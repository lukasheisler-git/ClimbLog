import { useCallback, useEffect, useRef, useState } from 'react';
import { HangboardWorkout } from '../types/hangboard';
import {
  playHangCountdownBeep, playHangEndBeep,
  playPauseCountdownBeep, playPauseEndBeep,
} from '../utils/audioUtils';

export type TimerPhase = 'idle' | 'getReady' | 'hanging' | 'repRest' | 'setRest' | 'complete';

interface InternalState {
  phase: TimerPhase;
  setIndex: number;
  rep: number;           // 1-basiert
  secondsLeft: number;
  totalForPhase: number; // Gesamtdauer der aktuellen Phase (für Fortschrittsring)
  isPaused: boolean;
  completedRepsPerSet: number[];
  elapsedSeconds: number;
}

const IDLE: InternalState = {
  phase: 'idle',
  setIndex: 0,
  rep: 1,
  secondsLeft: 0,
  totalForPhase: 0,
  isPaused: false,
  completedRepsPerSet: [],
  elapsedSeconds: 0,
};

const GET_READY_SECONDS = 10;

// Reine Übergangsfunktion — bestimmt den nächsten Zustand wenn ein Countdown
// auf 0 fällt. Kein React-State-Zugriff.
function advance(s: InternalState, workout: HangboardWorkout): InternalState {
  const set = workout.sets[s.setIndex];

  if (s.phase === 'getReady') {
    const firstSet = workout.sets[0];
    return { ...s, phase: 'hanging', setIndex: 0, rep: 1, secondsLeft: firstSet.hangDuration, totalForPhase: firstSet.hangDuration };
  }

  if (s.phase === 'hanging') {
    const newCompleted = [...s.completedRepsPerSet];
    newCompleted[s.setIndex] = (newCompleted[s.setIndex] ?? 0) + 1;

    if (s.rep < set.reps) {
      return { ...s, phase: 'repRest', rep: s.rep, secondsLeft: set.restDuration, totalForPhase: set.restDuration, completedRepsPerSet: newCompleted };
    }
    if (s.setIndex < workout.sets.length - 1) {
      return { ...s, phase: 'setRest', secondsLeft: set.setRest, totalForPhase: set.setRest, completedRepsPerSet: newCompleted };
    }
    return { ...s, phase: 'complete', secondsLeft: 0, completedRepsPerSet: newCompleted };
  }

  if (s.phase === 'repRest') {
    return { ...s, phase: 'hanging', rep: s.rep + 1, secondsLeft: set.hangDuration, totalForPhase: set.hangDuration };
  }

  if (s.phase === 'setRest') {
    const nextSet = workout.sets[s.setIndex + 1];
    return { ...s, phase: 'hanging', setIndex: s.setIndex + 1, rep: 1, secondsLeft: nextSet.hangDuration, totalForPhase: nextSet.hangDuration };
  }

  return s;
}

export function useHangboardTimer(workout: HangboardWorkout | null) {
  const stateRef            = useRef<InternalState>({ ...IDLE });
  const workoutRef          = useRef(workout);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [display, setDisplay] = useState<InternalState>({ ...IDLE });

  useEffect(() => { workoutRef.current = workout; }, [workout]);

  const sync = () => setDisplay({ ...stateRef.current });

  const stopTick = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) { clearTimeout(transitionTimeoutRef.current); transitionTimeoutRef.current = null; }
  }, []);

  // 300ms nach Anzeige von 0s: Phasenwechsel + Ton
  const scheduleTransition = useCallback(() => {
    clearTransitionTimeout();
    transitionTimeoutRef.current = setTimeout(() => {
      transitionTimeoutRef.current = null;
      const s = stateRef.current;
      const w = workoutRef.current;
      if (!w || s.isPaused) return;

      const prevPhase = s.phase;
      const next = advance(s, w);
      stateRef.current = { ...next, elapsedSeconds: s.elapsedSeconds };

      if (next.phase === 'repRest' || next.phase === 'setRest') {
        playHangEndBeep();                   // Hängen → Pause
      } else if (next.phase === 'hanging' && (prevPhase === 'repRest' || prevPhase === 'setRest' || prevPhase === 'getReady')) {
        playPauseEndBeep();                  // Pause / GetReady → Hängen
      } else if (next.phase === 'complete') {
        playPauseEndBeep();
        stopTick();
      }

      sync();
    }, 300);
  }, [clearTransitionTimeout, stopTick]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const w = workoutRef.current;
    if (!w || s.isPaused || s.phase === 'idle' || s.phase === 'complete') return;
    if (s.secondsLeft === 0) return; // Übergang läuft bereits

    const elapsed    = s.elapsedSeconds + 1;
    const newSeconds = s.secondsLeft - 1;

    if (newSeconds > 0) {
      // Countdown-Beeps bei 2s und 1s verbleibend (nur Hängen + Pause, nicht getReady)
      if (newSeconds <= 2) {
        if (s.phase === 'hanging') playHangCountdownBeep();
        else if (s.phase === 'repRest' || s.phase === 'setRest') playPauseCountdownBeep();
      }
      stateRef.current = { ...s, secondsLeft: newSeconds, elapsedSeconds: elapsed };
      sync();
      return;
    }

    // newSeconds === 0 → kurz 0s anzeigen, dann Phasenwechsel
    stateRef.current = { ...s, secondsLeft: 0, elapsedSeconds: elapsed };
    sync();
    scheduleTransition();
  }, [scheduleTransition]);

  const startTick = useCallback(() => {
    stopTick();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, stopTick]);

  const start = useCallback(() => {
    const w = workoutRef.current;
    if (!w || w.sets.length === 0) return;
    stateRef.current = {
      ...IDLE,
      phase: 'getReady',
      secondsLeft: GET_READY_SECONDS,
      totalForPhase: GET_READY_SECONDS,
      completedRepsPerSet: w.sets.map(() => 0),
    };
    sync();
    startTick();
  }, [startTick]);

  const pause = useCallback(() => {
    stopTick();
    clearTransitionTimeout();
    stateRef.current = { ...stateRef.current, isPaused: true };
    sync();
  }, [stopTick, clearTransitionTimeout]);

  const resume = useCallback(() => {
    stateRef.current = { ...stateRef.current, isPaused: false };
    sync();
    // Falls bei 0s pausiert wurde: Übergang neu starten statt tick
    const s = stateRef.current;
    if (s.secondsLeft === 0 && s.phase !== 'idle' && s.phase !== 'complete') {
      scheduleTransition();
    } else {
      startTick();
    }
  }, [startTick, scheduleTransition]);

  const abort = useCallback(() => {
    stopTick();
    clearTransitionTimeout();
    stateRef.current = { ...IDLE };
    sync();
  }, [stopTick, clearTransitionTimeout]);

  useEffect(() => () => { stopTick(); clearTransitionTimeout(); }, [stopTick, clearTransitionTimeout]);

  return {
    ...display,
    currentSet: workout?.sets[display.setIndex] ?? null,
    totalSets:  workout?.sets.length ?? 0,
    start,
    pause,
    resume,
    abort,
  };
}

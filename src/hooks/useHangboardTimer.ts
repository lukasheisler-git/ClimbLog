import { useCallback, useEffect, useRef, useState } from 'react';
import { HangboardWorkout } from '../types/hangboard';
import { playLongBeep, playShortBeep } from '../utils/audioUtils';

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

const GET_READY_SECONDS = 15;

// Reine Übergangsfunktion — bestimmt den nächsten Zustand wenn ein Countdown
// auf 0 fällt. Wird im interval-Callback aufgerufen (kein React-State-Zugriff).
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
  // Alle mutable Timer-Daten im Ref — verhindert Stale-Closure-Probleme im Interval.
  const stateRef  = useRef<InternalState>({ ...IDLE });
  const workoutRef = useRef(workout);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Nur die für das Rendering benötigten Werte als State
  const [display, setDisplay] = useState<InternalState>({ ...IDLE });

  useEffect(() => { workoutRef.current = workout; }, [workout]);

  const sync = () => setDisplay({ ...stateRef.current });

  const stopTick = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const w = workoutRef.current;
    if (!w || s.isPaused || s.phase === 'idle' || s.phase === 'complete') return;

    const elapsed = s.elapsedSeconds + 1;

    if (s.secondsLeft > 1) {
      stateRef.current = { ...s, secondsLeft: s.secondsLeft - 1, elapsedSeconds: elapsed };
      sync();
      return;
    }

    // Countdown abgelaufen → Phase wechseln
    const prevPhase = s.phase;
    const next = advance(s, w);
    stateRef.current = { ...next, elapsedSeconds: elapsed };

    // Ton-Feedback beim Phasenwechsel
    if (next.phase === 'repRest' || next.phase === 'setRest') {
      playShortBeep(); // Hang beendet
    } else if (next.phase === 'hanging' && (prevPhase === 'repRest' || prevPhase === 'setRest' || prevPhase === 'getReady')) {
      playLongBeep();  // Pause / Get-Ready beendet → jetzt hängen
    } else if (next.phase === 'complete') {
      playLongBeep();
      stopTick();
    }

    sync();
  }, [stopTick]);

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
    stateRef.current = { ...stateRef.current, isPaused: true };
    sync();
  }, [stopTick]);

  const resume = useCallback(() => {
    stateRef.current = { ...stateRef.current, isPaused: false };
    sync();
    startTick();
  }, [startTick]);

  const abort = useCallback(() => {
    stopTick();
    stateRef.current = { ...IDLE };
    sync();
  }, [stopTick]);

  // Aufräumen beim Unmount
  useEffect(() => () => stopTick(), [stopTick]);

  return {
    ...display,
    currentSet: workout?.sets[display.setIndex] ?? null,
    totalSets: workout?.sets.length ?? 0,
    start,
    pause,
    resume,
    abort,
  };
}

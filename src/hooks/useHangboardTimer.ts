import { useCallback, useEffect, useRef, useState } from 'react';
import { HangboardWorkout } from '../types/hangboard';
import { playDouble, playTransition } from '../utils/audioUtils';

export type TimerPhase = 'idle' | 'getReady' | 'hanging' | 'repRest' | 'setRest' | 'complete';

interface InternalState {
  phase: TimerPhase;
  setIndex: number;
  rep: number;
  secondsLeft: number;
  totalForPhase: number;
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
  const stateRef             = useRef<InternalState>({ ...IDLE });
  const workoutRef           = useRef(workout);
  const timeoutRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTargetRef        = useRef(0);
  const tickFnRef            = useRef<() => void>(() => {});

  const [display, setDisplay] = useState<InternalState>({ ...IDLE });

  useEffect(() => { workoutRef.current = workout; }, [workout]);

  const sync = () => setDisplay({ ...stateRef.current });

  const stopTick = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) { clearTimeout(transitionTimeoutRef.current); transitionTimeoutRef.current = null; }
  }, []);

  // 300ms nach Anzeige von 0s: Phasenwechsel, dann Tick neu starten
  const scheduleTransition = useCallback(() => {
    clearTransitionTimeout();
    transitionTimeoutRef.current = setTimeout(() => {
      transitionTimeoutRef.current = null;
      const s = stateRef.current;
      const w = workoutRef.current;
      if (!w || s.isPaused) return;

      const next = advance(s, w);
      stateRef.current = { ...next, elapsedSeconds: s.elapsedSeconds };
      sync();

      if (next.phase === 'complete') {
        stopTick();
      } else {
        tickTargetRef.current = Date.now() + 1000;
        timeoutRef.current = setTimeout(tickFnRef.current, 1000);
      }
    }, 300);
  }, [clearTransitionTimeout, stopTick]);

  const tick = useCallback(() => {
    const s = stateRef.current;
    const w = workoutRef.current;
    if (!w || s.isPaused || s.phase === 'idle' || s.phase === 'complete') return;
    if (s.secondsLeft === 0) return;

    const elapsed    = s.elapsedSeconds + 1;
    const newSeconds = s.secondsLeft - 1;

    if (newSeconds > 0) {
      if (newSeconds <= 2 && (s.phase === 'hanging' || s.phase === 'repRest' || s.phase === 'setRest')) {
        playDouble();
      }
      stateRef.current = { ...s, secondsLeft: newSeconds, elapsedSeconds: elapsed };
      sync();
      // Drift-korrigierter nächster Tick
      tickTargetRef.current += 1000;
      timeoutRef.current = setTimeout(tickFnRef.current, Math.max(0, tickTargetRef.current - Date.now()));
      return;
    }

    // newSeconds === 0: Ton sofort, dann Phasenwechsel nach 300ms
    playTransition();
    stateRef.current = { ...s, secondsLeft: 0, elapsedSeconds: elapsed };
    sync();
    scheduleTransition();
  }, [scheduleTransition]);

  useEffect(() => { tickFnRef.current = tick; }, [tick]);

  const startTick = useCallback(() => {
    stopTick();
    tickTargetRef.current = Date.now() + 1000;
    timeoutRef.current = setTimeout(tickFnRef.current, 1000);
  }, [stopTick]);

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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HangboardWorkout, HangboardSession } from '../types/hangboard';

const WORKOUTS_KEY = '@climblog:hangboard_workouts';
const SESSIONS_KEY = '@climblog:hangboard_sessions';

export async function loadWorkouts(): Promise<HangboardWorkout[]> {
  const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
  if (!raw) return [];
  const workouts: HangboardWorkout[] = JSON.parse(raw);
  return workouts.map(w => w.category ? w : { ...w, category: 'Strength & Power' });
}

export async function saveWorkout(workout: HangboardWorkout): Promise<void> {
  const existing = await loadWorkouts();
  const idx = existing.findIndex(w => w.id === workout.id);
  if (idx >= 0) {
    existing[idx] = workout;
  } else {
    existing.unshift(workout);
  }
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(existing));
}

export async function deleteWorkout(id: string): Promise<void> {
  const existing = await loadWorkouts();
  await AsyncStorage.setItem(
    WORKOUTS_KEY,
    JSON.stringify(existing.filter(w => w.id !== id)),
  );
}

export async function loadSessions(): Promise<HangboardSession[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSession(session: HangboardSession): Promise<void> {
  const existing = await loadSessions();
  existing.unshift(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
}

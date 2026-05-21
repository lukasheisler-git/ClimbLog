import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingSession } from '../types/training';

const KEY = '@training:sessions_v1';

const DEFAULT_TEMPLATES: Omit<TrainingSession, 'id'>[] = [
  { name: 'Boulder Session',      category: 'Strength & Power', date: new Date().toISOString(), duration: 90,  intensity: 5, exercises: [], isTemplate: true },
  { name: 'Klettersession Halle', category: 'Open Climbing',    date: new Date().toISOString(), duration: 90,  intensity: 5, exercises: [], isTemplate: true },
  { name: 'Outdoor Klettern',     category: 'Open Climbing',    date: new Date().toISOString(), duration: 180, intensity: 5, exercises: [], isTemplate: true },
  { name: 'Yoga',                 category: 'Cross Training',   date: new Date().toISOString(), duration: 60,  intensity: 5, exercises: [], isTemplate: true },
  { name: 'Mobility Workout',     category: 'Cross Training',   date: new Date().toISOString(), duration: 45,  intensity: 5, exercises: [], isTemplate: true },
  { name: 'Krafttraining',        category: 'Conditioning',     date: new Date().toISOString(), duration: 60,  intensity: 5, exercises: [], isTemplate: true },
];

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function loadAllSessions(): Promise<TrainingSession[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const sessions: TrainingSession[] = JSON.parse(raw);
  return sessions.map(s => ({ ...s, intensity: (s.intensity as number | undefined) ?? 5 }));
}

async function writeAll(sessions: TrainingSession[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function initTemplates(): Promise<void> {
  const existing = await loadAllSessions();
  if (existing.some(s => s.isTemplate)) return;
  const templates: TrainingSession[] = DEFAULT_TEMPLATES.map(t => ({ ...t, id: makeId() }));
  await writeAll([...existing, ...templates]);
}

export async function loadSessions(): Promise<TrainingSession[]> {
  const all = await loadAllSessions();
  return all.filter(s => !s.isTemplate).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function loadTemplates(): Promise<TrainingSession[]> {
  const all = await loadAllSessions();
  return all.filter(s => s.isTemplate);
}

export async function saveSession(session: TrainingSession): Promise<void> {
  const all = await loadAllSessions();
  all.unshift(session);
  await writeAll(all);
}

export async function updateSession(session: TrainingSession): Promise<void> {
  const all = await loadAllSessions();
  const idx = all.findIndex(s => s.id === session.id);
  if (idx >= 0) { all[idx] = session; await writeAll(all); }
}

export async function deleteSession(id: string): Promise<void> {
  const all = await loadAllSessions();
  await writeAll(all.filter(s => s.id !== id));
}

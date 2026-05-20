import { useCallback, useState } from 'react';
import { loadSessions, loadTemplates } from '../storage/trainingStorage';
import { TrainingCategory, TrainingSession } from '../types/training';

export type StatsRange = '4w' | '8w' | 'all';

export interface TrainingStats {
  weekCount:     number;
  monthCount:    number;
  totalHours:    number;
  longestStreak: number;
}

export interface CategoryCount {
  category: TrainingCategory;
  count:    number;
  percent:  number;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function longestStreak(sessions: TrainingSession[]): number {
  const days = [...new Set(sessions.map(s => s.date.slice(0, 10)))].sort();
  if (!days.length) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = daysBetween(new Date(days[i - 1]), new Date(days[i]));
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

export function calcStats(sessions: TrainingSession[]): TrainingStats {
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekCount  = sessions.filter(s => new Date(s.date) >= weekStart).length;
  const monthCount = sessions.filter(s => new Date(s.date) >= monthStart).length;
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

  void today;
  return { weekCount, monthCount, totalHours, longestStreak: longestStreak(sessions) };
}

export function filterByRange(sessions: TrainingSession[], range: StatsRange): TrainingSession[] {
  if (range === 'all') return sessions;
  const weeks = range === '4w' ? 4 : 8;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  return sessions.filter(s => new Date(s.date) >= cutoff);
}

export function calcCategoryCounts(sessions: TrainingSession[]): CategoryCount[] {
  const map: Partial<Record<TrainingCategory, number>> = {};
  for (const s of sessions) map[s.category] = (map[s.category] ?? 0) + 1;
  const total = sessions.length;
  return (Object.entries(map) as [TrainingCategory, number][])
    .map(([category, count]) => ({ category, count, percent: total ? Math.round(count / total * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
}

export function useTraining() {
  const [sessions,  setSessions]  = useState<TrainingSession[]>([]);
  const [templates, setTemplates] = useState<TrainingSession[]>([]);

  const reload = useCallback(async () => {
    const [s, t] = await Promise.all([loadSessions(), loadTemplates()]);
    setSessions(s);
    setTemplates(t);
  }, []);

  return { sessions, templates, reload };
}

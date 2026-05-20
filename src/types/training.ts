export type TrainingCategory =
  | 'Endurance'
  | 'Power Endurance'
  | 'Strength & Power'
  | 'Conditioning'
  | 'Technique'
  | 'Open Climbing'
  | 'Cross Training';

export const CATEGORIES: TrainingCategory[] = [
  'Endurance', 'Power Endurance', 'Strength & Power',
  'Conditioning', 'Technique', 'Open Climbing', 'Cross Training',
];

export const CATEGORY_COLOR: Record<TrainingCategory, string> = {
  'Endurance':        '#0D9488',
  'Power Endurance':  '#F59E0B',
  'Strength & Power': '#EF4444',
  'Conditioning':     '#8B5CF6',
  'Technique':        '#3B82F6',
  'Open Climbing':    '#16A34A',
  'Cross Training':   '#6B7280',
};

export interface TrainingExercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;   // Sekunden
  weight?: number;     // kg
  notes?: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  category: TrainingCategory;
  date: string;           // ISO
  duration: number;       // Minuten
  notes?: string;
  exercises: TrainingExercise[];
  isTemplate: boolean;
}

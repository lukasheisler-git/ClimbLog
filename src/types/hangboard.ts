export type GripDepth = '45mm' | '30mm' | '20mm' | '15mm';
export type GripType = 'Half Crimp' | 'Full Crimp' | 'Open Hand';
export type HangboardCategory = 'Endurance' | 'Power Endurance' | 'Strength & Power';

export interface HangboardSet {
  id: string;
  gripDepth: GripDepth;
  gripType: GripType;
  hangDuration: number;   // Sekunden
  restDuration: number;   // Pause zwischen Reps (Sekunden)
  reps: number;
  setRest: number;        // Pause zwischen Sätzen (Sekunden)
  addedWeight: number;    // kg: positiv = Weste, negativ = Assisted
}

export interface HangboardWorkout {
  id: string;
  name: string;
  category: HangboardCategory;
  sets: HangboardSet[];
  createdAt: number;
  updatedAt: number;
}

export interface CompletedSet {
  setId: string;
  gripDepth: GripDepth;
  gripType: GripType;
  plannedReps: number;
  completedReps: number;
  addedWeight: number;
  hangDuration: number;
}

export interface HangboardSession {
  id: string;
  date: string;           // ISO 8601
  workoutId: string;
  workoutName: string;
  completedSets: CompletedSet[];
  totalDuration: number;  // Sekunden
  createdAt: number;
}

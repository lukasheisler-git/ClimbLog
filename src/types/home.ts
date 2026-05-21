export interface WeightEntry {
  id: string;
  date: string;     // ISO-String
  weight: number;   // kg
  createdAt: number;
}

export type BucketListCategory = 'Gebiet' | 'Route' | 'Boulder' | 'Tour';

export type TourType =
  | 'Mehrseillänge'
  | 'Hochtour'
  | 'Skitour'
  | 'Wanderung'
  | 'Klettersteig'
  | 'Alpinklettern';

export interface BucketListItem {
  id: string;
  name: string;
  category: BucketListCategory;
  grade?: string;        // Route — franz. System
  boulderGrade?: string; // Boulder — franz. System
  tourType?: TourType;   // Tour
  notes?: string;
  completed: boolean;
  createdAt: number;
}

export interface AppSettings {
  showWeight: boolean;
}

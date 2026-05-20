export type BucketListType = 'Gebiet' | 'Route' | 'Tour';

export interface WeightEntry {
  id: string;
  date: string;     // ISO-String
  weight: number;   // kg
  createdAt: number;
}

export interface BucketListItem {
  id: string;
  name: string;
  type: BucketListType;
  notes?: string;
  done: boolean;
  createdAt: number;
}

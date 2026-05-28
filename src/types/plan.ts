export type PlannedUnitType = 'training' | 'hangboard';

export type Weekday =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday';

export const ALL_WEEKDAYS: Weekday[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch',
  thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag',
};

// Maps JS Date.getDay() (0=Sun) to Weekday
export const JS_DAY_TO_WEEKDAY: Record<number, Weekday> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

// Day offset from Monday (Mon=0 … Sun=6)
export const WEEKDAY_OFFSET: Record<Weekday, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

export interface PlannedUnit {
  id: string;
  type: PlannedUnitType;
  templateId: string;
  templateName: string;
  category: string;
  order: number;
}

export interface WeekdayPlan {
  weekday: Weekday;
  isRestDay: boolean;
  units: PlannedUnit[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  weekdays: WeekdayPlan[];
}

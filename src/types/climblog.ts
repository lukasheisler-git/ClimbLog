export type ClimbStyle  = 'Lead' | 'Boulder' | 'Multi-Pitch';
export type ClimbResult = 'Onsight' | 'Flash' | 'Redpoint' | 'Project';

export type WallAngle = 'Slab' | 'Vertical' | 'Overhang' | 'Roof';

export type ClimbingStyle =
  | 'Kraftroute'
  | 'Athletisch'
  | 'Sloper'
  | 'Ausdauer'
  | 'Technisch'
  | 'Krimpen';

export interface PhotoItem {
  data: string;      // base64 JPEG
  width?: number;    // Pixel nach Komprimierung (800px)
  height?: number;   // Pixel nach Komprimierung
}

export interface ClimbRoute {
  id: string;
  name: string;
  area?: string;
  sector?: string;
  date: string;              // ISO-String
  grade: string;             // z.B. "7a+"
  style: ClimbStyle;
  result: ClimbResult;
  stars?: number;            // 0–5
  notes?: string;
  wallAngle?: WallAngle;
  climbingStyles?: ClimbingStyle[];
  photos?: PhotoItem[];
  createdAt: number;
}

export const GRADES = [
  '4', '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+', '9c',
] as const;

export const WALL_ANGLES: WallAngle[] = ['Slab', 'Vertical', 'Overhang', 'Roof'];

export const CLIMBING_STYLES: ClimbingStyle[] = [
  'Kraftroute', 'Athletisch', 'Sloper', 'Ausdauer', 'Technisch', 'Krimpen',
];

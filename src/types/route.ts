// Klettertypen – werden im gesamten Projekt geteilt

export type ClimbStyle = 'Lead' | 'Toprope' | 'Bouldern';

export type ClimbResult = 'Rotpunkt' | 'Begehung' | 'Sturz' | 'Projekt';

export interface RouteEntry {
  id: string;
  date: string;       // ISO 8601, z.B. "2026-05-18T00:00:00.000Z"
  grade: string;      // UIAA/Französische Skala, z.B. "7a+"
  style: ClimbStyle;
  result: ClimbResult;
  notes: string;      // leer wenn keine Notizen
  createdAt: number;  // Unix-Timestamp für Sortierung
}

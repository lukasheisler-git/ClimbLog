import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteEntry } from '../types/route';

const STORAGE_KEY = '@climblog:routes';

/** Lädt alle gespeicherten Routen (neueste zuerst). */
export async function loadRoutes(): Promise<RouteEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as RouteEntry[]) : [];
}

/** Fügt einen neuen Eintrag an den Anfang der Liste ein. */
export async function saveRoute(entry: RouteEntry): Promise<void> {
  const existing = await loadRoutes();
  existing.unshift(entry);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

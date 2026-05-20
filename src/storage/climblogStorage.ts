import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClimbRoute } from '../types/climblog';

const KEY = '@climblog:routes_v2';

export async function loadRoutes(): Promise<ClimbRoute[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRoute(route: ClimbRoute): Promise<void> {
  const existing = await loadRoutes();
  existing.unshift(route);
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));
}

export async function deleteRoute(id: string): Promise<void> {
  const existing = await loadRoutes();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter(r => r.id !== id)));
}

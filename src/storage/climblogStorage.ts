import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClimbRoute } from '../types/climblog';

const KEY = '@climblog:routes_v2';

export async function loadRoutes(): Promise<ClimbRoute[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const routes: ClimbRoute[] = JSON.parse(raw);
  return routes.map(r => ({
    climbingStyles: [],
    ...r,
    // Migrate: photos stored as bare base64 strings → PhotoItem
    photos: ((r.photos ?? []) as any[]).map((p: any) =>
      typeof p === 'string' ? { data: p } : p,
    ),
  }));
}

export async function saveRoute(route: ClimbRoute): Promise<void> {
  const existing = await loadRoutes();
  existing.unshift(route);
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));
}

export async function updateRoute(route: ClimbRoute): Promise<void> {
  const existing = await loadRoutes();
  const idx = existing.findIndex(r => r.id === route.id);
  if (idx >= 0) {
    existing[idx] = route;
    await AsyncStorage.setItem(KEY, JSON.stringify(existing));
  }
}

export async function deleteRoute(id: string): Promise<void> {
  const existing = await loadRoutes();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter(r => r.id !== id)));
}

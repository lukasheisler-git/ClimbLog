import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClimbRoute } from '../types/climblog';
import { deletePhotos } from '../utils/photoStorage';

const KEY = '@climblog:routes_v2';

export async function loadRoutes(): Promise<ClimbRoute[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const routes: ClimbRoute[] = JSON.parse(raw);
  return routes.map(r => ({ climbingStyles: [], ...r }));
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
  const route = existing.find(r => r.id === id);
  if (route?.photos?.length) {
    await deletePhotos(route.photos);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter(r => r.id !== id)));
}

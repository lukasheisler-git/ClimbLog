import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, BucketListItem, WeightEntry } from '../types/home';

const WEIGHT_KEY   = '@home:weight_entries';
const BUCKET_KEY   = '@home:bucket_list';
const SETTINGS_KEY = '@settings';

// --- Weight entries ---

export async function loadWeightEntries(): Promise<WeightEntry[]> {
  const raw = await AsyncStorage.getItem(WEIGHT_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  const existing = await loadWeightEntries();
  existing.unshift(entry);
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(existing));
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const existing = await loadWeightEntries();
  await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(existing.filter(e => e.id !== id)));
}

// --- Bucket list ---

export async function loadBucketList(): Promise<BucketListItem[]> {
  const raw = await AsyncStorage.getItem(BUCKET_KEY);
  if (!raw) return [];
  const items = JSON.parse(raw) as any[];
  // Migrate old shape: type→category, done→completed
  return items.map(i => ({
    ...i,
    category:  i.category  ?? i.type ?? 'Gebiet',
    completed: i.completed ?? i.done ?? false,
  }));
}

export async function saveBucketItem(item: BucketListItem): Promise<void> {
  const existing = await loadBucketList();
  existing.unshift(item);
  await AsyncStorage.setItem(BUCKET_KEY, JSON.stringify(existing));
}

export async function updateBucketItem(item: BucketListItem): Promise<void> {
  const existing = await loadBucketList();
  const idx = existing.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    existing[idx] = item;
    await AsyncStorage.setItem(BUCKET_KEY, JSON.stringify(existing));
  }
}

export async function deleteBucketItem(id: string): Promise<void> {
  const existing = await loadBucketList();
  await AsyncStorage.setItem(BUCKET_KEY, JSON.stringify(existing.filter(i => i.id !== id)));
}

// --- Settings ---

const DEFAULT_SETTINGS: AppSettings = { showWeight: true };

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(s: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

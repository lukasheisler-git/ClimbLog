import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ClimbPhoto } from '../types/climblog';

export const PHOTO_DIR = (FileSystem.documentDirectory ?? '') + 'photos/';

const MIGRATION_KEY = '@climblog:photos_migrated_v1';
const ROUTES_KEY    = '@climblog:routes_v2';

async function ensurePhotoDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
}

function makeFilename(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
}

// Komprimiert ein ImagePicker-Asset auf 800px, kopiert es ins Foto-Verzeichnis
// und gibt ein ClimbPhoto zurück (kein base64, nur lokaler Pfad).
export async function savePhoto(asset: ImagePicker.ImagePickerAsset): Promise<ClimbPhoto | null> {
  try {
    await ensurePhotoDir();
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    const origW   = asset.width  ?? 800;
    const origH   = asset.height ?? 600;
    const scaledH = Math.round(800 * origH / origW);
    const dest    = PHOTO_DIR + makeFilename();
    await FileSystem.copyAsync({ from: manipulated.uri, to: dest });
    return { uri: dest, width: 800, height: scaledH };
  } catch {
    return null;
  }
}

export async function deletePhoto(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function deletePhotos(photos: ClimbPhoto[]): Promise<void> {
  await Promise.all(photos.map(p => deletePhoto(p.uri)));
}

// Einmalige Migration: base64-Daten (bare string oder { data } PhotoItem) → Dateien.
// Wird beim App-Start aufgerufen; setzt danach ein Flag damit sie nur einmal läuft.
export async function migrateBase64Photos(): Promise<void> {
  const done = await AsyncStorage.getItem(MIGRATION_KEY);
  if (done) return;

  const raw = await AsyncStorage.getItem(ROUTES_KEY);
  if (!raw) {
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  try {
    await ensurePhotoDir();
    const routes = JSON.parse(raw) as any[];
    let changed = false;

    for (const route of routes) {
      if (!route.photos?.length) continue;
      const migrated: ClimbPhoto[] = [];

      for (const photo of route.photos as any[]) {
        if (typeof photo === 'string') {
          // Ältestes Format: bare base64-String
          const dest = PHOTO_DIR + makeFilename();
          await FileSystem.writeAsStringAsync(dest, photo, { encoding: FileSystem.EncodingType.Base64 });
          migrated.push({ uri: dest });
          changed = true;
        } else if (photo.data && !photo.uri) {
          // PhotoItem-Format: { data, width?, height? }
          const dest = PHOTO_DIR + makeFilename();
          await FileSystem.writeAsStringAsync(dest, photo.data, { encoding: FileSystem.EncodingType.Base64 });
          migrated.push({ uri: dest, width: photo.width, height: photo.height });
          changed = true;
        } else if (photo.uri) {
          // Bereits ClimbPhoto-Format
          migrated.push({ uri: photo.uri, width: photo.width, height: photo.height });
        }
      }

      route.photos = migrated;
    }

    if (changed) {
      await AsyncStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
    }
  } catch (e) {
    console.warn('Photo migration failed, will retry on next start:', e);
    return;
  }

  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}

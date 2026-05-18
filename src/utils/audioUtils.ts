import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

// Erzeugt eine WAV-Datei als Base64-String (8-Bit PCM, Mono, 8000 Hz).
// Kein externes Asset nötig — der Ton wird zur Laufzeit generiert und
// einmalig im Cache gespeichert.
function generateWavBase64(frequencyHz: number, durationMs: number): string {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * durationMs / 1000);
  const buffer = new ArrayBuffer(44 + numSamples);
  const v = new DataView(buffer);

  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };

  str(0, 'RIFF');
  v.setUint32(4, 36 + numSamples, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);      // PCM chunk size
  v.setUint16(20, 1, true);       // PCM format
  v.setUint16(22, 1, true);       // Mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate, true); // ByteRate (8-bit mono)
  v.setUint16(32, 1, true);       // BlockAlign
  v.setUint16(34, 8, true);       // BitsPerSample
  str(36, 'data');
  v.setUint32(40, numSamples, true);

  const fadeIn = Math.min(80, Math.floor(numSamples * 0.05));
  const fadeOut = Math.min(160, Math.floor(numSamples * 0.1));

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let amp = 0.75;
    if (i < fadeIn) amp *= i / fadeIn;
    if (i > numSamples - fadeOut) amp *= (numSamples - i) / fadeOut;
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * amp;
    v.setUint8(44 + i, Math.round(128 + sample * 100));
  }

  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

let _shortBeep: Audio.Sound | null = null;
let _longBeep: Audio.Sound | null = null;
let _ready = false;

// Einmalig aufrufen wenn der Timer-Screen geöffnet wird.
export async function initBeeps(): Promise<void> {
  if (_ready) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });

    const shortB64 = generateWavBase64(880, 130);  // hoher Ton, kurz → Ende Hang
    const longB64  = generateWavBase64(440, 520);  // tiefer Ton, lang → Ende Pause

    const shortUri = FileSystem.cacheDirectory + 'climblog_short.wav';
    const longUri  = FileSystem.cacheDirectory + 'climblog_long.wav';

    await Promise.all([
      FileSystem.writeAsStringAsync(shortUri, shortB64, { encoding: FileSystem.EncodingType.Base64 }),
      FileSystem.writeAsStringAsync(longUri,  longB64,  { encoding: FileSystem.EncodingType.Base64 }),
    ]);

    const [{ sound: s }, { sound: l }] = await Promise.all([
      Audio.Sound.createAsync({ uri: shortUri }),
      Audio.Sound.createAsync({ uri: longUri }),
    ]);

    _shortBeep = s;
    _longBeep  = l;
    _ready = true;
  } catch (e) {
    console.warn('Audio-Init fehlgeschlagen, Fallback auf Haptics:', e);
  }
}

export async function unloadBeeps(): Promise<void> {
  await Promise.all([_shortBeep?.unloadAsync(), _longBeep?.unloadAsync()]);
  _shortBeep = null;
  _longBeep  = null;
  _ready     = false;
}

export function playShortBeep(): void {
  if (_shortBeep) {
    _shortBeep.replayAsync().catch(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function playLongBeep(): void {
  if (_longBeep) {
    _longBeep.replayAsync().catch(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

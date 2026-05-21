import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

// Erzeugt eine WAV-Datei als Base64-String (8-Bit PCM, Mono, 8000 Hz).
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
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);       // PCM
  v.setUint16(22, 1, true);       // Mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);       // 8-bit
  str(36, 'data');
  v.setUint32(40, numSamples, true);

  const fadeIn  = Math.min(60, Math.floor(numSamples * 0.05));
  const fadeOut = Math.min(120, Math.floor(numSamples * 0.1));

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let amp = 0.75;
    if (i < fadeIn)  amp *= i / fadeIn;
    if (i > numSamples - fadeOut) amp *= (numSamples - i) / fadeOut;
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * amp;
    v.setUint8(44 + i, Math.round(128 + sample * 100));
  }

  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// ─── Sound-Objekte ────────────────────────────────────────────────────────────
// hangCountdown:  kurzer hoher Beep beim Countdown im Hängen (2s, 1s)
// pauseCountdown: kurzer tiefer Beep beim Countdown in der Pause (2s, 1s)
// hangEnd:        mittellanger Beep → Hängen endet, Pause beginnt
// pauseEnd:       längerer Beep   → Pause endet, Hängen beginnt (oder Abschluss)

let _hangCountdown:  Audio.Sound | null = null;
let _pauseCountdown: Audio.Sound | null = null;
let _hangEnd:        Audio.Sound | null = null;
let _pauseEnd:       Audio.Sound | null = null;
let _ready = false;

export async function initBeeps(): Promise<void> {
  if (_ready) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });

    const hangCdB64  = generateWavBase64(880, 80);   // kurz hoch
    const pauseCdB64 = generateWavBase64(440, 80);   // kurz tief
    const hangEndB64 = generateWavBase64(880, 200);  // mittel hoch
    const pauseEndB64 = generateWavBase64(440, 400); // lang tief

    const base = FileSystem.cacheDirectory!;
    const uriHangCd   = base + 'cl_hang_cd.wav';
    const uriPauseCd  = base + 'cl_pause_cd.wav';
    const uriHangEnd  = base + 'cl_hang_end.wav';
    const uriPauseEnd = base + 'cl_pause_end.wav';

    await Promise.all([
      FileSystem.writeAsStringAsync(uriHangCd,   hangCdB64,   { encoding: FileSystem.EncodingType.Base64 }),
      FileSystem.writeAsStringAsync(uriPauseCd,  pauseCdB64,  { encoding: FileSystem.EncodingType.Base64 }),
      FileSystem.writeAsStringAsync(uriHangEnd,  hangEndB64,  { encoding: FileSystem.EncodingType.Base64 }),
      FileSystem.writeAsStringAsync(uriPauseEnd, pauseEndB64, { encoding: FileSystem.EncodingType.Base64 }),
    ]);

    const [{ sound: hc }, { sound: pc }, { sound: he }, { sound: pe }] = await Promise.all([
      Audio.Sound.createAsync({ uri: uriHangCd }),
      Audio.Sound.createAsync({ uri: uriPauseCd }),
      Audio.Sound.createAsync({ uri: uriHangEnd }),
      Audio.Sound.createAsync({ uri: uriPauseEnd }),
    ]);

    _hangCountdown  = hc;
    _pauseCountdown = pc;
    _hangEnd        = he;
    _pauseEnd       = pe;
    _ready = true;
  } catch (e) {
    console.warn('Audio-Init fehlgeschlagen, Fallback auf Haptics:', e);
  }
}

export async function unloadBeeps(): Promise<void> {
  await Promise.all([
    _hangCountdown?.unloadAsync(),
    _pauseCountdown?.unloadAsync(),
    _hangEnd?.unloadAsync(),
    _pauseEnd?.unloadAsync(),
  ]);
  _hangCountdown = _pauseCountdown = _hangEnd = _pauseEnd = null;
  _ready = false;
}

function play(sound: Audio.Sound | null, hapticFallback: () => void): void {
  if (sound) {
    sound.replayAsync().catch(hapticFallback);
  } else {
    hapticFallback();
  }
}

// Countdown-Beeps (2s, 1s verbleibend) —  kurze Pieptöne
export function playHangCountdownBeep():  void { play(_hangCountdown,  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); }
export function playPauseCountdownBeep(): void { play(_pauseCountdown, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); }

// Phasenende-Töne
export function playHangEndBeep():  void { play(_hangEnd,  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); }
export function playPauseEndBeep(): void { play(_pauseEnd, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)); }

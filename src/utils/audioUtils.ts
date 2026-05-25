import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// ─── WAV Generation ───────────────────────────────────────────────────────────

const SR = 8000; // 8-bit PCM, mono, 8000 Hz

function writeWavHeader(v: DataView, numSamples: number): void {
  const w = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + numSamples, true);
  w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR, true);
  v.setUint16(32, 1, true);  v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, numSamples, true);
}

function writeTone(v: DataView, offset: number, n: number, hz: number): void {
  const fadeIn  = Math.min(40, Math.floor(n * 0.05));
  const fadeOut = Math.min(80, Math.floor(n * 0.10));
  for (let i = 0; i < n; i++) {
    let amp = 0.75;
    if (i < fadeIn)       amp *= i / fadeIn;
    if (i > n - fadeOut)  amp *= (n - i) / fadeOut;
    v.setUint8(offset + i, Math.round(128 + Math.sin(2 * Math.PI * hz * (i / SR)) * amp * 100));
  }
}

// Double beep: 2× 330 Hz (80 ms tone · 50 ms silence · 80 ms tone)
function generateDoubleBeep(): string {
  const tone    = Math.floor(SR * 0.08);  // 640 samples
  const silence = Math.floor(SR * 0.05);  // 400 samples
  const total   = tone * 2 + silence;
  const v = new DataView(new ArrayBuffer(44 + total));
  writeWavHeader(v, total);
  writeTone(v, 44, tone, 330);
  for (let i = 0; i < silence; i++) v.setUint8(44 + tone + i, 128);
  writeTone(v, 44 + tone + silence, tone, 330);
  return arrayBufferToBase64(v.buffer);
}

// Single tone: 660 Hz, 400 ms
function generateSingleBeep(): string {
  const total = Math.floor(SR * 0.4);  // 3200 samples
  const v = new DataView(new ArrayBuffer(44 + total));
  writeWavHeader(v, total);
  writeTone(v, 44, total, 660);
  return arrayBufferToBase64(v.buffer);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// ─── Sound Objects ────────────────────────────────────────────────────────────

let _soundDouble:     Audio.Sound | null = null;
let _soundTransition: Audio.Sound | null = null;
let _ready = false;

export async function initBeeps(): Promise<void> {
  if (_ready) return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });

    const [{ sound: d }, { sound: t }] = await Promise.all([
      Audio.Sound.createAsync({ uri: 'data:audio/wav;base64,' + generateDoubleBeep() }),
      Audio.Sound.createAsync({ uri: 'data:audio/wav;base64,' + generateSingleBeep() }),
    ]);

    _soundDouble     = d;
    _soundTransition = t;
    _ready = true;
  } catch (e) {
    console.warn('Audio-Init fehlgeschlagen, Fallback auf Haptics:', e);
  }
}

export async function unloadBeeps(): Promise<void> {
  await Promise.all([
    _soundDouble?.unloadAsync(),
    _soundTransition?.unloadAsync(),
  ]);
  _soundDouble = _soundTransition = null;
  _ready = false;
}

async function play(sound: Audio.Sound | null, haptic: () => void): Promise<void> {
  if (sound) {
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      haptic();
    }
  } else {
    haptic();
  }
}

// 2s / 1s verbleibend (Hängen oder Pause)
export function playDouble(): void {
  play(_soundDouble, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// 0s / Phasenübergang
export function playTransition(): void {
  play(_soundTransition, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CountdownCircle } from '../../components/hangboard/CountdownCircle';
import { useHangboardTimer } from '../../hooks/useHangboardTimer';
import { HangboardStackParamList } from '../../navigation/types';
import { loadWorkouts, saveSession } from '../../storage/hangboardStorage';
import { HangboardSession, HangboardWorkout } from '../../types/hangboard';
import { initBeeps, unloadBeeps } from '../../utils/audioUtils';

type Props = NativeStackScreenProps<HangboardStackParamList, 'Timer'>;

const GREEN      = '#1B4332';
const GREEN_LIGHT= '#52B788';
const RED        = '#D62828';
const AMBER      = '#F59E0B';

const PHASE_LABEL: Record<string, string> = {
  idle:     'Bereit',
  getReady: 'GET READY',
  hanging:  'HÄNGEN',
  repRest:  'REP-PAUSE',
  setRest:  'SATZPAUSE',
  complete: 'Fertig!',
};

function formatWeight(kg: number): string | null {
  if (kg === 0) return null;
  return kg > 0 ? `+${kg} kg` : `${Math.abs(kg)} kg Assisted`;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function TimerScreen({ route, navigation }: Props) {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState<HangboardWorkout | null>(null);
  const timer = useHangboardTimer(workout);
  const sessionSavedRef = useRef(false);

  useEffect(() => {
    loadWorkouts().then(ws => setWorkout(ws.find(w => w.id === workoutId) ?? null));
    initBeeps();
    return () => { unloadBeeps(); };
  }, [workoutId]);

  // Session automatisch speichern wenn Workout abgeschlossen
  useEffect(() => {
    if (timer.phase !== 'complete' || !workout || sessionSavedRef.current) return;
    sessionSavedRef.current = true;

    const session: HangboardSession = {
      id:            Date.now().toString(),
      date:          new Date().toISOString(),
      workoutId:     workout.id,
      workoutName:   workout.name,
      completedSets: workout.sets.map((s, i) => ({
        setId:         s.id,
        gripDepth:     s.gripDepth,
        gripType:      s.gripType,
        plannedReps:   s.reps,
        completedReps: timer.completedRepsPerSet[i] ?? 0,
        addedWeight:   s.addedWeight,
        hangDuration:  s.hangDuration,
      })),
      totalDuration: timer.elapsedSeconds,
      createdAt:     Date.now(),
    };
    saveSession(session).catch(console.warn);
  }, [timer.phase]);

  // Zurück-Navigation während laufendem Timer abfangen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (timer.phase === 'idle' || timer.phase === 'complete') return;
      // React Navigation v7: cast nötig da der Typ fälschlicherweise als non-cancelable deklariert ist
      (e as any).preventDefault();
      Alert.alert('Workout abbrechen?', 'Der aktuelle Fortschritt geht verloren.', [
        { text: 'Weiter trainieren', style: 'cancel' },
        { text: 'Abbrechen', style: 'destructive', onPress: () => { timer.abort(); navigation.dispatch(e.data.action); } },
      ]);
    });
    return unsubscribe;
  }, [navigation, timer.phase]);

  if (!workout) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#6B7280' }}>Lade Workout…</Text>
      </View>
    );
  }

  // ── Abschluss-Screen ──────────────────────────────────────────────────────
  if (timer.phase === 'complete') {
    const totalReps = timer.completedRepsPerSet.reduce((a, b) => a + b, 0);
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.completeEmoji}>✓</Text>
        <Text style={styles.completeTitle}>Workout abgeschlossen!</Text>
        <Text style={styles.completeSub}>{workout.name}</Text>
        <View style={styles.statsRow}>
          <StatBox label="Sätze"    value={workout.sets.length.toString()} />
          <StatBox label="Reps"     value={totalReps.toString()} />
          <StatBox label="Dauer"    value={formatDuration(timer.elapsedSeconds)} />
        </View>
        <Text style={styles.savedHint}>Session wurde gespeichert</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Zurück</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSet = timer.currentSet;
  const isHanging  = timer.phase === 'hanging';
  const phaseColor = isHanging ? RED : timer.phase === 'getReady' ? AMBER : GREEN;

  // ── Timer-Screen ──────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Phasen-Label */}
      <View style={[styles.phaseBadge, { backgroundColor: phaseColor }]}>
        <Text style={styles.phaseLabel}>{PHASE_LABEL[timer.phase]}</Text>
      </View>

      {/* Fortschrittsring */}
      <CountdownCircle
        secondsLeft={timer.secondsLeft}
        total={timer.totalForPhase}
        phase={timer.phase}
      />

      {/* Satz / Rep Info */}
      {currentSet && (
        <View style={styles.infoBlock}>
          <Text style={styles.progressText}>
            Satz {timer.setIndex + 1} / {timer.totalSets}
          </Text>
          <Text style={styles.repText}>
            Rep {timer.rep} / {currentSet.reps}
          </Text>
          <Text style={styles.gripText}>
            {currentSet.gripDepth} · {currentSet.gripType}
          </Text>
          {formatWeight(currentSet.addedWeight) && (
            <Text style={styles.weightText}>{formatWeight(currentSet.addedWeight)}</Text>
          )}
        </View>
      )}

      {/* Steuerung */}
      <View style={styles.controls}>
        {timer.phase === 'idle' ? (
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: GREEN }]} onPress={timer.start}>
            <Text style={styles.ctaBtnText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: timer.isPaused ? GREEN : '#374151' }]}
              onPress={timer.isPaused ? timer.resume : timer.pause}
            >
              <Text style={styles.controlBtnText}>{timer.isPaused ? 'Weiter' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.controlBtnText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Elapsed */}
      {timer.phase !== 'idle' && (
        <Text style={styles.elapsed}>{formatDuration(timer.elapsedSeconds)}</Text>
      )}
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 40 },
  center: { justifyContent: 'center', gap: 16 },

  phaseBadge:  { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  phaseLabel:  { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },

  infoBlock:    { alignItems: 'center', gap: 4 },
  progressText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  repText:      { fontSize: 22, color: '#F9FAFB', fontWeight: '700' },
  gripText:     { fontSize: 15, color: '#D1D5DB', marginTop: 4 },
  weightText:   { fontSize: 13, color: '#60A5FA', marginTop: 2 },

  controls: { alignItems: 'center', width: '100%', paddingHorizontal: 32 },
  btnRow:   { flexDirection: 'row', gap: 12 },
  ctaBtn:   { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 60 },
  ctaBtnText:    { color: '#fff', fontSize: 20, fontWeight: '700' },
  controlBtn:    { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  controlBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },

  elapsed: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

  // Abschluss
  completeEmoji: { fontSize: 64, textAlign: 'center', color: GREEN_LIGHT },
  completeTitle: { fontSize: 26, fontWeight: '800', color: '#F9FAFB', textAlign: 'center' },
  completeSub:   { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  statsRow:      { flexDirection: 'row', gap: 16, marginTop: 8 },
  statBox:       { alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14 },
  statValue:     { fontSize: 22, fontWeight: '700', color: '#F9FAFB' },
  statLabel:     { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  savedHint:     { fontSize: 12, color: '#52B788' },
  doneBtn:       { marginTop: 8, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  doneBtnText:   { color: '#fff', fontSize: 17, fontWeight: '700' },
});

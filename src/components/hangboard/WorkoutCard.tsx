import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HangboardWorkout } from '../../types/hangboard';

interface Props {
  workout: HangboardWorkout;
  onStart: () => void;
  onLongPress: () => void;
}

function estimateDuration(workout: HangboardWorkout): string {
  const totalSeconds = workout.sets.reduce((acc, s, i) => {
    const hangTime = s.hangDuration * s.reps;
    const restTime = s.restDuration * (s.reps - 1);
    const setRestTime = i < workout.sets.length - 1 ? s.setRest : 0;
    return acc + hangTime + restTime + setRestTime;
  }, 0);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return sec > 0 ? `~${min}min ${sec}s` : `~${min}min`;
}

export function WorkoutCard({ workout, onStart, onLongPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onStart} onLongPress={onLongPress} activeOpacity={0.8}>
      <View style={styles.info}>
        <Text style={styles.name}>{workout.name}</Text>
        <Text style={styles.meta}>
          {workout.sets.length} {workout.sets.length === 1 ? 'Satz' : 'Sätze'} · {estimateDuration(workout)}
        </Text>
      </View>
      <View style={styles.startBtn}>
        <Text style={styles.startText}>▶</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  info:      { flex: 1 },
  name:      { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta:      { fontSize: 13, color: '#6B7280', marginTop: 2 },
  startBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  startText: { color: '#fff', fontSize: 14, marginLeft: 2 },
});

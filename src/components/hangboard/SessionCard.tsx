import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HangboardSession } from '../../types/hangboard';

interface Props {
  session: HangboardSession;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

export function SessionCard({ session }: Props) {
  const totalReps = session.completedSets.reduce((a, s) => a + s.completedReps, 0);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{session.workoutName}</Text>
        <Text style={styles.date}>{formatDate(session.date)}</Text>
      </View>
      <Text style={styles.meta}>
        {session.completedSets.length} Sätze · {totalReps} Reps · {formatDuration(session.totalDuration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  date: { fontSize: 13, color: '#6B7280' },
  meta: { fontSize: 12, color: '#9CA3AF' },
});

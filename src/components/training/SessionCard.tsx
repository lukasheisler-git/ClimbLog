import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrainingSession } from '../../types/training';
import { CategoryBadge } from './CategoryBadge';

interface Props {
  session: TrainingSession;
  onPress: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function SessionCard({ session, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>{session.name}</Text>
        <CategoryBadge category={session.category} small />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{formatDate(session.date)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaText}>{session.duration} min</Text>
        {session.exercises.length > 0 && (
          <>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.metaText}>{session.exercises.length} Übung{session.exercises.length !== 1 ? 'en' : ''}</Text>
          </>
        )}
        <Text style={styles.dot}>·</Text>
        <View style={styles.intensityBadge}>
          <Text style={styles.intensityText}>⚡ {session.intensity ?? 5}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  top:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 },
  name:     { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  meta:           { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:       { fontSize: 12, color: '#9CA3AF' },
  dot:            { fontSize: 12, color: '#D1D5DB' },
  intensityBadge: { backgroundColor: '#FEF3C7', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  intensityText:  { fontSize: 11, fontWeight: '600', color: '#92400E' },
});

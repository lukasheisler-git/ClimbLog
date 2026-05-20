import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CategoryBadge } from '../../components/training/CategoryBadge';
import { deleteSession, loadAllSessions } from '../../storage/trainingStorage';
import { TrainingSession } from '../../types/training';
import { TrainingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TrainingStackParamList, 'SessionDetail'>;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatExercise(ex: TrainingSession['exercises'][number]): string {
  const parts: string[] = [];
  if (ex.sets)     parts.push(`${ex.sets} Sätze`);
  if (ex.reps)     parts.push(`${ex.reps} Wdh.`);
  if (ex.duration) parts.push(`${ex.duration} s`);
  if (ex.weight)   parts.push(`${ex.weight} kg`);
  return parts.join(' · ');
}

export function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<TrainingSession | null>(null);

  useFocusEffect(useCallback(() => {
    loadAllSessions().then(all => {
      setSession(all.find(s => s.id === sessionId) ?? null);
    });
  }, [sessionId]));

  const handleDelete = () => {
    Alert.alert(
      'Einheit löschen',
      `"${session?.name}" unwiderruflich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen', style: 'destructive',
          onPress: async () => { await deleteSession(sessionId); navigation.goBack(); },
        },
      ],
    );
  };

  if (!session) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{session.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SessionEditor', { sessionId })}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="pencil-outline" size={20} color="#1B4332" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metaRow}>
          <CategoryBadge category={session.category} />
          <Text style={styles.metaText}>{formatDate(session.date)}</Text>
          <Text style={styles.metaText}>{session.duration} min</Text>
        </View>

        {session.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.sectionLabel}>Notizen</Text>
            <Text style={styles.notesText}>{session.notes}</Text>
          </View>
        ) : null}

        {session.exercises.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Übungen ({session.exercises.length})</Text>
            {session.exercises.map(ex => (
              <View key={ex.id} style={styles.exerciseCard}>
                <Text style={styles.exName}>{ex.name}</Text>
                {!!formatExercise(ex) && <Text style={styles.exMeta}>{formatExercise(ex)}</Text>}
                {ex.notes && <Text style={styles.exNotes}>{ex.notes}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F3F4F6' },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, gap: 10 },
  headerTitle:   { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },

  content: { paddingHorizontal: 16, paddingBottom: 48 },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  metaText: { fontSize: 13, color: '#6B7280' },

  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 16, marginBottom: 8 },

  notesCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 4 },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 20 },

  exerciseCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 6 },
  exName:  { fontSize: 14, fontWeight: '600', color: '#111827' },
  exMeta:  { fontSize: 12, color: '#6B7280', marginTop: 3 },
  exNotes: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
});

import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SessionCard } from '../../components/hangboard/SessionCard';
import { WorkoutCard } from '../../components/hangboard/WorkoutCard';
import { deleteWorkout, loadSessions, loadWorkouts } from '../../storage/hangboardStorage';
import { HangboardSession, HangboardWorkout } from '../../types/hangboard';
import { HangboardStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HangboardStackParamList, 'HangboardHome'>;

export function HangboardHomeScreen({ navigation }: Props) {
  const [workouts, setWorkouts]             = useState<HangboardWorkout[]>([]);
  const [recentSessions, setRecentSessions] = useState<HangboardSession[]>([]);

  // Daten neu laden jedes Mal wenn der Screen aktiv wird
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadWorkouts(), loadSessions()]).then(([ws, ss]) => {
        setWorkouts(ws);
        setRecentSessions(ss.slice(0, 5));
      });
    }, []),
  );

  const handleLongPress = (workout: HangboardWorkout) => {
    Alert.alert(workout.name, undefined, [
      { text: 'Bearbeiten', onPress: () => navigation.navigate('WorkoutEditor', { workoutId: workout.id }) },
      {
        text: 'Löschen', style: 'destructive',
        onPress: () =>
          Alert.alert('Workout löschen?', `"${workout.name}" wird dauerhaft gelöscht.`, [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Löschen', style: 'destructive', onPress: async () => {
                await deleteWorkout(workout.id);
                setWorkouts(prev => prev.filter(w => w.id !== workout.id));
              }},
          ]),
      },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Hangboard</Text>

      {/* Workout starten */}
      <Text style={styles.sectionTitle}>Workout starten</Text>
      {workouts.length === 0 ? (
        <Text style={styles.empty}>Noch keine Workouts gespeichert.</Text>
      ) : (
        workouts.map(w => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onStart={() => navigation.navigate('Timer', { workoutId: w.id })}
            onLongPress={() => handleLongPress(w)}
          />
        ))
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('WorkoutEditor', {})}
      >
        <Text style={styles.addButtonText}>+ Neues Workout</Text>
      </TouchableOpacity>

      {/* Letzte Sessions */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Letzte Sessions</Text>
      {recentSessions.length === 0 ? (
        <Text style={styles.empty}>Noch keine Sessions aufgezeichnet.</Text>
      ) : (
        recentSessions.map(s => <SessionCard key={s.id} session={s} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F3F4F6' },
  container:    { padding: 20, paddingBottom: 40 },
  heading:      { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 20, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  empty:        { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  addButton:    { marginTop: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#1B4332', borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center' },
  addButtonText:{ fontSize: 14, fontWeight: '600', color: '#1B4332' },
});

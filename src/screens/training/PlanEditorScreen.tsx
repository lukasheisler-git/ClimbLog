import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { TrainingStackParamList } from '../../navigation/types';
import { loadPlans, savePlans } from '../../storage/planStorage';
import { ALL_WEEKDAYS, TrainingPlan } from '../../types/plan';

type Props = NativeStackScreenProps<TrainingStackParamList, 'PlanEditor'>;

const GREEN = '#1B4332';

export function PlanEditorScreen({ route, navigation }: Props) {
  const { planId } = route.params ?? {};
  const [name, setName] = useState('');

  useEffect(() => {
    if (!planId) return;
    loadPlans().then(plans => {
      const found = plans.find(p => p.id === planId);
      if (found) setName(found.name);
    });
  }, [planId]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name fehlt', 'Bitte einen Namen für den Plan eingeben.');
      return;
    }

    try {
      const plans = await loadPlans();

      if (planId) {
        await savePlans(plans.map(p => p.id === planId ? { ...p, name: trimmed } : p));
      } else {
        const hasActive = plans.some(p => p.isActive);
        const newPlan: TrainingPlan = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: trimmed,
          createdAt: new Date().toISOString(),
          isActive: !hasActive,
          weekdays: ALL_WEEKDAYS.map(weekday => ({ weekday, isRestDay: true, units: [] })),
        };
        await savePlans([...plans, newPlan]);
      }

      navigation.goBack();
    } catch {
      Alert.alert('Fehler', 'Plan konnte nicht gespeichert werden.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{planId ? 'Plan bearbeiten' : 'Neuer Plan'}</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={8}>
          <Text style={styles.saveBtn}>Speichern</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="z.B. Winterplan"
          placeholderTextColor="#9CA3AF"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F3F4F6' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveBtn:     { fontSize: 15, fontWeight: '700', color: GREEN },

  content: { padding: 20 },
  label:   { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  input:   { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB' },
});

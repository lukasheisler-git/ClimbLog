import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { loadWorkouts } from '../../storage/hangboardStorage';
import { loadTemplates } from '../../storage/trainingStorage';
import { CATEGORY_COLOR } from '../../types/training';
import { HangboardWorkout } from '../../types/hangboard';
import { TrainingSession } from '../../types/training';
import { PlannedUnit } from '../../types/plan';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (unit: Omit<PlannedUnit, 'order'>) => void;
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function badgeColor(category: string): string {
  return (CATEGORY_COLOR as Record<string, string>)[category] ?? '#6B7280';
}

export function TemplatePickerModal({ visible, onClose, onSelect }: Props) {
  const [templates, setTemplates] = useState<TrainingSession[]>([]);
  const [workouts,  setWorkouts]  = useState<HangboardWorkout[]>([]);

  useEffect(() => {
    if (!visible) return;
    Promise.all([loadTemplates(), loadWorkouts()]).then(([t, w]) => {
      setTemplates(t);
      setWorkouts(w);
    });
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Einheit hinzufügen</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.doneBtn}>Fertig</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Training Templates */}
          <Text style={styles.section}>Training</Text>
          {templates.length === 0 ? (
            <Text style={styles.empty}>Keine Templates vorhanden.</Text>
          ) : templates.map(t => (
            <TouchableOpacity
              key={t.id}
              style={styles.row}
              onPress={() => onSelect({ id: makeId(), type: 'training', templateId: t.id, templateName: t.name, category: t.category })}
              activeOpacity={0.7}
            >
              <Ionicons name="barbell-outline" size={18} color="#6B7280" style={styles.rowIcon} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{t.name}</Text>
                <View style={[styles.badge, { backgroundColor: badgeColor(t.category) + '22' }]}>
                  <Text style={[styles.badgeText, { color: badgeColor(t.category) }]}>{t.category}</Text>
                </View>
              </View>
              <Ionicons name="add-circle-outline" size={20} color="#1B4332" />
            </TouchableOpacity>
          ))}

          {/* Hangboard Workouts */}
          <Text style={[styles.section, { marginTop: 16 }]}>Hangboard</Text>
          {workouts.length === 0 ? (
            <Text style={styles.empty}>Keine Workouts vorhanden.</Text>
          ) : workouts.map(w => (
            <TouchableOpacity
              key={w.id}
              style={styles.row}
              onPress={() => onSelect({ id: makeId(), type: 'hangboard', templateId: w.id, templateName: w.name, category: w.category })}
              activeOpacity={0.7}
            >
              <Ionicons name="finger-print-outline" size={18} color="#6B7280" style={styles.rowIcon} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{w.name}</Text>
                <View style={[styles.badge, { backgroundColor: badgeColor(w.category) + '22' }]}>
                  <Text style={[styles.badgeText, { color: badgeColor(w.category) }]}>{w.category}</Text>
                </View>
              </View>
              <Ionicons name="add-circle-outline" size={20} color="#1B4332" />
            </TouchableOpacity>
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', paddingBottom: 24 },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: 12, marginBottom: 4 },

  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  sheetTitle:  { fontSize: 17, fontWeight: '700', color: '#111827' },
  doneBtn:     { fontSize: 15, fontWeight: '600', color: '#1B4332' },

  section: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 20, marginBottom: 6 },
  empty:   { fontSize: 13, color: '#9CA3AF', marginHorizontal: 20, marginBottom: 8 },

  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  rowIcon:  { marginRight: 12 },
  rowInfo:  { flex: 1, gap: 4 },
  rowName:  { fontSize: 14, fontWeight: '600', color: '#111827' },
  badge:    { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:{ fontSize: 10, fontWeight: '600' },
});

import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrainingStackParamList } from '../../navigation/types';
import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { CategoryBadge } from '../../components/training/CategoryBadge';
import { SessionCard } from '../../components/training/SessionCard';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';
import { deleteSession } from '../../storage/trainingStorage';
import { PlannedUnit } from '../../types/plan';
import { CATEGORY_COLOR, TrainingSession } from '../../types/training';

function badgeColor(category: string): string {
  return (CATEGORY_COLOR as Record<string, string>)[category] ?? '#6B7280';
}

interface Props {
  navigation: NativeStackNavigationProp<TrainingStackParamList>;
  sessions:  TrainingSession[];
  templates: TrainingSession[];
  onReload:  () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TrainingLogScreen({ navigation, sessions, templates, onReload }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const { todayPlan, reload } = useTrainingPlan();
  useEffect(() => { reload(); }, [reload]);

  const openFromTemplate = async (template: TrainingSession) => {
    setModalVisible(false);
    navigation.navigate('SessionEditor', { templateId: template.id });
  };

  const deleteTemplate = (template: TrainingSession) => {
    Alert.alert(
      'Template löschen?',
      `„${template.name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteSession(template.id); onReload(); } },
      ],
    );
  };

  const openEmpty = () => {
    setModalVisible(false);
    navigation.navigate('SessionEditor', {});
  };

  const openPlannedUnit = (unit: PlannedUnit) => {
    setModalVisible(false);
    if (unit.type === 'hangboard') {
      (navigation as any).navigate('HangboardTab', { screen: 'HangboardHome' });
      (navigation as any).navigate('HangboardTab', { screen: 'Timer', params: { workoutId: unit.templateId } });
    } else {
      navigation.navigate('SessionEditor', { templateId: unit.templateId });
    }
  };

  const showTodaySection = !!(todayPlan && !todayPlan.isRestDay && todayPlan.units.length > 0);

  return (
    <View style={styles.root}>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Noch keine Trainingseinheiten erfasst.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>Erste Einheit hinzufügen</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Quick-Log Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Training starten</Text>

          {showTodaySection && (
            <View style={styles.todaySection}>
              <View style={styles.modalSectionRow}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                <Text style={styles.modalSection}>Heute geplant</Text>
              </View>
              {todayPlan!.units.map(unit => {
                const color = badgeColor(unit.category);
                return (
                  <TouchableOpacity key={unit.id} style={styles.plannedUnitCard} onPress={() => openPlannedUnit(unit)}>
                    <Ionicons
                      name={unit.type === 'hangboard' ? 'finger-print-outline' : 'barbell-outline'}
                      size={17} color="#6B7280"
                    />
                    <Text style={styles.plannedUnitName} numberOfLines={1}>{unit.templateName}</Text>
                    <View style={[styles.unitBadge, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.unitBadgeText, { color }]}>{unit.category}</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={14} color="#D1D5DB" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.modalSection}>Schnellstart</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateRow}
          >
            {templates.map(t => (
              <TouchableOpacity key={t.id} style={styles.templateCard} onPress={() => openFromTemplate(t)}>
                <TouchableOpacity style={styles.templateDeleteBtn} onPress={() => deleteTemplate(t)} hitSlop={6}>
                  <Ionicons name="trash-outline" size={13} color="#9CA3AF" />
                </TouchableOpacity>
                <CategoryBadge category={t.category} small />
                <Text style={styles.templateName} numberOfLines={2}>{t.name}</Text>
                <Text style={styles.templateDuration}>{t.duration} min</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.modalSection}>Eigenes Workout</Text>
          <TouchableOpacity style={styles.customBtn} onPress={openEmpty}>
            <Ionicons name="add-circle-outline" size={20} color="#1B4332" />
            <Text style={styles.customBtnText}>Eigenes Workout erstellen</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },

  emptyBox:    { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText:   { fontSize: 14, color: '#9CA3AF' },
  emptyBtn:    { backgroundColor: '#1B4332', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },

  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: 48, paddingHorizontal: 20,
  },
  modalHandle:  { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  modalSection: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },

  templateRow: { gap: 10, paddingRight: 4, marginBottom: 20 },
  templateCard: {
    width: 120, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, gap: 6,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  templateDeleteBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  templateName:     { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 17 },
  templateDuration: { fontSize: 11, color: '#9CA3AF' },

  customBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#1B4332', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13 },
  customBtnText: { fontSize: 15, fontWeight: '600', color: '#1B4332' },

  modalSectionRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  todaySection:     { marginBottom: 20 },
  plannedUnitCard:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  plannedUnitName:  { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' },
  unitBadge:        { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  unitBadgeText:    { fontSize: 10, fontWeight: '600' },
});


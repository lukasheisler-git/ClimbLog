import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { TrainingStackParamList } from '../../navigation/types';
import { CATEGORY_COLOR } from '../../types/training';
import { ALL_WEEKDAYS, PlannedUnit, TrainingPlan, Weekday, WeekdayPlan, WEEKDAY_LABEL } from '../../types/plan';
import { useTrainingPlan, getTodayWeekday } from '../../hooks/useTrainingPlan';

interface Props {
  navigation: NativeStackNavigationProp<TrainingStackParamList>;
}

const GREEN = '#1B4332';

function badgeColor(category: string): string {
  return (CATEGORY_COLOR as Record<string, string>)[category] ?? '#6B7280';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Unit Chip ────────────────────────────────────────────────────────────────

function UnitChip({ unit }: { unit: PlannedUnit }) {
  const color = badgeColor(unit.category);
  return (
    <View style={[styles.chip, { backgroundColor: color + '18', borderColor: color + '44' }]}>
      <Ionicons
        name={unit.type === 'hangboard' ? 'finger-print-outline' : 'barbell-outline'}
        size={11} color={color}
      />
      <Text style={[styles.chipText, { color }]} numberOfLines={1}>{unit.templateName}</Text>
    </View>
  );
}

// ─── Day Card ────────────────────────────────────────────────────────────────

function DayCard({ weekday, day, isToday, onEdit }: { weekday: Weekday; day: WeekdayPlan | undefined; isToday: boolean; onEdit: () => void }) {
  const isRestDay = day?.isRestDay ?? true;
  const units = day?.units ?? [];

  return (
    <View style={[styles.dayCard, isToday && styles.dayCardToday]}>
      <View style={styles.dayLeft}>
        <Text style={[styles.dayLabel, isToday && { color: GREEN, fontWeight: '700' }]}>
          {WEEKDAY_LABEL[weekday]}
        </Text>
        {isRestDay ? (
          <Text style={styles.restText}>Ruhetag</Text>
        ) : units.length === 0 ? (
          <Text style={styles.restText}>Kein Training geplant</Text>
        ) : (
          <View style={styles.chips}>
            {units.map(u => <UnitChip key={u.id} unit={u} />)}
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.editBtn}>
        <Ionicons name="pencil-outline" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Plan Selection Modal ─────────────────────────────────────────────────────

function PlanSelectModal({
  visible, plans, onClose, onSelect, onNew, onEdit, onDelete,
}: {
  visible: boolean;
  plans: TrainingPlan[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Trainingsplan wählen</Text>

        <FlatList
          data={plans}
          keyExtractor={p => p.id}
          style={{ maxHeight: 340 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.planRow}
              onPress={() => { onSelect(item.id); onClose(); }}
              onLongPress={() => {
                Alert.alert(item.name, undefined, [
                  { text: 'Bearbeiten', onPress: () => { onClose(); onEdit(item.id); } },
                  ...(!item.isActive ? [{ text: 'Löschen', style: 'destructive' as const, onPress: () => onDelete(item.id) }] : []),
                  { text: 'Abbrechen', style: 'cancel' },
                ]);
              }}
            >
              <View style={styles.planRowInfo}>
                <Text style={styles.planName}>{item.name}</Text>
                <Text style={styles.planDate}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.isActive && (
                <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Aktiv</Text></View>
              )}
              <Ionicons name="chevron-forward-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Noch keine Pläne vorhanden.</Text>}
        />

        <TouchableOpacity style={styles.newPlanBtn} onPress={() => { onClose(); onNew(); }}>
          <Ionicons name="add-circle-outline" size={18} color={GREEN} />
          <Text style={styles.newPlanText}>Neuer Plan</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PlanningScreen({ navigation }: Props) {
  const { plans, activePlan, reload, setActivePlan, deletePlan } = useTrainingPlan();
  const [modalVisible, setModalVisible] = useState(false);
  const todayWeekday = getTodayWeekday();

  useEffect(() => { reload(); }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleDeletePlan = (id: string) => {
    Alert.alert('Plan löschen?', 'Dieser Plan wird dauerhaft gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deletePlan(id) },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Plan-Auswahl Header */}
      <TouchableOpacity style={styles.planHeader} onPress={() => setModalVisible(true)}>
        <View>
          <Text style={styles.planHeaderLabel}>Trainingsplan</Text>
          <Text style={styles.planHeaderName} numberOfLines={1}>
            {activePlan?.name ?? 'Kein Plan vorhanden'}
          </Text>
        </View>
        <Ionicons name="chevron-down-outline" size={18} color="#6B7280" />
      </TouchableOpacity>

      {/* Wochenansicht */}
      <ScrollView contentContainerStyle={styles.weekList}>
        {ALL_WEEKDAYS.map(weekday => (
          <DayCard
            key={weekday}
            weekday={weekday}
            day={activePlan?.weekdays.find(d => d.weekday === weekday)}
            isToday={weekday === todayWeekday}
            onEdit={() => navigation.navigate('DayEditor', { weekday })}
          />
        ))}
      </ScrollView>

      <PlanSelectModal
        visible={modalVisible}
        plans={plans}
        onClose={() => setModalVisible(false)}
        onSelect={setActivePlan}
        onNew={() => navigation.navigate('PlanEditor', {})}
        onEdit={id => navigation.navigate('PlanEditor', { planId: id })}
        onDelete={handleDeletePlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },

  planHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  planHeaderLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 },
  planHeaderName:  { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 1 },

  weekList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  dayCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dayCardToday: { borderWidth: 1.5, borderColor: GREEN + '55' },
  dayLeft:      { flex: 1 },
  dayLabel:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  restText:     { fontSize: 12, color: '#9CA3AF' },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  editBtn:      { padding: 4, marginLeft: 8 },

  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '600', maxWidth: 110 },

  // Plan Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 40, paddingHorizontal: 20 },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },

  planRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  planRowInfo: { flex: 1 },
  planName:    { fontSize: 15, fontWeight: '600', color: '#111827' },
  planDate:    { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  activeBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: '#065F46' },

  newPlanBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  newPlanText: { fontSize: 15, fontWeight: '600', color: GREEN },
  empty:       { fontSize: 13, color: '#9CA3AF', paddingVertical: 12 },
});

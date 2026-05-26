import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TemplatePickerModal } from '../../components/training/TemplatePickerModal';
import { TrainingStackParamList } from '../../navigation/types';
import { loadPlans } from '../../storage/planStorage';
import { CATEGORY_COLOR } from '../../types/training';
import { PlannedUnit, WEEKDAY_LABEL, WeekdayPlan } from '../../types/plan';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';

type Props = NativeStackScreenProps<TrainingStackParamList, 'DayEditor'>;

const GREEN = '#1B4332';

function badgeColor(category: string): string {
  return (CATEGORY_COLOR as Record<string, string>)[category] ?? '#6B7280';
}

export function DayEditorScreen({ route, navigation }: Props) {
  const { weekday } = route.params;
  const { activePlan, reload: reloadPlan, updateWeekday } = useTrainingPlan();

  const [isRestDay, setIsRestDay] = useState(true);
  const [units,     setUnits]     = useState<PlannedUnit[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load initial state from active plan
  useEffect(() => {
    loadPlans().then(plans => {
      const plan = plans.find(p => p.isActive) ?? plans[0];
      const day  = plan?.weekdays.find(d => d.weekday === weekday);
      if (day) { setIsRestDay(day.isRestDay); setUnits(day.units); }
    });
  }, [weekday]);

  // Also keep in sync when reloadPlan triggers
  useEffect(() => {
    if (!activePlan) return;
    const day = activePlan.weekdays.find(d => d.weekday === weekday);
    if (day) { setIsRestDay(day.isRestDay); setUnits(day.units); }
  }, [activePlan, weekday]);

  useEffect(() => { reloadPlan(); }, [reloadPlan]);

  const handleSave = async () => {
    const dayPlan: WeekdayPlan = {
      weekday,
      isRestDay,
      units: units.map((u, i) => ({ ...u, order: i })),
    };
    await updateWeekday(weekday, dayPlan);
    navigation.goBack();
  };

  const handleAddUnit = (unit: Omit<PlannedUnit, 'order'>) => {
    setUnits(prev => [...prev, { ...unit, order: prev.length }]);
  };

  const handleDeleteUnit = (id: string) => {
    Alert.alert('Einheit entfernen?', undefined, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => setUnits(prev => prev.filter(u => u.id !== id)) },
    ]);
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<PlannedUnit>) => {
    const color = badgeColor(item.category);
    return (
      <ScaleDecorator>
        <View style={[styles.unitCard, isActive && styles.unitCardActive]}>
          <Ionicons
            name={item.type === 'hangboard' ? 'finger-print-outline' : 'barbell-outline'}
            size={18} color="#6B7280" style={styles.unitIcon}
          />
          <View style={styles.unitInfo}>
            <Text style={styles.unitName}>{item.templateName}</Text>
            <View style={[styles.badge, { backgroundColor: color + '22' }]}>
              <Text style={[styles.badgeText, { color }]}>{item.category}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteUnit(item.id)} hitSlop={6} style={styles.unitAction}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity onLongPress={drag} delayLongPress={150} hitSlop={6} style={styles.unitAction}>
            <Ionicons name="reorder-three-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{WEEKDAY_LABEL[weekday]}</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={8}>
          <Text style={styles.saveBtn}>Speichern</Text>
        </TouchableOpacity>
      </View>

      {/* Ruhetag Toggle */}
      <View style={styles.restRow}>
        <Text style={styles.restLabel}>Ruhetag</Text>
        <Switch
          value={isRestDay}
          onValueChange={setIsRestDay}
          trackColor={{ false: '#E5E7EB', true: GREEN }}
          thumbColor="#fff"
        />
      </View>

      {/* Unit List */}
      {!isRestDay && (
        <>
          <DraggableFlatList
            data={units}
            keyExtractor={u => u.id}
            onDragEnd={({ data }) => setUnits(data.map((u, i) => ({ ...u, order: i })))}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>Noch keine Einheiten. Tippe auf "+" um eine hinzuzufügen.</Text>
            }
          />

          <TouchableOpacity style={styles.addBtn} onPress={() => setPickerOpen(true)}>
            <Ionicons name="add-circle-outline" size={20} color={GREEN} />
            <Text style={styles.addBtnText}>Einheit hinzufügen</Text>
          </TouchableOpacity>
        </>
      )}

      <TemplatePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddUnit}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveBtn:     { fontSize: 15, fontWeight: '700', color: GREEN },

  restRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  restLabel:{ fontSize: 15, color: '#111827', fontWeight: '500' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },

  unitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  unitCardActive: { opacity: 0.9, shadowOpacity: 0.15, elevation: 4 },
  unitIcon:   { marginRight: 10 },
  unitInfo:   { flex: 1, gap: 4 },
  unitName:   { fontSize: 14, fontWeight: '600', color: '#111827' },
  badge:      { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:  { fontSize: 10, fontWeight: '600' },
  unitAction: { padding: 4, marginLeft: 4 },

  empty:  { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24, paddingHorizontal: 20 },

  addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, borderWidth: 1.5, borderColor: GREEN, borderStyle: 'dashed', paddingVertical: 13 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: GREEN },
});

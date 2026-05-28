import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';
import { AppTabParamList } from '../../navigation/types';
import { PlannedUnit } from '../../types/plan';
import { CATEGORY_COLOR } from '../../types/training';

interface Props {
  navigation: NavigationProp<AppTabParamList>;
}

const GREEN = '#1B4332';
const MAX_SHOWN = 4;

function badgeColor(category: string): string {
  return (CATEGORY_COLOR as Record<string, string>)[category] ?? '#6B7280';
}

function UnitRow({ unit, onPress }: { unit: PlannedUnit; onPress: () => void }) {
  const color = badgeColor(unit.category);
  return (
    <TouchableOpacity style={styles.unitRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.unitIconBox, { backgroundColor: color + '18' }]}>
        <Ionicons
          name={unit.type === 'hangboard' ? 'finger-print-outline' : 'barbell-outline'}
          size={16} color={color}
        />
      </View>
      <View style={styles.unitInfo}>
        <Text style={styles.unitName}>{unit.templateName}</Text>
        <Text style={[styles.unitCategory, { color }]}>{unit.category}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={14} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export function TodayWidget({ navigation }: Props) {
  const { todayPlan, activePlan, reload } = useTrainingPlan();

  useEffect(() => { reload(); }, [reload]);

  const handleUnitPress = (unit: PlannedUnit) => {
    if (unit.type === 'hangboard') {
      navigation.navigate('HangboardTab', { screen: 'Timer', params: { workoutId: unit.templateId } } as any);
    } else {
      navigation.navigate('TrainingTab', { screen: 'SessionEditor', params: { templateId: unit.templateId } } as any);
    }
  };

  const handlePlanLink = () => {
    navigation.navigate('TrainingTab', {} as any);
  };

  const isRestDay = todayPlan?.isRestDay ?? true;
  const units = todayPlan?.isRestDay ? [] : (todayPlan?.units ?? []);
  const shown = units.slice(0, MAX_SHOWN);
  const overflow = units.length - MAX_SHOWN;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Heutiges Training</Text>

      {activePlan === null ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kein Trainingsplan vorhanden.</Text>
          <TouchableOpacity onPress={handlePlanLink}>
            <Text style={styles.link}>Plan erstellen →</Text>
          </TouchableOpacity>
        </View>
      ) : isRestDay ? (
        <View style={styles.restState}>
          <Ionicons name="moon-outline" size={20} color="#9CA3AF" />
          <Text style={styles.restText}>Ruhetag</Text>
        </View>
      ) : units.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kein Training geplant.</Text>
          <TouchableOpacity onPress={handlePlanLink}>
            <Text style={styles.link}>Planen →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {shown.map(unit => (
            <UnitRow key={unit.id} unit={unit} onPress={() => handleUnitPress(unit)} />
          ))}
          {overflow > 0 && (
            <TouchableOpacity onPress={handlePlanLink} style={styles.moreBtn}>
              <Text style={styles.moreText}>+ {overflow} weitere</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  restState: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  restText:  { fontSize: 15, color: '#9CA3AF' },

  emptyState: { paddingVertical: 8, gap: 4 },
  emptyText:  { fontSize: 13, color: '#9CA3AF' },
  link:       { fontSize: 13, fontWeight: '600', color: GREEN },

  unitRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  unitIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  unitInfo:    { flex: 1, gap: 2 },
  unitName:    { fontSize: 14, fontWeight: '600', color: '#111827' },
  unitCategory:{ fontSize: 11, fontWeight: '500' },

  moreBtn:  { paddingTop: 10, alignItems: 'center' },
  moreText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
});

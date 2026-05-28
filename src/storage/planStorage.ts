import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_WEEKDAYS, TrainingPlan } from '../types/plan';

const PLANS_KEY = 'trainingPlans';

function makeDefaultPlan(): TrainingPlan {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: 'Mein Trainingsplan',
    createdAt: new Date().toISOString(),
    isActive: true,
    weekdays: ALL_WEEKDAYS.map(weekday => ({ weekday, isRestDay: true, units: [] })),
  };
}

export async function loadPlans(): Promise<TrainingPlan[]> {
  const raw = await AsyncStorage.getItem(PLANS_KEY);
  if (!raw) return [];
  const plans: TrainingPlan[] = JSON.parse(raw);
  return plans.map(p => ({
    ...p,
    weekdays: p.weekdays.map(d => ({ ...d, units: d.units ?? [] })),
  }));
}

export async function savePlans(plans: TrainingPlan[]): Promise<void> {
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export async function initDefaultPlan(): Promise<void> {
  const plans = await loadPlans();
  if (plans.length === 0) {
    await savePlans([makeDefaultPlan()]);
  }
}

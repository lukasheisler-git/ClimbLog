import { useCallback, useState } from 'react';
import { loadPlans, savePlans } from '../storage/planStorage';
import { JS_DAY_TO_WEEKDAY, TrainingPlan, Weekday, WeekdayPlan } from '../types/plan';

export function getTodayWeekday(): Weekday {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()];
}

export function useTrainingPlan() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);

  const reload = useCallback(async () => {
    setPlans(await loadPlans());
  }, []);

  const activePlan = plans.find(p => p.isActive) ?? plans[0] ?? null;
  const todayWeekday = getTodayWeekday();
  const todayPlan = activePlan?.weekdays.find(d => d.weekday === todayWeekday) ?? null;

  const _persist = useCallback(async (updated: TrainingPlan[]) => {
    setPlans(updated);
    await savePlans(updated);
  }, []);

  const setActivePlan = useCallback(async (planId: string) => {
    _persist(plans.map(p => ({ ...p, isActive: p.id === planId })));
  }, [plans, _persist]);

  const savePlan = useCallback(async (plan: TrainingPlan) => {
    const exists = plans.some(p => p.id === plan.id);
    if (exists) {
      _persist(plans.map(p => p.id === plan.id ? plan : p));
    } else {
      const hasActive = plans.some(p => p.isActive);
      _persist([...plans, { ...plan, isActive: !hasActive }]);
    }
  }, [plans, _persist]);

  const deletePlan = useCallback(async (planId: string) => {
    _persist(plans.filter(p => p.id !== planId));
  }, [plans, _persist]);

  const updateWeekday = useCallback(async (weekday: Weekday, dayPlan: WeekdayPlan) => {
    if (!activePlan) return;
    await savePlan({
      ...activePlan,
      weekdays: activePlan.weekdays.map(d => d.weekday === weekday ? dayPlan : d),
    });
  }, [activePlan, savePlan]);

  return { plans, activePlan, todayPlan, todayWeekday, reload, setActivePlan, savePlan, deletePlan, updateWeekday };
}

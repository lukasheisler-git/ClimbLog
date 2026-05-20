import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ClimbRoute } from '../../types/climblog';

interface Props {
  routes: ClimbRoute[];
}

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WeekActivityWidget({ routes }: Props) {
  const weekDates = getWeekDates();
  const today = new Date().toISOString().slice(0, 10);

  const activeDays = new Set(routes.map(r => r.date.slice(0, 10)));

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Diese Woche</Text>
      <View style={styles.dots}>
        {weekDates.map((date, i) => {
          const isActive  = activeDays.has(date);
          const isToday   = date === today;
          return (
            <View key={date} style={styles.dayCol}>
              <View style={[
                styles.dot,
                isActive  && styles.dotActive,
                isToday   && !isActive && styles.dotToday,
              ]} />
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  dots:      { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol:    { alignItems: 'center', gap: 6 },
  dot:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  dotToday:  { borderColor: '#1B4332' },
  dayLabel:      { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  dayLabelToday: { color: '#1B4332', fontWeight: '700' },
});

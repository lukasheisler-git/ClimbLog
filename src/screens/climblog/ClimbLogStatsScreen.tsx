import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { NavTabs } from '../../components/climblog/NavTabs';
import { gradeIndex } from '../../hooks/useClimbLog';
import { ClimbLogStackParamList } from '../../navigation/types';
import { loadRoutes } from '../../storage/climblogStorage';
import { ClimbResult, ClimbRoute, GRADES } from '../../types/climblog';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'ClimbLogStats'>;

const RESULT_COLOR: Record<ClimbResult, string> = {
  Onsight:  '#F59E0B',
  Flash:    '#3B82F6',
  Redpoint: '#EF4444',
  Project:  '#9CA3AF',
};

const STACK_ORDER: ClimbResult[] = ['Onsight', 'Flash', 'Redpoint', 'Project'];

interface BarData {
  grade: string;
  counts: Record<ClimbResult, number>;
  total: number;
}

function hardestGrade(routes: ClimbRoute[], result: ClimbResult): string | null {
  const matches = routes.filter(r => r.result === result);
  if (!matches.length) return null;
  return matches.reduce((best, r) => gradeIndex(r.grade) > gradeIndex(best.grade) ? r : best).grade;
}

function GradeChart({ barData, maxTotal }: { barData: BarData[]; maxTotal: number }) {
  const CHART_H = 150;
  const BAR_W   = 30;
  const BAR_GAP = 10;
  const L_PAD   = 24; // y-axis labels
  const B_PAD   = 20; // x-axis labels
  const SVG_W   = barData.length * (BAR_W + BAR_GAP) + L_PAD;
  const SVG_H   = CHART_H + B_PAD;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={Math.max(SVG_W, 240)} height={SVG_H}>
        {/* Grid lines at 0%, 50%, 100% */}
        {[0, 0.5, 1].map(frac => {
          const y = CHART_H - frac * CHART_H;
          const label = Math.round(frac * maxTotal).toString();
          return (
            <G key={frac}>
              <Line x1={L_PAD} y1={y} x2={SVG_W} y2={y} stroke="#E5E7EB" strokeWidth="1" />
              {frac > 0 && (
                <SvgText x={L_PAD - 3} y={y + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">{label}</SvgText>
              )}
            </G>
          );
        })}

        {/* Bars */}
        {barData.map((d, i) => {
          const x = L_PAD + i * (BAR_W + BAR_GAP);
          let accH = 0;
          return (
            <G key={d.grade}>
              {STACK_ORDER.map(result => {
                const count = d.counts[result];
                if (!count) return null;
                const h = (count / maxTotal) * CHART_H;
                const y = CHART_H - accH - h;
                accH += h;
                return (
                  <Rect key={result} x={x} y={y} width={BAR_W} height={h} fill={RESULT_COLOR[result]} />
                );
              })}
              <SvgText x={x + BAR_W / 2} y={CHART_H + 14} textAnchor="middle" fontSize="9" fill="#6B7280">
                {d.grade}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ClimbLogStatsScreen({ navigation }: Props) {
  const [routes, setRoutes] = useState<ClimbRoute[]>([]);

  useFocusEffect(
    useCallback(() => { loadRoutes().then(setRoutes); }, []),
  );

  const barData = useMemo<BarData[]>(() => {
    const map: Record<string, Record<ClimbResult, number>> = {};
    for (const r of routes) {
      if (!map[r.grade]) map[r.grade] = { Onsight: 0, Flash: 0, Redpoint: 0, Project: 0 };
      map[r.grade][r.result]++;
    }
    return (GRADES as readonly string[])
      .filter(g => map[g])
      .map(g => ({
        grade:  g,
        counts: map[g],
        total:  Object.values(map[g]).reduce((a, b) => a + b, 0),
      }));
  }, [routes]);

  const maxTotal = useMemo(() => Math.max(1, ...barData.map(d => d.total)), [barData]);

  const uniqueAreas = useMemo(
    () => new Set(routes.filter(r => r.area).map(r => r.area!)).size,
    [routes],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Kletterlog</Text>
      </View>
      <NavTabs
        active="Statistik"
        onPress={tab => {
          if (tab === 'Begehungen') navigation.navigate('ClimbLogHome');
          if (tab === 'Suche')     navigation.navigate('ClimbLogSearch');
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Balkendiagramm */}
        <Text style={styles.sectionTitle}>Begehungen nach Schwierigkeitsgrad</Text>

        {barData.length === 0 ? (
          <Text style={styles.empty}>Noch keine Daten vorhanden.</Text>
        ) : (
          <View style={styles.chartCard}>
            <GradeChart barData={barData} maxTotal={maxTotal} />
            {/* Legende */}
            <View style={styles.legend}>
              {(Object.entries(RESULT_COLOR) as [ClimbResult, string][]).map(([result, color]) => (
                <View key={result} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{result}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Kennzahlen */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Kennzahlen</Text>
        <View style={styles.statGrid}>
          <StatCard label="Begehungen gesamt"  value={routes.length.toString()} />
          <StatCard label="Schwerstes Redpoint" value={hardestGrade(routes, 'Redpoint') ?? '—'} />
          <StatCard label="Schwerstes Onsight"  value={hardestGrade(routes, 'Onsight') ?? '—'} />
          <StatCard label="Klettergebiete"       value={uniqueAreas.toString()} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F3F4F6' },
  header:    { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:     { fontSize: 26, fontWeight: '700', color: '#111827' },
  container: { paddingHorizontal: 16, paddingBottom: 48 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  empty:        { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },

  chartCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    marginBottom: 8,
  },
  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  statGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard:  {
    flex: 1, minWidth: '40%', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
});

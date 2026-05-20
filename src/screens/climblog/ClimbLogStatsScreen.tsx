import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { NavTabs } from '../../components/climblog/NavTabs';
import { gradeIndex } from '../../hooks/useClimbLog';
import { ClimbLogStackParamList } from '../../navigation/types';
import { loadRoutes, updateRoute } from '../../storage/climblogStorage';
import { ClimbResult, ClimbRoute, GRADES } from '../../types/climblog';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'ClimbLogStats'>;

const RESULT_COLOR: Record<ClimbResult, string> = {
  Onsight:  '#F59E0B',
  Flash:    '#3B82F6',
  Redpoint: '#EF4444',
  Project:  '#9CA3AF',
};

// Projekte werden im Diagramm nicht gestapelt — nur abgeschlossene Begehungen
const CHART_ORDER: ClimbResult[] = ['Onsight', 'Flash', 'Redpoint'];

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function GradeChart({ barData, maxTotal }: { barData: BarData[]; maxTotal: number }) {
  const CHART_H = 150;
  const BAR_W   = 30;
  const BAR_GAP = 10;
  const L_PAD   = 24;
  const B_PAD   = 20;
  const SVG_W   = barData.length * (BAR_W + BAR_GAP) + L_PAD;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={Math.max(SVG_W, 240)} height={CHART_H + B_PAD}>
        {[0, 0.5, 1].map(frac => {
          const y = CHART_H - frac * CHART_H;
          return (
            <G key={frac}>
              <Line x1={L_PAD} y1={y} x2={SVG_W} y2={y} stroke="#E5E7EB" strokeWidth="1" />
              {frac > 0 && (
                <SvgText x={L_PAD - 3} y={y + 4} textAnchor="end" fontSize="9" fill="#9CA3AF">
                  {Math.round(frac * maxTotal)}
                </SvgText>
              )}
            </G>
          );
        })}

        {barData.map((d, i) => {
          const x = L_PAD + i * (BAR_W + BAR_GAP);
          let accH = 0;
          return (
            <G key={d.grade}>
              {CHART_ORDER.map(result => {
                const count = d.counts[result];
                if (!count) return null;
                const h = (count / maxTotal) * CHART_H;
                const y = CHART_H - accH - h;
                accH += h;
                return <Rect key={result} x={x} y={y} width={BAR_W} height={h} fill={RESULT_COLOR[result]} />;
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

function ProjectCard({ route, onComplete }: { route: ClimbRoute; onComplete: () => void }) {
  return (
    <View style={styles.projectCard}>
      <View style={styles.projectInfo}>
        <Text style={styles.projectName} numberOfLines={1}>{route.name}</Text>
        {route.area && <Text style={styles.projectArea} numberOfLines={1}>{route.area}</Text>}
        <Text style={styles.projectMeta}>{route.grade} · {formatDate(route.date)}</Text>
      </View>
      <TouchableOpacity onPress={onComplete} hitSlop={8} style={styles.flagBtn}>
        <Ionicons name="flag-outline" size={22} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

export function ClimbLogStatsScreen({ navigation }: Props) {
  const [routes,          setRoutes]          = useState<ClimbRoute[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRoutes().then(setRoutes);
      setShowAllProjects(false);
    }, []),
  );

  // Projekte herausfiltern für alle Kennzahlen + Diagramm
  const completedRoutes = useMemo(() => routes.filter(r => r.result !== 'Project'), [routes]);

  const projects = useMemo(() => (
    [...routes.filter(r => r.result === 'Project')]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), [routes]);

  const visibleProjects = showAllProjects ? projects : projects.slice(0, 3);

  const barData = useMemo<BarData[]>(() => {
    const map: Record<string, Record<ClimbResult, number>> = {};
    for (const r of completedRoutes) {
      if (!map[r.grade]) map[r.grade] = { Onsight: 0, Flash: 0, Redpoint: 0, Project: 0 };
      map[r.grade][r.result]++;
    }
    return (GRADES as readonly string[])
      .filter(g => map[g])
      .map(g => ({
        grade:  g,
        counts: map[g],
        total:  CHART_ORDER.reduce((s, r) => s + map[g][r], 0),
      }));
  }, [completedRoutes]);

  const maxTotal = useMemo(() => Math.max(1, ...barData.map(d => d.total)), [barData]);

  const uniqueAreas = useMemo(
    () => new Set(completedRoutes.filter(r => r.area).map(r => r.area!)).size,
    [completedRoutes],
  );

  const markAsRedpoint = (project: ClimbRoute) => {
    Alert.alert(
      'Route durchgestiegen?',
      `"${project.name}" als Redpoint markieren?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Ja, Rotpunkt!',
          onPress: async () => {
            const updated: ClimbRoute = {
              ...project,
              result: 'Redpoint',
              date:   new Date().toISOString(),
            };
            await updateRoute(updated);
            setRoutes(prev => prev.map(r => r.id === updated.id ? updated : r));
          },
        },
      ],
    );
  };

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

        {/* 1. Kennzahlen — ganz oben */}
        <Text style={styles.sectionTitle}>Kennzahlen</Text>
        <View style={styles.statGrid}>
          <StatCard label="Begehungen gesamt"  value={completedRoutes.length.toString()} />
          <StatCard label="Schwerstes Redpoint" value={hardestGrade(completedRoutes, 'Redpoint') ?? '—'} />
          <StatCard label="Schwerstes Onsight"  value={hardestGrade(completedRoutes, 'Onsight') ?? '—'} />
          <StatCard label="Klettergebiete"      value={uniqueAreas.toString()} />
        </View>

        {/* 2. Balkendiagramm (ohne Projekte) */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Begehungen nach Schwierigkeitsgrad</Text>
        {barData.length === 0 ? (
          <Text style={styles.empty}>Noch keine abgeschlossenen Begehungen.</Text>
        ) : (
          <View style={styles.chartCard}>
            <GradeChart barData={barData} maxTotal={maxTotal} />
            <View style={styles.legend}>
              {CHART_ORDER.map(result => (
                <View key={result} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: RESULT_COLOR[result] }]} />
                  <Text style={styles.legendText}>{result}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. Offene Projekte */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Offene Projekte</Text>
        {projects.length === 0 ? (
          <Text style={styles.empty}>Keine offenen Projekte.</Text>
        ) : (
          <>
            {visibleProjects.map(p => (
              <ProjectCard key={p.id} route={p} onComplete={() => markAsRedpoint(p)} />
            ))}
            {projects.length > 3 && (
              <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllProjects(v => !v)}>
                <Text style={styles.showMoreText}>
                  {showAllProjects ? 'Weniger anzeigen' : `Alle ${projects.length} Projekte anzeigen`}
                </Text>
                <Ionicons
                  name={showAllProjects ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={14}
                  color="#1B4332"
                />
              </TouchableOpacity>
            )}
          </>
        )}
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

  statGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  statCard:  {
    flex: 1, minWidth: '40%', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },

  chartCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    marginBottom: 8,
  },
  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  projectCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  projectInfo:  { flex: 1, marginRight: 12 },
  projectName:  { fontSize: 15, fontWeight: '600', color: '#111827' },
  projectArea:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  projectMeta:  { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  flagBtn:      { padding: 4 },

  showMoreBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10 },
  showMoreText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
});

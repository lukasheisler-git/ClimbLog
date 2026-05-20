import React, { useMemo, useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CATEGORY_COLOR, TrainingCategory, TrainingSession } from '../../types/training';
import { StatsRange, calcCategoryCounts, calcStats, filterByRange } from '../../hooks/useTraining';

interface Props {
  sessions: TrainingSession[];
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const o1 = polarToXY(cx, cy, outerR, startDeg);
  const o2 = polarToXY(cx, cy, outerR, endDeg);
  const i1 = polarToXY(cx, cy, innerR, endDeg);
  const i2 = polarToXY(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${o1.x} ${o1.y} A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
}

function DonutChart({ sessions }: { sessions: TrainingSession[] }) {
  const counts = useMemo(() => calcCategoryCounts(sessions), [sessions]);
  const SIZE   = Math.min(Dimensions.get('window').width - 64, 200);
  const cx     = SIZE / 2;
  const cy     = SIZE / 2;
  const outer  = SIZE / 2 - 8;
  const inner  = outer * 0.58;

  if (!counts.length) {
    return <Text style={styles.empty}>Noch keine Trainingseinheiten im gewählten Zeitraum.</Text>;
  }

  let cursor = -90; // start at top
  const total = sessions.length;

  return (
    <>
      <Svg width={SIZE} height={SIZE} style={{ alignSelf: 'center' }}>
        {counts.map(({ category, count }) => {
          const sweep = (count / total) * 360;
          const end   = cursor + sweep;
          let segment: React.ReactNode;
          if (counts.length === 1) {
            segment = (
              <G key={category}>
                <Circle cx={cx} cy={cy} r={outer} fill={CATEGORY_COLOR[category]} />
                <Circle cx={cx} cy={cy} r={inner} fill="#fff" />
              </G>
            );
          } else {
            segment = (
              <Path key={category} d={arcPath(cx, cy, outer, inner, cursor, end - 0.5)} fill={CATEGORY_COLOR[category]} />
            );
          }
          cursor = end;
          return segment;
        })}
        {counts.length > 1 && <Circle cx={cx} cy={cy} r={inner} fill="#fff" />}
        <SvgText x={cx} y={cy - 6}  textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">{total}</SvgText>
        <SvgText x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9CA3AF">Einheiten</SvgText>
      </Svg>

      <View style={styles.legend}>
        {counts.map(({ category, count, percent }) => (
          <View key={category} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLOR[category] }]} />
            <Text style={styles.legendName}>{category}</Text>
            <Text style={styles.legendCount}>{count}</Text>
            <Text style={styles.legendPct}>{percent}%</Text>
          </View>
        ))}
      </View>
    </>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

const HEAT_COLORS = ['#E1F5EE', '#5DCAA5', '#1D9E75', '#085041'];
const CELL = 11;
const GAP  = 2;
const STEP = CELL + GAP;
const WEEKS = 52;
const L_PAD = 22; // day labels
const T_PAD = 20; // month labels

function heatColor(count: number): string {
  if (count === 0) return HEAT_COLORS[0];
  if (count === 1) return HEAT_COLORS[1];
  if (count === 2) return HEAT_COLORS[2];
  return HEAT_COLORS[3];
}

function getMonday(d: Date): Date {
  const day  = d.getDay();
  const diff = (day + 6) % 7;
  const m    = new Date(d);
  m.setDate(d.getDate() - diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function Heatmap({ sessions }: { sessions: TrainingSession[] }) {
  const [selected, setSelected] = useState<{ date: string; count: number } | null>(null);

  const today     = new Date();
  const todayIso  = toIsoDate(today);
  const thisMonday = getMonday(today);
  const startDate = addDays(thisMonday, -(WEEKS - 1) * 7);

  // Count sessions per day
  const dayCounts: Record<string, number> = {};
  for (const s of sessions) {
    const d = s.date.slice(0, 10);
    dayCounts[d] = (dayCounts[d] ?? 0) + 1;
  }

  // Build cells
  const cells: { iso: string; week: number; dow: number; count: number }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d);
      if (date > today) continue;
      cells.push({ iso: toIsoDate(date), week: w, dow: d, count: dayCounts[toIsoDate(date)] ?? 0 });
    }
  }

  // Month labels
  const monthLabels: { label: string; x: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = addDays(startDate, w * 7);
    const m = weekStart.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTH_NAMES[m], x: L_PAD + w * STEP });
      lastMonth = m;
    }
  }

  const SVG_W = L_PAD + WEEKS * STEP;
  const SVG_H = T_PAD + 7 * STEP;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={SVG_W} height={SVG_H}>
          {/* Month labels */}
          {monthLabels.map(({ label, x }) => (
            <SvgText key={label + x} x={x} y={13} fontSize="9" fill="#9CA3AF">{label}</SvgText>
          ))}
          {/* Day labels */}
          {DAY_LABELS.map((lbl, i) => lbl ? (
            <SvgText key={i} x={L_PAD - 4} y={T_PAD + i * STEP + CELL - 1} textAnchor="end" fontSize="8" fill="#9CA3AF">{lbl}</SvgText>
          ) : null)}
          {/* Cells */}
          {cells.map(cell => {
            const x = L_PAD + cell.week * STEP;
            const y = T_PAD + cell.dow * STEP;
            const isToday = cell.iso === todayIso;
            return (
              <Rect
                key={cell.iso}
                x={x} y={y} width={CELL} height={CELL} rx={2}
                fill={heatColor(cell.count)}
                stroke={isToday ? '#085041' : 'none'}
                strokeWidth={isToday ? 1.5 : 0}
                onPress={() => setSelected(s => s?.date === cell.iso ? null : { date: cell.iso, count: cell.count })}
              />
            );
          })}
        </Svg>
      </ScrollView>

      {selected && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {new Date(selected.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            {' — '}
            {selected.count === 0 ? 'kein Training' : `${selected.count} Einheit${selected.count !== 1 ? 'en' : ''}`}
          </Text>
        </View>
      )}

      <View style={styles.heatLegend}>
        <Text style={styles.heatLegendLabel}>Weniger</Text>
        {HEAT_COLORS.map(c => <View key={c} style={[styles.heatLegendCell, { backgroundColor: c }]} />)}
        <Text style={styles.heatLegendLabel}>Mehr</Text>
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const RANGES: { key: StatsRange; label: string }[] = [
  { key: '4w',  label: '4 Wochen' },
  { key: '8w',  label: '8 Wochen' },
  { key: 'all', label: 'Gesamt' },
];

export function TrainingStatsScreen({ sessions }: Props) {
  const [range, setRange] = useState<StatsRange>('4w');

  const stats      = useMemo(() => calcStats(sessions), [sessions]);
  const filtered   = useMemo(() => filterByRange(sessions, range), [sessions, range]);

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Kennzahlen */}
      <Text style={styles.sectionTitle}>Kennzahlen</Text>
      <View style={styles.statGrid}>
        <StatCard label="Diese Woche"      value={stats.weekCount.toString()} />
        <StatCard label="Diesen Monat"     value={stats.monthCount.toString()} />
        <StatCard label="Gesamtstunden"    value={stats.totalHours.toFixed(1) + ' h'} />
        <StatCard label="Längste Streak"   value={stats.longestStreak + ' Tage'} />
      </View>

      {/* Donut */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Trainingsfokus</Text>
        <View style={styles.rangeToggle}>
          {RANGES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.rangeChip, range === r.key && styles.rangeChipActive]}
              onPress={() => setRange(r.key)}
            >
              <Text style={[styles.rangeChipText, range === r.key && styles.rangeChipTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <DonutChart sessions={filtered} />
      </View>

      {/* Heatmap */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Jahresübersicht</Text>
      <View style={styles.card}>
        <Heatmap sessions={sessions} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { paddingHorizontal: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  empty:        { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, minWidth: '40%', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },

  rangeToggle:       { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2, gap: 2 },
  rangeChip:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  rangeChipActive:   { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  rangeChipText:     { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  rangeChipTextActive:{ color: '#111827' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
    marginBottom: 8,
  },

  legend:      { marginTop: 16, gap: 8 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendName:  { flex: 1, fontSize: 13, color: '#374151' },
  legendCount: { fontSize: 13, fontWeight: '600', color: '#111827', width: 28, textAlign: 'right' },
  legendPct:   { fontSize: 12, color: '#9CA3AF', width: 36, textAlign: 'right' },

  tooltip:     { backgroundColor: '#111827', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, alignSelf: 'center' },
  tooltipText: { fontSize: 12, color: '#fff', fontWeight: '500' },

  heatLegend:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' },
  heatLegendLabel: { fontSize: 10, color: '#9CA3AF' },
  heatLegendCell:  { width: 10, height: 10, borderRadius: 2 },
});

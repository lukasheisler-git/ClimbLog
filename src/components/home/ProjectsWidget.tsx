import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ClimbRoute } from '../../types/climblog';

interface Props {
  projects: ClimbRoute[];
  onNavigate: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function ProjectsWidget({ projects, onNavigate }: Props) {
  const visible = projects.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Offene Projekte</Text>
        <TouchableOpacity onPress={onNavigate} style={styles.moreBtn}>
          <Text style={styles.moreBtnText}>Alle</Text>
          <Ionicons name="chevron-forward-outline" size={14} color="#1B4332" />
        </TouchableOpacity>
      </View>

      {visible.length === 0 ? (
        <Text style={styles.empty}>Keine offenen Projekte.</Text>
      ) : (
        visible.map(p => (
          <View key={p.id} style={styles.projectRow}>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{p.grade}</Text>
            </View>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
              {p.area && <Text style={styles.projectArea} numberOfLines={1}>{p.area}</Text>}
            </View>
            <Text style={styles.projectDate}>{formatDate(p.date)}</Text>
          </View>
        ))
      )}

      {projects.length > 3 && (
        <Text style={styles.moreCount}>+{projects.length - 3} weitere</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle:  { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 },
  moreBtn:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreBtnText:{ fontSize: 12, fontWeight: '600', color: '#1B4332' },

  empty: { fontSize: 13, color: '#9CA3AF', paddingVertical: 8 },

  projectRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  gradeBadge:  { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, minWidth: 44, alignItems: 'center' },
  gradeText:   { fontSize: 13, fontWeight: '700', color: '#111827' },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  projectArea: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  projectDate: { fontSize: 11, color: '#9CA3AF' },

  moreCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingTop: 10 },
});

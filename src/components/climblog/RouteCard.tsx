import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ClimbResult, ClimbRoute } from '../../types/climblog';

interface Props {
  route: ClimbRoute;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RESULT_COLOR: Record<ClimbResult, string> = {
  Onsight:  '#F59E0B',
  Flash:    '#3B82F6',
  Redpoint: '#EF4444',
  Project:  '#9CA3AF',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function RouteCard({ route, onEdit, onDelete }: Props) {
  const handleLongPress = () => {
    if (!onEdit && !onDelete) return;
    Alert.alert(route.name, undefined, [
      ...(onEdit   ? [{ text: 'Bearbeiten', onPress: onEdit }] : []),
      ...(onDelete ? [{ text: 'Löschen', style: 'destructive' as const, onPress: onDelete }] : []),
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={handleLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.name} numberOfLines={1}>{route.name}</Text>
          {(route.area || route.sector) && (
            <Text style={styles.area} numberOfLines={1}>
              {[route.area, route.sector].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          <Text style={styles.grade}>{route.grade}</Text>
          <Text style={[styles.result, { color: RESULT_COLOR[route.result] }]}>{route.result}</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.meta}>{formatDate(route.date)}</Text>
        <Text style={styles.meta}>{route.style}</Text>
        {!!route.stars && (
          <Text style={styles.stars}>{'★'.repeat(route.stars)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  top:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  left:   { flex: 1, marginRight: 8 },
  right:  { alignItems: 'flex-end' },
  name:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  area:   { fontSize: 12, color: '#6B7280', marginTop: 2 },
  grade:  { fontSize: 18, fontWeight: '800', color: '#111827' },
  result: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  bottom: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  meta:   { fontSize: 12, color: '#9CA3AF' },
  stars:  { fontSize: 12, color: '#F59E0B', letterSpacing: 1 },
});

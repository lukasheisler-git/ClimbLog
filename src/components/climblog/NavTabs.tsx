import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ClimbLogTab = 'Begehungen' | 'Suche' | 'Statistik';

interface Props {
  active: ClimbLogTab;
  onPress: (tab: ClimbLogTab) => void;
}

const TABS: ClimbLogTab[] = ['Begehungen', 'Suche', 'Statistik'];

export function NavTabs({ active, onPress }: Props) {
  return (
    <View style={styles.row}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, active === tab && styles.tabActive]}
          onPress={() => onPress(tab)}
        >
          <Text style={[styles.label, active === tab && styles.labelActive]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:         { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 3, margin: 16, marginTop: 0 },
  tab:         { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive:   { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  label:       { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  labelActive: { color: '#111827' },
});

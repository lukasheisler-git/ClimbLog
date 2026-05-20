import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props<T extends string> {
  tabs: readonly T[];
  active: T;
  onPress: (tab: T) => void;
}

export function AppTabBar<T extends string>({ tabs, active, onPress }: Props<T>) {
  return (
    <View style={styles.bar}>
      {tabs.map(tab => (
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

export const appTabBarStyles = StyleSheet.create({
  bar:        { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#E5E7EB', borderRadius: 10, padding: 3 },
  tab:        { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive:  { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  label:      { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  labelActive:{ color: '#111827' },
});

const styles = appTabBarStyles;

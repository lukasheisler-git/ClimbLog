import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { NavTabs } from '../../components/climblog/NavTabs';
import { RouteCard } from '../../components/climblog/RouteCard';
import { DEFAULT_FILTER, FilterState, SortOrder, applyFilter, gradeIndex } from '../../hooks/useClimbLog';
import { ClimbLogStackParamList } from '../../navigation/types';
import { deleteRoute, loadRoutes } from '../../storage/climblogStorage';
import { ClimbResult, ClimbRoute, ClimbStyle, GRADES } from '../../types/climblog';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'ClimbLogSearch'>;

const STYLES: (ClimbStyle | 'Alle')[]   = ['Alle', 'Lead', 'Boulder', 'Multi-Pitch'];
const RESULTS: (ClimbResult | 'Alle')[] = ['Alle', 'Onsight', 'Flash', 'Redpoint', 'Project'];
const SORTS: { key: SortOrder; label: string }[] = [
  { key: 'date-desc',  label: 'Neu→Alt' },
  { key: 'date-asc',   label: 'Alt→Neu' },
  { key: 'grade-asc',  label: 'Leicht→Schwer' },
  { key: 'grade-desc', label: 'Schwer→Leicht' },
];

function FilterChips<T extends string>({
  options, value, onChange,
}: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, value === opt && styles.chipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export function ClimbLogSearchScreen({ navigation }: Props) {
  const [allRoutes, setAllRoutes] = useState<ClimbRoute[]>([]);
  const [filter, setFilter]       = useState<FilterState>(DEFAULT_FILTER);

  useFocusEffect(
    useCallback(() => { loadRoutes().then(setAllRoutes); }, []),
  );

  const results = useMemo(() => applyFilter(allRoutes, filter), [allRoutes, filter]);

  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    setFilter(prev => ({ ...prev, [key]: val }));

  const handleDelete = (id: string) => {
    deleteRoute(id);
    setAllRoutes(prev => prev.filter(r => r.id !== id));
  };

  const FilterHeader = () => (
    <View>
      {/* Suche */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={filter.query}
          onChangeText={t => set('query', t)}
          placeholder="Route oder Gebiet suchen…"
          placeholderTextColor="#9CA3AF"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Schwierigkeit */}
      <SectionLabel text="Schwierigkeit" />
      <View style={styles.rangeRow}>
        <View style={styles.rangeCol}>
          <Text style={styles.rangeLabel}>Von</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {GRADES.filter(g => gradeIndex(g) <= gradeIndex(filter.gradeTo)).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, filter.gradeFrom === g && styles.chipActive]}
                onPress={() => set('gradeFrom', g)}
              >
                <Text style={[styles.chipText, filter.gradeFrom === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.rangeCol}>
          <Text style={styles.rangeLabel}>Bis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {GRADES.filter(g => gradeIndex(g) >= gradeIndex(filter.gradeFrom)).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, filter.gradeTo === g && styles.chipActive]}
                onPress={() => set('gradeTo', g)}
              >
                <Text style={[styles.chipText, filter.gradeTo === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Stil */}
      <SectionLabel text="Stil" />
      <FilterChips options={STYLES} value={filter.style} onChange={v => set('style', v)} />

      {/* Ergebnis */}
      <SectionLabel text="Ergebnis" />
      <FilterChips options={RESULTS} value={filter.result} onChange={v => set('result', v)} />

      {/* Sortierung */}
      <SectionLabel text="Sortierung" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SORTS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, filter.sort === s.key && styles.chipActive]}
            onPress={() => set('sort', s.key)}
          >
            <Text style={[styles.chipText, filter.sort === s.key && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>{results.length} Ergebnis{results.length !== 1 ? 'se' : ''}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Kletterlog</Text>
      </View>
      <NavTabs
        active="Suche"
        onPress={tab => {
          if (tab === 'Begehungen') navigation.navigate('ClimbLogHome');
          if (tab === 'Statistik')  navigation.navigate('ClimbLogStats');
        }}
      />
      <FlatList
        data={results}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <RouteCard route={item} onDelete={() => handleDelete(item.id)} />
        )}
        ListHeaderComponent={<FilterHeader />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>Keine Ergebnisse für diese Filter.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:  { fontSize: 26, fontWeight: '700', color: '#111827' },
  list:   { paddingHorizontal: 16, paddingBottom: 40 },

  searchBox:   { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 4 },
  searchInput: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },

  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 16, marginBottom: 8 },

  rangeRow: { gap: 8 },
  rangeCol: { gap: 4 },
  rangeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  chipRow:      { flexDirection: 'row', gap: 6, paddingRight: 4 },
  chip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActive:   { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipText:     { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },

  resultCount: { fontSize: 12, color: '#9CA3AF', marginTop: 16, marginBottom: 8 },
  empty:       { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 32 },
});

import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { RouteCard } from '../../components/climblog/RouteCard';
import { DEFAULT_FILTER, FilterState, SortOrder, applyFilter, gradeIndex } from '../../hooks/useClimbLog';
import { ClimbLogStackParamList } from '../../navigation/types';
import { deleteRoute, loadRoutes } from '../../storage/climblogStorage';
import { ClimbResult, ClimbRoute, ClimbStyle, GRADES } from '../../types/climblog';

interface Props {
  navigation: NavigationProp<ClimbLogStackParamList>;
  reloadKey: number;
}

const STYLES: (ClimbStyle | 'Alle')[]   = ['Alle', 'Lead', 'Boulder', 'Multi-Pitch'];
const RESULTS: (ClimbResult | 'Alle')[] = ['Alle', 'Onsight', 'Flash', 'Redpoint', 'Project'];
const SORTS: { key: SortOrder; label: string }[] = [
  { key: 'date-desc',  label: 'Neu→Alt' },
  { key: 'date-asc',   label: 'Alt→Neu' },
  { key: 'grade-asc',  label: 'Leicht→Schwer' },
  { key: 'grade-desc', label: 'Schwer→Leicht' },
];

interface FilterSectionProps {
  filter: FilterState;
  onChange: <K extends keyof FilterState>(key: K, val: FilterState[K]) => void;
}

function FilterChipsRow<T extends string>({ options, value, onChange }: {
  options: T[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterSt.chipRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[filterSt.chip, value === opt && filterSt.chipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[filterSt.chipText, value === opt && filterSt.chipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function FilterSection({ filter, onChange }: FilterSectionProps) {
  return (
    <View style={filterSt.container}>
      <Text style={filterSt.label}>Schwierigkeit</Text>
      <View style={filterSt.rangeBlock}>
        <View style={filterSt.rangeCol}>
          <Text style={filterSt.rangeLabel}>Von</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterSt.chipRow}>
            {(GRADES as readonly string[]).filter(g => gradeIndex(g) <= gradeIndex(filter.gradeTo)).map(g => (
              <TouchableOpacity
                key={g}
                style={[filterSt.chip, filter.gradeFrom === g && filterSt.chipActive]}
                onPress={() => onChange('gradeFrom', g)}
              >
                <Text style={[filterSt.chipText, filter.gradeFrom === g && filterSt.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={filterSt.rangeCol}>
          <Text style={filterSt.rangeLabel}>Bis</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterSt.chipRow}>
            {(GRADES as readonly string[]).filter(g => gradeIndex(g) >= gradeIndex(filter.gradeFrom)).map(g => (
              <TouchableOpacity
                key={g}
                style={[filterSt.chip, filter.gradeTo === g && filterSt.chipActive]}
                onPress={() => onChange('gradeTo', g)}
              >
                <Text style={[filterSt.chipText, filter.gradeTo === g && filterSt.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Text style={filterSt.label}>Stil</Text>
      <FilterChipsRow options={STYLES} value={filter.style} onChange={v => onChange('style', v)} />

      <Text style={filterSt.label}>Ergebnis</Text>
      <FilterChipsRow options={RESULTS} value={filter.result} onChange={v => onChange('result', v)} />

      <Text style={filterSt.label}>Sortierung</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterSt.chipRow}>
        {SORTS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[filterSt.chip, filter.sort === s.key && filterSt.chipActive]}
            onPress={() => onChange('sort', s.key)}
          >
            <Text style={[filterSt.chipText, filter.sort === s.key && filterSt.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export function ClimbLogSearchScreen({ navigation, reloadKey }: Props) {
  const [allRoutes,   setAllRoutes]   = useState<ClimbRoute[]>([]);
  const [filter,      setFilter]      = useState<FilterState>(DEFAULT_FILTER);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRoutes().then(setAllRoutes);
  }, [reloadKey]);

  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFilter(prev => ({ ...prev, [key]: val }));
  }, []);

  const results = useMemo(() => applyFilter(allRoutes, filter), [allRoutes, filter]);

  const handleDelete = useCallback((id: string) => {
    deleteRoute(id);
    setAllRoutes(prev => prev.filter(r => r.id !== id));
  }, []);

  const renderItem = useCallback(({ item }: { item: ClimbRoute }) => (
    <RouteCard
      route={item}
      onEdit={() => navigation.navigate('AddRoute', { routeId: item.id })}
      onDelete={() => handleDelete(item.id)}
    />
  ), [navigation, handleDelete]);

  return (
    <View style={styles.root}>
      <View style={styles.searchArea}>
        <TextInput
          style={styles.searchInput}
          value={filter.query}
          onChangeText={q => handleFilterChange('query', q)}
          placeholder="Route oder Gebiet suchen…"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(v => !v)}>
          <Ionicons
            name={showFilters ? 'chevron-up-outline' : 'options-outline'}
            size={18}
            color="#6B7280"
          />
          <Text style={styles.filterToggleText}>{showFilters ? 'Ausblenden' : 'Filter'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.resultCount}>{results.length} Ergebnis{results.length !== 1 ? 'se' : ''}</Text>

      <FlatList
        data={results}
        keyExtractor={r => r.id}
        renderItem={renderItem}
        ListHeaderComponent={showFilters
          ? <FilterSection filter={filter} onChange={handleFilterChange} />
          : null
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>Keine Ergebnisse für diese Filter.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1 },
  list:             { paddingHorizontal: 16, paddingBottom: 40 },
  searchArea:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 4, gap: 8 },
  searchInput:      { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827' },
  filterToggle:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  filterToggleText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  resultCount:      { fontSize: 12, color: '#9CA3AF', marginHorizontal: 16, marginBottom: 8 },
  empty:            { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 32 },
});

const filterSt = StyleSheet.create({
  container:      { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  label:          { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 14, marginBottom: 8 },
  rangeBlock:     { gap: 8 },
  rangeCol:       { gap: 4 },
  rangeLabel:     { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  chipRow:        { flexDirection: 'row', gap: 6, paddingRight: 4 },
  chip:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActive:     { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipText:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
});

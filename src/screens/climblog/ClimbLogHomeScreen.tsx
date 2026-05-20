import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavTabs } from '../../components/climblog/NavTabs';
import { RouteCard } from '../../components/climblog/RouteCard';
import { ClimbLogStackParamList } from '../../navigation/types';
import { deleteRoute, loadRoutes } from '../../storage/climblogStorage';
import { ClimbRoute } from '../../types/climblog';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'ClimbLogHome'>;

export function ClimbLogHomeScreen({ navigation }: Props) {
  const [routes, setRoutes] = useState<ClimbRoute[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRoutes().then(setRoutes);
    }, []),
  );

  const handleDelete = (id: string) => {
    deleteRoute(id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Kletterlog</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddRoute')} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={28} color="#1B4332" />
        </TouchableOpacity>
      </View>

      <NavTabs
        active="Begehungen"
        onPress={tab => {
          if (tab === 'Suche')     navigation.navigate('ClimbLogSearch');
          if (tab === 'Statistik') navigation.navigate('ClimbLogStats');
        }}
      />

      <FlatList
        data={routes}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <RouteCard route={item} onDelete={() => handleDelete(item.id)} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Noch keine Begehungen erfasst.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddRoute')}>
              <Text style={styles.emptyBtnText}>Erste Route hinzufügen</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F3F4F6' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:       { fontSize: 26, fontWeight: '700', color: '#111827' },
  list:        { paddingHorizontal: 16, paddingBottom: 40 },
  emptyBox:    { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText:   { fontSize: 14, color: '#9CA3AF' },
  emptyBtn:    { backgroundColor: '#1B4332', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
});

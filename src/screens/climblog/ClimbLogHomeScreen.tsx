import { NavigationProp } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteCard } from '../../components/climblog/RouteCard';
import { ClimbLogStackParamList } from '../../navigation/types';
import { loadRoutes } from '../../storage/climblogStorage';
import { ClimbRoute } from '../../types/climblog';

interface Props {
  navigation: NavigationProp<ClimbLogStackParamList>;
  reloadKey: number;
}

export function ClimbLogHomeScreen({ navigation, reloadKey }: Props) {
  const [routes, setRoutes] = useState<ClimbRoute[]>([]);

  useEffect(() => {
    loadRoutes().then(setRoutes);
  }, [reloadKey]);

  return (
    <FlatList
      data={routes}
      keyExtractor={r => r.id}
      renderItem={({ item }) => (
        <RouteCard
          route={item}
          onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
        />
      )}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Noch keine Begehungen erfasst.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddRoute', {})}>
            <Text style={styles.emptyBtnText}>Erste Route hinzufügen</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list:        { paddingHorizontal: 16, paddingBottom: 100 },
  emptyBox:    { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText:   { fontSize: 14, color: '#9CA3AF' },
  emptyBtn:    { backgroundColor: '#1B4332', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
});

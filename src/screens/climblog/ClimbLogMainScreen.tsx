import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTabBar } from '../../components/shared/AppTabBar';
import { ClimbLogStackParamList, ClimbLogTabKey } from '../../navigation/types';
import { ClimbLogHomeScreen } from './ClimbLogHomeScreen';
import { ClimbLogSearchScreen } from './ClimbLogSearchScreen';
import { ClimbLogStatsScreen } from './ClimbLogStatsScreen';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'ClimbLogMain'>;

const TABS: readonly ClimbLogTabKey[] = ['Begehungen', 'Suche', 'Statistik'];

export function ClimbLogMainScreen({ route, navigation }: Props) {
  const [activeTab, setActiveTab] = useState<ClimbLogTabKey>(
    route.params?.initialTab ?? 'Begehungen',
  );
  const [reloadKey, setReloadKey] = useState(0);

  // Respond to param changes (e.g. deep-link from HomeScreen)
  useEffect(() => {
    if (route.params?.initialTab) setActiveTab(route.params.initialTab);
  }, [route.params?.initialTab]);

  // Reload active tab content when returning from AddRoute or regaining focus
  useFocusEffect(useCallback(() => {
    setReloadKey(k => k + 1);
  }, []));

  const nav = navigation as unknown as Parameters<typeof ClimbLogHomeScreen>[0]['navigation'];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Kletterlog</Text>
        {activeTab === 'Begehungen' && (
          <TouchableOpacity onPress={() => navigation.navigate('AddRoute', {})} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={28} color="#1B4332" />
          </TouchableOpacity>
        )}
      </View>

      <AppTabBar tabs={TABS} active={activeTab} onPress={setActiveTab} />

      {activeTab === 'Begehungen' && (
        <ClimbLogHomeScreen navigation={nav} reloadKey={reloadKey} />
      )}
      {activeTab === 'Suche' && (
        <ClimbLogSearchScreen navigation={nav} reloadKey={reloadKey} />
      )}
      {activeTab === 'Statistik' && (
        <ClimbLogStatsScreen navigation={nav} reloadKey={reloadKey} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  title:  { fontSize: 26, fontWeight: '700', color: '#111827' },
});

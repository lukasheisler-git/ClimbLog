import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrainingStackParamList } from '../../navigation/types';
import { initTemplates } from '../../storage/trainingStorage';
import { useTraining } from '../../hooks/useTraining';
import { TrainingLogScreen } from './TrainingLogScreen';
import { TrainingStatsScreen } from './TrainingStatsScreen';

type Props = NativeStackScreenProps<TrainingStackParamList, 'TrainingMain'>;
type TabKey = 'Log' | 'Statistik';
const TABS: TabKey[] = ['Log', 'Statistik'];

export function TrainingMainScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('Log');
  const { sessions, templates, reload } = useTraining();

  useFocusEffect(useCallback(() => {
    initTemplates().then(reload);
  }, [reload]));

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Training</Text>
      </View>

      {/* Top Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'Log' ? (
        <TrainingLogScreen
          navigation={navigation as unknown as NativeStackNavigationProp<TrainingStackParamList>}
          sessions={sessions}
          templates={templates}
          onReload={reload}
        />
      ) : (
        <TrainingStatsScreen sessions={sessions} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12 },
  title:  { fontSize: 26, fontWeight: '700', color: '#111827' },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#E5E7EB', borderRadius: 10, padding: 3,
  },
  tab:         { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive:   { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabText:     { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive:{ color: '#111827' },
});

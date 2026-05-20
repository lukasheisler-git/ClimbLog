import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTabBar } from '../../components/shared/AppTabBar';
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

      <AppTabBar tabs={TABS} active={activeTab} onPress={setActiveTab} />

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

});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Switch, Text,
  TouchableOpacity, View,
} from 'react-native';
import { BucketListWidget } from '../../components/home/BucketListWidget';
import { ProjectsWidget } from '../../components/home/ProjectsWidget';
import { WeekActivityWidget } from '../../components/home/WeekActivityWidget';
import { WeightWidget } from '../../components/home/WeightWidget';
import { loadBucketList, loadSettings, loadWeightEntries, saveSettings } from '../../storage/homeStorage';
import { loadRoutes } from '../../storage/climblogStorage';
import { ClimbRoute } from '../../types/climblog';
import { AppSettings, BucketListItem, WeightEntry } from '../../types/home';
import { AppTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<AppTabParamList, 'HomeTab'>;

function formatDate(): string {
  return new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function HomeScreen({ navigation }: Props) {
  const [routes,          setRoutes]          = useState<ClimbRoute[]>([]);
  const [weights,         setWeights]         = useState<WeightEntry[]>([]);
  const [bucketItems,     setBucketItems]     = useState<BucketListItem[]>([]);
  const [settings,        setSettings]        = useState<AppSettings>({ showWeight: true });
  const [settingsVisible, setSettingsVisible] = useState(false);

  const loadAll = useCallback(async () => {
    const [r, w, b, s] = await Promise.all([
      loadRoutes(), loadWeightEntries(), loadBucketList(), loadSettings(),
    ]);
    setRoutes(r);
    setWeights(w);
    setBucketItems(b);
    setSettings(s);
  }, []);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveSettings(next);
  };

  const weekRoutes = (() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return routes.filter(r => new Date(r.date) >= monday);
  })();

  const openProjects = routes
    .filter(r => r.result === 'Project')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hallo Lukas</Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} hitSlop={8}>
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WeekActivityWidget routes={weekRoutes} />

        {settings.showWeight && <WeightWidget entries={weights} onUpdate={loadAll} />}

        <ProjectsWidget
          projects={openProjects}
          onNavigate={() => navigation.navigate('ClimbLogTab', { screen: 'ClimbLogMain', params: { initialTab: 'Statistik' } } as any)}
        />

        <BucketListWidget items={bucketItems} onUpdate={loadAll} />

        {/* Nächstes Training — Platzhalter */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>Nächstes Training</Text>
          <Text style={styles.nextPlaceholder}>Trainingsplanung kommt bald.</Text>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsRoot}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity onPress={() => setSettingsVisible(false)} hitSlop={8}>
              <Ionicons name="chevron-back-outline" size={26} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.settingsTitle}>Einstellungen</Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={styles.settingsSection}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Gewichtstracker anzeigen</Text>
              <Switch
                value={settings.showWeight}
                onValueChange={v => updateSetting('showWeight', v)}
                trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F3F4F6' },
  header:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 20 },
  greeting:{ fontSize: 26, fontWeight: '700', color: '#111827' },
  date:    { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  content: { paddingHorizontal: 16, paddingBottom: 48 },

  nextCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  nextTitle:       { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  nextPlaceholder: { fontSize: 13, color: '#9CA3AF', paddingVertical: 8 },

  settingsRoot:    { flex: 1, backgroundColor: '#F3F4F6' },
  settingsHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  settingsTitle:   { fontSize: 17, fontWeight: '700', color: '#111827' },
  settingsSection: { marginTop: 24, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  settingsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingsLabel:   { fontSize: 15, color: '#111827' },
});

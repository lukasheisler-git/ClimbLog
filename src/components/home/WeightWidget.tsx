import React, { useState } from 'react';
import {
  Alert, Dimensions, KeyboardAvoidingView, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { deleteWeightEntry, saveWeightEntry } from '../../storage/homeStorage';
import { WeightEntry } from '../../types/home';

interface Props {
  entries: WeightEntry[];
  onUpdate: () => void;
}

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - 32 - 32; // screen - horizontal padding - card padding

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export function WeightWidget({ entries, onUpdate }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [inputWeight,  setInputWeight]  = useState('');

  // last 8 entries, chronologically ascending for chart
  const chartEntries = [...entries].reverse().slice(-8);

  const handleAdd = async () => {
    const val = parseFloat(inputWeight.replace(',', '.'));
    if (isNaN(val) || val < 20 || val > 300) {
      Alert.alert('Ungültig', 'Bitte ein gültiges Gewicht eingeben (20–300 kg).');
      return;
    }
    const entry: WeightEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      weight: val,
      createdAt: Date.now(),
    };
    await saveWeightEntry(entry);
    setInputWeight('');
    setModalVisible(false);
    onUpdate();
  };

  const latestEntry = entries.length > 0 ? entries[0] : null;

  const handleLongPressLatest = () => {
    if (!latestEntry) return;
    Alert.alert(
      'Eintrag löschen',
      `${latestEntry.weight} kg vom ${formatDate(latestEntry.date)} löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteWeightEntry(latestEntry.id); onUpdate(); } },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Gewichtsverlauf</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Eintragen</Text>
        </TouchableOpacity>
      </View>

      {chartEntries.length >= 2 ? (
        <LineChart
          data={{
            labels: chartEntries.map(e => formatDate(e.date)),
            datasets: [{ data: chartEntries.map(e => e.weight) }],
          }}
          width={CHART_W}
          height={140}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(27, 67, 50, ${opacity})`,
            labelColor: () => '#9CA3AF',
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#1B4332' },
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
        />
      ) : (
        <Text style={styles.empty}>
          {entries.length === 0
            ? 'Noch keine Einträge. Trage dein erstes Gewicht ein.'
            : 'Mindestens 2 Einträge für den Graphen benötigt.'}
        </Text>
      )}

      {latestEntry && (
        <TouchableOpacity style={styles.latestRow} onLongPress={handleLongPressLatest}>
          <Text style={styles.latestDate}>{formatDate(latestEntry.date)}</Text>
          <Text style={styles.latestWeight}>{latestEntry.weight.toFixed(1)} kg</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Gewicht eintragen</Text>
            <TextInput
              style={styles.modalInput}
              value={inputWeight}
              onChangeText={setInputWeight}
              placeholder="z. B. 72.5"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setInputWeight(''); }}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmBtnText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle:  { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn:     { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1B4332', borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  chart:      { marginLeft: -16, marginBottom: 4 },
  empty:      { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },

  latestRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4 },
  latestDate:   { fontSize: 13, color: '#9CA3AF' },
  latestWeight: { fontSize: 15, fontWeight: '700', color: '#111827' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalInput:   { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111827', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText:{ fontSize: 15, fontWeight: '600', color: '#6B7280' },
  confirmBtn:   { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#1B4332', alignItems: 'center' },
  confirmBtnText:{ fontSize: 15, fontWeight: '600', color: '#fff' },
});

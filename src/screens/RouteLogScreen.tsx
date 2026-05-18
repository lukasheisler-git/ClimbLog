import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { saveRoute } from '../storage/routeStorage';
import { ClimbResult, ClimbStyle, RouteEntry } from '../types/route';

// ── Konstanten ──────────────────────────────────────────────────────────────

// Vollständige Skala für Sportklettern (UIAA/Französisch)
const GRADES = [
  '3', '4', '4+', '5', '5+',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b',
];

const STYLES: ClimbStyle[] = ['Lead', 'Toprope', 'Bouldern'];
const RESULTS: ClimbResult[] = ['Rotpunkt', 'Begehung', 'Sturz', 'Projekt'];

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Komponente ───────────────────────────────────────────────────────────────

export default function RouteLogScreen() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [grade, setGrade] = useState<string | null>(null);
  const [style, setStyle] = useState<ClimbStyle | null>(null);
  const [result, setResult] = useState<ClimbResult | null>(null);
  const [notes, setNotes] = useState('');

  // Animations-Wert für den Erfolgs-Banner
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ── Datum ────────────────────────────────────────────────────────────────

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    // Android schließt den Picker automatisch; auf iOS bleibt er offen
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  // ── Erfolgs-Animation ─────────────────────────────────────────────────────

  const showSuccessBanner = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  // ── Speichern ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!grade || !style || !result) {
      Alert.alert('Fehlende Angaben', 'Bitte Schwierigkeit, Stil und Ergebnis auswählen.');
      return;
    }

    const entry: RouteEntry = {
      id: Date.now().toString(),
      date: date.toISOString(),
      grade,
      style,
      result,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    try {
      await saveRoute(entry);
    } catch {
      Alert.alert('Fehler', 'Eintrag konnte nicht gespeichert werden.');
      return;
    }

    // Formular zurücksetzen
    setDate(new Date());
    setGrade(null);
    setStyle(null);
    setResult(null);
    setNotes('');

    showSuccessBanner();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Route erfassen</Text>

        {/* ── Datum ── */}
        <Text style={styles.label}>Datum</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          <Text style={styles.dateHint}>Tippen zum Ändern</Text>
        </TouchableOpacity>

        {/* iOS zeigt den Picker inline direkt unter dem Button */}
        {showDatePicker && Platform.OS === 'ios' && (
          <View style={styles.iosPickerWrapper}>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()}
              locale="de-DE"
            />
            <TouchableOpacity
              style={styles.iosDoneButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.iosDoneText}>Fertig</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Android: nativer Dialog, wird durch showDatePicker gesteuert */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* ── Schwierigkeit ── */}
        <Text style={styles.label}>Schwierigkeit</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipScrollContent}
        >
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, grade === g && styles.chipActive]}
              onPress={() => setGrade(g)}
            >
              <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Stil ── */}
        <Text style={styles.label}>Stil</Text>
        <View style={styles.toggleRow}>
          {STYLES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.toggleBtn, style === s && styles.toggleBtnActive]}
              onPress={() => setStyle(s)}
            >
              <Text style={[styles.toggleText, style === s && styles.toggleTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Ergebnis ── */}
        <Text style={styles.label}>Ergebnis</Text>
        <View style={styles.toggleRow}>
          {RESULTS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, result === r && styles.toggleBtnActive]}
              onPress={() => setResult(r)}
            >
              <Text style={[styles.toggleText, result === r && styles.toggleTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Notizen ── */}
        <Text style={styles.label}>
          Notizen{' '}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Besonderheiten, Tipps, Bedingungen…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ── Speichern-Button ── */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Speichern</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Erfolgs-Banner (absolut positioniert am unteren Rand) ── */}
      <Animated.View style={[styles.successBanner, { opacity: fadeAnim }]}>
        <Text style={styles.successText}>Route gespeichert!</Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const GREEN = '#1B4332';
const GREEN_LIGHT = '#52B788';
const BG = '#F3F4F6';
const CARD = '#FFFFFF';
const TEXT = '#111827';
const TEXT_MUTED = '#6B7280';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    padding: 20,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 52 : 20,
  },

  // Labels
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  optional: {
    fontWeight: '400',
    textTransform: 'none',
    letterSpacing: 0,
    color: '#9CA3AF',
  },

  // Datum
  dateButton: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Leichter Schatten für Card-Optik
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 17,
    color: TEXT,
    fontWeight: '500',
  },
  dateHint: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  iosPickerWrapper: {
    backgroundColor: CARD,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  iosDoneButton: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  iosDoneText: {
    color: GREEN,
    fontWeight: '600',
    fontSize: 15,
  },

  // Schwierigkeit-Chips
  chipScroll: {
    marginHorizontal: -20, // über den Padding-Rand hinaus scrollen
  },
  chipScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // Toggle-Buttons (Stil & Ergebnis)
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },

  // Notizen
  notesInput: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: TEXT,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },

  // Speichern-Button
  saveButton: {
    marginTop: 32,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    // Satter Schatten für den primären CTA
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Erfolgs-Banner
  successBanner: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: GREEN_LIGHT,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    // Schatten damit das Banner über dem Inhalt schwebt
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

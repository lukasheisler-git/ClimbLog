import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ClimbLogStackParamList } from '../../navigation/types';
import { loadRoutes, saveRoute, updateRoute } from '../../storage/climblogStorage';
import { ClimbResult, ClimbRoute, ClimbStyle, GRADES } from '../../types/climblog';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'AddRoute'>;

const GREEN   = '#1B4332';
const STYLES:  ClimbStyle[]  = ['Lead', 'Boulder', 'Multi-Pitch'];
const RESULTS: ClimbResult[] = ['Onsight', 'Flash', 'Redpoint', 'Project'];

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function ToggleRow<T extends string>({
  options, value, onChange,
}: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.toggleRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.toggleBtn, value === opt && styles.toggleBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.toggleText, value === opt && styles.toggleTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StarRow({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n === value ? 0 : n)} hitSlop={4}>
          <Text style={[styles.star, { color: n <= value ? '#F59E0B' : '#D1D5DB' }]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function AddRouteScreen({ route, navigation }: Props) {
  const routeId  = route.params?.routeId;
  const isEditing = !!routeId;

  const [name,     setName]     = useState('');
  const [area,     setArea]     = useState('');
  const [sector,   setSector]   = useState('');
  const [date,     setDate]     = useState(new Date());
  const [showDP,   setShowDP]   = useState(false);
  const [grade,    setGrade]    = useState('7a');
  const [style,    setStyle]    = useState<ClimbStyle>('Lead');
  const [result,   setResult]   = useState<ClimbResult>('Redpoint');
  const [stars,    setStars]    = useState(0);
  const [notes,    setNotes]    = useState('');
  const [error,    setError]    = useState('');
  const [isLoaded, setIsLoaded] = useState(!isEditing);

  const gradeScrollRef  = useRef<ScrollView>(null);
  const existingIdRef   = useRef<string | null>(null);
  const existingAtRef   = useRef<number>(Date.now());

  // Bestehendes Workout laden wenn routeId vorhanden
  useEffect(() => {
    if (!routeId) return;
    loadRoutes().then(routes => {
      const found = routes.find(r => r.id === routeId);
      if (!found) return;
      existingIdRef.current  = found.id;
      existingAtRef.current  = found.createdAt;
      setName(found.name);
      setArea(found.area ?? '');
      setSector(found.sector ?? '');
      setDate(new Date(found.date));
      setGrade(found.grade);
      setStyle(found.style);
      setResult(found.result);
      setStars(found.stars ?? 0);
      setNotes(found.notes ?? '');
      setIsLoaded(true);
    });
  }, [routeId]);

  // Grad-Picker nach dem Laden zur gewählten Note scrollen
  useEffect(() => {
    if (!isLoaded) return;
    const idx = (GRADES as readonly string[]).indexOf(grade);
    if (idx < 0) return;
    // Chip-Breite ~48px; Sichtfenster-Hälfte ~150px
    const x = Math.max(0, idx * 48 - 150);
    const t = setTimeout(() => gradeScrollRef.current?.scrollTo({ x, animated: false }), 80);
    return () => clearTimeout(t);
  }, [isLoaded]); // läuft einmalig wenn Daten bereit sind

  const handleSave = async () => {
    if (!name.trim()) { setError('Bitte einen Routennamen eingeben.'); return; }
    setError('');

    const entry: ClimbRoute = {
      id:        existingIdRef.current ?? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name:      name.trim(),
      area:      area.trim()   || undefined,
      sector:    sector.trim() || undefined,
      date:      date.toISOString(),
      grade,
      style,
      result,
      stars:     stars || undefined,
      notes:     notes.trim() || undefined,
      createdAt: existingAtRef.current,
    };

    if (isEditing) {
      await updateRoute(entry);
    } else {
      await saveRoute(entry);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backBtn}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>{isEditing ? 'Begehung bearbeiten' : 'Begehung erfassen'}</Text>
        </View>

        {/* Routenname */}
        <FieldLabel text="Routenname *" />
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={name}
          onChangeText={t => { setName(t); setError(''); }}
          placeholder="z.B. Action Directe"
          placeholderTextColor="#9CA3AF"
          returnKeyType="next"
        />
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Klettergebiet */}
        <FieldLabel text="Klettergebiet" />
        <TextInput
          style={styles.input}
          value={area}
          onChangeText={setArea}
          placeholder="z.B. Frankenjura"
          placeholderTextColor="#9CA3AF"
          returnKeyType="next"
        />

        {/* Sektor */}
        <FieldLabel text="Sektor" />
        <TextInput
          style={styles.input}
          value={sector}
          onChangeText={setSector}
          placeholder="z.B. Feuerstein"
          placeholderTextColor="#9CA3AF"
          returnKeyType="done"
        />

        {/* Datum */}
        <FieldLabel text="Datum" />
        {Platform.OS === 'android' ? (
          <>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDP(true)}>
              <Text style={styles.dateBtnText}>{formatDate(date)}</Text>
            </TouchableOpacity>
            {showDP && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, d) => { setShowDP(false); if (d) setDate(d); }}
              />
            )}
          </>
        ) : (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={(_, d) => { if (d) setDate(d); }}
            style={{ marginLeft: -10 }}
          />
        )}

        {/* Schwierigkeit */}
        <FieldLabel text="Schwierigkeit *" />
        <ScrollView
          ref={gradeScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gradeScroll}
          contentContainerStyle={styles.gradeContent}
        >
          {GRADES.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.gradeChip, grade === g && styles.gradeChipActive]}
              onPress={() => setGrade(g)}
            >
              <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stil */}
        <FieldLabel text="Stil" />
        <ToggleRow options={STYLES} value={style} onChange={v => setStyle(v as ClimbStyle)} />

        {/* Ergebnis */}
        <FieldLabel text="Ergebnis" />
        <ToggleRow options={RESULTS} value={result} onChange={v => setResult(v as ClimbResult)} />

        {/* Bewertung */}
        <FieldLabel text="Bewertung" />
        <StarRow value={stars} onChange={setStars} />

        {/* Notizen */}
        <FieldLabel text="Notizen" />
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Beobachtungen, Beta, Wetter…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Speichern */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Speichern</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F3F4F6' },
  container: { padding: 20, paddingBottom: 48 },

  header:    { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 32, marginBottom: 24 },
  backBtn:   { fontSize: 14, color: GREEN, fontWeight: '600' },
  heading:   { fontSize: 22, fontWeight: '700', color: '#111827' },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#EF4444' },
  errorText:  { fontSize: 12, color: '#EF4444', marginTop: 4 },
  notesInput: { height: 100, paddingTop: 12 },

  dateBtn:     { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12 },
  dateBtnText: { fontSize: 15, color: '#111827' },

  gradeScroll:     { marginHorizontal: -2 },
  gradeContent:    { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  gradeChip:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  gradeChipActive: { backgroundColor: GREEN, borderColor: GREEN },
  gradeText:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  gradeTextActive: { color: '#fff' },

  toggleRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleBtn:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  toggleBtnActive:  { backgroundColor: GREEN, borderColor: GREEN },
  toggleText:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#fff' },

  starRow: { flexDirection: 'row', gap: 8 },
  star:    { fontSize: 30 },

  saveBtn:     { marginTop: 32, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 3 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

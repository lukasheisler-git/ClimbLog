import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { CategoryBadge } from '../../components/training/CategoryBadge';
import { TrainingStackParamList } from '../../navigation/types';
import { loadAllSessions, saveSession, updateSession } from '../../storage/trainingStorage';
import { CATEGORIES, CATEGORY_COLOR, TrainingCategory, TrainingExercise, TrainingSession } from '../../types/training';

type Props = NativeStackScreenProps<TrainingStackParamList, 'SessionEditor'>;

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isoToDate(iso: string): Date { return new Date(iso); }
function dateToIso(d: Date): string { return d.toISOString(); }
function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const EMPTY_EX: Omit<TrainingExercise, 'id'> = { name: '', sets: undefined, reps: undefined, duration: undefined, weight: undefined, notes: '' };

export function SessionEditorScreen({ route, navigation }: Props) {
  const { sessionId, templateId } = route.params ?? {};
  const isEdit = !!sessionId;

  const [name,       setName]       = useState('');
  const [category,   setCategory]   = useState<TrainingCategory>('Open Climbing');
  const [date,       setDate]       = useState(new Date());
  const [duration,   setDuration]   = useState('60');
  const [intensity,  setIntensity]  = useState(5);
  const [notes,      setNotes]      = useState('');
  const [exercises,  setExercises]  = useState<TrainingExercise[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exOpen,    setExOpen]    = useState(false);
  const [exForm,    setExForm]    = useState(false);
  const [editingEx, setEditingEx] = useState<string | null>(null);

  const [exDraft, setExDraft] = useState({ ...EMPTY_EX });

  const originalId  = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      const all = await loadAllSessions();
      if (sessionId) {
        const s = all.find(x => x.id === sessionId);
        if (s) { originalId.current = s.id; fill(s); }
      } else if (templateId) {
        const t = all.find(x => x.id === templateId);
        if (t) { fill(t, true); setDate(new Date()); } // always reset intensity+date for template-based sessions
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fill(s: TrainingSession, resetIntensity = false) {
    setName(s.name);
    setCategory(s.category);
    setDate(isoToDate(s.date));
    setDuration(String(s.duration));
    setIntensity(resetIntensity ? 5 : (s.intensity ?? 5));
    setNotes(s.notes ?? '');
    setExercises(s.exercises.map(e => ({ ...e, id: e.id || makeId() })));
  }

  const openAddExercise = () => {
    setEditingEx(null);
    setExDraft({ ...EMPTY_EX });
    setExForm(true);
  };

  const openEditExercise = (ex: TrainingExercise) => {
    setEditingEx(ex.id);
    setExDraft({ name: ex.name, sets: ex.sets, reps: ex.reps, duration: ex.duration, weight: ex.weight, notes: ex.notes ?? '' });
    setExForm(true);
  };

  const saveExercise = () => {
    if (!exDraft.name.trim()) { Alert.alert('Fehler', 'Name ist erforderlich.'); return; }
    const ex: TrainingExercise = { id: editingEx ?? makeId(), name: exDraft.name.trim(), sets: exDraft.sets, reps: exDraft.reps, duration: exDraft.duration, weight: exDraft.weight, notes: exDraft.notes || undefined };
    setExercises(prev => editingEx ? prev.map(e => e.id === editingEx ? ex : e) : [...prev, ex]);
    setExForm(false);
  };

  const deleteExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
    if (editingEx === id) setExForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Fehler', 'Name ist erforderlich.'); return; }
    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur <= 0) { Alert.alert('Fehler', 'Bitte eine gültige Dauer eingeben.'); return; }

    const session: TrainingSession = {
      id: originalId.current ?? makeId(),
      name: name.trim(),
      category,
      date: dateToIso(date),
      duration: dur,
      intensity,
      notes: notes.trim() || undefined,
      exercises,
      isTemplate: false,
    };

    const doSave = async () => {
      if (isEdit) { await updateSession(session); }
      else        { await saveSession(session); }
      if (saveAsTemplate) {
        await saveSession({ ...session, id: makeId(), isTemplate: true });
      }
      navigation.goBack();
    };

    if (!isEdit) {
      const targetDate = session.date.slice(0, 10);
      const all = await loadAllSessions();
      const duplicate = all.find(
        s => !s.isTemplate && s.id !== session.id &&
             s.name === session.name &&
             s.date.slice(0, 10) === targetDate &&
             s.category === session.category,
      );
      if (duplicate) {
        Alert.alert(
          'Einheit bereits vorhanden',
          `Diese Einheit wurde heute bereits geloggt. Trotzdem speichern?`,
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Trotzdem speichern', onPress: doSave },
          ],
        );
        return;
      }
    }

    await doSave();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Einheit bearbeiten' : 'Neue Einheit'}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Speichern</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Name */}
        <Text style={styles.fieldLabel}>Name *</Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="z. B. Boulder Session"
          placeholderTextColor="#9CA3AF"
        />

        {/* Kategorie */}
        <Text style={styles.fieldLabel}>Kategorie</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && { backgroundColor: CATEGORY_COLOR[cat], borderColor: CATEGORY_COLOR[cat] }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Datum */}
        <Text style={styles.fieldLabel}>Datum</Text>
        <TouchableOpacity style={styles.textInput} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
          />
        )}

        {/* Dauer */}
        <Text style={styles.fieldLabel}>Dauer (Minuten)</Text>
        <TextInput
          style={styles.textInput}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          placeholder="60"
          placeholderTextColor="#9CA3AF"
        />

        {/* Intensität */}
        <View style={styles.intensityHeader}>
          <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Intensität</Text>
          <Text style={styles.intensityValue}>{intensity}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={intensity}
          onValueChange={v => setIntensity(v)}
          minimumTrackTintColor="#1B4332"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#1B4332"
        />

        {/* Notizen */}
        <Text style={styles.fieldLabel}>Notizen (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Freie Notizen zur Einheit…"
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
        />

        {/* Übungen */}
        <TouchableOpacity style={styles.sectionToggle} onPress={() => setExOpen(v => !v)}>
          <Text style={styles.sectionToggleText}>
            Übungen {exercises.length > 0 ? `(${exercises.length})` : ''}
          </Text>
          <Ionicons name={exOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color="#6B7280" />
        </TouchableOpacity>

        {exOpen && (
          <View style={styles.exSection}>
            {exercises.map(ex => (
              <View key={ex.id} style={styles.exCard}>
                <View style={styles.exCardInfo}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  {[ex.sets && `${ex.sets} Sätze`, ex.reps && `${ex.reps} Wdh.`, ex.duration && `${ex.duration} s`, ex.weight && `${ex.weight} kg`].filter(Boolean).length > 0 && (
                    <Text style={styles.exMeta}>{[ex.sets && `${ex.sets} Sätze`, ex.reps && `${ex.reps} Wdh.`, ex.duration && `${ex.duration} s`, ex.weight && `${ex.weight} kg`].filter(Boolean).join(' · ')}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => openEditExercise(ex)} hitSlop={8} style={styles.exBtn}>
                  <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteExercise(ex.id)} hitSlop={8} style={styles.exBtn}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {exForm ? (
              <View style={styles.exForm}>
                <Text style={styles.exFormTitle}>{editingEx ? 'Übung bearbeiten' : 'Übung hinzufügen'}</Text>

                <Text style={styles.exFieldLabel}>Name *</Text>
                <TextInput style={styles.exInput} value={exDraft.name} onChangeText={v => setExDraft(p => ({ ...p, name: v }))} placeholder="z. B. Hängeanlage" placeholderTextColor="#9CA3AF" />

                <View style={styles.exRow}>
                  <View style={styles.exRowItem}>
                    <Text style={styles.exFieldLabel}>Sätze</Text>
                    <TextInput style={styles.exInput} value={exDraft.sets?.toString() ?? ''} onChangeText={v => setExDraft(p => ({ ...p, sets: v ? parseInt(v) : undefined }))} keyboardType="number-pad" placeholder="—" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={styles.exRowItem}>
                    <Text style={styles.exFieldLabel}>Wdh.</Text>
                    <TextInput style={styles.exInput} value={exDraft.reps?.toString() ?? ''} onChangeText={v => setExDraft(p => ({ ...p, reps: v ? parseInt(v) : undefined }))} keyboardType="number-pad" placeholder="—" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={styles.exRowItem}>
                    <Text style={styles.exFieldLabel}>Dauer (s)</Text>
                    <TextInput style={styles.exInput} value={exDraft.duration?.toString() ?? ''} onChangeText={v => setExDraft(p => ({ ...p, duration: v ? parseInt(v) : undefined }))} keyboardType="number-pad" placeholder="—" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={styles.exRowItem}>
                    <Text style={styles.exFieldLabel}>Gewicht (kg)</Text>
                    <TextInput style={styles.exInput} value={exDraft.weight?.toString() ?? ''} onChangeText={v => setExDraft(p => ({ ...p, weight: v ? parseFloat(v) : undefined }))} keyboardType="decimal-pad" placeholder="—" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                <Text style={styles.exFieldLabel}>Notiz (optional)</Text>
                <TextInput style={styles.exInput} value={exDraft.notes ?? ''} onChangeText={v => setExDraft(p => ({ ...p, notes: v }))} placeholder="Optionale Notiz" placeholderTextColor="#9CA3AF" />

                <View style={styles.exFormActions}>
                  <TouchableOpacity style={styles.exCancelBtn} onPress={() => setExForm(false)}>
                    <Text style={styles.exCancelBtnText}>Abbrechen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.exSaveBtn} onPress={saveExercise}>
                    <Text style={styles.exSaveBtnText}>{editingEx ? 'Übernehmen' : 'Hinzufügen'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addExBtn} onPress={openAddExercise}>
                <Ionicons name="add-outline" size={16} color="#1B4332" />
                <Text style={styles.addExBtnText}>Übung hinzufügen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Als Template speichern */}
        {!isEdit && (
          <View style={styles.templateRow}>
            <Text style={styles.templateLabel}>Als Template speichern</Text>
            <Switch
              value={saveAsTemplate}
              onValueChange={setSaveAsTemplate}
              trackColor={{ true: '#1B4332' }}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F3F4F6' },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, gap: 10 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' },
  saveBtn:     { backgroundColor: '#1B4332', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  content: { paddingHorizontal: 16, paddingBottom: 20 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 6 },
  textInput:  { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  notesInput: { height: 80, textAlignVertical: 'top' },
  dateText:   { fontSize: 15, color: '#111827' },

  catGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  catChipText:     { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  catChipTextActive: { color: '#fff' },

  sectionToggle:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  sectionToggleText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  exSection: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', padding: 12, marginTop: 4, gap: 8 },

  exCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, gap: 8 },
  exCardInfo: { flex: 1 },
  exName:     { fontSize: 13, fontWeight: '600', color: '#111827' },
  exMeta:     { fontSize: 11, color: '#6B7280', marginTop: 2 },
  exBtn:      { padding: 4 },

  exForm:       { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, gap: 8 },
  exFormTitle:  { fontSize: 13, fontWeight: '700', color: '#374151' },
  exFieldLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  exInput:      { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#111827' },
  exRow:        { flexDirection: 'row', gap: 6 },
  exRowItem:    { flex: 1, gap: 4 },
  exFormActions: { flexDirection: 'row', gap: 8 },
  exCancelBtn:  { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  exCancelBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  exSaveBtn:    { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: '#1B4332', alignItems: 'center' },
  exSaveBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  addExBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', paddingVertical: 8 },
  addExBtnText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },

  templateRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
  templateLabel:{ fontSize: 15, color: '#374151' },

  intensityHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16, marginBottom: 2 },
  intensityValue:  { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  slider:          { marginHorizontal: -4, marginTop: 2, marginBottom: 4 },
});

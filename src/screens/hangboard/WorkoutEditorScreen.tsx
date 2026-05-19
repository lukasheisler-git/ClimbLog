import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { HangboardStackParamList } from '../../navigation/types';
import { loadWorkouts, saveWorkout } from '../../storage/hangboardStorage';
import { GripDepth, GripType, HangboardSet, HangboardWorkout } from '../../types/hangboard';

type Props = NativeStackScreenProps<HangboardStackParamList, 'WorkoutEditor'>;

const GRIP_DEPTHS: GripDepth[] = ['45mm', '30mm', '20mm', '15mm'];
const GRIP_TYPES: GripType[]   = ['Half Crimp', 'Full Crimp', 'Open Hand'];

const GREEN = '#1B4332';
const BG    = '#F3F4F6';
const CARD  = '#FFFFFF';

function makeSet(base?: Partial<HangboardSet>): HangboardSet {
  return {
    id:           `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    gripDepth:    '20mm',
    gripType:     'Half Crimp',
    hangDuration: 7,
    restDuration: 3,
    reps:         6,
    setRest:      180,
    addedWeight:  0,
    ...base,
  };
}

// Kompakter Auswahl-Button (Grifftiefe / Grifftyp)
function OptionRow<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.optionRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Nummerisches Eingabefeld
function NumField({ label, value, unit, onChange, allowNegative }: {
  label: string; value: number; unit?: string; onChange: (n: number) => void; allowNegative?: boolean;
}) {
  return (
    <View style={styles.numField}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numRow}>
        <TextInput
          style={styles.numInput}
          value={value === 0 && !allowNegative ? '' : value.toString()}
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          keyboardType={allowNegative ? 'numeric' : 'number-pad'}
          onChangeText={t => {
            const n = allowNegative ? parseFloat(t) : parseInt(t, 10);
            onChange(isNaN(n) ? 0 : n);
          }}
        />
        {unit ? <Text style={styles.numUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

// Editor für einen einzelnen Satz
function SetEditor({ set, index, total, onChange, onDelete }: {
  set: HangboardSet; index: number; total: number;
  onChange: (s: HangboardSet) => void; onDelete: () => void;
}) {
  const u = <K extends keyof HangboardSet>(key: K, val: HangboardSet[K]) =>
    onChange({ ...set, [key]: val });

  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.setTitle}>Satz {index + 1}</Text>
        {total > 1 && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.deleteText}>Entfernen</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.fieldLabel}>Grifftiefe</Text>
      <OptionRow options={GRIP_DEPTHS} value={set.gripDepth} onChange={v => u('gripDepth', v)} />

      <Text style={styles.fieldLabel}>Grifftyp</Text>
      <OptionRow options={GRIP_TYPES} value={set.gripType} onChange={v => u('gripType', v)} />

      <View style={styles.numGrid}>
        <NumField label="Hangzeit"    value={set.hangDuration} unit="s"  onChange={v => u('hangDuration', v)} />
        <NumField label="Rep-Pause"   value={set.restDuration} unit="s"  onChange={v => u('restDuration', v)} />
        <NumField label="Wdh."        value={set.reps}                   onChange={v => u('reps', v)} />
        <NumField label="Satzpause"   value={set.setRest}     unit="s"  onChange={v => u('setRest', v)} />
        <NumField label="Zusatzgew."  value={set.addedWeight} unit="kg" onChange={v => u('addedWeight', v)} allowNegative />
      </View>
      {set.addedWeight < 0 && (
        <Text style={styles.assistedHint}>Negatives Gewicht = Assisted (Band)</Text>
      )}
    </View>
  );
}

export function WorkoutEditorScreen({ route, navigation }: Props) {
  const { workoutId } = route.params ?? {};
  const isEditing = !!workoutId;

  const [name, setName] = useState('');
  const [sets, setSets] = useState<HangboardSet[]>([makeSet()]);

  // Bestehendes Workout laden wenn workoutId vorhanden
  useEffect(() => {
    if (!workoutId) return;
    loadWorkouts().then(ws => {
      const found = ws.find(w => w.id === workoutId);
      if (found) { setName(found.name); setSets(found.sets); }
    });
  }, [workoutId]);

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([...sets, makeSet(last ? { ...last } : undefined)]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name fehlt', 'Bitte einen Workout-Namen eingeben.');
      return;
    }
    if (sets.length === 0) {
      Alert.alert('Keine Sätze', 'Mindestens einen Satz hinzufügen.');
      return;
    }

    const now = Date.now();
    const workout: HangboardWorkout = {
      id:        workoutId ?? now.toString(),
      name:      name.trim(),
      sets,
      createdAt: workoutId ? now : now, // Bei Edit: createdAt bleibt unverändert (wird beim Laden überschrieben)
      updatedAt: now,
    };

    // createdAt beim Bearbeiten erhalten
    if (isEditing) {
      const existing = (await loadWorkouts()).find(w => w.id === workoutId);
      if (existing) workout.createdAt = existing.createdAt;
    }

    await saveWorkout(workout);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{isEditing ? 'Workout bearbeiten' : 'Neues Workout'}</Text>

        {/* Name */}
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="z.B. 7/3 Grundlage"
          placeholderTextColor="#9CA3AF"
          returnKeyType="done"
        />

        {/* Sätze */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Sätze</Text>
        {sets.map((s, i) => (
          <SetEditor
            key={s.id}
            set={s}
            index={i}
            total={sets.length}
            onChange={updated => setSets(prev => prev.map((x, j) => j === i ? updated : x))}
            onDelete={() => setSets(prev => prev.filter((_, j) => j !== i))}
          />
        ))}

        <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
          <Text style={styles.addSetText}>+ Satz hinzufügen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Speichern</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: BG },
  container: { padding: 20, paddingBottom: 48 },
  heading:   { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20, marginTop: 8 },

  nameInput: {
    backgroundColor: CARD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, marginTop: 14 },

  // Satz-Card
  setCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  setHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  setTitle:    { fontSize: 15, fontWeight: '700', color: '#111827' },
  deleteText:  { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  // Optionen (Grifftiefe / Grifftyp)
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  optionBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  optionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  optionTextActive: { color: '#fff' },

  // Zahlenfelder
  numGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  numField:  { minWidth: '28%', flex: 1 },
  numLabel:  { fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontWeight: '500' },
  numRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  numInput:  {
    backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 16, fontWeight: '600', color: '#111827', minWidth: 52, textAlign: 'center',
  },
  numUnit:   { fontSize: 12, color: '#9CA3AF' },
  assistedHint: { fontSize: 11, color: '#3B82F6', marginTop: 6 },

  // Buttons
  addSetBtn:  { borderRadius: 10, borderWidth: 1.5, borderColor: GREEN, borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  addSetText: { fontSize: 14, fontWeight: '600', color: GREEN },
  saveBtn:    {
    marginTop: 28, backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

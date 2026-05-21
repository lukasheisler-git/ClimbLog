import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { GRADES } from '../../types/climblog';
import { deleteBucketItem, saveBucketItem, updateBucketItem } from '../../storage/homeStorage';
import { BucketListCategory, BucketListItem, TourType } from '../../types/home';

interface Props {
  items: BucketListItem[];
  onUpdate: () => void;
}

const CATEGORIES: BucketListCategory[] = ['Gebiet', 'Route', 'Boulder', 'Tour'];

const TOUR_TYPES: TourType[] = [
  'Mehrseillänge', 'Hochtour', 'Skitour', 'Wanderung', 'Klettersteig', 'Alpinklettern',
];

const CATEGORY_COLOR: Record<BucketListCategory, string> = {
  Gebiet:  '#3B82F6',
  Route:   '#1B4332',
  Boulder: '#8B5CF6',
  Tour:    '#F59E0B',
};

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function BucketListWidget({ items, onUpdate }: Props) {
  const [showAll,     setShowAll]     = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [doneVisible, setDoneVisible] = useState(false);
  const [doneItem,    setDoneItem]    = useState<BucketListItem | null>(null);

  // Form fields
  const [fName,        setFName]        = useState('');
  const [fCategory,    setFCategory]    = useState<BucketListCategory>('Gebiet');
  const [fGrade,       setFGrade]       = useState('');
  const [fBoulderGrade, setFBoulderGrade] = useState('');
  const [fTourType,    setFTourType]    = useState<TourType | null>(null);
  const [fNotes,       setFNotes]       = useState('');

  const openAdd = () => {
    setEditingId(null);
    setFName(''); setFCategory('Gebiet'); setFGrade('');
    setFBoulderGrade(''); setFTourType(null); setFNotes('');
    setFormVisible(true);
  };

  const openEdit = (item: BucketListItem) => {
    setEditingId(item.id);
    setFName(item.name);
    setFCategory(item.category);
    setFGrade(item.grade ?? '');
    setFBoulderGrade(item.boulderGrade ?? '');
    setFTourType(item.tourType ?? null);
    setFNotes(item.notes ?? '');
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) return;
    const base = {
      name:         fName.trim(),
      category:     fCategory,
      grade:        fCategory === 'Route'   ? fGrade || undefined : undefined,
      boulderGrade: fCategory === 'Boulder' ? fBoulderGrade || undefined : undefined,
      tourType:     fCategory === 'Tour'    ? fTourType ?? undefined : undefined,
      notes:        fNotes.trim() || undefined,
    };
    if (editingId) {
      const existing = items.find(i => i.id === editingId);
      if (existing) await updateBucketItem({ ...existing, ...base });
    } else {
      await saveBucketItem({ id: makeId(), ...base, completed: false, createdAt: Date.now() });
    }
    setFormVisible(false);
    onUpdate();
  };

  const handleDelete = () => {
    Alert.alert('Eintrag löschen', 'Eintrag aus der Bucket List entfernen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => {
        if (editingId) await deleteBucketItem(editingId);
        setFormVisible(false);
        onUpdate();
      }},
    ]);
  };

  const confirmDone = (item: BucketListItem) => {
    setDoneItem(item);
    setDoneVisible(true);
  };

  const handleMarkDone = async () => {
    if (!doneItem) return;
    await updateBucketItem({ ...doneItem, completed: true });
    setDoneVisible(false);
    setDoneItem(null);
    onUpdate();
  };

  const openItems  = items.filter(i => !i.completed);
  const doneItems  = items.filter(i => i.completed);
  const visibleItems = showAll ? items : openItems;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Bucket List</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Hinzufügen</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>Noch keine Ziele. Füge dein erstes Ziel hinzu!</Text>
      ) : (
        <>
          {visibleItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, item.completed && styles.itemRowDone]}
              onPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.catDot, { backgroundColor: item.completed ? '#D1D5DB' : CATEGORY_COLOR[item.category] }]} />
              <View style={styles.itemContent}>
                <View style={styles.itemTopRow}>
                  <Text style={[styles.itemName, item.completed && styles.itemNameDone]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.itemBadges}>
                    {item.category === 'Route' && item.grade && (
                      <View style={styles.badge}><Text style={styles.badgeText}>{item.grade}</Text></View>
                    )}
                    {item.category === 'Boulder' && item.boulderGrade && (
                      <View style={styles.badge}><Text style={styles.badgeText}>{item.boulderGrade}</Text></View>
                    )}
                    {item.category === 'Tour' && item.tourType && (
                      <View style={styles.badge}><Text style={styles.badgeText}>{item.tourType}</Text></View>
                    )}
                    {!item.completed && (
                      <TouchableOpacity onPress={() => confirmDone(item)} hitSlop={8}>
                        <Ionicons name="checkmark-circle-outline" size={22} color="#D1D5DB" />
                      </TouchableOpacity>
                    )}
                    {item.completed && (
                      <Ionicons name="checkmark-circle" size={22} color="#1B4332" />
                    )}
                  </View>
                </View>
                {item.notes && !item.completed && (
                  <Text style={styles.itemNotes} numberOfLines={1}>{item.notes}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {doneItems.length > 0 && (
            <TouchableOpacity style={styles.showAllBtn} onPress={() => setShowAll(v => !v)}>
              <Text style={styles.showAllText}>
                {showAll ? 'Weniger anzeigen' : `Alle anzeigen (${doneItems.length} erledigt)`}
              </Text>
              <Ionicons name={showAll ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color="#6B7280" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Hinzufügen / Bearbeiten Modal */}
      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{editingId ? 'Ziel bearbeiten' : 'Ziel hinzufügen'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Kategorie */}
              <Text style={styles.label}>Kategorie</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, fCategory === c && { backgroundColor: CATEGORY_COLOR[c], borderColor: CATEGORY_COLOR[c] }]}
                    onPress={() => setFCategory(c)}
                  >
                    <Text style={[styles.chipText, fCategory === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Name */}
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={fName}
                onChangeText={setFName}
                placeholder="z. B. Frankenjura, Action Directe..."
                placeholderTextColor="#9CA3AF"
                autoFocus={!editingId}
              />

              {/* Schwierigkeit (Route / Boulder) */}
              {(fCategory === 'Route' || fCategory === 'Boulder') && (
                <>
                  <Text style={styles.label}>Schwierigkeit (optional)</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.gradeRow}
                    style={styles.gradeScroll}
                  >
                    {(GRADES as readonly string[]).map(g => {
                      const active = fCategory === 'Route' ? fGrade === g : fBoulderGrade === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          style={[styles.gradeChip, active && styles.gradeChipActive]}
                          onPress={() =>
                            fCategory === 'Route'
                              ? setFGrade(fGrade === g ? '' : g)
                              : setFBoulderGrade(fBoulderGrade === g ? '' : g)
                          }
                        >
                          <Text style={[styles.gradeChipText, active && styles.gradeChipTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Tourtyp */}
              {fCategory === 'Tour' && (
                <>
                  <Text style={styles.label}>Tourtyp (optional)</Text>
                  <View style={styles.chipRow}>
                    {TOUR_TYPES.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.chip, fTourType === t && styles.chipActive]}
                        onPress={() => setFTourType(fTourType === t ? null : t)}
                      >
                        <Text style={[styles.chipText, fTourType === t && styles.chipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Notizen */}
              <Text style={styles.label}>Notizen (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={fNotes}
                onChangeText={setFNotes}
                placeholder="Weitere Details..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />

              {/* Aktionen */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormVisible(false)}>
                  <Text style={styles.cancelBtnText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>{editingId ? 'Speichern' : 'Hinzufügen'}</Text>
                </TouchableOpacity>
              </View>

              {editingId && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>Eintrag löschen</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Erledigt-Bestätigung */}
      <Modal visible={doneVisible} transparent animationType="fade" onRequestClose={() => setDoneVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.doneSheet}>
            <Ionicons name="checkmark-circle" size={48} color="#1B4332" style={{ marginBottom: 12 }} />
            <Text style={styles.doneTitle}>Ziel erreicht?</Text>
            <Text style={styles.doneText}>"{doneItem?.name}" als erledigt markieren?</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDoneVisible(false)}>
                <Text style={styles.cancelBtnText}>Nein</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleMarkDone}>
                <Text style={styles.saveBtnText}>Ja!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle:  { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn:     { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1B4332', borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  empty:      { fontSize: 13, color: '#9CA3AF', paddingVertical: 8 },

  itemRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemRowDone:  { opacity: 0.5 },
  catDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  itemContent:  { flex: 1, gap: 3 },
  itemTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  itemName:     { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  itemBadges:   { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  badge:        { backgroundColor: '#F3F4F6', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:    { fontSize: 11, fontWeight: '600', color: '#374151' },
  itemNotes:    { fontSize: 12, color: '#9CA3AF' },

  showAllBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 12 },
  showAllText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, maxHeight: '90%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle:  { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16, marginTop: 8 },

  label:     { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  input:     { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  notesInput:{ height: 72 },

  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActive:    { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipText:      { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive:{ color: '#fff' },

  gradeScroll: { marginHorizontal: -2, marginBottom: 2 },
  gradeRow:    { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  gradeChip:       { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  gradeChipActive: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  gradeChipText:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  gradeChipTextActive: { color: '#fff' },

  actions:   { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn:   { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#1B4332', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  deleteBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10 },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },

  doneSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, alignItems: 'center' },
  doneTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  doneText:  { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, paddingHorizontal: 12 },
});

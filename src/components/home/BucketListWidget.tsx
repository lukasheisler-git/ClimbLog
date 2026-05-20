import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { deleteBucketItem, saveBucketItem, updateBucketItem } from '../../storage/homeStorage';
import { BucketListItem, BucketListType } from '../../types/home';

interface Props {
  items: BucketListItem[];
  onUpdate: () => void;
}

const TYPES: BucketListType[] = ['Gebiet', 'Route', 'Tour'];

const TYPE_COLOR: Record<BucketListType, string> = {
  Gebiet: '#3B82F6',
  Route:  '#1B4332',
  Tour:   '#F59E0B',
};

export function BucketListWidget({ items, onUpdate }: Props) {
  const [addVisible,   setAddVisible]   = useState(false);
  const [doneVisible,  setDoneVisible]  = useState(false);
  const [doneItem,     setDoneItem]     = useState<BucketListItem | null>(null);
  const [inputName,    setInputName]    = useState('');
  const [inputNotes,   setInputNotes]   = useState('');
  const [selectedType, setSelectedType] = useState<BucketListType>('Gebiet');
  const [showAll,      setShowAll]      = useState(false);

  const openItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);
  const visibleItems = showAll ? items : openItems;

  const handleAdd = async () => {
    if (!inputName.trim()) return;
    const item: BucketListItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: inputName.trim(),
      type: selectedType,
      notes: inputNotes.trim() || undefined,
      done: false,
      createdAt: Date.now(),
    };
    await saveBucketItem(item);
    setInputName('');
    setInputNotes('');
    setSelectedType('Gebiet');
    setAddVisible(false);
    onUpdate();
  };

  const confirmDone = (item: BucketListItem) => {
    setDoneItem(item);
    setDoneVisible(true);
  };

  const handleMarkDone = async () => {
    if (!doneItem) return;
    await updateBucketItem({ ...doneItem, done: true });
    setDoneVisible(false);
    setDoneItem(null);
    onUpdate();
  };

  const handleLongPress = (item: BucketListItem) => {
    Alert.alert(
      'Eintrag löschen',
      `"${item.name}" aus der Bucket List entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => { await deleteBucketItem(item.id); onUpdate(); } },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Bucket List</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
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
              style={[styles.itemRow, item.done && styles.itemRowDone]}
              onPress={() => !item.done && confirmDone(item)}
              onLongPress={() => handleLongPress(item)}
            >
              <View style={[styles.typeDot, { backgroundColor: item.done ? '#D1D5DB' : TYPE_COLOR[item.type] }]} />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.done && styles.itemNameDone]}>{item.name}</Text>
                {item.notes && !item.done && <Text style={styles.itemNotes} numberOfLines={1}>{item.notes}</Text>}
              </View>
              {!item.done && <Text style={styles.itemType}>{item.type}</Text>}
              <Ionicons
                name={item.done ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={22}
                color={item.done ? '#1B4332' : '#D1D5DB'}
              />
            </TouchableOpacity>
          ))}

          {doneItems.length > 0 && (
            <TouchableOpacity style={styles.showAllBtn} onPress={() => setShowAll(v => !v)}>
              <Text style={styles.showAllText}>
                {showAll ? 'Weniger anzeigen' : `Alle anzeigen (${doneItems.length} erledigt)`}
              </Text>
              <Ionicons
                name={showAll ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={14}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Ziel hinzufügen</Text>

            <Text style={styles.inputLabel}>Typ</Text>
            <View style={styles.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, selectedType === t && { backgroundColor: TYPE_COLOR[t], borderColor: TYPE_COLOR[t] }]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text style={[styles.typeChipText, selectedType === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={inputName}
              onChangeText={setInputName}
              placeholder="z. B. Frankenjura, Chamonix..."
              placeholderTextColor="#9CA3AF"
              autoFocus
            />

            <Text style={styles.inputLabel}>Notizen (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.notesInput]}
              value={inputNotes}
              onChangeText={setInputNotes}
              placeholder="Weitere Details..."
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddVisible(false); setInputName(''); setInputNotes(''); }}>
                <Text style={styles.cancelBtnText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmBtnText}>Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Done Confirmation Modal */}
      <Modal visible={doneVisible} transparent animationType="fade" onRequestClose={() => setDoneVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.doneSheet}>
            <Ionicons name="checkmark-circle" size={48} color="#1B4332" style={{ marginBottom: 12 }} />
            <Text style={styles.doneTitle}>Ziel erreicht?</Text>
            <Text style={styles.doneText}>"{doneItem?.name}" als erledigt markieren?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDoneVisible(false)}>
                <Text style={styles.cancelBtnText}>Nein</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleMarkDone}>
                <Text style={styles.confirmBtnText}>Ja!</Text>
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

  empty: { fontSize: 13, color: '#9CA3AF', paddingVertical: 8 },

  itemRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  itemRowDone:  { opacity: 0.5 },
  typeDot:      { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemInfo:     { flex: 1 },
  itemName:     { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  itemNotes:    { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  itemType:     { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  showAllBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 12 },
  showAllText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  inputLabel:   { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  typeRow:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeChipTextActive: { color: '#fff' },
  modalInput:   { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', marginBottom: 14 },
  notesInput:   { height: 72, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText:{ fontSize: 15, fontWeight: '600', color: '#6B7280' },
  confirmBtn:   { flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: '#1B4332', alignItems: 'center' },
  confirmBtnText:{ fontSize: 15, fontWeight: '600', color: '#fff' },

  doneSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, paddingBottom: 40, alignItems: 'center' },
  doneTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  doneText:  { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
});

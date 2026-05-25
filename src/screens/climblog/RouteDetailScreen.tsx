import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Dimensions, FlatList, Image,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { ClimbLogStackParamList } from '../../navigation/types';
import { deleteRoute, loadRoutes } from '../../storage/climblogStorage';
import { ClimbPhoto, ClimbResult, ClimbRoute } from '../../types/climblog';

type Props = NativeStackScreenProps<ClimbLogStackParamList, 'RouteDetail'>;

const GREEN = '#1B4332';
const SCREEN_W = Dimensions.get('window').width;

const RESULT_COLOR: Record<ClimbResult, string> = {
  Onsight:  '#F59E0B',
  Flash:    '#3B82F6',
  Redpoint: '#EF4444',
  Project:  '#9CA3AF',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function photoHeight(photo: ClimbPhoto): number {
  return photo.width && photo.height
    ? Math.min(SCREEN_W * photo.height / photo.width, SCREEN_W * 1.5)
    : SCREEN_W * 0.75;
}

export function RouteDetailScreen({ route, navigation }: Props) {
  const { routeId } = route.params;
  const [climbRoute, setClimbRoute] = useState<ClimbRoute | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setPhotoIndex(viewableItems[0].index);
      }
    },
  );

  useEffect(() => {
    loadRoutes().then(routes => {
      setClimbRoute(routes.find(r => r.id === routeId) ?? null);
    });
  }, [routeId]);

  const handleDelete = () => {
    Alert.alert(
      'Route löschen',
      `"${climbRoute?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen', style: 'destructive',
          onPress: async () => {
            await deleteRoute(routeId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const renderPhoto = useCallback(({ item }: { item: ClimbPhoto }) => {
    const h = photoHeight(item);
    return (
      <View style={{ width: SCREEN_W, height: h, overflow: 'hidden' }}>
        <Image
          source={{ uri: item.uri }}
          style={{ width: SCREEN_W, height: h }}
          resizeMode="contain"
        />
      </View>
    );
  }, []);

  if (!climbRoute) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.loading}>Lade Route…</Text>
      </View>
    );
  }

  const photos = climbRoute.photos ?? [];
  const galleryH = photos.length > 0 ? photoHeight(photos[photoIndex] ?? photos[0]) : 0;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{climbRoute.name}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddRoute', { routeId })}
          hitSlop={8}
        >
          <Ionicons name="pencil-outline" size={22} color={GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Info-Bereich */}
        <View style={styles.infoCard}>
          <View style={styles.gradeRow}>
            <Text style={styles.gradeText}>{climbRoute.grade}</Text>
            <View style={[styles.resultBadge, { backgroundColor: RESULT_COLOR[climbRoute.result] + '22' }]}>
              <Text style={[styles.resultBadgeText, { color: RESULT_COLOR[climbRoute.result] }]}>
                {climbRoute.result}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <InfoRow label="Datum"  value={formatDate(climbRoute.date)} />
          <InfoRow label="Stil"   value={climbRoute.style} />

          {climbRoute.wallAngle && (
            <InfoRow label="Wandneigung" value={climbRoute.wallAngle} />
          )}

          {(climbRoute.climbingStyles?.length ?? 0) > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Charakter</Text>
              <View style={styles.chipWrap}>
                {climbRoute.climbingStyles!.map(s => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(climbRoute.area || climbRoute.sector) && (
            <InfoRow
              label="Gebiet"
              value={[climbRoute.area, climbRoute.sector].filter(Boolean).join(' · ')}
            />
          )}

          {!!climbRoute.stars && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bewertung</Text>
              <Text style={styles.starsText}>{'★'.repeat(climbRoute.stars)}{'☆'.repeat(5 - climbRoute.stars)}</Text>
            </View>
          )}

          {climbRoute.notes && (
            <View style={styles.notesBlock}>
              <Text style={styles.infoLabel}>Notizen</Text>
              <Text style={styles.notesText}>{climbRoute.notes}</Text>
            </View>
          )}
        </View>

        {/* Foto-Galerie */}
        {photos.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionLabel}>Fotos</Text>
            <View style={[styles.galleryWrap, { height: galleryH }]}>
              <FlatList
                data={photos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_W}
                snapToAlignment="start"
                decelerationRate="fast"
                keyExtractor={(_, index) => index.toString()}
                getItemLayout={(_, index) => ({
                  length: SCREEN_W,
                  offset: SCREEN_W * index,
                  index,
                })}
                renderItem={renderPhoto}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
              />
              {photos.length > 1 && (
                <View style={styles.dots}>
                  {photos.map((_, i) => (
                    <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Löschen */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteBtnText}>Route löschen</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F3F4F6' },
  center: { alignItems: 'center', justifyContent: 'center' },
  loading:{ fontSize: 14, color: '#9CA3AF' },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' },

  content: { paddingBottom: 48 },

  gallerySection: { marginHorizontal: 16, marginTop: 4, marginBottom: 4 },
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  galleryWrap:    { borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  dots:           { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.25)' },
  dotActive:      { backgroundColor: '#1B4332', width: 18 },

  infoCard: { margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },

  gradeRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  gradeText:      { fontSize: 36, fontWeight: '800', color: '#111827' },
  resultBadge:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  resultBadgeText:{ fontSize: 14, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },

  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 12 },
  infoLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', width: 100, flexShrink: 0 },
  infoValue: { flex: 1, fontSize: 13, color: '#111827', fontWeight: '500', textAlign: 'right' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1, justifyContent: 'flex-end' },
  chip:     { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  starsText: { fontSize: 16, color: '#F59E0B', letterSpacing: 2 },

  notesBlock: { paddingTop: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', paddingBottom: 7 },
  notesText:  { fontSize: 14, color: '#374151', lineHeight: 20 },

  deleteBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
});

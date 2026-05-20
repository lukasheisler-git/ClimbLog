import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORY_COLOR, TrainingCategory } from '../../types/training';

interface Props {
  category: TrainingCategory;
  small?: boolean;
}

export function CategoryBadge({ category, small }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: CATEGORY_COLOR[category] }, small && styles.badgeSmall]}>
      <Text style={[styles.text, small && styles.textSmall]}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  text:       { fontSize: 11, fontWeight: '700', color: '#fff' },
  textSmall:  { fontSize: 10 },
});

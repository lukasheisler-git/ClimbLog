import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { TimerPhase } from '../../hooks/useHangboardTimer';

interface Props {
  secondsLeft: number;
  total: number;
  phase: TimerPhase;
}

const SIZE = 220;
const RADIUS = 90;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASE_COLOR: Record<TimerPhase, string> = {
  idle:     '#9CA3AF',
  getReady: '#F59E0B',
  hanging:  '#D62828',
  repRest:  '#2D6A4F',
  setRest:  '#1A535C',
  complete: '#52B788',
};

export function CountdownCircle({ secondsLeft, total, phase }: Props) {
  const progress = total > 0 ? Math.max(0, secondsLeft / total) : 1;
  const offset   = CIRCUMFERENCE * (1 - progress);
  const color    = PHASE_COLOR[phase];
  const cx       = SIZE / 2;
  const cy       = SIZE / 2;

  return (
    <View style={styles.wrapper}>
      <Svg width={SIZE} height={SIZE}>
        {/* Hintergrundring */}
        <Circle cx={cx} cy={cy} r={RADIUS} stroke="#E5E7EB" strokeWidth={STROKE} fill="none" />
        {/* Fortschrittsring — beginnt oben (rotation −90°) */}
        <Circle
          cx={cx} cy={cy} r={RADIUS}
          stroke={color} strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.seconds, { color }]}>{secondsLeft}</Text>
        <Text style={styles.unit}>sek</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center:  { position: 'absolute', alignItems: 'center' },
  seconds: { fontSize: 64, fontWeight: '700', lineHeight: 70 },
  unit:    { fontSize: 16, color: '#6B7280', fontWeight: '500' },
});

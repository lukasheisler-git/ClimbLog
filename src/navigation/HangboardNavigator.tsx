import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HangboardHomeScreen } from '../screens/hangboard/HangboardHomeScreen';
import { TimerScreen } from '../screens/hangboard/TimerScreen';
import { WorkoutEditorScreen } from '../screens/hangboard/WorkoutEditorScreen';
import { HangboardStackParamList } from './types';

const Stack = createNativeStackNavigator<HangboardStackParamList>();

export function HangboardNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HangboardHome"  component={HangboardHomeScreen} />
      <Stack.Screen name="WorkoutEditor"  component={WorkoutEditorScreen} />
      <Stack.Screen
        name="Timer"
        component={TimerScreen}
        // Wisch-Geste deaktivieren damit kein versehentliches Abbrechen passiert
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

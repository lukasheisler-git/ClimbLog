import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SessionDetailScreen } from '../screens/training/SessionDetailScreen';
import { SessionEditorScreen } from '../screens/training/SessionEditorScreen';
import { TrainingMainScreen } from '../screens/training/TrainingMainScreen';
import { DayEditorScreen } from '../screens/training/DayEditorScreen';
import { PlanEditorScreen } from '../screens/training/PlanEditorScreen';
import { TrainingStackParamList } from './types';

const Stack = createNativeStackNavigator<TrainingStackParamList>();

export function TrainingNavigator() {
  return (
    <Stack.Navigator id="TrainingStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainingMain"  component={TrainingMainScreen} />
      <Stack.Screen name="SessionEditor" component={SessionEditorScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      <Stack.Screen name="DayEditor"     component={DayEditorScreen} />
      <Stack.Screen name="PlanEditor"    component={PlanEditorScreen} />
    </Stack.Navigator>
  );
}

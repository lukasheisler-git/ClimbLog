import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { SessionDetailScreen } from '../screens/training/SessionDetailScreen';
import { SessionEditorScreen } from '../screens/training/SessionEditorScreen';
import { TrainingMainScreen } from '../screens/training/TrainingMainScreen';
import { TrainingStackParamList } from './types';

const Stack = createNativeStackNavigator<TrainingStackParamList>();

export function TrainingNavigator() {
  return (
    <Stack.Navigator id="TrainingStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainingMain"  component={TrainingMainScreen} />
      <Stack.Screen name="SessionEditor" component={SessionEditorScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}

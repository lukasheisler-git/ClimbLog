import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AddRouteScreen } from '../screens/climblog/AddRouteScreen';
import { ClimbLogHomeScreen } from '../screens/climblog/ClimbLogHomeScreen';
import { ClimbLogSearchScreen } from '../screens/climblog/ClimbLogSearchScreen';
import { ClimbLogStatsScreen } from '../screens/climblog/ClimbLogStatsScreen';
import { ClimbLogStackParamList } from './types';

const Stack = createNativeStackNavigator<ClimbLogStackParamList>();

export function ClimbLogNavigator() {
  return (
    <Stack.Navigator id="ClimbLogStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClimbLogHome"   component={ClimbLogHomeScreen} />
      <Stack.Screen name="AddRoute"       component={AddRouteScreen} />
      <Stack.Screen name="ClimbLogSearch" component={ClimbLogSearchScreen} />
      <Stack.Screen name="ClimbLogStats"  component={ClimbLogStatsScreen} />
    </Stack.Navigator>
  );
}

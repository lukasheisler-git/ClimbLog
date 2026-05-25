import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { AddRouteScreen } from '../screens/climblog/AddRouteScreen';
import { ClimbLogMainScreen } from '../screens/climblog/ClimbLogMainScreen';
import { RouteDetailScreen } from '../screens/climblog/RouteDetailScreen';
import { ClimbLogStackParamList } from './types';

const Stack = createNativeStackNavigator<ClimbLogStackParamList>();

export function ClimbLogNavigator() {
  return (
    <Stack.Navigator id="ClimbLogStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClimbLogMain" component={ClimbLogMainScreen} />
      <Stack.Screen name="AddRoute"     component={AddRouteScreen} />
      <Stack.Screen name="RouteDetail"  component={RouteDetailScreen} />
    </Stack.Navigator>
  );
}

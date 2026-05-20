import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text } from 'react-native';
import { ClimbLogNavigator } from './ClimbLogNavigator';
import { HangboardNavigator } from './HangboardNavigator';
import { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

// Platzhalter-Screens für spätere Module
function HomeScreen()     { return <Text style={{ margin: 40, fontSize: 16, color: '#6B7280' }}>Home — kommt bald</Text>; }
function TrainingScreen() { return <Text style={{ margin: 40, fontSize: 16, color: '#6B7280' }}>Training — kommt bald</Text>; }

const ICON_MAP: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  HomeTab:      'home-outline',
  ClimbLogTab:  'flag-outline',
  HangboardTab: 'barbell-outline',
  TrainingTab:  'calendar-outline',
};

export function AppNavigator() {
  return (
    <Tab.Navigator
      id="TabNavigator"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle:             { backgroundColor: '#fff', borderTopColor: '#E5E7EB' },
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <Ionicons name={ICON_MAP[route.name]} size={24} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab"      component={HomeScreen}        options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ClimbLogTab"  component={ClimbLogNavigator} options={{ tabBarLabel: 'Kletterlog' }} />
      <Tab.Screen name="HangboardTab" component={HangboardNavigator} options={{ tabBarLabel: 'Hangboard' }} />
      <Tab.Screen name="TrainingTab"  component={TrainingScreen}    options={{ tabBarLabel: 'Training' }} />
    </Tab.Navigator>
  );
}

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';
import RouteLogScreen from '../screens/RouteLogScreen';
import { HangboardNavigator } from './HangboardNavigator';
import { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

// Platzhalter-Screens für spätere Module
function HomeScreen()     { return <Text style={{ margin: 40, fontSize: 16, color: '#6B7280' }}>Home — kommt bald</Text>; }
function TrainingScreen() { return <Text style={{ margin: 40, fontSize: 16, color: '#6B7280' }}>Training — kommt bald</Text>; }

const GREEN = '#1B4332';

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   GREEN,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle:             { backgroundColor: '#fff', borderTopColor: '#E5E7EB' },
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            HomeTab:      '🏠',
            ClimbLogTab:  '📋',
            HangboardTab: '🤲',
            TrainingTab:  '📊',
          };
          return <Text style={{ fontSize: size - 4 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="HomeTab"      component={HomeScreen}        options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ClimbLogTab"  component={RouteLogScreen}    options={{ tabBarLabel: 'Kletterlog' }} />
      <Tab.Screen name="HangboardTab" component={HangboardNavigator} options={{ tabBarLabel: 'Hangboard' }} />
      <Tab.Screen name="TrainingTab"  component={TrainingScreen}    options={{ tabBarLabel: 'Training' }} />
    </Tab.Navigator>
  );
}

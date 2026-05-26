import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDefaultPlan } from './src/storage/planStorage';
import { migrateBase64Photos } from './src/utils/photoStorage';

export default function App() {
  useEffect(() => {
    migrateBase64Photos().catch(console.warn);
    initDefaultPlan().catch(console.warn);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

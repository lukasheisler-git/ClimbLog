import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { migrateBase64Photos } from './src/utils/photoStorage';

export default function App() {
  useEffect(() => {
    migrateBase64Photos().catch(console.warn);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <AppNavigator />
    </NavigationContainer>
  );
}

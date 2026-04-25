import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/utils/notifications';

export default function App() {
  useEffect(() => {
    // Registration is safe even if you later choose a different backend/provider.
    // On development builds, this gives you an Expo push token (when EAS projectId exists).
    void registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AppProvider>
    </SafeAreaProvider>
  );
}

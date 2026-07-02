// ============================================================
// GURBANI TRADERS - Root Layout
// Initializes database, wraps app in providers, handles splash
// ============================================================

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { initializeDatabase } from '../database/database';
import SplashScreenView from '../screens/dashboard/SplashScreenView';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let splashDone = false;
    let dbDone = false;

    const tryFinish = () => {
      if (splashDone && dbDone) setReady(true);
    };

    // Minimum splash time
    setTimeout(() => { splashDone = true; tryFinish(); }, 1800);

    // Init DB
    try {
      initializeDatabase();
    } catch (e) {
      console.error('DB init error:', e);
    } finally {
      dbDone = true;
      tryFinish();
    }
  }, []);

  if (!ready) return <SplashScreenView />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

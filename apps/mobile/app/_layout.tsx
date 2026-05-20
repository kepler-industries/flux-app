import '../global.css';
import * as React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFluxStore } from '@/lib/store';

export default function RootLayout() {
  const bootstrap = useFluxStore((s) => s.bootstrap);
  const bootstrapped = useFluxStore((s) => s.bootstrapped);
  const materialise = useFluxStore((s) => s.materialiseDueRecurring);

  React.useEffect(() => {
    bootstrap().then(() => materialise());
  }, [bootstrap, materialise]);

  if (!bootstrapped) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0F14' } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="signin" options={{ presentation: 'modal' }} />
          <Stack.Screen name="transaction/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="recurring/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="account/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="budget/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="category/new" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

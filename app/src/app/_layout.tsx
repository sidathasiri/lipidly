import '@/services/amplify';
import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold, useFonts } from '@expo-google-fonts/figtree';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DEV_BOOT_ACTIVE, devAutoSignIn, useDevBoot, useDevTour } from '@/dev/devBoot';
import { restoreSession } from '@/state/actions/auth';
import { useNotifications } from '@/services/notifications';
import { useSync } from '@/services/sync';
import { useStore } from '@/state/store';
import { colors } from '@/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHydrated() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => useStore.persist.onFinishHydration(() => setHydrated(true)), []);
  return hydrated;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  const hydrated = useHydrated();
  const ready = fontsLoaded && hydrated;
  useNotifications();
  useSync();
  useDevTour();
  const booted = useDevBoot(ready);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Keep the saved session in step with Cognito (signed out elsewhere, tokens gone, etc.).
  useEffect(() => {
    if (hydrated && !DEV_BOOT_ACTIVE) restoreSession().then(devAutoSignIn);
  }, [hydrated]);

  if (!ready || !booted) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="check-in" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="check-in-done" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="reports/add" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
          <Stack.Screen name="medicines/add" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
          <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="reading" options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="reports/viewer" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '@/lib/providers';
import { useColors } from '@/design/theme-context';
import { BrandSplash } from '@/design/BrandSplash';
import { useClubFonts } from '@/lib/fonts';

void SplashScreen.preventAutoHideAsync();

function RootNavigator({ showBrandSplash, onBrandDone }: { showBrandSplash: boolean; onBrandDone: () => void }) {
  const colors = useColors();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="haber" />
      </Stack>
      {showBrandSplash ? <BrandSplash onDone={onBrandDone} /> : null}
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useClubFonts();
  const [brandDone, setBrandDone] = useState(false);
  const onBrandDone = useCallback(() => setBrandDone(true), []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator showBrandSplash={!brandDone} onBrandDone={onBrandDone} />
    </AppProviders>
  );
}

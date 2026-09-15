import { Stack } from 'expo-router';
import { colors } from '@/design/tokens';

export default function NewsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.black },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontFamily: 'Oswald_600SemiBold',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Haberler' }} />
      <Stack.Screen name="[slug]" options={{ title: 'Haber' }} />
    </Stack>
  );
}

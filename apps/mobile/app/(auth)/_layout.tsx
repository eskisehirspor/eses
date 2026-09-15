import { Stack } from 'expo-router';
import { colors } from '@/design/tokens';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.black },
        headerTintColor: colors.white,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Giriş' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Kayıt' }} />
    </Stack>
  );
}

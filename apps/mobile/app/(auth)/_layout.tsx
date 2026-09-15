import { Stack } from 'expo-router';
import { useColors } from '@/design/theme-context';

export default function AuthLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Giriş' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Kayıt' }} />
    </Stack>
  );
}

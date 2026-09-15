import { Stack } from 'expo-router';
import { typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';

export default function MatchesStackLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: typography.family.ui,
          fontWeight: typography.weight.semibold,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Maç' }} />
    </Stack>
  );
}

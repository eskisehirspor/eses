import { Link, Stack } from 'expo-router';
import { Screen, Text, Button } from '@/design';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Bulunamadı' }} />
      <Screen>
        <Text variant="title">Sayfa yok</Text>
        <Text muted>Bu rota Phase 0 kabuğunda tanımlı değil.</Text>
        <Link href="/" asChild>
          <Button label="HOME’a dön" />
        </Link>
      </Screen>
    </>
  );
}

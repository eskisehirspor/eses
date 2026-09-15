import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, spacing } from './tokens';
import { Text } from './Text';
import { Button } from './Button';

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="cloud-offline-outline" size={iconSize.xl} color={colors.textMuted} />
      <Text variant="subtitle">Çevrimdışı</Text>
      <Text muted style={styles.copy}>
        Bağlantın zayıf veya yok. Temel ekranlar açık kalır; hesap işlemleri için internet gerekir.
      </Text>
      {onRetry ? <Button label="Yenile" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
  },
  copy: {
    textAlign: 'center',
  },
});

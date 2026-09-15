import { StyleSheet, View } from 'react-native';
import { spacing } from './tokens';
import { ClubCrest } from './ClubCrest';
import { Text } from './Text';

export function ClubIdentity({
  kicker = '1965',
  title = 'Eskişehirspor',
  subtitle = 'Kırmızı Şimşekler',
  compact = false,
}: {
  kicker?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <ClubCrest size={compact ? 'sm' : 'md'} />
      <View style={styles.copy}>
        <Text variant="overline" tone="accent">
          {kicker}
        </Text>
        <Text variant={compact ? 'title' : 'masthead'} numberOfLines={2}>
          {title}
        </Text>
        <Text variant="overline">{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  compact: {
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});

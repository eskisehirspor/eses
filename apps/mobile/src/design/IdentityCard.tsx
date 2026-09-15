import { StyleSheet, View } from 'react-native';
import { layout, spacing } from './tokens';
import { useColors } from './theme-context';
import { ClubCrest } from './ClubCrest';
import { Text } from './Text';

export function IdentityCard({
  supporterName,
  detail,
}: {
  supporterName?: string;
  detail?: string;
}) {
  const colors = useColors();
  const titled = Boolean(supporterName);
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityLabel={titled ? `${supporterName} taraftar kimliği` : 'Taraftar kartı yakında'}
    >
      <View style={[styles.stripe, { backgroundColor: colors.red }]} />
      <ClubCrest size="lg" />
      <View style={styles.copy}>
        <Text variant="caption" tone="accent">
          Eskişehirspor
        </Text>
        <Text variant="title">{supporterName ?? 'Taraftar kartı'}</Text>
        <Text variant="caption" muted>
          {detail ?? 'Metal kimlik sonraki fazda bu kartın yerini alır.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: layout.stripe,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});

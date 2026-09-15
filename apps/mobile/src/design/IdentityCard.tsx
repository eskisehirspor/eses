import { StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from './tokens';
import { ClubCrest } from './ClubCrest';
import { Text } from './Text';

export function IdentityCard() {
  return (
    <View style={styles.card} accessibilityLabel="Taraftar kartı yakında">
      <View style={styles.stripe} />
      <ClubCrest size="md" />
      <View style={styles.copy}>
        <Text variant="overline" tone="accent">
          ES ES
        </Text>
        <Text variant="title">Taraftar kartı</Text>
        <Text variant="caption" muted>
          Metal kimlik sonraki fazda bu kartın yerini alır.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    padding: spacing.lg,
    backgroundColor: colors.charcoal,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
    backgroundColor: colors.red,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});

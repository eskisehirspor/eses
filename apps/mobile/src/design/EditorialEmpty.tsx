import { StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from './tokens';
import { Text } from './Text';

/** Quiet empty geometry — no icon cluster, no fake media. */
export function EditorialEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.cap} />
      <Text>{title}</Text>
      <Text variant="caption" muted>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingRight: spacing.md,
  },
  cap: {
    width: 28,
    height: layout.stripe,
    backgroundColor: colors.red,
    marginBottom: spacing.xs,
  },
});

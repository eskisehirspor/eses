import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from './tokens';
import { Text } from './Text';

export function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
  quiet = false,
}: {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  quiet?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rule, quiet && styles.ruleQuiet]} />
      <View style={styles.copy}>
        {eyebrow ? (
          <Text variant="overline" tone="accent">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant={quiet ? 'caption' : 'subtitle'}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={styles.action}
        >
          <Text variant="caption" tone="accent">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rule: {
    width: layout.stripe,
    backgroundColor: colors.red,
  },
  ruleQuiet: {
    backgroundColor: colors.border,
  },
  copy: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
  },
});

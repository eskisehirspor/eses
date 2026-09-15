import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { iconSize, spacing } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';
import { Button } from './Button';
import type { IoniconName } from './icons';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  icon = 'ellipse-outline',
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  icon?: IoniconName;
}) {
  const colors = useColors();
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Ionicons name={icon} size={compact ? iconSize.lg : iconSize.xl} color={colors.red} />
      <Text variant={compact ? 'caption' : 'subtitle'} style={styles.title}>
        {title}
      </Text>
      <Text muted style={styles.copy}>
        {description}
      </Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  compact: {
    flex: 0,
    paddingVertical: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
});

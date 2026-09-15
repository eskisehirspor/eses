import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, spacing } from './tokens';
import { Text } from './Text';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="flag-outline" size={iconSize.xl} color={colors.red} />
      <Text variant="subtitle" style={styles.title}>
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
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
});

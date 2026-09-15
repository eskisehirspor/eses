import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, spacing } from './tokens';
import { Text } from './Text';
import type { IoniconName } from './icons';

export function InlineEmpty({
  icon,
  title,
  description,
}: {
  icon: IoniconName;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={iconSize.md} color={colors.textMuted} />
      <View style={styles.copy}>
        <Text variant="caption">{title}</Text>
        <Text variant="caption" muted>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

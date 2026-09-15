import { Pressable, StyleSheet } from 'react-native';
import { colors, spacing, touchTarget } from './tokens';
import { Text } from './Text';

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text variant="overline" style={selected ? styles.on : styles.off}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget - 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
  selected: {
    borderBottomColor: colors.red,
  },
  on: {
    color: colors.text,
  },
  off: {
    color: colors.textMuted,
  },
});

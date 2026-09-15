import { Pressable, StyleSheet } from 'react-native';
import { colors, radii, spacing, touchTarget } from './tokens';
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
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text variant="caption">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: colors.red,
    backgroundColor: colors.surfaceRaised,
  },
});

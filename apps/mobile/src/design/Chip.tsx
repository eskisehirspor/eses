import { Pressable, StyleSheet } from 'react-native';
import { spacing, touchTarget } from './tokens';
import { useColors } from './theme-context';
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
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { borderBottomColor: colors.red }]}
    >
      <Text variant="caption" style={{ color: selected ? colors.text : colors.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
});

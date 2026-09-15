import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, touchTarget, typography } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.bar, { borderBottomColor: colors.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.tab, selected && { borderBottomColor: colors.red }]}
          >
            <Text
              variant="caption"
              style={{
                color: selected ? colors.text : colors.textMuted,
                fontWeight: selected ? typography.weight.bold : typography.weight.medium,
                fontSize: typography.size.sm,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
});

import { View, StyleSheet, type ViewProps } from 'react-native';
import { radii, spacing } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'live' } & ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
        },
        tone === 'live' && { backgroundColor: colors.red, borderColor: colors.red },
      ]}
    >
      <Text variant="caption" style={tone === 'live' ? { color: colors.white } : undefined}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xs,
  },
});

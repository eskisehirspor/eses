import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radii, spacing } from './tokens';
import { Text } from './Text';

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'live' } & ViewProps) {
  return (
    <View style={[styles.badge, tone === 'live' && styles.live]}>
      <Text variant="overline" style={tone === 'live' ? styles.liveLabel : undefined}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xs,
  },
  live: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  liveLabel: {
    color: colors.white,
  },
});

import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radii, spacing } from './tokens';
import { Text } from './Text';

export function Badge({ label }: { label: string } & ViewProps) {
  return (
    <View style={styles.badge}>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.redMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
});

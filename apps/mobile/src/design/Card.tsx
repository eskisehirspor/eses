import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, elevation, radii, spacing } from './tokens';

export function Card({
  style,
  flat = false,
  padded = true,
  ...rest
}: ViewProps & { flat?: boolean; padded?: boolean }) {
  return <View style={[styles.card, flat && styles.flat, !padded && styles.unpadded, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.none,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.sm,
    ...elevation.none,
  },
  flat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...elevation.none,
  },
  unpadded: {
    padding: 0,
    gap: 0,
  },
});

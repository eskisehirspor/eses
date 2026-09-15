import { View, StyleSheet, type ViewProps } from 'react-native';
import { elevation, radii, spacing } from './tokens';
import { useColors } from './theme-context';

export function Card({
  style,
  flat = false,
  padded = true,
  ...rest
}: ViewProps & { flat?: boolean; padded?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.none,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle,
          padding: spacing.md,
          gap: spacing.sm,
          ...elevation.none,
        },
        flat && { backgroundColor: 'transparent', borderWidth: 0, ...elevation.none },
        !padded && { padding: 0, gap: 0 },
        style,
      ]}
      {...rest}
    />
  );
}

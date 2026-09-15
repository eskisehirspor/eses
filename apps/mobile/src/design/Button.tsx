import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { radii, spacing, touchTarget, typography } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        variant === 'primary' && { backgroundColor: colors.red },
        variant === 'secondary' && { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        variant === 'danger' && {
          backgroundColor: colors.surfaceRaised,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.danger,
        },
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.red} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: colors.text },
            variant === 'primary' && { color: colors.white },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.semibold,
    fontFamily: typography.family.ui,
  },
});

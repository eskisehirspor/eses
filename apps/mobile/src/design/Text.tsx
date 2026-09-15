import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import { typography } from './tokens';
import { useColors } from './theme-context';

type Variant = 'masthead' | 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'overline' | 'score';

const variantStyle: Record<Variant, TextStyle> = {
  masthead: {
    fontFamily: typography.family.display,
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.masthead,
  },
  display: {
    fontFamily: typography.family.display,
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: typography.weight.bold,
  },
  title: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  body: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.weight.regular,
  },
  caption: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  overline: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.overline,
    lineHeight: typography.lineHeight.overline,
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.overline,
  },
  score: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.score,
    lineHeight: typography.lineHeight.score,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.4,
  },
};

export type AppTextProps = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
  tone?: 'default' | 'danger' | 'accent';
};

export function Text({
  variant = 'body',
  muted,
  tone = 'default',
  style,
  children,
  ...rest
}: AppTextProps) {
  const colors = useColors();
  const color =
    tone === 'danger'
      ? colors.danger
      : tone === 'accent'
        ? colors.red
        : muted
          ? colors.textMuted
          : colors.text;

  return (
    <RNText style={[styles.base, variantStyle[variant], { color }, style]} {...rest}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {},
});

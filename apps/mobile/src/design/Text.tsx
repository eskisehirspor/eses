import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { colors, typography } from './tokens';

type Variant = 'masthead' | 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'overline' | 'score';

const variantStyle: Record<
  Variant,
  {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing?: number;
  }
> = {
  masthead: {
    fontFamily: typography.family.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 1.6,
  },
  display: {
    fontFamily: typography.family.display,
    fontSize: typography.size.xl,
    lineHeight: typography.lineHeight.xl,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: typography.family.displaySemi,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontFamily: typography.family.displayMedium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    letterSpacing: 0.3,
  },
  body: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
  },
  caption: {
    fontFamily: typography.family.ui,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  overline: {
    fontFamily: typography.family.uiSemi,
    fontSize: typography.size.overline,
    lineHeight: typography.lineHeight.overline,
    letterSpacing: typography.tracking.overline,
  },
  score: {
    fontFamily: typography.family.display,
    fontSize: typography.size.score,
    lineHeight: typography.lineHeight.score,
    letterSpacing: 1,
  },
};

const upperVariants = new Set<Variant>(['masthead', 'display', 'overline']);

function localizeUpper(children: RNTextProps['children']): RNTextProps['children'] {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children).toLocaleUpperCase('tr-TR');
  }
  return children;
}

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
  return (
    <RNText
      style={[
        styles.base,
        variantStyle[variant],
        muted && styles.muted,
        tone === 'danger' && styles.danger,
        tone === 'accent' && styles.accent,
        style,
      ]}
      {...rest}
    >
      {upperVariants.has(variant) ? localizeUpper(children) : children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
  danger: {
    color: colors.danger,
  },
  accent: {
    color: colors.red,
  },
});

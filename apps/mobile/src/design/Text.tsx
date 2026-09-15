import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { colors, typography } from './tokens';

type Variant = 'display' | 'title' | 'body' | 'subtitle' | 'caption';

const variantStyle: Record<Variant, { fontSize: number; lineHeight: number; fontWeight: '400' | '600' | '700' }> =
  {
    display: { fontSize: typography.size.display, lineHeight: typography.lineHeight.display, fontWeight: '700' },
    title: { fontSize: typography.size.xl, lineHeight: typography.lineHeight.xl, fontWeight: '700' },
    body: { fontSize: typography.size.md, lineHeight: typography.lineHeight.md, fontWeight: '400' },
    subtitle: { fontSize: typography.size.lg, lineHeight: typography.lineHeight.lg, fontWeight: '600' },
    caption: { fontSize: typography.size.sm, lineHeight: typography.lineHeight.sm, fontWeight: '400' },
  };

export type AppTextProps = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
  tone?: 'default' | 'danger';
};

export function Text({ variant = 'body', muted, tone = 'default', style, ...rest }: AppTextProps) {
  return (
    <RNText
      style={[
        styles.base,
        variantStyle[variant],
        muted && styles.muted,
        tone === 'danger' && styles.danger,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    fontFamily: typography.family.regular,
  },
  muted: {
    color: colors.textMuted,
  },
  danger: {
    color: colors.danger,
  },
});

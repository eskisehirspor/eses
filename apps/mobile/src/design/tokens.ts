import { fontFamily } from '@/lib/fonts';
import { darkColors } from './theme-palettes';

/** Default (dark) semantic colors — prefer useColors() for live theme. */
export const colors = darkColors;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  full: 999,
} as const;

export const borders = {
  width: 1,
  color: colors.border,
} as const;

export const typography = {
  family: fontFamily,
  size: {
    overline: 13,
    xs: 13,
    sm: 14,
    md: 17,
    lg: 21,
    xl: 28,
    display: 32,
    score: 48,
    dateDay: 24,
    tab: 12,
  },
  lineHeight: {
    overline: 18,
    xs: 18,
    sm: 20,
    md: 24,
    lg: 26,
    xl: 34,
    display: 38,
    score: 52,
    dateDay: 28,
    tab: 16,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  tracking: {
    overline: 0.6,
    masthead: 0.2,
  },
} as const;

export const elevation = {
  none: {
    boxShadow: 'none',
    elevation: 0,
  },
  card: {
    boxShadow: '0px 16px 40px rgba(0, 0, 0, 0.45)',
    elevation: 4,
  },
} as const;

export const iconSize = {
  sm: 18,
  md: 22,
  lg: 24,
  xl: 32,
} as const;

export const crestSize = {
  standings: 32,
  row: 36,
  rowClub: 40,
  featured: 80,
} as const;

export const touchTarget = 44;

export const layout = {
  gutter: 20,
  maxReadable: 720,
  tabBarHeight: 56,
  stripe: 2,
  mediaHero: 240,
  mediaStory: 168,
  mediaThumb: { width: 108, height: 80 },
  dateStamp: 56,
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export const tokens = {
  colors,
  spacing,
  radii,
  borders,
  typography,
  elevation,
  iconSize,
  crestSize,
  touchTarget,
  layout,
  motion,
} as const;

export type ColorToken = keyof typeof colors;

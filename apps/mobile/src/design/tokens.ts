import { fontFamily } from '@/lib/fonts';

export const colors = {
  red: '#C8102E',
  redMuted: '#8A0F22',
  redSoft: 'rgba(200, 16, 46, 0.12)',
  gold: '#FFED00',
  black: '#030304',
  charcoal: '#0C0C0E',
  white: '#F6F3F0',
  background: '#030304',
  surface: '#0C0C0E',
  surfaceRaised: '#141418',
  text: '#F6F3F0',
  textSecondary: '#C5BEB6',
  textMuted: '#7F7972',
  border: '#242428',
  borderSubtle: '#16161A',
  overlay: 'rgba(0, 0, 0, 0.55)',
  danger: '#E24B4A',
  success: '#3BB273',
  warning: '#D4A017',
} as const;

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
    overline: 10,
    xs: 12,
    sm: 13,
    md: 16,
    lg: 18,
    xl: 28,
    display: 40,
    score: 44,
  },
  lineHeight: {
    overline: 14,
    xs: 16,
    sm: 18,
    md: 24,
    lg: 24,
    xl: 32,
    display: 44,
    score: 48,
  },
  tracking: {
    overline: 2.2,
    masthead: 3,
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
  sm: 16,
  md: 18,
  lg: 22,
  xl: 28,
} as const;

export const touchTarget = 44;

export const layout = {
  gutter: 20,
  maxReadable: 720,
  tabBarHeight: 52,
  stripe: 2,
  mediaHero: 220,
  mediaStory: 168,
  mediaThumb: { width: 108, height: 80 },
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
  touchTarget,
  layout,
  motion,
} as const;

export type ColorToken = keyof typeof colors;

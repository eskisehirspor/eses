export const colors = {
  red: '#D0121F',
  redMuted: '#8F1018',
  black: '#0B0B0C',
  white: '#F7F4F2',
  background: '#0B0B0C',
  surface: '#161618',
  surfaceRaised: '#1E1E21',
  text: '#F7F4F2',
  textMuted: '#A8A29E',
  border: '#2C2C31',
  overlay: 'rgba(0, 0, 0, 0.64)',
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
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const borders = {
  width: 1,
  color: colors.border,
} as const;

export const typography = {
  family: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    display: 34,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 34,
    display: 40,
  },
} as const;

export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const touchTarget = 44;

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
  motion,
} as const;

export type ColorToken = keyof typeof colors;

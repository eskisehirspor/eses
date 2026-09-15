import { Platform } from 'react-native';

export function useClubFonts(): [boolean, Error | null] {
  return [true, null];
}

const systemFont = Platform.select({
  ios: undefined,
  android: 'sans-serif',
  web: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  default: undefined,
});

export const fontFamily = {
  display: systemFont,
  displayMedium: systemFont,
  displaySemi: systemFont,
  ui: systemFont,
  uiMedium: systemFont,
  uiSemi: systemFont,
} as const;

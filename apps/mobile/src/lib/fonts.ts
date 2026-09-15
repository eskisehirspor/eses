import { useFonts } from 'expo-font';
import {
  Oswald_500Medium,
  Oswald_600SemiBold,
  Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
} from '@expo-google-fonts/barlow';

export function useClubFonts() {
  return useFonts({
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
  });
}

export const fontFamily = {
  display: 'Oswald_700Bold',
  displayMedium: 'Oswald_500Medium',
  displaySemi: 'Oswald_600SemiBold',
  ui: 'Barlow_400Regular',
  uiMedium: 'Barlow_500Medium',
  uiSemi: 'Barlow_600SemiBold',
} as const;

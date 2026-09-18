import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/design';
import { iconSize, spacing } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import type { FixtureRecord } from './api';

export type MatchWeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

export type MatchWeatherForecast = {
  temperatureC: number;
  condition: MatchWeatherCondition;
};

const WEATHER_ICONS: Record<MatchWeatherCondition, keyof typeof Ionicons.glyphMap> = {
  sunny: 'sunny-outline',
  cloudy: 'cloud-outline',
  rainy: 'rainy-outline',
  stormy: 'thunderstorm-outline',
};

/** Home matches use Eskişehir; away matches use the venue city when known. */
export function weatherLocationLabel(fixture: FixtureRecord): string {
  if (fixture.home_team.is_eskisehirspor) {
    return 'Eskişehir';
  }
  return fixture.venue?.city ?? fixture.home_team.name;
}

/**
 * Compact weather value for the "Tahmini Hava Durumu" row inside Maç bilgisi
 * — icon + temperature, right-aligned like every other value in that card.
 * No forecast source is wired up yet, so this always renders the placeholder
 * today; passing `forecast` later activates the real branch with no redesign.
 */
export function WeatherValue({ forecast = null }: { forecast?: MatchWeatherForecast | null }) {
  const colors = useColors();
  if (!forecast) {
    return (
      <Text variant="caption" muted>
        Yakında
      </Text>
    );
  }
  return (
    <View style={styles.row}>
      <Ionicons name={WEATHER_ICONS[forecast.condition]} size={iconSize.sm} color={colors.text} />
      <Text numberOfLines={1}>{Math.round(forecast.temperatureC)}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});

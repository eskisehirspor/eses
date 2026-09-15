import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { CatalogAwayTrip } from '@eskisehirspor/shared';
import { BottomSheet, Button, PressableScale, Text } from '@/design';
import { iconSize, spacing, touchTarget } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import { logger } from '@/lib/logger';
import type { FixtureRecord } from './api';

export { fixtureAwayTrip } from './away-trip';

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function AwayTripChip({
  fixture,
  trip,
}: {
  fixture: FixtureRecord;
  trip: CatalogAwayTrip;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const kmLabel = trip.approxRoadKm != null ? `Deplasman · ~${trip.approxRoadKm} km` : 'Deplasman';
  const stadium = fixture.venue?.name ?? trip.stadiumName;
  const city = fixture.venue?.city ?? trip.city;
  const query = stadium ? `${stadium} ${city}` : trip.mapsQuery;
  const canOpenMaps = Boolean(stadium || trip.mapsQuery);

  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={kmLabel}
        style={styles.chip}
      >
        <View style={styles.chipRow}>
          <Ionicons name="bus-outline" size={iconSize.sm} color={colors.red} />
          <Text style={{ color: colors.text }}>{kmLabel}</Text>
        </View>
        {stadium ? (
          <Text variant="caption" muted numberOfLines={1} style={styles.stadium}>
            {stadium}
          </Text>
        ) : null}
      </PressableScale>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.sheetBody}>
          <Text variant="caption" tone="accent">
            Deplasman
          </Text>
          <Text variant="subtitle">{fixture.home_team.name}</Text>
          <Text>{stadium ?? 'Stadyum kaydı yok'}</Text>
          <Text variant="caption" muted>
            Eskişehir → {city}
          </Text>
          {trip.approxRoadKm != null ? (
            <Text variant="title">Yaklaşık {trip.approxRoadKm} km</Text>
          ) : (
            <Text muted>Karayolu mesafesi doğrulanıyor.</Text>
          )}
          <View style={styles.block}>
            <Text variant="caption" muted>
              Müsabaka
            </Text>
            <Text>
              {fixture.home_team.name} — {fixture.away_team.name}
            </Text>
          </View>
          {canOpenMaps ? (
            <Button
              label="Haritada Aç"
              variant="secondary"
              onPress={() => {
                void Linking.openURL(mapsUrl(query)).catch((error: unknown) => {
                  logger.error('Harita açılamadı', {
                    code: 'away.maps',
                    cause: error instanceof Error ? error.message : 'unknown',
                  });
                });
              }}
            />
          ) : null}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: touchTarget,
    paddingLeft: 68,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stadium: {
    paddingLeft: iconSize.sm + spacing.xs,
  },
  sheetBody: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  block: {
    gap: 4,
  },
});

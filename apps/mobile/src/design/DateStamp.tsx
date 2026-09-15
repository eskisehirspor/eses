import { StyleSheet, View } from 'react-native';
import { layout, spacing, typography } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';

export function DateStamp({ iso }: { iso?: string | null }) {
  const colors = useColors();
  if (!iso) {
    return (
      <View style={[styles.stamp, { borderRightColor: colors.border }]} accessibilityLabel="Tarih yok">
        <Text style={styles.day} muted>
          —
        </Text>
        <Text variant="caption" muted>
          —
        </Text>
      </View>
    );
  }

  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', timeZone: 'Europe/Istanbul' }).format(date);
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'short', timeZone: 'Europe/Istanbul' })
    .format(date)
    .replace('.', '')
    .toLocaleUpperCase('tr-TR');
  const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'short', timeZone: 'Europe/Istanbul' })
    .format(date)
    .replace('.', '')
    .toLocaleUpperCase('tr-TR');

  return (
    <View style={[styles.stamp, { borderRightColor: colors.border }]} accessibilityLabel={`${day} ${month} ${weekday}`}>
      <Text style={[styles.day, { color: colors.text }]}>{day}</Text>
      <Text variant="caption" tone="accent" style={styles.month}>
        {month}
      </Text>
      <Text variant="caption" muted>
        {weekday}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    width: layout.dateStamp,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 1,
    paddingRight: spacing.sm,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  day: {
    fontSize: typography.size.dateDay,
    lineHeight: typography.lineHeight.dateDay,
    fontWeight: typography.weight.bold,
    fontFamily: typography.family.ui,
  },
  month: {
    fontWeight: typography.weight.semibold,
  },
});

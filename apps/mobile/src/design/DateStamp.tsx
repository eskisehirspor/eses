import { StyleSheet, View } from 'react-native';
import { colors, spacing } from './tokens';
import { Text } from './Text';

export function DateStamp({ iso }: { iso?: string | null }) {
  if (!iso) {
    return (
      <View style={styles.stamp} accessibilityLabel="Tarih yok">
        <Text variant="overline" muted>
          —
        </Text>
        <Text variant="title" muted>
          —
        </Text>
      </View>
    );
  }

  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(date);
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(date).replace('.', '').toUpperCase();
  const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date).replace('.', '').toUpperCase();

  return (
    <View style={styles.stamp} accessibilityLabel={`${weekday} ${day} ${month}`}>
      <Text variant="overline" muted>
        {weekday}
      </Text>
      <Text variant="title">{day}</Text>
      <Text variant="overline" tone="accent">
        {month}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    width: 52,
    alignItems: 'flex-start',
    gap: 2,
    paddingRight: spacing.sm,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
});

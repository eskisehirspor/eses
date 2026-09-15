import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, spacing } from './tokens';
import { Text } from './Text';
import { ClubCrest } from './ClubCrest';
import type { IoniconName } from './icons';

export function ComingSoon({
  kicker,
  title,
  description,
  items,
}: {
  kicker: string;
  title: string;
  description: string;
  items: readonly { icon: IoniconName; label: string; detail: string }[];
}) {
  return (
    <View style={styles.wrap}>
      <ClubCrest size="lg" />
      <Text variant="overline" tone="accent">
        {kicker}
      </Text>
      <Text variant="title" style={styles.title}>
        {title}
      </Text>
      <Text muted style={styles.copy}>
        {description}
      </Text>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={iconSize.md} color={colors.red} />
            </View>
            <View style={styles.rowCopy}>
              <Text>{item.label}</Text>
              <Text variant="caption" muted>
                {item.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  title: {
    maxWidth: 280,
  },
  copy: {
    maxWidth: 320,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.redSoft,
    borderRadius: 8,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
});

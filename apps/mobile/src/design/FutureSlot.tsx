import { StyleSheet, View } from 'react-native';
import { colors, spacing } from './tokens';
import { Text } from './Text';

export function FutureSlot({
  kicker,
  title,
  detail,
}: {
  kicker?: string;
  title: string;
  detail: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {kicker ? (
          <Text variant="caption" muted>
            {kicker}
          </Text>
        ) : null}
        <Text>{title}</Text>
        <Text variant="caption" muted>
          {detail}
        </Text>
      </View>
      <Text variant="caption" muted>
        Yakında
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});

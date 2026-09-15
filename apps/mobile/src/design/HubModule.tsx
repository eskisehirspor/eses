import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, spacing } from './tokens';
import { Text } from './Text';
import type { IoniconName } from './icons';

export function HubModule({
  index,
  title,
  detail,
  icon,
}: {
  index: string;
  title: string;
  detail: string;
  icon: IoniconName;
}) {
  return (
    <View style={styles.row} accessibilityRole="summary">
      <Text variant="display" muted style={styles.index}>
        {index}
      </Text>
      <View style={styles.copy}>
        <Text variant="title">{title}</Text>
        <Text variant="caption" muted>
          {detail}
        </Text>
      </View>
      <Ionicons name={icon} size={iconSize.lg} color={colors.red} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 88,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  index: {
    width: 56,
    fontSize: 28,
    lineHeight: 32,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
});

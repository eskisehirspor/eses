import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { iconSize, spacing } from './tokens';
import { useColors } from './theme-context';
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
  const colors = useColors();
  return (
    <View
      style={[styles.row, { borderBottomColor: colors.borderSubtle }]}
      accessibilityRole="summary"
    >
      <Text variant="display" muted style={styles.index}>
        {index}
      </Text>
      <View style={styles.copy}>
        <Text variant="subtitle">{title}</Text>
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

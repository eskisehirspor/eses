import { StyleSheet } from 'react-native';
import { colors, spacing } from './tokens';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

export function CompactNewsItem({
  title,
  publishedAt,
  onPress,
}: {
  title: string;
  publishedAt?: string | null;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={styles.row}>
      <Text numberOfLines={2}>{title}</Text>
      {publishedAt ? (
        <Text variant="caption" muted>
          {publishedAt}
        </Text>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    paddingVertical: spacing.md,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
});

import { StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from './tokens';
import { Text } from './Text';
import { EditorialImage } from './EditorialImage';
import { PressableScale } from './PressableScale';

export function StoryRow({
  title,
  category,
  publishedAt,
  imageUrl,
  onPress,
}: {
  title: string;
  category?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={styles.row}>
      <View style={styles.thumb}>
        <EditorialImage uri={imageUrl} height={layout.mediaThumb.height} />
      </View>
      <View style={styles.copy}>
        {category ? (
          <Text variant="overline" muted>
            {category}
          </Text>
        ) : null}
        <Text variant="subtitle" numberOfLines={3}>
          {title}
        </Text>
        {publishedAt ? (
          <Text variant="caption" muted>
            {publishedAt}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    alignItems: 'flex-start',
  },
  thumb: {
    width: layout.mediaThumb.width,
    overflow: 'hidden',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 2,
  },
});

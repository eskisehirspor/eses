import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from './tokens';
import { Text } from './Text';
import { EditorialImage } from './EditorialImage';
import { PressableScale } from './PressableScale';

export function FeaturedStory({
  title,
  excerpt,
  category,
  publishedAt,
  imageUrl,
  onPress,
  emptyTitle,
  emptyDescription,
}: {
  title?: string;
  excerpt?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  onPress?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const empty = !title;
  const headline = empty ? (emptyTitle ?? 'Öne çıkan haber') : title;

  const body = (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        {imageUrl && !empty ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.media}
            contentFit="cover"
            accessibilityLabel={headline}
            transition={220}
          />
        ) : (
          <View style={styles.media}>
            <EditorialImage uri={null} height={layout.mediaHero} />
          </View>
        )}
        {imageUrl && !empty ? (
          <LinearGradient colors={['transparent', 'rgba(3,3,4,0.94)']} style={styles.overlay} />
        ) : null}
        <View style={styles.onImage}>
          <Text variant="overline" tone="accent">
            {category ?? 'Kulüp'}
          </Text>
          <Text variant="title">{headline}</Text>
          {publishedAt ? (
            <Text variant="caption" muted>
              {publishedAt}
            </Text>
          ) : null}
        </View>
      </View>
      {excerpt || emptyDescription ? (
        <Text muted numberOfLines={3} style={styles.excerpt}>
          {excerpt ?? emptyDescription}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress || empty) {
    return body;
  }

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: -layout.gutter,
  },
  hero: {
    height: layout.mediaHero,
    backgroundColor: colors.charcoal,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  media: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.charcoal,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  onImage: {
    gap: spacing.xs,
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.lg,
  },
  excerpt: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
});

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors, layout, spacing } from './tokens';
import { Text } from './Text';

export function EditorialImage({
  uri,
  height = layout.mediaHero,
  label,
  accessibilityLabel,
  overlay,
}: {
  uri?: string | null;
  height?: number;
  label?: string;
  accessibilityLabel?: string;
  overlay?: boolean;
}) {
  return (
    <View style={[styles.frame, { height }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.media}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel ?? label}
          transition={220}
        />
      ) : (
        <View style={styles.empty} />
      )}
      {overlay ? (
        <LinearGradient colors={['transparent', 'rgba(3,3,4,0.92)']} style={styles.overlay} />
      ) : null}
      {!uri ? <View style={styles.cap} /> : null}
      {!uri && label ? (
        <View style={styles.emptyLabel}>
          <Text variant="caption" muted>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    backgroundColor: colors.charcoal,
    overflow: 'hidden',
  },
  media: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.charcoal,
  },
  empty: {
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
  cap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: layout.stripe,
    backgroundColor: colors.red,
  },
  emptyLabel: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
  },
});

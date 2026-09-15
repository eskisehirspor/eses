import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { clubCrest } from '@/brand/assets';

const sizes = {
  xs: 28,
  sm: 36,
  md: 52,
  lg: 72,
  xl: 96,
} as const;

export function ClubCrest({
  size = 'md',
  accessibilityLabel = 'Eskişehirspor arması',
}: {
  size?: keyof typeof sizes;
  accessibilityLabel?: string;
}) {
  const dimension = sizes[size];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: dimension, height: dimension, backgroundColor: 'transparent' }}
    >
      <Image
        source={clubCrest}
        style={styles.image}
        contentFit="contain"
        transition={0}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

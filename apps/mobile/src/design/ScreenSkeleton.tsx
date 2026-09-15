import { View, StyleSheet } from 'react-native';
import { spacing } from './tokens';
import { Skeleton } from './Skeleton';

export function ScreenSkeleton() {
  return (
    <View style={styles.wrap}>
      <Skeleton height={12} width="18%" />
      <Skeleton height={40} width="78%" />
      <Skeleton height={12} width="42%" />
      <Skeleton height={220} />
      <Skeleton height={18} width="36%" />
      <Skeleton height={88} />
      <Skeleton height={72} />
      <Skeleton height={72} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});

import { View, StyleSheet } from 'react-native';
import { spacing } from './tokens';
import { Skeleton } from './Skeleton';

export function ScreenSkeleton() {
  return (
    <View style={styles.wrap}>
      <Skeleton height={28} width="60%" />
      <Skeleton height={16} width="90%" />
      <Skeleton height={16} width="80%" />
      <Skeleton height={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    padding: spacing.lg,
  },
});

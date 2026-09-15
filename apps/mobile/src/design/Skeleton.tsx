import { View, StyleSheet } from 'react-native';
import { radii } from './tokens';
import { useColors } from './theme-context';

export function Skeleton({ width = '100%', height = 16 }: { width?: number | `${number}%`; height?: number }) {
  const colors = useColors();
  return <View style={[styles.block, { width, height, backgroundColor: colors.surfaceRaised }]} />;
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radii.sm,
  },
});

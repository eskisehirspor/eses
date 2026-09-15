import { View, StyleSheet } from 'react-native';
import { colors, radii } from './tokens';

export function Skeleton({ width = '100%', height = 16 }: { width?: number | `${number}%`; height?: number }) {
  return <View style={[styles.block, { width, height }]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
  },
});

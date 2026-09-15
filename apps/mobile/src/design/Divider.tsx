import { View, StyleSheet } from 'react-native';
import { spacing } from './tokens';
import { useColors } from './theme-context';

export function Divider() {
  const colors = useColors();
  return <View style={[styles.line, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
});

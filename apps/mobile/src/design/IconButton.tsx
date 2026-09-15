import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, radii, touchTarget } from './tokens';

export function IconButton({
  icon,
  accessibilityLabel,
  ...rest
}: PressableProps & { icon: keyof typeof Ionicons.glyphMap; accessibilityLabel: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
      {...rest}
    >
      <Ionicons name={icon} size={iconSize.lg} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

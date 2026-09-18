import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { iconSize, radii, touchTarget } from './tokens';
import { useColors } from './theme-context';

/** iOS-style back control for stack headers. Falls back to Home when the screen has no history (e.g. opened from another tab). */
export function BackButton() {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Geri"
      hitSlop={8}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <Ionicons name="chevron-back" size={iconSize.lg} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget,
    height: touchTarget,
    marginLeft: -8,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ClubCrest } from '@/design/ClubCrest';
import { darkColors } from '@/design/theme-palettes';

/**
 * Short branded opening after native splash hides.
 * Native splash stays near-black; this layer runs ~1.2s then yields to the app.
 */
export function BrandSplash({ onDone }: { onDone: () => void }) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(0.92), []);
  const line = useMemo(() => new Animated.Value(0), []);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(line, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(220),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    sequence.start(({ finished }) => {
      if (finished) {
        setVisible(false);
        onDone();
      }
    });
    return () => sequence.stop();
  }, [line, onDone, opacity, scale]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.mark, { opacity, transform: [{ scale }] }]}>
        <ClubCrest size="lg" />
        <Animated.View style={[styles.rule, { opacity: line }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: darkColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  mark: {
    alignItems: 'center',
    gap: 20,
  },
  rule: {
    width: 48,
    height: 2,
    backgroundColor: darkColors.red,
  },
});

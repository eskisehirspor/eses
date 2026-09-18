import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/design';
import { iconSize, radii, spacing, typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';

/** Polished red-accented week pill with balanced previous/next controls either side. */
export function WeekSelector({
  label,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrevious}
        disabled={!hasPrevious}
        accessibilityRole="button"
        accessibilityLabel="Önceki hafta"
        hitSlop={8}
        style={[styles.arrow, { backgroundColor: colors.surfaceRaised }]}
      >
        <Ionicons
          name="chevron-back"
          size={iconSize.md}
          color={hasPrevious ? colors.text : colors.textMuted}
        />
      </Pressable>
      <View style={[styles.pill, { backgroundColor: colors.redSoft, borderColor: colors.red }]}>
        <Text variant="caption" numberOfLines={1} style={[styles.label, { color: colors.red }]}>
          {label}
        </Text>
      </View>
      <Pressable
        onPress={onNext}
        disabled={!hasNext}
        accessibilityRole="button"
        accessibilityLabel="Sonraki hafta"
        hitSlop={8}
        style={[styles.arrow, { backgroundColor: colors.surfaceRaised }]}
      >
        <Ionicons
          name="chevron-forward"
          size={iconSize.md}
          color={hasNext ? colors.text : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minWidth: 140,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  label: {
    textAlign: 'center',
    fontWeight: typography.weight.bold,
    letterSpacing: 0.6,
  },
});

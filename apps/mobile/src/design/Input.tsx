import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { radii, spacing, touchTarget, typography } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';

export function Input({
  label,
  error,
  ...rest
}: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text variant="caption">{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
            fontFamily: typography.family.ui,
          },
        ]}
        autoCapitalize="none"
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  input: {
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.md,
  },
});

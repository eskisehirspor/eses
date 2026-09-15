import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radii, spacing, touchTarget, typography } from './tokens';
import { Text } from './Text';

export function Input({
  label,
  error,
  ...rest
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.wrap}>
      <Text variant="caption">{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
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
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.size.md,
    backgroundColor: colors.surface,
  },
});

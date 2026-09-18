import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@/design';
import { spacing } from '@/design/tokens';

/**
 * Disabled-but-ready ticket CTA. Flip `disabled` to false once ticketing exists —
 * the component (and its screen placement) does not need to change.
 */
export function TicketButton({ disabled = true }: { disabled?: boolean }) {
  return (
    <View style={styles.wrap}>
      <Button label="Bilet Al" disabled={disabled} />
      {disabled ? (
        <Text variant="caption" muted style={styles.hint}>
          Satış açıldığında burada aktif olacak
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
  },
  hint: {
    textAlign: 'center',
  },
});

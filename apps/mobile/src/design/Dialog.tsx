import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { radii, spacing } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';
import { Button } from './Button';

export function Dialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(event) => event.stopPropagation()}
        >
          <Text variant="subtitle">{title}</Text>
          <Text muted>{description}</Text>
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" onPress={onClose} />
            <Button label={confirmLabel} onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});

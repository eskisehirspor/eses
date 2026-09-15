import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from './tokens';
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
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
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});

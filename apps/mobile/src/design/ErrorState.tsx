import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { iconSize, spacing } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';
import { Button } from './Button';

export function ErrorState({
  title = 'Bir şeyler ters gitti',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Ionicons name="warning-outline" size={iconSize.xl} color={colors.danger} />
      <Text variant="subtitle" style={styles.title}>
        {title}
      </Text>
      <Text muted style={styles.copy}>
        {description}
      </Text>
      {onRetry ? <Button label="Tekrar dene" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
});

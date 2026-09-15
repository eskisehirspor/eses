import { View, StyleSheet } from 'react-native';
import { spacing } from './tokens';
import { Text } from './Text';
import { ClubCrest } from './ClubCrest';

export function PageHeader({
  title,
  subtitle,
  showCrest = false,
}: {
  title: string;
  subtitle?: string;
  showCrest?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {showCrest ? <ClubCrest size="sm" /> : null}
      <View style={styles.copy}>
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});

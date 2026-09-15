import { View, StyleSheet } from 'react-native';
import { colors } from './tokens';
import { Text } from './Text';

export function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      accessibilityLabel={`${name} avatar`}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.36, fontWeight: '700' }}>{initials || 'ES'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
});

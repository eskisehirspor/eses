import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors, typography } from './tokens';
import { Text } from './Text';
import { ClubCrest } from './ClubCrest';

type TeamMarkSize = 'xs' | 'sm' | 'md' | 'lg';

const sizes: Record<TeamMarkSize, number> = {
  xs: 28,
  sm: 40,
  md: 56,
  lg: 72,
};

export function TeamMark({
  name,
  shortName,
  isClub,
  crestUri,
  size = 'md',
}: {
  name: string;
  shortName: string;
  isClub?: boolean;
  crestUri?: string | null;
  size?: TeamMarkSize;
}) {
  if (isClub) {
    return <ClubCrest size={size} />;
  }
  const dimension = sizes[size];
  if (crestUri) {
    return (
      <Image
        source={{ uri: crestUri }}
        style={{ width: dimension, height: dimension }}
        contentFit="contain"
        accessibilityLabel={`${name} arması`}
      />
    );
  }
  const initials = shortName.slice(0, 3).toUpperCase();
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: dimension * 0.28 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  initials: {
    fontWeight: '700',
    fontFamily: typography.family.display,
    color: colors.textSecondary,
  },
});

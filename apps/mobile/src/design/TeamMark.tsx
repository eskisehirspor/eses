import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { crestSize, typography } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';
import { ClubCrest } from './ClubCrest';

type TeamMarkSize = 'xs' | 'sm' | 'md' | 'lg';

const sizes: Record<TeamMarkSize, number> = {
  xs: crestSize.standings,
  sm: crestSize.row,
  md: crestSize.rowClub,
  lg: crestSize.featured,
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
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  const dimension = sizes[size];

  if (isClub) {
    return (
      <View style={[styles.box, { width: dimension, height: dimension }]}>
        <ClubCrest size={size} />
      </View>
    );
  }

  if (crestUri && !failed) {
    return (
      <View style={[styles.box, { width: dimension, height: dimension }]}>
        <Image
          source={{ uri: crestUri }}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory"
          recyclingKey={crestUri}
          accessibilityLabel={`${name} arması`}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  const initials = shortName.slice(0, 3).toLocaleUpperCase('tr-TR');
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.box,
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.max(12, dimension * 0.28), color: colors.textSecondary }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  fallback: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  initials: {
    fontWeight: typography.weight.bold,
    fontFamily: typography.family.ui,
  },
});

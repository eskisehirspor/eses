import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/design/tokens';
import {
  THEME_UI_OPTIONS,
  normalizeThemePreference,
  type AppThemeMode,
} from '@eskisehirspor/shared';
import { Button, Input, SectionHeader, SegmentedControl, Text } from '@/design';
import { useTheme } from '@/design/theme-context';
import { toUserMessage } from '@/lib/errors';
import type { OwnProfile } from './api';

export function ProfileEditor({
  profile,
  saving,
  errorMessage,
  onSave,
}: {
  profile: OwnProfile;
  saving: boolean;
  errorMessage: string | null;
  onSave: (input: { display_name: string; theme_preference: AppThemeMode }) => void;
}) {
  const { setMode } = useTheme();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [theme, setTheme] = useState<AppThemeMode>(normalizeThemePreference(profile.theme_preference));

  return (
    <View style={styles.wrap}>
      <SectionHeader eyebrow="Kimlik" title="Tribündeki adın" />
      <Text muted>
        Bu ad taraftar kimliğinde görünür. Dil Türkçe kalır; arma yükleme sonraki adımda.
      </Text>
      <Input
        label="Görünen ad"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        autoComplete="username"
        maxLength={24}
        error={errorMessage ?? undefined}
      />
      <Text variant="caption" muted>
        Görünüm
      </Text>
      <SegmentedControl
        value={theme}
        options={THEME_UI_OPTIONS}
        onChange={(value) => {
          setTheme(value);
          setMode(value);
        }}
      />
      <Button
        label="Kimliği kaydet"
        loading={saving}
        onPress={() => onSave({ display_name: displayName, theme_preference: theme })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
});

export function profileSaveMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'Bu görünen ad kullanımda.') {
    return error.message;
  }
  if (error instanceof Error && error.message.includes('Görünen ad')) {
    return error.message;
  }
  if (error instanceof Error && error.message.includes('Profil bilgileri')) {
    return error.message;
  }
  return toUserMessage(error, 'Kimlik kaydedilemedi.');
}

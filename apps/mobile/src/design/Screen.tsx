import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import { colors, spacing } from './tokens';

export function Screen({
  children,
  scroll = false,
  keyboard = false,
  style,
}: ViewProps & { scroll?: boolean; keyboard?: boolean }) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, style]}>{children}</View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
  },
});

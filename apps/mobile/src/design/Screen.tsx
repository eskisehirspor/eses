import { SafeAreaView } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import { layout, spacing } from './tokens';
import { useColors } from './theme-context';

export function Screen({
  children,
  scroll = false,
  keyboard = false,
  style,
  refreshing = false,
  onRefresh,
}: ViewProps & {
  scroll?: boolean;
  keyboard?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const colors = useColors();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.red}
            colors={[colors.red]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, { backgroundColor: colors.background }, style]}>{children}</View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + layout.tabBarHeight,
    gap: spacing.xl,
  },
});

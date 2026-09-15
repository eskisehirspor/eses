import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { radii, spacing } from './tokens';
import { useColors } from './theme-context';
import { Text } from './Text';

type Toast = { id: number; message: string; tone: 'default' | 'danger' };

type ToastContextValue = {
  show: (message: string, tone?: Toast['tone']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastStack({ toasts }: { toasts: Toast[] }) {
  const colors = useColors();
  return (
    <View pointerEvents="none" style={styles.stack}>
      {toasts.map((toast) => (
        <View
          key={toast.id}
          style={[
            styles.toast,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: toast.tone === 'danger' ? colors.danger : colors.border,
            },
          ]}
        >
          <Text>{toast.message}</Text>
        </View>
      ))}
    </View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Toast['tone'] = 'default') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast ToastProvider dışında kullanılamaz.');
  }
  return ctx;
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xxl,
    gap: spacing.xs,
  },
  toast: {
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
  },
});

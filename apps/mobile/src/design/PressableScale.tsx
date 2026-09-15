import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

export function PressableScale({
  style,
  children,
  ...rest
}: PressableProps & { style?: ViewStyle | ViewStyle[] }) {
  return (
    <Pressable
      style={(state) => [
        state.pressed ? { opacity: 0.84 } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

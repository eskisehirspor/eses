import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memory = new Map<string, string>();

export const authStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return memory.get(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      memory.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      memory.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

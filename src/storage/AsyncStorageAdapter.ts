import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IStorageAdapter } from './IStorageAdapter';

export class AsyncStorageAdapter implements IStorageAdapter {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}

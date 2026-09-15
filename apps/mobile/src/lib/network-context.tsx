import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as Network from 'expo-network';
import { logger } from './logger';

type NetworkContextValue = {
  isOffline: boolean;
  refresh: () => Promise<void>;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

function isOfflineFromState(state: Network.NetworkState): boolean {
  return !(state.isConnected && state.isInternetReachable !== false);
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  const refresh = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(isOfflineFromState(state));
    } catch (error) {
      logger.error('Ağ durumu alınamadı', {
        code: 'network.state',
        cause: error instanceof Error ? error.message : 'unknown',
      });
    }
  };

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      setIsOffline(isOfflineFromState(state));
    });
    return () => subscription.remove();
  }, []);

  return (
    <NetworkContext.Provider value={{ isOffline, refresh }}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork NetworkProvider dışında kullanılamaz.');
  }
  return ctx;
}

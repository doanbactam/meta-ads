import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FacebookConnectionState {
  isConnected: boolean;
  adAccountId?: string;
  facebookAdAccountId?: string;
  tokenExpiry?: Date;
  showConnectionDialog: boolean;
  lastSyncTimestamp?: number;
  setConnected: (
    connected: boolean,
    adAccountId?: string,
    facebookAdAccountId?: string,
    tokenExpiry?: Date
  ) => void;
  setShowConnectionDialog: (show: boolean) => void;
  updateSyncTimestamp: () => void;
  isTokenExpired: () => boolean;
  reset: () => void;
}

export const useFacebookStore = create<FacebookConnectionState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      showConnectionDialog: false,
      lastSyncTimestamp: undefined,
      setConnected: (connected, adAccountId, facebookAdAccountId, tokenExpiry) =>
        set({
          isConnected: connected,
          adAccountId,
          facebookAdAccountId,
          tokenExpiry,
          lastSyncTimestamp: Date.now(),
        }),
      setShowConnectionDialog: (show) => set({ showConnectionDialog: show }),
      updateSyncTimestamp: () => set({ lastSyncTimestamp: Date.now() }),
      isTokenExpired: () => {
        const state = get();
        if (!state.tokenExpiry) return false;
        return new Date(state.tokenExpiry) < new Date();
      },
      reset: () =>
        set({
          isConnected: false,
          adAccountId: undefined,
          facebookAdAccountId: undefined,
          tokenExpiry: undefined,
          lastSyncTimestamp: undefined,
        }),
    }),
    {
      name: 'facebook-connection-storage',
    }
  )
);

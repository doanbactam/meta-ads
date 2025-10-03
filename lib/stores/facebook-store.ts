import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FacebookConnectionState {
  isConnected: boolean;
  adAccountId?: string;
  facebookAdAccountId?: string;
  tokenExpiry?: Date;
  showConnectionDialog: boolean;
  setConnected: (connected: boolean, adAccountId?: string, facebookAdAccountId?: string, tokenExpiry?: Date) => void;
  setShowConnectionDialog: (show: boolean) => void;
  reset: () => void;
}

export const useFacebookStore = create<FacebookConnectionState>()(
  persist(
    (set) => ({
      isConnected: false,
      showConnectionDialog: false,
      setConnected: (connected, adAccountId, facebookAdAccountId, tokenExpiry) =>
        set({ isConnected: connected, adAccountId, facebookAdAccountId, tokenExpiry }),
      setShowConnectionDialog: (show) => set({ showConnectionDialog: show }),
      reset: () => set({ isConnected: false, adAccountId: undefined, facebookAdAccountId: undefined, tokenExpiry: undefined }),
    }),
    {
      name: 'facebook-connection-storage',
    }
  )
);

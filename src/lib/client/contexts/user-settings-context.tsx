'use client';

import { createContext, useContext } from 'react';
import { detectUserLocale, detectUserTimezone } from '@/lib/client/utils/locale-detection';

interface UserSettings {
  locale: string;
  timezone: string;
}

interface UserSettingsContextType {
  settings: UserSettings;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  // Auto-detect user preferences from browser/system
  const settings: UserSettings = {
    locale: detectUserLocale(),
    timezone: detectUserTimezone(),
  };

  return (
    <UserSettingsContext.Provider value={{ settings }}>{children}</UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}

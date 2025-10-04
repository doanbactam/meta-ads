'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserSettings {
  preferredCurrency: string;
  preferredLocale: string;
  preferredTimezone: string;
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async (): Promise<UserSettings> => {
      const response = await fetch('/api/user/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }
      return response.json();
    },
    enabled: isSignedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    await updateSettingsMutation.mutateAsync(newSettings);
  };

  const defaultSettings: UserSettings = {
    preferredCurrency: 'USD',
    preferredLocale: 'en-US',
    preferredTimezone: 'UTC',
  };

  return (
    <UserSettingsContext.Provider
      value={{
        settings: settings || defaultSettings,
        updateSettings,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}
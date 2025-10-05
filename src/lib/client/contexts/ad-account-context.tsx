'use client';

import { createContext, type ReactNode, useContext } from 'react';

interface AdAccountContextType {
  selectedAdAccount: string;
}

const AdAccountContext = createContext<AdAccountContextType | undefined>(undefined);

export function useAdAccount() {
  const context = useContext(AdAccountContext);
  if (!context) {
    throw new Error('useAdAccount must be used within AdAccountProvider');
  }
  return context;
}

interface AdAccountProviderProps {
  children: ReactNode;
  selectedAdAccount: string;
}

export function AdAccountProvider({ children, selectedAdAccount }: AdAccountProviderProps) {
  return (
    <AdAccountContext.Provider value={{ selectedAdAccount }}>{children}</AdAccountContext.Provider>
  );
}

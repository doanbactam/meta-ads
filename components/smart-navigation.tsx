'use client';

import { useCallback } from 'react';
import { backgroundSync } from '@/lib/background-sync';

interface SmartNavigationProps {
  adAccountId?: string;
  children: React.ReactNode;
  targetPage: string;
}

export function SmartNavigation({ adAccountId, children, targetPage }: SmartNavigationProps) {
  const handleMouseEnter = useCallback(() => {
    if (adAccountId) {
      // Prefetch data khi user hover
      backgroundSync.prefetchPageData(targetPage, adAccountId);
    }
  }, [adAccountId, targetPage]);

  return (
    <div onMouseEnter={handleMouseEnter}>
      {children}
    </div>
  );
}
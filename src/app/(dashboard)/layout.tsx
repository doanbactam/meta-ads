'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { AdAccountProvider } from '@/lib/client/contexts/ad-account-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');

  return (
    <AppLayout 
      selectedAdAccount={selectedAdAccount}
      onAdAccountChange={setSelectedAdAccount}
    >
      <AdAccountProvider selectedAdAccount={selectedAdAccount}>
        {children}
      </AdAccountProvider>
    </AppLayout>
  );
}

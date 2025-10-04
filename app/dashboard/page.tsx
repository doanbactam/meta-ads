'use client';

import { AppLayout } from '@/components/app-layout';
import { DashboardOverview } from '@/components/dashboard-overview';

export default function DashboardPage() {
  return (
    <AppLayout>
      {({ selectedAdAccount }: { selectedAdAccount: string }) => (
        <DashboardOverview adAccountId={selectedAdAccount} />
      )}
    </AppLayout>
  );
}
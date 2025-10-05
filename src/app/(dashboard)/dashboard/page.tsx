'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';

export default function DashboardPage() {
  return (
    <AppLayout>
      {({ selectedAdAccount }: { selectedAdAccount: string }) => (
        <DashboardOverview adAccountId={selectedAdAccount} />
      )}
    </AppLayout>
  );
}
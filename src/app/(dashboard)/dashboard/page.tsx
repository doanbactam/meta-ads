'use client';

import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { useAdAccount } from '@/lib/client/contexts/ad-account-context';

export default function DashboardPage() {
  const { selectedAdAccount } = useAdAccount();
  
  return <DashboardOverview adAccountId={selectedAdAccount} />;
}
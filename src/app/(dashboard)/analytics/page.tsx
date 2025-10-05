'use client';

import { AppLayout } from '@/components/layout/app-layout';

export default function AnalyticsPage() {
  return (
    <AppLayout showAdAccountSelector={false}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">analytics</h1>
        <p className="text-muted-foreground">advanced analytics coming soon</p>
      </div>
    </AppLayout>
  );
}
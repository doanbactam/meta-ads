'use client';

import { AppLayout } from '@/components/app-layout';

export default function SupportPage() {
  return (
    <AppLayout showAdAccountSelector={false}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-semibold text-foreground mb-2">support</h1>
        <p className="text-muted-foreground">help center coming soon</p>
      </div>
    </AppLayout>
  );
}
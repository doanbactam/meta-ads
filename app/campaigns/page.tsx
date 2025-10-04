'use client';

import { AppLayout } from '@/components/app-layout';
import { UniversalDataTable } from '@/components/universal-data-table';
import { campaignTableConfig } from '@/lib/table-configs';
import { Campaign } from '@/types';

export default function CampaignsPage() {
  return (
    <AppLayout>
      {({ selectedAdAccount }: { selectedAdAccount: string }) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">campaigns</h1>
            <p className="text-sm text-muted-foreground">manage your advertising campaigns</p>
          </div>
          <UniversalDataTable<Campaign>
            adAccountId={selectedAdAccount}
            config={campaignTableConfig}
          />
        </div>
      )}
    </AppLayout>
  );
}

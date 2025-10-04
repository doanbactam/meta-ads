'use client';

import { AppLayout } from '@/components/app-layout';
import { UniversalDataTable } from '@/components/universal-data-table';
import { adsTableConfig } from '@/lib/table-configs';
import { Ad } from '@/types';

export default function AdsPage() {
  return (
    <AppLayout>
      {({ selectedAdAccount }: { selectedAdAccount: string }) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">ads</h1>
            <p className="text-sm text-muted-foreground">manage your ad creatives</p>
          </div>
          <UniversalDataTable<Ad>
            adAccountId={selectedAdAccount}
            config={adsTableConfig}
          />
        </div>
      )}
    </AppLayout>
  );
}

'use client';

import { AppLayout } from '@/components/app-layout';
import { UniversalDataTable } from '@/components/universal-data-table';
import { adGroupsTableConfig } from '@/lib/table-configs';
import { AdGroup } from '@/types';

export default function AdSetsPage() {
  return (
    <AppLayout>
      {({ selectedAdAccount }: { selectedAdAccount: string }) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">ad sets</h1>
            <p className="text-sm text-muted-foreground">manage your ad sets and targeting</p>
          </div>
          <UniversalDataTable<AdGroup>
            adAccountId={selectedAdAccount}
            config={adGroupsTableConfig}
          />
        </div>
      )}
    </AppLayout>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { UniversalDataTable } from '@/components/table/universal-data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdAccount } from '@/lib/client/contexts/ad-account-context';
import {
  adGroupsTableConfig,
  adsTableConfig,
  campaignTableConfig,
} from '@/lib/client/table-configs';
import type { Ad, AdGroup, Campaign } from '@/types';

function CampaignsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('campaigns');
  const { selectedAdAccount } = useAdAccount();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['campaigns', 'ad-sets', 'ads'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/campaigns?tab=${value}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">ad management</h1>
        <p className="text-sm text-muted-foreground">manage your campaigns, ad sets, and ads</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3" data-testid="campaign-tabs">
          <TabsTrigger value="campaigns" data-testid="campaigns-tab">campaigns</TabsTrigger>
          <TabsTrigger value="ad-sets" data-testid="ad-sets-tab">ad sets</TabsTrigger>
          <TabsTrigger value="ads" data-testid="ads-tab">ads</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <UniversalDataTable<Campaign>
            adAccountId={selectedAdAccount}
            config={campaignTableConfig}
          />
        </TabsContent>

        <TabsContent value="ad-sets" className="mt-4">
          <UniversalDataTable<AdGroup>
            adAccountId={selectedAdAccount}
            config={adGroupsTableConfig}
          />
        </TabsContent>

        <TabsContent value="ads" className="mt-4">
          <UniversalDataTable<Ad> adAccountId={selectedAdAccount} config={adsTableConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CampaignsContent />
    </Suspense>
  );
}

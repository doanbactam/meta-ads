'use client';

import { AppLayout } from '@/components/app-layout';
import { UniversalDataTable } from '@/components/universal-data-table';
import { campaignTableConfig, adGroupsTableConfig, adsTableConfig } from '@/lib/table-configs';
import { Campaign, AdGroup, Ad } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('campaigns');

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
    <AppLayout>
      {({ selectedAdAccount }: { selectedAdAccount: string }) => (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">ad management</h1>
            <p className="text-sm text-muted-foreground">manage your campaigns, ad sets, and ads</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="campaigns">campaigns</TabsTrigger>
              <TabsTrigger value="ad-sets">ad sets</TabsTrigger>
              <TabsTrigger value="ads">ads</TabsTrigger>
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
              <UniversalDataTable<Ad>
                adAccountId={selectedAdAccount}
                config={adsTableConfig}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { UniversalDataTable } from '@/components/table/universal-data-table';
import { campaignTableConfig, adGroupsTableConfig, adsTableConfig } from '@/lib/client/table-configs';
import { Campaign, AdGroup, Ad } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { useFacebookStore } from '@/lib/client/stores/facebook-store';


export function AdManagerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const { isLoaded, isSignedIn } = useUser();
  const { connected, loading } = useFacebookConnection(selectedAdAccount);
  const { showConnectionDialog } = useFacebookStore();

  useEffect(() => {
    // Only show connection dialog if user explicitly needs to connect
    // Don't auto-show on every load
    if (isLoaded && isSignedIn && selectedAdAccount && !loading) {
      // Check if we need Facebook connection for this account
      // This will be handled by individual table components
    }
  }, [isLoaded, isSignedIn, selectedAdAccount, loading]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          selectedAdAccount={selectedAdAccount}
          onAdAccountChange={setSelectedAdAccount}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Tabs defaultValue="campaigns" className="space-y-4 w-full">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-sm bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="campaigns" className="rounded-sm px-3 text-xs font-medium">
                campaigns
              </TabsTrigger>
              <TabsTrigger value="ad-sets" className="rounded-sm px-3 text-xs font-medium">
                ad_sets
              </TabsTrigger>
              <TabsTrigger value="ads" className="rounded-sm px-3 text-xs font-medium">
                ads
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <UniversalDataTable<Campaign>
                adAccountId={selectedAdAccount}
                config={campaignTableConfig}
              />
            </TabsContent>

            <TabsContent value="ad-sets" className="space-y-4">
              <UniversalDataTable<AdGroup>
                adAccountId={selectedAdAccount}
                config={adGroupsTableConfig}
              />
            </TabsContent>

            <TabsContent value="ads" className="space-y-4">
              <UniversalDataTable<Ad>
                adAccountId={selectedAdAccount}
                config={adsTableConfig}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

    </div>
  );
}

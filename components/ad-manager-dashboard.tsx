'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { CampaignTable } from '@/components/campaign-table';
import { AdGroupsTable } from '@/components/ad-groups-table';
import { CreativesTable } from '@/components/creatives-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FacebookConnectDialog } from '@/components/facebook-connect-dialog';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { useFacebookStore } from '@/lib/stores/facebook-store';

export function AdManagerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const { isLoaded, isSignedIn } = useUser();
  const { connected, loading, connectFacebook } = useFacebookConnection(selectedAdAccount);
  const { showConnectionDialog, setShowConnectionDialog } = useFacebookStore();

  useEffect(() => {
    if (isLoaded && isSignedIn && !loading) {
      if (!connected) {
        setShowConnectionDialog(true);
      }
    }
  }, [isLoaded, isSignedIn, connected, loading, setShowConnectionDialog]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          selectedAdAccount={selectedAdAccount}
          onAdAccountChange={setSelectedAdAccount}
        />
        <main className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-sm bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="campaigns" className="rounded-sm px-3 text-xs font-medium">
                campaigns
              </TabsTrigger>
              <TabsTrigger value="adGroups" className="rounded-sm px-3 text-xs font-medium">
                ad_groups
              </TabsTrigger>
              <TabsTrigger value="creatives" className="rounded-sm px-3 text-xs font-medium">
                creatives
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              <CampaignTable adAccountId={selectedAdAccount} />
            </TabsContent>

            <TabsContent value="adGroups" className="space-y-4">
              <AdGroupsTable />
            </TabsContent>

            <TabsContent value="creatives" className="space-y-4">
              <CreativesTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <FacebookConnectDialog
        open={showConnectionDialog}
        onOpenChange={(open) => {
          if (!connected) {
            return;
          }
          setShowConnectionDialog(open);
        }}
        onConnect={connectFacebook}
      />
    </div>
  );
}

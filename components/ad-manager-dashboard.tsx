'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { CampaignTable } from '@/components/campaign-table';
import { AdGroupsTable } from '@/components/ad-groups-table';
import { CreativesTable } from '@/components/creatives-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function AdManagerDashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
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
              <CampaignTable />
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { CampaignTable } from '@/components/campaign-table';
import { AdGroupsTable } from '@/components/ad-groups-table';
import { CreativesTable } from '@/components/creatives-table';
import { Button } from '@/components/ui/button';

export function AdManagerDashboard() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'adGroups' | 'creatives'>('campaigns');

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'campaigns' ? 'secondary' : 'ghost'}
                className={activeTab === 'campaigns' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                onClick={() => setActiveTab('campaigns')}
              >
                Campaigns
              </Button>
              <Button
                variant={activeTab === 'adGroups' ? 'secondary' : 'ghost'}
                className={activeTab === 'adGroups' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                onClick={() => setActiveTab('adGroups')}
              >
                Ad groups
              </Button>
              <Button
                variant={activeTab === 'creatives' ? 'secondary' : 'ghost'}
                className={activeTab === 'creatives' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                onClick={() => setActiveTab('creatives')}
              >
                Creatives
              </Button>
            </div>

            {activeTab === 'campaigns' && <CampaignTable />}
            {activeTab === 'adGroups' && <AdGroupsTable />}
            {activeTab === 'creatives' && <CreativesTable />}
          </div>
        </main>
      </div>
    </div>
  );
}

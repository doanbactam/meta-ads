'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function DebugSession() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [expanded, setExpanded] = useState(false);

  const { data: adAccounts, isLoading, error } = useQuery({
    queryKey: ['debug-ad-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/ad-accounts');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isSignedIn,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['debug-campaigns', adAccounts?.accounts?.[0]?.id],
    queryFn: async () => {
      if (!adAccounts?.accounts?.[0]?.id) return null;
      const response = await fetch(`/api/campaigns?adAccountId=${adAccounts.accounts[0].id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!adAccounts?.accounts?.[0]?.id,
  });

  if (!isLoaded) {
    return <div className="p-4 text-xs text-muted-foreground">Loading session...</div>;
  }

  return (
    <div className="p-4 text-xs space-y-2 bg-muted/20 border rounded mb-4">
      <div 
        className="font-medium flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Debug Session Info
      </div>
      
      {expanded && (
        <div className="space-y-1 ml-5">
          <div>Signed In: {isSignedIn ? '✅' : '❌'}</div>
          <div>User ID: {user?.id || 'None'}</div>
          <div>Email: {user?.emailAddresses?.[0]?.emailAddress || 'None'}</div>
          <div>Name: {user?.fullName || 'None'}</div>
          
          <div className="pt-2 border-t border-border">
            <div>Ad Accounts Loading: {isLoading ? '⏳' : error ? '❌' : '✅'}</div>
            {error && <div className="text-destructive">Error: {error.message}</div>}
            <div>Ad Accounts Count: {adAccounts?.accounts?.length || 0}</div>
            
            {adAccounts?.accounts?.map((account: any, index: number) => (
              <div key={account.id} className="ml-2">
                {index + 1}. {account.name} ({account.platform}) - ID: {account.id}
              </div>
            ))}
          </div>
          
          {adAccounts?.accounts?.[0] && (
            <div className="pt-2 border-t border-border">
              <div>First Account Campaigns: {campaignsData?.campaigns?.length || 0}</div>
              {campaignsData?.campaigns?.slice(0, 3).map((campaign: any) => (
                <div key={campaign.id} className="ml-2">
                  • {campaign.name} ({campaign.status})
                </div>
              ))}
              {(campaignsData?.campaigns?.length || 0) > 3 && (
                <div className="ml-2 text-muted-foreground">
                  ... and {campaignsData.campaigns.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
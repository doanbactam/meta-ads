'use client';

import { useQuery } from '@tanstack/react-query';
import { Building, Clock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdAccountInfoProps {
  adAccountId?: string;
  className?: string;
}

export function AdAccountInfo({ adAccountId, className = '' }: AdAccountInfoProps) {
  const { data: adAccount, isLoading } = useQuery({
    queryKey: ['ad-account-detail', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return null;
      const response = await fetch(`/api/ad-accounts/${adAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch ad account details');
      return response.json();
    },
    enabled: !!adAccountId,
  });

  if (!adAccountId || isLoading) {
    return (
      <div className={`flex items-center gap-4 text-xs text-muted-foreground ${className}`}>
        <div className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          <span>{isLoading ? 'loading...' : 'no currency'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{isLoading ? 'loading...' : 'no timezone'}</span>
        </div>
      </div>
    );
  }

  if (!adAccount) {
    return (
      <div className={`flex items-center gap-4 text-xs text-muted-foreground ${className}`}>
        <div className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          <span>no currency</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>no timezone</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <Globe className="h-3 w-3 text-chart-2" />
        <span className="font-medium">{adAccount.currency}</span>
        <span className="text-muted-foreground">currency</span>
      </div>

      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-chart-3" />
        <span className="font-medium">{adAccount.timeZone}</span>
        <span className="text-muted-foreground">timezone</span>
      </div>
    </div>
  );
}

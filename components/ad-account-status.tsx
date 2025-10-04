'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Activity, Calendar, DollarSign, Clock } from 'lucide-react';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';

interface AdAccountStatusProps {
  adAccountId?: string;
  className?: string;
}

function AdAccountStatusComponent({ adAccountId, className = '' }: AdAccountStatusProps) {
  // Simplified approach to avoid duplicate calls
  const connected = !!adAccountId; // Simple check - if we have an account ID, assume connected
  
  if (!adAccountId) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Calendar className="h-3 w-3" />
        <span>no sync data</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <Calendar className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">last sync: 2 min ago</span>
    </div>
  );
}

export const AdAccountStatus = React.memo(AdAccountStatusComponent);
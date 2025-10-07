'use client';

import { Activity, AlertTriangle, Calendar, Wifi, WifiOff } from 'lucide-react';
import React from 'react';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';

interface AdAccountStatusProps {
  adAccountId?: string;
  className?: string;
}

function AdAccountStatusComponent({ adAccountId, className = '' }: AdAccountStatusProps) {
  const { connected, loading, tokenExpiryWarning, requiresReconnect, reason } =
    useFacebookConnection(adAccountId);

  if (!adAccountId) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Calendar className="h-3 w-3" />
        <span>no sync data</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Activity className="h-3 w-3 animate-pulse" />
        <span>checking...</span>
      </div>
    );
  }

  if (!connected && requiresReconnect) {
    let message = 'connection required';
    if (reason === 'TOKEN_EXPIRED') {
      message = 'token expired - reconnect needed';
    } else if (reason === 'TOKEN_INVALID') {
      message = 'token invalid - reconnect needed';
    }

    return (
      <div className={`flex items-center gap-1 text-xs text-destructive ${className}`}>
        <WifiOff className="h-3 w-3" />
        <span>{message}</span>
      </div>
    );
  }

  if (connected && tokenExpiryWarning) {
    return (
      <div className={`flex items-center gap-1 text-xs text-yellow-600 ${className}`}>
        <AlertTriangle className="h-3 w-3" />
        <span>token expiring soon</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className={`flex items-center gap-1 text-xs ${className}`}>
        <Wifi className="h-3 w-3 text-green-600" />
        <span className="text-muted-foreground">connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Calendar className="h-3 w-3" />
      <span>no connection</span>
    </div>
  );
}

export const AdAccountStatus = React.memo(AdAccountStatusComponent);

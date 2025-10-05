'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface DashboardAlertsProps {
  adAccountId?: string;
}

export function DashboardAlerts({ adAccountId }: DashboardAlertsProps) {
  if (!adAccountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">alerts & notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            select an ad account to view alerts
          </div>
        </CardContent>
      </Card>
    );
  }

  const alerts: any[] = [];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'error':
        return TrendingDown;
      case 'success':
        return TrendingUp;
      case 'info':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 text-red-500';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'low':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">alerts & notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            no alerts at this time
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type);
                return (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border border-border rounded-sm hover:bg-muted/30 transition-colors">
                    <Icon className={`h-4 w-4 mt-0.5 ${getAlertColor(alert.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm truncate">{alert.title}</div>
                        <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {alert.description}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                view all notifications →
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
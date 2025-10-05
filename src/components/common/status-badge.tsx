'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/shared/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusVariant = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'eligible':
      case 'active':
        return 'default'; // Green-ish
      case 'paused':
        return 'secondary'; // Gray
      case 'pending':
      case 'review':
        return 'outline'; // Outlined
      case 'disapproved':
      case 'rejected':
      case 'removed':
      case 'deleted':
        return 'destructive'; // Red
      case 'ended':
      case 'archived':
        return 'secondary'; // Gray
      default:
        return 'outline'; // Default fallback
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'eligible':
      case 'active':
        return '●'; // Solid dot for active
      case 'paused':
        return '⏸'; // Pause symbol
      case 'pending':
      case 'review':
        return '⏳'; // Hourglass for pending
      case 'disapproved':
      case 'rejected':
      case 'removed':
      case 'deleted':
        return '✕'; // X for rejected/removed
      case 'ended':
      case 'archived':
        return '◐'; // Half circle for ended
      default:
        return '○'; // Empty circle for unknown
    }
  };

  const variant = getStatusVariant(status);
  const icon = getStatusIcon(status);

  return (
    <Badge 
      variant={variant} 
      className={cn(
        'text-xs font-medium gap-1 min-w-[80px] justify-center',
        className
      )}
    >
      <span className="text-[10px]">{icon}</span>
      {status.toLowerCase()}
    </Badge>
  );
}
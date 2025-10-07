'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/shared/utils';

// ============================================================================
// STATUS BADGE
// ============================================================================

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
      className={cn('text-xs font-medium gap-1 min-w-[80px] justify-center', className)}
    >
      <span className="text-[10px]">{icon}</span>
      {status.toLowerCase()}
    </Badge>
  );
}

// ============================================================================
// FORMAT BADGE
// ============================================================================

interface FormatBadgeProps {
  format: string;
  className?: string;
}

export function FormatBadge({ format, className }: FormatBadgeProps) {
  const getFormatVariant = (
    format: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const normalizedFormat = format.toLowerCase();

    switch (normalizedFormat) {
      case 'image':
        return 'default'; // Primary color
      case 'video':
        return 'secondary'; // Secondary color
      case 'carousel':
        return 'outline'; // Outlined
      case 'story':
        return 'destructive'; // Different color
      case 'facebook ad':
        return 'secondary'; // Generic Facebook ad
      default:
        return 'outline'; // Default fallback
    }
  };

  const getFormatIcon = (format: string) => {
    const normalizedFormat = format.toLowerCase();

    switch (normalizedFormat) {
      case 'image':
        return '🖼️'; // Image icon
      case 'video':
        return '🎥'; // Video icon
      case 'carousel':
        return '🎠'; // Carousel icon
      case 'story':
        return '📱'; // Story icon
      case 'facebook ad':
        return '📢'; // Generic ad icon
      default:
        return '📄'; // Document icon for unknown
    }
  };

  const variant = getFormatVariant(format);
  const icon = getFormatIcon(format);

  return (
    <Badge
      variant={variant}
      className={cn('text-xs font-medium gap-1 min-w-[90px] justify-center', className)}
    >
      <span className="text-[10px]">{icon}</span>
      {format.toLowerCase()}
    </Badge>
  );
}

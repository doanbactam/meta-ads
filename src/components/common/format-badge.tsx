'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/shared/utils';

interface FormatBadgeProps {
  format: string;
  className?: string;
}

export function FormatBadge({ format, className }: FormatBadgeProps) {
  const getFormatVariant = (format: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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

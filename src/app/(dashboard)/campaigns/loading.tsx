import {
  UniversalDataTableSkeleton,
} from '@/components/table/universal-data-table';
import { campaignTableConfig } from '@/lib/client/table-configs';
import type { Campaign } from '@/types';

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <UniversalDataTableSkeleton<Campaign> config={campaignTableConfig} />
    </div>
  );
}

import type { TableConfig } from './types';

interface UniversalDataTableSkeletonProps<T extends { id: string }> {
  config: TableConfig<T>;
  rows?: number;
}

const DEFAULT_ROWS = 8;

export function UniversalDataTableSkeleton<T extends { id: string }>({
  config,
  rows = DEFAULT_ROWS,
}: UniversalDataTableSkeletonProps<T>) {
  const features = {
    search: true,
    dateRange: true,
    columnSelector: true,
    pagination: true,
    bulkActions: true,
    ...config.features,
  };

  const visibleColumnCount = config.defaultColumns.length || config.columns.length;

  return (
    <div className="space-y-3">
      <div className="rounded-sm border border-border bg-background p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {features.search && (
            <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-muted md:w-64" />
          )}

          {features.dateRange && (
            <div className="h-9 w-full max-w-xs animate-pulse rounded-md bg-muted md:w-56" />
          )}

          {features.columnSelector && (
            <div className="ml-auto h-9 w-28 animate-pulse rounded-md bg-muted" />
          )}

          {features.bulkActions && (
            <div className="h-9 w-full animate-pulse rounded-md bg-muted md:w-48" />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-border">
        <table className="min-w-[800px] w-full table-fixed text-xs">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {Array.from({ length: visibleColumnCount }).map((_, index) => (
                <th key={`header-${index}`} className="p-3 text-left font-medium text-muted-foreground">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="border-b border-border last:border-b-0">
                {Array.from({ length: visibleColumnCount }).map((__, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`} className="p-3">
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {features.pagination && (
        <div className="flex items-center justify-between rounded-sm border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )}
    </div>
  );
}

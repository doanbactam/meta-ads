import type { ReactNode } from 'react';

// Generic column definition
export interface TableColumn<T = any> {
  id: string;
  label: string;
  accessor?: keyof T | ((item: T) => any);
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

// Generic table configuration
export interface TableConfig<T = any> {
  // Data fetching
  queryKey: string;
  apiEndpoint: string;

  // Display
  title: string;
  columns: TableColumn<T>[];
  defaultColumns: string[];

  // Actions
  actions?: {
    create?: {
      label: string;
      onClick: () => void;
    };
    edit?: {
      label: string;
      onClick: (selectedIds: string[]) => void;
    };
    duplicate?: {
      label: string;
      onClick: (selectedIds: string[]) => void;
    };
    delete?: {
      label: string;
      onClick: (selectedIds: string[]) => void;
    };
    custom?: Array<{
      label: string;
      icon: any;
      onClick: (selectedIds: string[], data?: T[]) => void;
      variant?: 'default' | 'outline' | 'ghost';
    }>;
  };

  // Features
  features?: {
    search?: boolean;
    dateRange?: boolean;
    columnSelector?: boolean;
    pagination?: boolean;
    bulkActions?: boolean;
  };

  // Customization
  emptyState?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export interface UniversalDataTableProps<T = any> {
  adAccountId?: string;
  config: TableConfig<T>;
  className?: string;
}

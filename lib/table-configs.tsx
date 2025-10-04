import { TableConfig } from '@/components/universal-data-table';
import { Campaign, AdGroup, Ad } from '@/types';
import { BarChart3, Eye } from 'lucide-react';

// Campaign Table Configuration
export const campaignTableConfig: TableConfig<Campaign> = {
  queryKey: 'campaigns',
  apiEndpoint: '/api/campaigns',
  title: 'Campaigns',
  
  columns: [
    {
      id: 'name',
      label: 'name',
      accessor: 'name',
      render: (value) => <span className="font-medium">{value || '--'}</span>,
    },
    {
      id: 'status',
      label: 'status',
      accessor: 'status',
    },
    {
      id: 'budget',
      label: 'budget',
      accessor: 'budget',
    },
    {
      id: 'spent',
      label: 'spent',
      accessor: 'spent',
    },
    {
      id: 'impressions',
      label: 'impressions',
      accessor: 'impressions',
    },
    {
      id: 'clicks',
      label: 'clicks',
      accessor: 'clicks',
    },
    {
      id: 'ctr',
      label: 'ctr',
      accessor: 'ctr',
    },
    {
      id: 'conversions',
      label: 'conversions',
      accessor: 'conversions',
    },
    {
      id: 'cost',
      label: 'cost_per_conv',
      accessor: 'cost_per_conversion',
    },
    {
      id: 'dateRange',
      label: 'date_range',
      accessor: (item) => ({ date_start: item.date_start, date_end: item.date_end }),
    },
    {
      id: 'schedule',
      label: 'schedule',
      accessor: 'schedule',
      render: (value) => <span className="text-muted-foreground">{value || '--'}</span>,
    },
  ],
  
  defaultColumns: ['name', 'status', 'budget', 'spent', 'impressions', 'clicks', 'ctr', 'conversions', 'cost', 'dateRange', 'schedule'],
  
  actions: {
    create: {
      label: 'new',
      onClick: () => {
        // TODO: Implement create campaign dialog
        console.log('Create campaign');
      },
    },
    edit: {
      label: 'edit',
      onClick: (ids) => {
        // TODO: Implement edit campaigns dialog
        console.log('Edit campaigns:', ids);
      },
    },
    duplicate: {
      label: 'duplicate',
      onClick: async (ids) => {
        try {
          await Promise.all(ids.map(async (id) => {
            const response = await fetch(`/api/campaigns/${id}/duplicate`, {
              method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to duplicate campaign');
          }));
          // Refresh will be handled by React Query
          window.location.reload(); // Temporary solution
        } catch (error) {
          console.error('Error duplicating campaigns:', error);
          alert('Failed to duplicate campaigns');
        }
      },
    },
    delete: {
      label: 'remove',
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} campaign(s)?`)) return;
        
        try {
          await Promise.all(ids.map(async (id) => {
            const response = await fetch(`/api/campaigns/${id}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete campaign');
          }));
          // Refresh will be handled by React Query
          window.location.reload(); // Temporary solution
        } catch (error) {
          console.error('Error deleting campaigns:', error);
          alert('Failed to delete campaigns');
        }
      },
    },
    custom: [
      {
        label: 'breakdown',
        icon: BarChart3,
        onClick: (ids) => {
          // TODO: Implement breakdown view
          console.log('Breakdown campaigns:', ids);
        },
        variant: 'outline' as const,
      },
    ],
  },
  
  emptyState: {
    title: 'No campaigns found in your Facebook ad account',
    description: 'Connect Facebook to view your campaigns',
    action: {
      label: 'Connect Facebook',
      onClick: () => console.log('Connect Facebook'),
    },
  },
};

// Ad Groups Table Configuration
export const adGroupsTableConfig: TableConfig<AdGroup> = {
  queryKey: 'adSets',
  apiEndpoint: '/api/ad-sets',
  title: 'Ad Sets',
  
  columns: [
    {
      id: 'name',
      label: 'name',
      accessor: 'name',
      render: (value) => <span className="font-medium">{value || '--'}</span>,
    },
    {
      id: 'campaign',
      label: 'campaign',
      accessor: (item) => (item as any).campaign_name,
      render: (value) => <span className="text-muted-foreground">{value || '--'}</span>,
    },
    {
      id: 'status',
      label: 'status',
      accessor: 'status',
    },
    {
      id: 'budget',
      label: 'budget',
      accessor: 'budget',
    },
    {
      id: 'spent',
      label: 'spent',
      accessor: 'spent',
    },
    {
      id: 'impressions',
      label: 'impressions',
      accessor: 'impressions',
    },
    {
      id: 'clicks',
      label: 'clicks',
      accessor: 'clicks',
    },
    {
      id: 'ctr',
      label: 'ctr',
      accessor: 'ctr',
    },
    {
      id: 'cpc',
      label: 'cpc',
      accessor: (item) => item.clicks > 0 ? (item.spent || 0) / item.clicks : 0,
    },
    {
      id: 'conversions',
      label: 'conversions',
      accessor: 'conversions',
    },
    {
      id: 'dateRange',
      label: 'date_range',
      accessor: (item) => ({ date_start: item.date_start, date_end: item.date_end }),
    },
  ],
  
  defaultColumns: ['name', 'campaign', 'status', 'budget', 'spent', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions', 'dateRange'],
  
  actions: {
    create: {
      label: 'new ad set',
      onClick: () => {
        // TODO: Implement create ad set dialog
        console.log('Create ad set');
      },
    },
    edit: {
      label: 'edit',
      onClick: (ids) => {
        // TODO: Implement edit ad sets dialog
        console.log('Edit ad sets:', ids);
      },
    },
    duplicate: {
      label: 'duplicate',
      onClick: async (ids) => {
        try {
          await Promise.all(ids.map(async (id) => {
            const response = await fetch(`/api/ad-sets/${id}/duplicate`, {
              method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to duplicate ad set');
          }));
          window.location.reload(); // Temporary solution
        } catch (error) {
          console.error('Error duplicating ad sets:', error);
          alert('Failed to duplicate ad sets');
        }
      },
    },
    delete: {
      label: 'remove',
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} ad set(s)?`)) return;
        
        try {
          await Promise.all(ids.map(async (id) => {
            const response = await fetch(`/api/ad-sets/${id}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete ad set');
          }));
          window.location.reload(); // Temporary solution
        } catch (error) {
          console.error('Error deleting ad sets:', error);
          alert('Failed to delete ad sets');
        }
      },
    },
    custom: [
      {
        label: 'breakdown',
        icon: BarChart3,
        onClick: (ids) => {
          // TODO: Implement breakdown view
          console.log('Breakdown ad sets:', ids);
        },
        variant: 'outline' as const,
      },
    ],
  },
  
  emptyState: {
    title: 'No ad sets found',
    description: 'Create your first ad set to start advertising',
    action: {
      label: 'Create Ad Set',
      onClick: () => console.log('Create ad set'),
    },
  },
};

// Ads Table Configuration
export const adsTableConfig: TableConfig<Ad> = {
  queryKey: 'ads',
  apiEndpoint: '/api/ads',
  title: 'Ads',
  
  columns: [
    {
      id: 'name',
      label: 'name',
      accessor: 'name',
      render: (value) => <span className="font-medium">{value || '--'}</span>,
    },
    {
      id: 'adSet',
      label: 'ad_set',
      accessor: (item) => (item as any).ad_set_name,
      render: (value) => <span className="text-muted-foreground">{value || '--'}</span>,
    },
    {
      id: 'format',
      label: 'format',
      accessor: 'format',
    },
    {
      id: 'status',
      label: 'status',
      accessor: 'status',
    },
    {
      id: 'impressions',
      label: 'impressions',
      accessor: 'impressions',
    },
    {
      id: 'clicks',
      label: 'clicks',
      accessor: 'clicks',
    },
    {
      id: 'ctr',
      label: 'ctr',
      accessor: 'ctr',
    },
    {
      id: 'engagement',
      label: 'engagement',
      accessor: 'engagement',
    },
    {
      id: 'spend',
      label: 'spend',
      accessor: 'spend',
    },
    {
      id: 'roas',
      label: 'roas',
      accessor: 'roas',
    },
    {
      id: 'dateRange',
      label: 'date_range',
      accessor: (item) => ({ date_start: item.date_start, date_end: item.date_end }),
    },
  ],
  
  defaultColumns: ['name', 'adSet', 'format', 'status', 'impressions', 'clicks', 'ctr', 'engagement', 'spend', 'roas', 'dateRange'],
  
  actions: {
    create: {
      label: 'new ad',
      onClick: () => {
        // TODO: Implement create ad dialog
        console.log('Create ad');
      },
    },
    edit: {
      label: 'edit',
      onClick: (ids) => {
        // TODO: Implement edit ads dialog
        console.log('Edit ads:', ids);
      },
    },
    duplicate: {
      label: 'duplicate',
      onClick: async (ids) => {
        try {
          await Promise.all(ids.map(async (id) => {
            const response = await fetch(`/api/ads/${id}/duplicate`, {
              method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to duplicate ad');
          }));
          window.location.reload(); // Temporary solution
        } catch (error) {
          console.error('Error duplicating ads:', error);
          alert('Failed to duplicate ads');
        }
      },
    },
    delete: {
      label: 'remove',
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} ad(s)?`)) return;
        
        try {
          await Promise.all(ids.map(async (id) => {
            const response = await fetch(`/api/ads/${id}`, {
              method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete ad');
          }));
          window.location.reload(); // Temporary solution
        } catch (error) {
          console.error('Error deleting ads:', error);
          alert('Failed to delete ads');
        }
      },
    },
    custom: [
      {
        label: 'preview',
        icon: Eye,
        onClick: (ids) => {
          // TODO: Implement ad preview
          console.log('Preview ads:', ids);
        },
        variant: 'outline' as const,
      },
    ],
  },
  
  emptyState: {
    title: 'No ads found',
    description: 'Create your first ad to start your campaign',
    action: {
      label: 'Create Ad',
      onClick: () => console.log('Create ad'),
    },
  },
};
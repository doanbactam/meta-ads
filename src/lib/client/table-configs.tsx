import { Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { TableConfig } from '@/components/table/universal-data-table';
import { useFacebookStore } from '@/lib/client/stores/facebook-store';
import type { Ad, AdGroup, Campaign, AIAnalysisResult } from '@/types';

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

  defaultColumns: [
    'name',
    'status',
    'budget',
    'spent',
    'impressions',
    'clicks',
    'ctr',
    'conversions',
    'cost',
    'dateRange',
    'schedule',
  ],

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
          toast.promise(
            Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/campaigns/${id}/duplicate`, {
                  method: 'POST',
                });
                if (!response.ok) throw new Error('Failed to duplicate campaign');
              })
            ),
            {
              loading: 'Duplicating campaigns...',
              success: () => {
                setTimeout(() => window.location.reload(), 1000);
                return `${ids.length} campaign${ids.length > 1 ? 's' : ''} duplicated successfully`;
              },
              error: 'Failed to duplicate campaigns',
            }
          );
        } catch (error) {
          console.error('Error duplicating campaigns:', error);
        }
      },
    },
    delete: {
      label: 'remove',
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} campaign(s)?`)) return;

        try {
          toast.promise(
            Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/campaigns/${id}`, {
                  method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete campaign');
              })
            ),
            {
              loading: 'Deleting campaigns...',
              success: () => {
                setTimeout(() => window.location.reload(), 1000);
                return `${ids.length} campaign${ids.length > 1 ? 's' : ''} deleted successfully`;
              },
              error: 'Failed to delete campaigns',
            }
          );
        } catch (error) {
          console.error('Error deleting campaigns:', error);
        }
      },
    },
    custom: [
      {
        label: 'AI Analysis',
        icon: Sparkles,
        onClick: async (ids: string[], data?: Campaign[]) => {
          if (ids.length !== 1) {
            toast.error('Please select exactly one campaign for AI analysis');
            return;
          }

          const campaignId = ids[0];
          const campaign = data?.find((c: Campaign) => c.id === campaignId);
          const campaignName = campaign?.name || 'Campaign';

          // Dynamic import to avoid SSR issues
          const { createRoot } = await import('react-dom/client');
          const { AIAnalysisDialog } = await import('@/components/ai/ai-analysis-dialog');
          const { createElement } = await import('react');

          // Create dialog container
          const dialogContainer = document.createElement('div');
          document.body.appendChild(dialogContainer);
          const root = createRoot(dialogContainer);

          let analysisResult: AIAnalysisResult | null = null;
          let isLoading = true;

          const renderDialog = () => {
            root.render(
              createElement(AIAnalysisDialog, {
                open: true,
                onOpenChange: (open: boolean) => {
                  if (!open) {
                    root.unmount();
                    document.body.removeChild(dialogContainer);
                  }
                },
                result: analysisResult,
                campaignName,
                isLoading,
              })
            );
          };

          // Show loading dialog
          renderDialog();

          // Fetch analysis
          try {
            const response = await fetch('/api/ai/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Analysis failed');
            }

            const responseData = await response.json();
            analysisResult = responseData.analysis;
            isLoading = false;
            renderDialog();

            toast.success('Analysis complete!');
          } catch (error) {
            console.error('AI analysis error:', error);
            toast.error(
              error instanceof Error ? error.message : 'Analysis failed. Please try again.'
            );
            root.unmount();
            document.body.removeChild(dialogContainer);
          }
        },
        variant: 'default' as const,
      },
    ],
  },

  emptyState: {
    title: 'No campaigns found in your Facebook ad account',
    description: 'Connect your Facebook account to sync and view your campaigns',
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
      accessor: (item) => (item.clicks > 0 ? (item.spent || 0) / item.clicks : 0),
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

  defaultColumns: [
    'name',
    'campaign',
    'status',
    'budget',
    'spent',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'conversions',
    'dateRange',
  ],

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
          toast.promise(
            Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/ad-sets/${id}/duplicate`, {
                  method: 'POST',
                });
                if (!response.ok) throw new Error('Failed to duplicate ad set');
              })
            ),
            {
              loading: 'Duplicating ad sets...',
              success: () => {
                setTimeout(() => window.location.reload(), 1000);
                return `${ids.length} ad set${ids.length > 1 ? 's' : ''} duplicated successfully`;
              },
              error: 'Failed to duplicate ad sets',
            }
          );
        } catch (error) {
          console.error('Error duplicating ad sets:', error);
        }
      },
    },
    delete: {
      label: 'remove',
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} ad set(s)?`)) return;

        try {
          toast.promise(
            Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/ad-sets/${id}`, {
                  method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete ad set');
              })
            ),
            {
              loading: 'Deleting ad sets...',
              success: () => {
                setTimeout(() => window.location.reload(), 1000);
                return `${ids.length} ad set${ids.length > 1 ? 's' : ''} deleted successfully`;
              },
              error: 'Failed to delete ad sets',
            }
          );
        } catch (error) {
          console.error('Error deleting ad sets:', error);
        }
      },
    },
  },

  emptyState: {
    title: 'No ad sets found',
    description: 'Ad sets will appear here once your campaigns have targeting groups',
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

  defaultColumns: [
    'name',
    'adSet',
    'format',
    'status',
    'impressions',
    'clicks',
    'ctr',
    'engagement',
    'spend',
    'roas',
    'dateRange',
  ],

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
          toast.promise(
            Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/ads/${id}/duplicate`, {
                  method: 'POST',
                });
                if (!response.ok) throw new Error('Failed to duplicate ad');
              })
            ),
            {
              loading: 'Duplicating ads...',
              success: () => {
                setTimeout(() => window.location.reload(), 1000);
                return `${ids.length} ad${ids.length > 1 ? 's' : ''} duplicated successfully`;
              },
              error: 'Failed to duplicate ads',
            }
          );
        } catch (error) {
          console.error('Error duplicating ads:', error);
        }
      },
    },
    delete: {
      label: 'remove',
      onClick: async (ids) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} ad(s)?`)) return;

        try {
          toast.promise(
            Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/ads/${id}`, {
                  method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete ad');
              })
            ),
            {
              loading: 'Deleting ads...',
              success: () => {
                setTimeout(() => window.location.reload(), 1000);
                return `${ids.length} ad${ids.length > 1 ? 's' : ''} deleted successfully`;
              },
              error: 'Failed to delete ads',
            }
          );
        } catch (error) {
          console.error('Error deleting ads:', error);
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
    description: 'Ads will appear here once you create creatives for your ad sets',
  },
};

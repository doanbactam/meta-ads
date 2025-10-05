import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFacebookStore } from '@/lib/client/stores/facebook-store';

interface FacebookConnectionStatus {
  connected: boolean;
  adAccountId?: string;
  facebookAdAccountId?: string;
  tokenExpiry?: Date;
  tokenExpiryWarning?: boolean;
  requiresReconnect?: boolean;
  reason?: string;
  errorDetails?: string;
  scopes?: string[];
}

async function checkFacebookConnection(adAccountId?: string): Promise<FacebookConnectionStatus> {
  if (!adAccountId) {
    return { connected: false };
  }

  try {
    const response = await fetch(`/api/facebook/check-connection?adAccountId=${adAccountId}`);

    const data = await response.json();

    if (!response.ok) {
      // Handle expected error responses with reconnection info
      return {
        connected: false,
        requiresReconnect: data.requiresReconnect,
        reason: data.reason,
        errorDetails: data.errorDetails || data.message || data.error,
      };
    }

    if (data.connected) {
      return {
        connected: true,
        adAccountId: data.adAccountId,
        facebookAdAccountId: data.facebookAdAccountId,
        tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
        tokenExpiryWarning: data.tokenExpiryWarning,
        scopes: data.scopes,
      };
    }

    return {
      connected: false,
      requiresReconnect: data.requiresReconnect,
      reason: data.reason,
      errorDetails: data.message,
    };
  } catch (error) {
    console.warn('Facebook connection check failed:', error);
    return {
      connected: false,
      requiresReconnect: true,
      reason: 'CONNECTION_ERROR',
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function connectFacebookAccount(accessToken: string, fbAdAccountId?: string) {
  const response = await fetch('/api/facebook/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      adAccountId: fbAdAccountId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || data.error || `HTTP ${response.status}: Failed to connect`;
    throw new Error(errorMessage);
  }

  if (!data.success) {
    throw new Error(data.message || data.error || 'Connection failed');
  }

  return data;
}

export function useFacebookConnection(adAccountId?: string) {
  const queryClient = useQueryClient();
  const { setConnected, setShowConnectionDialog } = useFacebookStore();

  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['facebook-connection', adAccountId],
    queryFn: () => checkFacebookConnection(adAccountId),
    enabled: !!adAccountId,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Prevent excessive refetching
    staleTime: 2 * 60 * 1000, // 2 minutes (matches our recent update window)
    retry: 1, // Reduce retries to prevent loops
    retryDelay: 1000,
  });

  const connectMutation = useMutation({
    mutationFn: ({ accessToken, fbAdAccountId }: { accessToken: string; fbAdAccountId?: string }) =>
      connectFacebookAccount(accessToken, fbAdAccountId),
    onSuccess: async (data) => {
      setConnected(true, data.adAccountId, data.facebookAdAccountId, data.tokenExpiry);

      // Small delay to ensure database changes are committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Invalidate all related queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['facebook-connection'] }),
        queryClient.invalidateQueries({ queryKey: ['facebook-campaigns'] }),
        queryClient.invalidateQueries({ queryKey: ['facebook-adsets'] }),
        queryClient.invalidateQueries({ queryKey: ['facebook-ads'] }),
        queryClient.invalidateQueries({ queryKey: ['ad-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['overview-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
        queryClient.invalidateQueries({ queryKey: ['ad-sets'] }),
        queryClient.invalidateQueries({ queryKey: ['ads'] }),
      ]);

      // Also remove any stale queries from the cache
      queryClient.removeQueries({
        queryKey: ['facebook-connection'],
        exact: false,
      });
    },
    onError: (error) => {
      console.error('Facebook connection error:', error);
      setConnected(false);
    },
  });

  const connectFacebook = async (accessToken: string, fbAdAccountId?: string) => {
    try {
      const result = await connectMutation.mutateAsync({ accessToken, fbAdAccountId });

      // Close dialog and show success
      setShowConnectionDialog(false);

      return { success: true, data: result };
    } catch (error) {
      console.error('Connect Facebook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Facebook',
      };
    }
  };

  return {
    connected: status?.connected || false,
    loading: isLoading,
    error: error instanceof Error ? error.message : undefined,
    adAccountId: status?.adAccountId,
    facebookAdAccountId: status?.facebookAdAccountId,
    tokenExpiry: status?.tokenExpiry,
    tokenExpiryWarning: status?.tokenExpiryWarning,
    requiresReconnect: status?.requiresReconnect,
    reason: status?.reason,
    errorDetails: status?.errorDetails,
    scopes: status?.scopes,
    checkConnection: refetch,
    connectFacebook,
  };
}

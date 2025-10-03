import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFacebookStore } from '@/lib/stores/facebook-store';

interface FacebookConnectionStatus {
  connected: boolean;
  adAccountId?: string;
  facebookAdAccountId?: string;
  tokenExpiry?: Date;
}

async function checkFacebookConnection(adAccountId?: string): Promise<FacebookConnectionStatus> {
  if (!adAccountId) {
    return { connected: false };
  }

  const response = await fetch(
    `/api/facebook/check-connection?adAccountId=${adAccountId}`
  );

  const data = await response.json();

  if (response.ok && data.connected) {
    return {
      connected: true,
      adAccountId: data.adAccountId,
      facebookAdAccountId: data.facebookAdAccountId,
      tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
    };
  }

  return { connected: false };
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

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['facebook-connection', adAccountId],
    queryFn: () => checkFacebookConnection(adAccountId),
    enabled: !!adAccountId,
    refetchOnMount: true,
  });

  const connectMutation = useMutation({
    mutationFn: ({ accessToken, fbAdAccountId }: { accessToken: string; fbAdAccountId?: string }) =>
      connectFacebookAccount(accessToken, fbAdAccountId),
    onSuccess: (data) => {
      setConnected(true, data.adAccountId, data.facebookAdAccountId, data.tokenExpiry);
      queryClient.invalidateQueries({ queryKey: ['facebook-connection'] });
      queryClient.invalidateQueries({ queryKey: ['facebook-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['facebook-adsets'] });
      queryClient.invalidateQueries({ queryKey: ['facebook-ads'] });
    },
    onError: (error) => {
      console.error('Facebook connection error:', error);
    },
  });

  const connectFacebook = async (accessToken: string, fbAdAccountId?: string) => {
    try {
      const result = await connectMutation.mutateAsync({ accessToken, fbAdAccountId });
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
    checkConnection: refetch,
    connectFacebook,
  };
}

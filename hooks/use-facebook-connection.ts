import { useState, useEffect, useCallback } from 'react';

interface FacebookConnectionStatus {
  connected: boolean;
  loading: boolean;
  error?: string;
  adAccountId?: string;
  facebookAdAccountId?: string;
  tokenExpiry?: Date;
}

export function useFacebookConnection(adAccountId?: string) {
  const [status, setStatus] = useState<FacebookConnectionStatus>({
    connected: false,
    loading: true,
  });

  const checkConnection = useCallback(async () => {
    if (!adAccountId) {
      setStatus({ connected: false, loading: false });
      return;
    }

    try {
      setStatus((prev) => ({ ...prev, loading: true }));

      const response = await fetch(
        `/api/facebook/check-connection?adAccountId=${adAccountId}`
      );

      const data = await response.json();

      if (response.ok && data.connected) {
        setStatus({
          connected: true,
          loading: false,
          adAccountId: data.adAccountId,
          facebookAdAccountId: data.facebookAdAccountId,
          tokenExpiry: data.tokenExpiry ? new Date(data.tokenExpiry) : undefined,
        });
      } else {
        setStatus({
          connected: false,
          loading: false,
          error: data.message || data.error,
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check connection',
      });
    }
  }, [adAccountId]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectFacebook = useCallback(
    async (accessToken: string, fbAdAccountId?: string) => {
      try {
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

        if (response.ok && data.success) {
          await checkConnection();
          return { success: true, data };
        } else {
          return { success: false, error: data.error || 'Failed to connect' };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to connect',
        };
      }
    },
    [checkConnection]
  );

  return {
    ...status,
    checkConnection,
    connectFacebook,
  };
}

'use client';

import { AlertCircle, Facebook, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FacebookConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (
    accessToken: string,
    adAccountId?: string
  ) => Promise<{ success: boolean; error?: string; data?: any }>;
}

export function FacebookConnectDialog({
  open,
  onOpenChange,
  onConnect,
}: FacebookConnectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) {
      setError('');
      setLoading(false);
      // Cleanup any pending OAuth listeners
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  }, [open]);

  const handleConnect = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      // Don't pass adAccountId - let API sync all accounts
      const result = await onConnect(token);

      if (result.success) {
        const accountCount = result.data?.accounts?.length || 0;
        toast.success('Facebook connection successful', {
          description: `Synchronized ${accountCount} ad account${accountCount !== 1 ? 's' : ''}. Refreshing...`,
        });

        // Reload page to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorMsg = result.error || 'Failed to connect to Facebook';
        setError(errorMsg);
        toast.error('Connection failed', {
          description: errorMsg,
        });
        console.error('Connection failed:', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      toast.error('Connection error', {
        description: errorMsg,
      });
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) {
      setError('Facebook App ID not configured');
      return;
    }

    setError('');
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const scope = 'ads_read,ads_management,business_management';
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;

    const popup = window.open(authUrl, 'Facebook Login', 'width=600,height=700,top=100,left=100');

    if (!popup) {
      setError('Failed to open popup window. Please allow popups for this site.');
      return;
    }

    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'facebook-auth-success' && event.data.accessToken) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);

        setLoading(true);

        try {
          popup?.close();
        } catch (e) {
          // Popup already closed
        }

        // Auto-connect with all accounts after OAuth success
        await handleConnect(event.data.accessToken);
      } else if (event.data.type === 'facebook-auth-error') {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setError(event.data.error || 'Authentication failed. Please try again.');
        try {
          popup?.close();
        } catch (e) {
          // Popup already closed
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Store cleanup function
    cleanupRef.current = () => {
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
      try {
        popup?.close();
      } catch (e) {
        // Popup already closed
      }
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            connect facebook account
          </DialogTitle>
          <DialogDescription>
            authorize access to sync all your facebook ad accounts automatically.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Button onClick={handleFacebookLogin} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                connecting...
              </>
            ) : (
              <>
                <Facebook className="mr-2 h-4 w-4" />
                login with facebook
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            all authorized ad accounts will be synchronized automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

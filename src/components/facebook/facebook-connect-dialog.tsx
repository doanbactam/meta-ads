'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Facebook, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FacebookConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accessToken: string, adAccountId?: string) => Promise<{ success: boolean; error?: string; data?: any }>;
}

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

export function FacebookConnectDialog({ open, onOpenChange, onConnect }: FacebookConnectDialogProps) {
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [step, setStep] = useState<'login' | 'account'>('login');
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) {
      setAccessToken('');
      setError('');
      setAccounts([]);
      setSelectedAccount('');
      setStep('login');
      setLoading(false);
      // Cleanup any pending OAuth listeners
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    }
  }, [open]);

  const handleConnect = async () => {
    if (!selectedAccount && accounts.length > 1) {
      setError('Please select an ad account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const accountId = selectedAccount || (accounts.length > 0 ? accounts[0].id.replace('act_', '') : undefined);
      const result = await onConnect(accessToken, accountId);

      if (result.success) {
        toast.success('Facebook account connected successfully', {
          description: 'Refreshing data...',
        });
        
        // Reload page to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorMsg = result.error || 'Failed to connect to Facebook';
        setError(errorMsg);
        console.error('Connection failed:', errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
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

    const popup = window.open(
      authUrl,
      'Facebook Login',
      'width=600,height=700,top=100,left=100'
    );

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

        const token = event.data.accessToken;
        setAccessToken(token);
        setLoading(true);

        try {
          popup?.close();
        } catch (e) {
          // Popup already closed
        }

        // Auto-validate token
        try {
          const response = await fetch('/api/facebook/validate-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken: token }),
          });

          const data = await response.json();

          if (!response.ok) {
            const errorMsg = data.message || data.error || 'Failed to validate token';
            setError(errorMsg);
            setLoading(false);
            return;
          }

          if (data.isValid) {
            const fbApi = await fetch(
              `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${token}`
            );
            const accountsData = await fbApi.json();

            if (accountsData.error) {
              setError(accountsData.error.message || 'Failed to fetch ad accounts');
              setLoading(false);
              return;
            }

            if (accountsData.data && accountsData.data.length > 0) {
              setAccounts(accountsData.data);
              setSelectedAccount(accountsData.data[0].id.replace('act_', ''));
              setStep('account');
            } else {
              setError('No ad accounts found for this token. Please ensure you have ad accounts in Facebook Business Manager.');
            }
          } else {
            setError(data.error || 'Invalid access token. Please check your token and try again.');
          }
        } catch (err) {
          console.error('Token validation error:', err);
          const errorMsg = err instanceof Error ? err.message : 'Failed to validate token';
          setError(errorMsg);
        } finally {
          setLoading(false);
        }
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
            {step === 'login'
              ? 'connect your facebook account to access ad campaigns and performance data.'
              : 'select the ad account you want to manage.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'login' ? (
          <div className="space-y-4">
            <Button
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full"
            >
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
              you will be redirected to facebook to authorize access to your ad accounts
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-account">select ad account</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
                disabled={loading}
              >
                <SelectTrigger id="ad-account">
                  <SelectValue placeholder="select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.replace('act_', '')}>
                      {account.name} ({account.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('login')}
                disabled={loading}
                className="flex-1"
              >
                back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={loading || (!selectedAccount && accounts.length > 1)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    connecting...
                  </>
                ) : (
                  'connect'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

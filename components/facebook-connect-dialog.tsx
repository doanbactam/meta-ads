'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Facebook, AlertCircle } from 'lucide-react';

interface FacebookConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accessToken: string, adAccountId?: string) => Promise<{ success: boolean; error?: string; data?: any }>;
}

export function FacebookConnectDialog({ open, onOpenChange, onConnect }: FacebookConnectDialogProps) {
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [step, setStep] = useState<'token' | 'account'>('token');

  useEffect(() => {
    if (!open) {
      setAccessToken('');
      setError('');
      setAccounts([]);
      setSelectedAccount('');
      setStep('token');
      setLoading(false);
    }
  }, [open]);

  const handleValidateToken = async () => {
    if (!accessToken.trim()) {
      setError('Please enter an access token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/facebook/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Failed to validate token';
        setError(errorMsg);
        return;
      }

      if (data.isValid) {
        const fbApi = await fetch(
          `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`
        );
        const accountsData = await fbApi.json();

        if (accountsData.error) {
          setError(accountsData.error.message || 'Failed to fetch ad accounts');
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
  };

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
        onOpenChange(false);
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

    const redirectUri = `${window.location.origin}/facebook-callback`;
    const scope = 'ads_read,ads_management,business_management';
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;

    const popup = window.open(
      authUrl,
      'Facebook Login',
      'width=600,height=700'
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'facebook-auth-success' && event.data.accessToken) {
        setAccessToken(event.data.accessToken);
        window.removeEventListener('message', handleMessage);
        popup?.close();
      }
    };

    window.addEventListener('message', handleMessage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Connect Facebook Account
          </DialogTitle>
          <DialogDescription>
            {step === 'token'
              ? 'Enter your Facebook access token or login with Facebook to connect your ad account.'
              : 'Select the ad account you want to connect.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'token' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-token">Facebook Access Token</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="Enter your Facebook access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                You can get an access token from the{' '}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Facebook Graph API Explorer
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleValidateToken}
                disabled={loading || !accessToken.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleFacebookLogin}
                disabled={loading}
                className="w-full"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Login with Facebook
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-account">Select Ad Account</Label>
              <select
                id="ad-account"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={loading}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id.replace('act_', '')}>
                    {account.name} ({account.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('token')}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={loading || (!selectedAccount && accounts.length > 1)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

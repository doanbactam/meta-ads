'use client';

import { Menu, RefreshCw, AlertCircle, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FacebookConnectDialog } from '@/components/facebook/facebook-connect-dialog';
import { useFacebookStore } from '@/lib/client/stores/facebook-store';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useRef } from 'react';
import { type AdAccount } from '@/lib/server/api/ad-accounts';
import { UserButton, useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { AdAccountStatus } from '@/components/dashboard/ad-account-status';
import { AdAccountInfo } from '@/components/dashboard/ad-account-info';
import { AdAccountStats } from '@/components/dashboard/ad-account-stats';
import { SettingsDialog } from '@/components/common/settings-dialog';

interface HeaderProps {
  onToggleSidebar?: () => void;
  selectedAdAccount?: string;
  onAdAccountChange?: (accountId: string) => void;
}

export function Header({ onToggleSidebar, selectedAdAccount, onAdAccountChange }: HeaderProps) {
  const { user, isSignedIn } = useUser();
  const isInitializedRef = useRef(false);
  const lastAccountsLengthRef = useRef(0);
  const { showConnectionDialog, setShowConnectionDialog } = useFacebookStore();
  const { connected, loading: fbLoading, connectFacebook } = useFacebookConnection(selectedAdAccount);

  const { 
    data: adAccountsData, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/ad-accounts');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch ad accounts: ${response.status}`);
      }
      const data = await response.json();
      return data.accounts || [];
    },
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const adAccounts = adAccountsData || [];

  // Auto-select first account if none selected
  // Use ref to prevent infinite loops
  useEffect(() => {
    // Only run once when accounts are first loaded
    if (
      adAccounts.length > 0 && 
      !selectedAdAccount && 
      onAdAccountChange &&
      !isInitializedRef.current
    ) {
      isInitializedRef.current = true;
      onAdAccountChange(adAccounts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adAccounts.length, selectedAdAccount]);

  // If selected account no longer exists, select first available
  // Only trigger when accounts list actually changes
  useEffect(() => {
    const accountsChanged = lastAccountsLengthRef.current !== adAccounts.length;
    lastAccountsLengthRef.current = adAccounts.length;

    if (
      selectedAdAccount && 
      adAccounts.length > 0 && 
      onAdAccountChange &&
      accountsChanged
    ) {
      const accountExists = adAccounts.find((a: AdAccount) => a.id === selectedAdAccount);
      if (!accountExists) {
        onAdAccountChange(adAccounts[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdAccount, adAccounts.length]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleConnectFacebook = () => {
    setShowConnectionDialog(true);
  };

  return (
    <header className="border-b border-border bg-card shrink-0">
      {/* Main header row */}
      <div className="h-12 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <Select 
              value={selectedAdAccount} 
              onValueChange={onAdAccountChange} 
              disabled={isLoading || !isSignedIn}
            >
              <SelectTrigger 
                size="sm" 
                className={`w-52 text-xs border-border ${
                  error ? 'border-destructive' : ''
                }`}
              >
                <SelectValue 
                  placeholder={
                    isLoading 
                      ? "loading accounts..." 
                      : error 
                      ? "error loading accounts"
                      : adAccounts.length === 0 
                      ? "no ad accounts found"
                      : "select ad account"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {adAccounts.length === 0 && !isLoading && (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    <AlertCircle className="h-3 w-3 mx-auto mb-1" />
                    No ad accounts found
                  </div>
                )}
                {adAccounts.map((account: AdAccount) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {account.platform}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {adAccounts.length > 0 && (
                  <div className="border-t border-border mt-1 pt-1">
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      {adAccounts.length} account{adAccounts.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleRefresh}
              disabled={isLoading}
              title={isLoading ? "Refreshing accounts..." : "Refresh ad accounts"}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={adAccounts.length === 0 && !isLoading ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={handleConnectFacebook}
              disabled={fbLoading}
            >
              <Facebook className="h-3.5 w-3.5" />
              {adAccounts.length === 0 ? 'connect facebook' : 'reconnect'}
            </Button>
          </div>

          {selectedAdAccount && (
            <div className="hidden lg:flex items-center gap-4 ml-3 min-w-0 overflow-hidden">
              <AdAccountStatus adAccountId={selectedAdAccount} className="shrink-0" />
              <AdAccountInfo adAccountId={selectedAdAccount} className="shrink-0" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SettingsDialog />

          <Separator orientation="vertical" className="h-4" />
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg border-border",
                  userButtonPopoverActionButton: "hover:bg-accent",
                  userButtonPopoverActionButtonText: "text-foreground",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
              Sign In
            </Button>
          </SignedOut>
        </div>
      </div>

      {/* Error alert row */}
      {isError && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <Alert variant="destructive" className="border-0 bg-transparent p-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Failed to load ad accounts. {error?.message || 'Please try again.'}
              {adAccounts.length === 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-2 text-xs underline"
                  onClick={handleConnectFacebook}
                >
                  Connect Facebook
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats row - only show on larger screens when account is selected */}
      {selectedAdAccount && (
        <div className="hidden xl:block px-4 py-2 bg-muted/20 border-t border-border">
          <AdAccountStats adAccountId={selectedAdAccount} />
        </div>
      )}

      {/* Facebook Connect Dialog */}
      <FacebookConnectDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onConnect={connectFacebook}
      />
    </header>
  );
}

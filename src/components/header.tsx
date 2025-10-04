'use client';

import { Menu, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';
import { type AdAccount } from '@/lib/api/ad-accounts';
import { UserButton, useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { AdAccountStatus } from '@/components/ad-account-status';
import { AdAccountInfo } from '@/components/ad-account-info';
import { AdAccountStats } from '@/components/ad-account-stats';
import { SettingsDialog } from '@/components/settings-dialog';

interface HeaderProps {
  onToggleSidebar?: () => void;
  selectedAdAccount?: string;
  onAdAccountChange?: (accountId: string) => void;
}

export function Header({ onToggleSidebar, selectedAdAccount, onAdAccountChange }: HeaderProps) {
  const { user, isSignedIn } = useUser();

  const { 
    data: adAccountsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['ad-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/ad-accounts');
      if (!response.ok) {
        throw new Error(`Failed to fetch ad accounts: ${response.status}`);
      }
      const data = await response.json();
      return data.accounts || [];
    },
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const adAccounts = adAccountsData || [];

  // Auto-select first account if none selected
  useEffect(() => {
    if (adAccounts.length > 0 && !selectedAdAccount && onAdAccountChange) {
      onAdAccountChange(adAccounts[0].id);
    }
  }, [adAccounts, selectedAdAccount, onAdAccountChange]);

  // If selected account no longer exists, select first available
  useEffect(() => {
    if (selectedAdAccount && adAccounts.length > 0 && onAdAccountChange) {
      const accountExists = adAccounts.find((a: AdAccount) => a.id === selectedAdAccount);
      if (!accountExists) {
        onAdAccountChange(adAccounts[0].id);
      }
    }
  }, [selectedAdAccount, adAccounts, onAdAccountChange]);

  const handleRefresh = () => {
    refetch();
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
              title="Refresh ad accounts"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
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

      {/* Stats row - only show on larger screens when account is selected */}
      {selectedAdAccount && (
        <div className="hidden xl:block px-4 py-2 bg-muted/20 border-t border-border">
          <AdAccountStats adAccountId={selectedAdAccount} />
        </div>
      )}
    </header>
  );
}

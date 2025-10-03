'use client';

import { Bell, ChevronDown, Facebook, MessageCircle, Linkedin, Instagram, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { getAdAccounts, type AdAccount } from '@/lib/api/ad-accounts';
import { UserButton, useUser } from '@clerk/nextjs';

interface HeaderProps {
  onToggleSidebar?: () => void;
  selectedAdAccount?: string;
  onAdAccountChange?: (accountId: string) => void;
}

export function Header({ onToggleSidebar, selectedAdAccount, onAdAccountChange }: HeaderProps) {
  const { user } = useUser();
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const platforms = [
    { name: 'facebook', icon: Facebook },
    { name: 'messenger', icon: MessageCircle },
    { name: 'linkedin', icon: Linkedin },
    { name: 'instagram', icon: Instagram },
  ];

  useEffect(() => {
    loadAdAccounts();
  }, []);

  async function loadAdAccounts() {
    try {
      setLoading(true);
      const accounts = await getAdAccounts();
      setAdAccounts(accounts);
      if (accounts.length > 0 && !selectedAdAccount && onAdAccountChange) {
        onAdAccountChange(accounts[0].id);
      }
    } catch (error) {
      console.error('Error loading ad accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <Select value={selectedAdAccount} onValueChange={onAdAccountChange}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="Select ad account" />
          </SelectTrigger>
          <SelectContent>
            {adAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id} className="text-xs">
                {account.name} ({account.platform})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1">
          {platforms.map((platform, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs font-normal hover:bg-muted"
            >
              <platform.icon className="h-3 w-3" />
              <span className="lowercase">{platform.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Bell className="h-3.5 w-3.5" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8"
            }
          }}
        />
      </div>
    </header>
  );
}

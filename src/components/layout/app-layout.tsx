'use client';

import { useState, ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { Header } from '@/components/layout/header';

interface AppLayoutProps {
  children: ReactNode;
  showAdAccountSelector?: boolean;
  selectedAdAccount?: string;
  onAdAccountChange?: (adAccountId: string) => void;
}

export function AppLayout({ 
  children, 
  showAdAccountSelector = true,
  selectedAdAccount = '',
  onAdAccountChange
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onToggleSidebar={() => setMobileMenuOpen(true)}
          selectedAdAccount={showAdAccountSelector ? selectedAdAccount : undefined}
          onAdAccountChange={showAdAccountSelector ? onAdAccountChange : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
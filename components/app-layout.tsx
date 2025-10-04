'use client';

import { useState, ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { Header } from '@/components/header';
import { FacebookConnectDialog } from '@/components/facebook-connect-dialog';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { useFacebookStore } from '@/lib/stores/facebook-store';

interface AppLayoutProps {
  children: ReactNode | ((props: { selectedAdAccount: string }) => ReactNode);
  showAdAccountSelector?: boolean;
}

export function AppLayout({ children, showAdAccountSelector = true }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('');
  const { connected, loading, connectFacebook } = useFacebookConnection(selectedAdAccount);
  const { showConnectionDialog, setShowConnectionDialog } = useFacebookStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          onToggleSidebar={() => setMobileMenuOpen(true)}
          selectedAdAccount={showAdAccountSelector ? selectedAdAccount : undefined}
          onAdAccountChange={showAdAccountSelector ? setSelectedAdAccount : undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {typeof children === 'function' ? children({ selectedAdAccount }) : children}
        </main>
      </div>

      {showAdAccountSelector && (
        <FacebookConnectDialog
          open={showConnectionDialog}
          onOpenChange={(open) => {
            if (!connected) {
              return;
            }
            setShowConnectionDialog(open);
          }}
          onConnect={connectFacebook}
        />
      )}
    </div>
  );
}
'use client';

import { LayoutDashboard, Megaphone, Sun, Moon, Terminal, Target, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'dashboard', href: '/dashboard', matchPath: '/dashboard' },
    { icon: Megaphone, label: 'campaigns', href: '/campaigns?tab=campaigns', matchPath: '/campaigns' },
    { icon: Target, label: 'ad sets', href: '/campaigns?tab=ad-sets', matchPath: '/campaigns' },
    { icon: Image, label: 'ads', href: '/campaigns?tab=ads', matchPath: '/campaigns' },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-12 px-4 border-b border-border flex items-center justify-start">
          <SheetTitle className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4" />
            <span>ad_manager</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 p-2">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.matchPath);
              return (
                <li key={item.label}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-8 px-3 text-xs font-normal ${
                      isActive ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <item.icon className="mr-2 h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-2 border-t border-border">
          {!mounted ? (
            <div className="h-8" />
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 flex-1 text-xs font-normal ${theme === 'light' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-1.5 h-3.5 w-3.5" />
                light
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 flex-1 text-xs font-normal ${theme === 'dark' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-1.5 h-3.5 w-3.5" />
                dark
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

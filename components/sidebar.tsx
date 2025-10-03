'use client';

import { LayoutDashboard, Megaphone, BarChart3, HelpCircle, Sun, Moon, Terminal, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'dashboard', active: false },
    { icon: Megaphone, label: 'campaigns', active: true },
    { icon: BarChart3, label: 'analytics', active: false },
    { icon: HelpCircle, label: 'support', active: false },
  ];

  return (
    <div
      className={`bg-card border-r border-border flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-52'
      }`}
    >
      <div className="h-12 px-4 border-b border-border flex items-center justify-between gap-2">
        {!collapsed && (
          <>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span className="text-sm font-medium">ad_manager</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggle}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 mx-auto"
            onClick={onToggle}
          >
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Button
                variant="ghost"
                className={`w-full ${collapsed ? 'justify-center' : 'justify-start'} h-8 px-3 text-xs font-normal ${
                  item.active ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`${collapsed ? '' : 'mr-2'} h-3.5 w-3.5`} />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-border">
        {!collapsed ? (
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
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-full text-xs font-normal ${theme === 'light' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              onClick={() => setTheme('light')}
              title="Light mode"
            >
              <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-full text-xs font-normal ${theme === 'dark' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              onClick={() => setTheme('dark')}
              title="Dark mode"
            >
              <Moon className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

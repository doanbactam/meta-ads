'use client';

import { LayoutDashboard, Megaphone, BarChart3, HelpCircle, Sun, Moon, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Sidebar() {
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
    <div className="w-52 bg-card border-r border-border flex flex-col">
      <div className="h-12 px-4 border-b border-border flex items-center gap-2">
        <Terminal className="h-4 w-4" />
        <span className="text-sm font-medium">ad_manager</span>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Button
                variant="ghost"
                className={`w-full justify-start h-8 px-3 text-xs font-normal ${
                  item.active ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
              >
                <item.icon className="mr-2 h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-border">
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
      </div>
    </div>
  );
}

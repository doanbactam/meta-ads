'use client';

import { LayoutDashboard, Megaphone, ChartBar as BarChart3, CircleHelp as HelpCircle, Sun, Moon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: false },
    { icon: Megaphone, label: 'Campaign', active: true },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: HelpCircle, label: 'Support', active: false },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-semibold">◐</span>
          </div>
          <span className="font-semibold">Ad Manager</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Button
                variant={item.active ? 'secondary' : 'ghost'}
                className={`w-full justify-between ${
                  item.active ? 'bg-secondary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.active && <ChevronRight className="w-4 h-4" />}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme('light')}
            className={theme === 'light' ? 'bg-secondary' : ''}
          >
            <Sun className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme('dark')}
            className={theme === 'dark' ? 'bg-secondary' : ''}
          >
            <Moon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

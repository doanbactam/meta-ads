'use client';

import { Bell, ChevronDown, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const platforms = [
    { name: 'Facebook', icon: Facebook, active: true },
    { name: 'Messenger', icon: Facebook, active: true },
    { name: 'LinkedIn', icon: Facebook, active: true },
    { name: 'Instagram', icon: Instagram, active: true },
  ];

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {platforms.map((platform, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="gap-2 text-sm"
          >
            <platform.icon className="w-4 h-4" />
            {platform.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-muted text-sm">A</AvatarFallback>
          </Avatar>
          <span className="text-sm">Armand</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

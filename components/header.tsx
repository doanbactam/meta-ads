'use client';

import { Bell, ChevronDown, Facebook, MessageCircle, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const platforms = [
    { name: 'facebook', icon: Facebook },
    { name: 'messenger', icon: MessageCircle },
    { name: 'linkedin', icon: Linkedin },
    { name: 'instagram', icon: Instagram },
  ];

  return (
    <header className="h-12 border-b border-border bg-card px-4 flex items-center justify-between">
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

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Bell className="h-3.5 w-3.5" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs font-normal">
          <Badge variant="outline" className="h-5 w-5 rounded-sm p-0 text-[10px] font-normal">
            A
          </Badge>
          <span>admin</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </header>
  );
}

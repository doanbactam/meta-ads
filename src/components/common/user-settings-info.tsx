'use client';

import { Clock, Globe, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUserSettings } from '@/lib/client/contexts/user-settings-context';

interface UserSettingsInfoProps {
  collapsed?: boolean;
}

export function UserSettingsInfo({ collapsed = false }: UserSettingsInfoProps) {
  const { settings } = useUserSettings();

  const formatTimezone = (timezone: string) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find((part) => part.type === 'timeZoneName')?.value;
      return timeZoneName || timezone;
    } catch {
      return timezone;
    }
  };

  const getLanguageName = (locale: string) => {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: 'language' });
      const languageCode = locale.split('-')[0];
      return displayNames.of(languageCode) || locale;
    } catch {
      return locale;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {collapsed ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs font-normal hover:bg-muted/50"
            title="User Settings (Auto-detected)"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs font-normal hover:bg-muted/50"
          >
            <Info className="mr-2 h-3.5 w-3.5" />
            settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            User Settings
          </DialogTitle>
          <DialogDescription>
            Your preferences are automatically detected from your browser and system settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              Language & Region
            </div>
            <div className="pl-6 text-sm text-muted-foreground">
              <div className="font-mono">{settings.locale}</div>
              <div>{getLanguageName(settings.locale)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Timezone
            </div>
            <div className="pl-6 text-sm text-muted-foreground">
              <div className="font-mono">{settings.timezone}</div>
              <div>{formatTimezone(settings.timezone)}</div>
            </div>
          </div>

          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>Currency is automatically determined by your Facebook Ad Account settings.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

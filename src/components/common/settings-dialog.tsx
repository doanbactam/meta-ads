'use client';

import { useState } from 'react';
import { Settings, Globe, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUserSettings } from '@/lib/client/contexts/user-settings-context';
import { SUPPORTED_CURRENCIES, SUPPORTED_LOCALES, getCurrencyByCode, getLocaleByCode } from '@/lib/shared/currency';

const TIMEZONES = [
  { code: 'UTC', name: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { code: 'America/New_York', name: 'Eastern Time (US & Canada)', offset: '-05:00' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (US & Canada)', offset: '-08:00' },
  { code: 'Europe/Berlin', name: 'Berlin (CET)', offset: '+01:00' },
  { code: 'Asia/Tokyo', name: 'Tokyo (JST)', offset: '+09:00' },
  { code: 'Asia/Ho_Chi_Minh', name: 'Ho Chi Minh City (ICT)', offset: '+07:00' },
];

interface SettingsDialogProps {
  trigger?: React.ReactNode;
}

export function SettingsDialog({ trigger }: SettingsDialogProps) {
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const currentCurrency = getCurrencyByCode(localSettings.preferredCurrency);
  const currentLocale = getLocaleByCode(localSettings.preferredLocale);
  const currentTimezone = TIMEZONES.find(tz => tz.code === localSettings.preferredTimezone);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            User Settings
          </DialogTitle>
          <DialogDescription>
            Configure your preferred currency, language, and timezone for the dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Currency Setting */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Preferred Currency
            </Label>
            <Select
              value={localSettings.preferredCurrency}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, preferredCurrency: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {currentCurrency ? (
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs">{currentCurrency.symbol}</span>
                      <span>{currentCurrency.code}</span>
                      <span className="text-muted-foreground">- {currentCurrency.name}</span>
                    </span>
                  ) : (
                    'Select currency'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs w-6">{currency.symbol}</span>
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-muted-foreground">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Locale Setting */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              Language & Region
            </Label>
            <Select
              value={localSettings.preferredLocale}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, preferredLocale: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {currentLocale ? (
                    <span className="flex items-center gap-2">
                      <span>{currentLocale.flag}</span>
                      <span>{currentLocale.name}</span>
                    </span>
                  ) : (
                    'Select language'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {SUPPORTED_LOCALES.map((locale) => (
                  <SelectItem key={locale.code} value={locale.code}>
                    <div className="flex items-center gap-2">
                      <span>{locale.flag}</span>
                      <span>{locale.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone Setting */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Timezone
            </Label>
            <Select
              value={localSettings.preferredTimezone}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, preferredTimezone: value }))}
            >
              <SelectTrigger>
                <SelectValue>
                  {currentTimezone ? (
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs">{currentTimezone.offset}</span>
                      <span>{currentTimezone.name}</span>
                    </span>
                  ) : (
                    'Select timezone'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {TIMEZONES.map((timezone) => (
                  <SelectItem key={timezone.code} value={timezone.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs w-16">{timezone.offset}</span>
                      <span>{timezone.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
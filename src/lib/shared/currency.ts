export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', locale: 'vi-VN' },
];

export const SUPPORTED_LOCALES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪' },
  { code: 'vi-VN', name: 'Tiếng Việt (Việt Nam)', flag: 'VI' },
];

export function getCurrencyByCode(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
}

export function getLocaleByCode(code: string) {
  return SUPPORTED_LOCALES.find(locale => locale.code === code);
}

export function formatCurrencyWithUserPrefs(
  value: number | null | undefined,
  userCurrency?: string,
  userLocale?: string
): string {
  const currency = userCurrency || 'USD';
  const locale = userLocale || 'en-US';
  
  if (value === null || value === undefined || isNaN(value)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumberWithUserPrefs(
  value: number | null | undefined,
  userLocale?: string
): string {
  const locale = userLocale || 'en-US';
  
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat(locale).format(value);
}
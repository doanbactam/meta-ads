/**
 * Utility functions for automatic locale and timezone detection
 */

export function detectUserLocale(): string {
  if (typeof window === 'undefined') return 'en-US';

  // Try to get locale from browser
  const browserLocale = navigator.language || navigator.languages?.[0];

  // Fallback to common locales if browser locale is not supported
  const supportedLocales = [
    'en-US',
    'en-GB',
    'vi-VN',
    'zh-CN',
    'zh-TW',
    'ja-JP',
    'ko-KR',
    'fr-FR',
    'de-DE',
    'es-ES',
    'it-IT',
    'pt-BR',
    'ru-RU',
    'ar-SA',
  ];

  if (browserLocale && supportedLocales.includes(browserLocale)) {
    return browserLocale;
  }

  // Try to match language part only
  const languageCode = browserLocale?.split('-')[0];
  const matchingLocale = supportedLocales.find((locale) => locale.startsWith(`${languageCode}-`));

  return matchingLocale || 'en-US';
}

export function detectUserTimezone(): string {
  if (typeof window === 'undefined') return 'UTC';

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function getLocaleFromAdAccount(adAccount: any): string {
  // Facebook Ad Account might have locale information
  // For now, use browser detection
  return detectUserLocale();
}

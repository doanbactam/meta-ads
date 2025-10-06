export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
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

export function formatNumber(value: number | null | undefined, locale: string = 'en-US'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  return `${value.toFixed(2)}%`;
}

export function formatDate(date: string | Date | null | undefined, locale: string = 'en-US'): string {
  if (!date) {
    return '--';
  }
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '--';
    }
    return dateObj.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
  locale: string = 'en-US'
): string {
  if (!start && !end) {
    return '--';
  }
  if (!start) {
    return `-- - ${formatDate(end, locale)}`;
  }
  if (!end) {
    return `${formatDate(start, locale)} - --`;
  }
  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}

/**
 * Maps Facebook API status to our database enum values
 * Facebook returns: ACTIVE, PAUSED, DELETED, ARCHIVED, etc.
 * We normalize to: ACTIVE, PAUSED, DELETED, ARCHIVED, PENDING, ENDED, etc.
 */
export function mapFacebookStatus(
  status: string,
  entityType: 'campaign' | 'adset' | 'ad' = 'ad'
): string {
  // Normalize to uppercase
  const normalizedStatus = status.toUpperCase();
  
  // Map Facebook statuses to our enum values
  const statusMap: { [key: string]: string } = {
    // Direct mappings
    'ACTIVE': 'ACTIVE',
    'PAUSED': 'PAUSED',
    'DELETED': 'DELETED',
    'ARCHIVED': 'ARCHIVED',
    'PENDING': 'PENDING',
    
    // Facebook-specific mappings
    'ELIGIBLE': 'ACTIVE',
    'DISAPPROVED': 'DISAPPROVED',
    'REMOVED': 'DELETED',
    'ENDED': 'ENDED',
    'REVIEW': 'REVIEW',
    'REJECTED': 'REJECTED',
    
    // Effective status mappings
    'CAMPAIGN_PAUSED': 'PAUSED',
    'ADSET_PAUSED': 'PAUSED',
    'AD_PAUSED': 'PAUSED',
  };
  
  return statusMap[normalizedStatus] || 'PENDING';
}

/**
 * Converts string date to DateTime object
 * Handles various date formats from Facebook API
 */
export function parseDate(dateString: string | null | undefined): Date {
  if (!dateString) {
    return new Date();
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch {
    return new Date();
  }
}

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

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return '--';
  }
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '--';
    }
    return dateObj.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export function formatDateRange(start: string | Date | null | undefined, end: string | Date | null | undefined): string {
  if (!start && !end) {
    return '--';
  }
  if (!start) {
    return `-- - ${formatDate(end)}`;
  }
  if (!end) {
    return `${formatDate(start)} - --`;
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function mapFacebookStatus(status: string, entityType: 'campaign' | 'adset' | 'ad' = 'ad'): string {
  const statusMap: { [key: string]: string } = {
    'ACTIVE': entityType === 'campaign' ? 'Eligible' : 'Active',
    'PAUSED': 'Paused',
    'DELETED': 'Removed',
    'ARCHIVED': 'Ended',
  };
  return statusMap[status] || 'Pending';
}

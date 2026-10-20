export function formatEGP(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ج.م';
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount) + ' ج.م';
}

export function formatNumberOnly(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDateArabic(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Cairo'
    }).format(d);
  } catch (e) {
    return isoDate;
  }
}

export function formatDateShort(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Africa/Cairo'
    }).format(d);
  } catch (e) {
    return isoDate;
  }
}

export function formatTimeOnly(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Cairo'
    }).format(d);
  } catch (e) {
    return isoDate;
  }
}

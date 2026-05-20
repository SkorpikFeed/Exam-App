const DEFAULT_LOCALE = "uk-UA";

export function formatShortDate(date: Date, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatLongDate(date: Date, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(date: Date, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, decimals = 0): string {
  const normalized = value > 1 ? value / 100 : value;
  return `${(normalized * 100).toFixed(decimals)}%`;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 1) {
    return "Менше 1 хв";
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} хв`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  if (remaining === 0) {
    return `${hours} год`;
  }
  return `${hours} год ${remaining} хв`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function diffInDays(a: Date, b: Date): number {
  const startA = startOfDay(a).getTime();
  const startB = startOfDay(b).getTime();
  return Math.round((startA - startB) / 86400000);
}

export function formatRelativeDay(date: Date, base = new Date()): string {
  const diff = diffInDays(date, base);
  if (diff === 0) {
    return "Сьогодні";
  }
  if (diff === 1) {
    return "Завтра";
  }
  if (diff === -1) {
    return "Вчора";
  }
  if (diff < 0) {
    return `Запізнення на ${Math.abs(diff)} дн`;
  }
  return `Через ${diff} дн`;
}

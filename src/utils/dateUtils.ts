import { AgeCategory } from '../types/club';

export const TURKISH_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

export const TURKISH_WEEKDAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

export const TURKISH_WEEKDAYS_FULL = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
] as const;

/**
 * Formats year, month (1-12), day (1-31) into YYYY-MM-DD without timezone shifts.
 */
export function toISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD safely into numeric parts without Date UTC parsing pitfalls.
 */
export function parseISODate(iso: string): { year: number; month: number; day: number } {
  const parts = iso.split('-');
  if (parts.length !== 3) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }
  return {
    year: Number(parts[0]),
    month: Number(parts[1]),
    day: Number(parts[2]),
  };
}

/**
 * Returns local today's date as YYYY-MM-DD.
 */
export function getTodayISO(): string {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string safely in local calendar space.
 */
export function shiftISODate(iso: string, deltaDays: number): string {
  const { year, month, day } = parseISODate(iso);
  const dt = new Date(year, month - 1, day + deltaDays);
  return toISODate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/**
 * Returns number of days in given month (1-12).
 */
export function getDaysCountInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns list of YYYY-MM-DD strings for all days in a given month (1-12).
 */
export function getMonthDaysISO(year: number, month: number): string[] {
  const total = getDaysCountInMonth(year, month);
  const days: string[] = [];
  for (let d = 1; d <= total; d++) {
    days.push(toISODate(year, month, d));
  }
  return days;
}

/**
 * Returns weekday index (0=Paz, 1=Pzt, ..., 6=Cmt) for a YYYY-MM-DD string.
 */
export function getWeekdayIndex(iso: string): number {
  const { year, month, day } = parseISODate(iso);
  return new Date(year, month - 1, day).getDay();
}

/**
 * Formats YYYY-MM-DD to "17 Kasım 2026"
 */
export function formatDateTR(iso: string): string {
  if (!iso) return '-';
  const { year, month, day } = parseISODate(iso);
  const monthName = TURKISH_MONTHS[month - 1] ?? '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Formats YYYY-MM-DD to "17.11.2026"
 */
export function formatDateShortTR(iso: string): string {
  if (!iso) return '-';
  const { year, month, day } = parseISODate(iso);
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
}

/**
 * Calculates exact age and Taekwondo competition age category (Minikler, Yıldızlar, Gençler, Büyükler).
 */
export function calculateAgeAndCategory(birthDateISO: string, referenceISO = getTodayISO()): {
  age: number;
  category: AgeCategory;
} {
  if (!birthDateISO) {
    return { age: 0, category: 'Minikler' };
  }
  const birth = parseISODate(birthDateISO);
  const ref = parseISODate(referenceISO);

  let age = ref.year - birth.year;
  if (ref.month < birth.month || (ref.month === birth.month && ref.day < birth.day)) {
    age -= 1;
  }
  age = Math.max(0, age);

  let category: AgeCategory = 'Büyükler';
  if (age <= 11) {
    category = 'Minikler';
  } else if (age <= 14) {
    category = 'Yıldızlar';
  } else if (age <= 17) {
    category = 'Gençler';
  } else {
    category = 'Büyükler';
  }

  return { age, category };
}

/**
 * Returns full months elapsed between two YYYY-MM-DD dates.
 */
export function monthsBetweenISO(startISO: string, endISO = getTodayISO()): number {
  if (!startISO) return 0;
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  let months = (end.year - start.year) * 12 + (end.month - start.month);
  if (end.day < start.day) {
    months -= 1;
  }
  return Math.max(0, months);
}

/**
 * Formats phone number into clean wa.me link digits (Turkey 90 prefix).
 */
export function formatWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (digits.startsWith('0') && digits.length === 11) {
    normalized = `90${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith('5')) {
    normalized = `90${digits}`;
  }
  const base = `https://wa.me/${normalized}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

import { BeltLevel, TrainingGroup } from '../types/club';

export interface BeltStyleMeta {
  level: BeltLevel;
  order: number;
  primaryHex: string;
  secondaryHex?: string; // For split belts (Sarı-Yeşil, Kırmızı-Siyah, etc.)
  stripeHex?: string; // Gold Dan bar for black belts
  danCount?: number;
  textColorClass: string;
  barGradient: string;
  minMonthsForNextExam: number;
}

export const BELT_DEFINITIONS: BeltStyleMeta[] = [
  {
    level: 'Beyaz',
    order: 1,
    primaryHex: '#F8FAFC',
    textColorClass: 'text-slate-700',
    barGradient: 'linear-gradient(90deg, #F8FAFC 0%, #E2E8F0 100%)',
    minMonthsForNextExam: 3,
  },
  {
    level: 'Sarı',
    order: 2,
    primaryHex: '#FACC15',
    textColorClass: 'text-amber-700',
    barGradient: '#FACC15',
    minMonthsForNextExam: 3,
  },
  {
    level: 'Sarı-Yeşil',
    order: 3,
    primaryHex: '#FACC15',
    secondaryHex: '#16A34A',
    textColorClass: 'text-emerald-700',
    barGradient: 'linear-gradient(180deg, #FACC15 50%, #16A34A 50%)',
    minMonthsForNextExam: 3,
  },
  {
    level: 'Yeşil',
    order: 4,
    primaryHex: '#16A34A',
    textColorClass: 'text-emerald-700',
    barGradient: '#16A34A',
    minMonthsForNextExam: 4,
  },
  {
    level: 'Yeşil-Mavi',
    order: 5,
    primaryHex: '#16A34A',
    secondaryHex: '#2563EB',
    textColorClass: 'text-blue-700',
    barGradient: 'linear-gradient(180deg, #16A34A 50%, #2563EB 50%)',
    minMonthsForNextExam: 4,
  },
  {
    level: 'Mavi',
    order: 6,
    primaryHex: '#2563EB',
    textColorClass: 'text-blue-700',
    barGradient: '#2563EB',
    minMonthsForNextExam: 4,
  },
  {
    level: 'Mavi-Kırmızı',
    order: 7,
    primaryHex: '#2563EB',
    secondaryHex: '#DC2626',
    textColorClass: 'text-rose-700',
    barGradient: 'linear-gradient(180deg, #2563EB 50%, #DC2626 50%)',
    minMonthsForNextExam: 4,
  },
  {
    level: 'Kırmızı',
    order: 8,
    primaryHex: '#DC2626',
    textColorClass: 'text-red-700',
    barGradient: '#DC2626',
    minMonthsForNextExam: 5,
  },
  {
    level: 'Kırmızı-Siyah',
    order: 9,
    primaryHex: '#DC2626',
    secondaryHex: '#0F172A',
    textColorClass: 'text-slate-900',
    barGradient: 'linear-gradient(180deg, #DC2626 50%, #0F172A 50%)',
    minMonthsForNextExam: 6,
  },
  {
    level: 'Siyah 1. Poom',
    order: 10,
    primaryHex: '#DC2626',
    secondaryHex: '#0F172A',
    stripeHex: '#F59E0B',
    danCount: 1,
    textColorClass: 'text-slate-900',
    barGradient: 'linear-gradient(180deg, #DC2626 50%, #0F172A 50%)',
    minMonthsForNextExam: 12,
  },
  {
    level: 'Siyah 1. Dan',
    order: 11,
    primaryHex: '#0F172A',
    stripeHex: '#F59E0B',
    danCount: 1,
    textColorClass: 'text-slate-900',
    barGradient: '#0F172A',
    minMonthsForNextExam: 12,
  },
  {
    level: 'Siyah 2. Dan',
    order: 12,
    primaryHex: '#0F172A',
    stripeHex: '#F59E0B',
    danCount: 2,
    textColorClass: 'text-slate-900',
    barGradient: '#0F172A',
    minMonthsForNextExam: 24,
  },
  {
    level: 'Siyah 3. Dan',
    order: 13,
    primaryHex: '#0F172A',
    stripeHex: '#F59E0B',
    danCount: 3,
    textColorClass: 'text-slate-900',
    barGradient: '#0F172A',
    minMonthsForNextExam: 36,
  },
];

export const BELT_MAP: Record<BeltLevel, BeltStyleMeta> = BELT_DEFINITIONS.reduce(
  (acc, item) => {
    acc[item.level] = item;
    return acc;
  },
  {} as Record<BeltLevel, BeltStyleMeta>
);

export const TRAINING_GROUPS: TrainingGroup[] = [
  'Minik Başlangıç',
  'Yıldız Müsabık',
  'Genç-Büyük Akşam Grubu',
  'Poomsae Özel Grubu',
];

export function getBeltMeta(level: BeltLevel): BeltStyleMeta {
  return BELT_MAP[level] ?? BELT_DEFINITIONS[0];
}

export function getNextBelt(current: BeltLevel): BeltLevel | null {
  const idx = BELT_DEFINITIONS.findIndex((b) => b.level === current);
  if (idx === -1 || idx >= BELT_DEFINITIONS.length - 1) {
    return null;
  }
  return BELT_DEFINITIONS[idx + 1].level;
}

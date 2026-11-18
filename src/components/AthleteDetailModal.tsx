import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  HeartPulse,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { Athlete, AttendanceRecord } from '../types/club';
import {
  calculateAgeAndCategory,
  formatDateTR,
  getMonthDaysISO,
  getTodayISO,
  getWeekdayIndex,
  monthsBetweenISO,
  parseISODate,
  TURKISH_MONTHS,
} from '../utils/dateUtils';
import { getBeltMeta } from '../utils/beltUtils';
import { BeltBadge } from './BeltBadge';

interface AthleteDetailModalProps {
  athlete: Athlete | null;
  attendance: AttendanceRecord[];
  onClose: () => void;
  onEdit: (athlete: Athlete) => void;
  onOpenWhatsApp: (athlete: Athlete) => void;
  onPromoteBelt: (athlete: Athlete) => void;
}

export const AthleteDetailModal: React.FC<AthleteDetailModalProps> = ({
  athlete,
  attendance,
  onClose,
  onEdit,
  onOpenWhatsApp,
  onPromoteBelt,
}) => {
  const todayParts = parseISODate(getTodayISO());
  const [selectedYear, setSelectedYear] = useState(todayParts.year);
  const [selectedMonth, setSelectedMonth] = useState(todayParts.month);

  const athleteRecords = useMemo(() => {
    if (!athlete) return [];
    return attendance.filter((r) => r.athleteId === athlete.id);
  }, [athlete, attendance]);

  const monthStats = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-`;
    const recordsInMonth = athleteRecords.filter((r) => r.date.startsWith(prefix));
    const map = new Map<string, AttendanceRecord>();
    recordsInMonth.forEach((r) => map.set(r.date, r));

    let g = 0;
    let x = 0;
    let i = 0;
    recordsInMonth.forEach((r) => {
      if (r.status === 'G') g++;
      else if (r.status === 'X') x++;
      else i++;
    });

    const total = g + x + i;
    const rate = total > 0 ? Math.round((g / total) * 100) : 0;

    return { map, g, x, i, total, rate, recordsInMonth };
  }, [athleteRecords, selectedYear, selectedMonth]);

  if (!athlete) return null;

  const { age, category } = calculateAgeAndCategory(athlete.birthDate);
  const beltMeta = getBeltMeta(athlete.beltLevel);
  const monthsAtBelt = monthsBetweenISO(athlete.lastBeltDate);
  const examReady = monthsAtBelt >= beltMeta.minMonthsForNextExam;

  const monthDays = getMonthDaysISO(selectedYear, selectedMonth);
  // Monday-first grid offset (0=Pzt ... 6=Paz)
  const firstWeekday = getWeekdayIndex(monthDays[0]);
  const leadingEmptyCells = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="athlete-detail-title"
    >
      <div className="w-full sm:max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="athlete-detail-title" className="text-xl font-bold tracking-tight truncate">
                {athlete.fullName}
              </h2>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  athlete.status === 'Aktif'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : athlete.status === 'Dondurulmuş'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                }`}
              >
                {athlete.status}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>{athlete.trainingGroup}</span>
              <span aria-hidden="true">·</span>
              <span>
                {age} yaş ({category})
              </span>
              <span aria-hidden="true">·</span>
              <span>{athlete.gender}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(athlete)}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4" />
              <span>Düzenle</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Belt & License */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Kuşak ve Lisans Bilgileri</span>
              </div>
              <div className="flex items-center justify-between">
                <BeltBadge belt={athlete.beltLevel} />
                <span className="text-xs text-slate-600 tabular-nums">
                  Terfi: {formatDateTR(athlete.lastBeltDate)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">
                  Kuşak süresi:{' '}
                  <strong className="text-slate-900 tabular-nums">{monthsAtBelt} ay</strong>
                </span>
                <span
                  className={`font-semibold ${
                    examReady ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {examReady
                    ? 'Sınav süresi doldu'
                    : `Sınava ${Math.max(0, beltMeta.minMonthsForNextExam - monthsAtBelt)} ay`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onPromoteBelt(athlete)}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span>Kuşak Atlat</span>
              </button>

              {athlete.beltHistory && athlete.beltHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500">Kuşak Terfi Geçmişi</div>
                  {athlete.beltHistory.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="text-[11px] text-slate-700 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {entry.fromBelt} → <strong>{entry.toBelt}</strong>
                      </span>
                      <span className="font-mono text-slate-500 shrink-0">
                        {formatDateTR(entry.promotedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Lisans:{' '}
                  <strong className="font-mono text-slate-900">
                    {athlete.licenseNo || 'Belirtilmedi'}
                  </strong>
                </span>
                <span
                  className={`font-semibold ${
                    athlete.licenseStatus === 'Aktif'
                      ? 'text-emerald-700'
                      : athlete.licenseStatus === 'Beklemede'
                        ? 'text-amber-700'
                        : 'text-red-700'
                  }`}
                >
                  {athlete.licenseStatus}
                </span>
              </div>
              {athlete.tcIdentityNo && (
                <div className="text-xs text-slate-600">
                  T.C. Kimlik: <span className="font-mono text-slate-800">{athlete.tcIdentityNo}</span>
                </div>
              )}
            </div>

            {/* Parent Contact & Health */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <User className="w-4 h-4 text-red-600" />
                <span>Veli İletişim ve Sağlık Notu</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {athlete.parentName || 'Veli bilgisi girilmedi'}
                </div>
                {athlete.parentPhone ? (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(athlete)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-mono font-semibold mt-0.5 text-left"
                    title="WhatsApp mesajı gönder"
                  >
                    {athlete.parentPhone}
                  </button>
                ) : (
                  <div className="text-xs text-slate-500 font-mono mt-0.5">-</div>
                )}
              </div>

              {athlete.parentPhone && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(athlete)}
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Mesaj Gönder</span>
                  </button>
                  <a
                    href={`tel:${athlete.parentPhone.replace(/\s+/g, '')}`}
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Ara</span>
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2 text-xs text-slate-700">
                <HeartPulse className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  {athlete.healthNotes
                    ? athlete.healthNotes
                    : 'Kayıtlı sağlık sorunu veya özel not bulunmuyor.'}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Attendance Calendar */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Kişisel Aylık Devam Takvimi
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  aria-label="Önceki ay"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-slate-900 min-w-[120px] text-center">
                  {TURKISH_MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  aria-label="Sonraki ay"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monthly Summary Strip */}
            <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Antrenman</div>
                <div className="text-base font-bold text-slate-900 tabular-nums">
                  {monthStats.total}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-emerald-700 font-medium">Geldi (G)</div>
                <div className="text-base font-bold text-emerald-700 tabular-nums">
                  {monthStats.g}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-red-700 font-medium">Gelmedi (X)</div>
                <div className="text-base font-bold text-red-700 tabular-nums">
                  {monthStats.x}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-600 font-medium">Devam Oranı</div>
                <div
                  className={`text-base font-bold tabular-nums ${
                    monthStats.total === 0
                      ? 'text-slate-400'
                      : monthStats.rate >= 85
                        ? 'text-emerald-700'
                        : monthStats.rate >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                  }`}
                >
                  {monthStats.total > 0 ? `%${monthStats.rate}` : '-'}
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500 mb-1.5">
                <span>Pzt</span>
                <span>Sal</span>
                <span>Çar</span>
                <span>Per</span>
                <span>Cum</span>
                <span>Cmt</span>
                <span>Paz</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: leadingEmptyCells }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-10 rounded-lg bg-slate-50/40" />
                ))}
                {monthDays.map((iso) => {
                  const dayNum = parseISODate(iso).day;
                  const rec = monthStats.map.get(iso);
                  const status = rec?.status;

                  let cellStyle = 'bg-slate-50 text-slate-500 border-slate-100';
                  if (status === 'G') {
                    cellStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
                  } else if (status === 'X') {
                    cellStyle = 'bg-red-50 text-red-800 border-red-200 font-semibold';
                  } else if (status === 'I') {
                    cellStyle = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
                  }

                  return (
                    <div
                      key={iso}
                      title={rec?.note ? `${formatDateTR(iso)}: ${rec.note}` : formatDateTR(iso)}
                      className={`h-10 rounded-lg border flex flex-col items-center justify-center text-xs tabular-nums ${cellStyle}`}
                    >
                      <span className="leading-none">{dayNum}</span>
                      {status && (
                        <span className="text-[10px] leading-none mt-0.5">
                          {status === 'I' ? 'İ' : status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Notes in Month */}
            {monthStats.recordsInMonth.some((r) => r.note) && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-xs font-semibold text-slate-700">Antrenman Notları</div>
                {monthStats.recordsInMonth
                  .filter((r) => r.note)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((r) => (
                    <div
                      key={r.id}
                      className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg"
                    >
                      <span className="font-mono text-slate-500 shrink-0">
                        {formatDateTR(r.date)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-800">{r.note}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

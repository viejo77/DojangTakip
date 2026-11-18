import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Save,
  Search,
  Users,
} from 'lucide-react';
import { Athlete, AttendanceRecord, AttendanceStatus, TrainingGroup } from '../types/club';
import { TRAINING_GROUPS } from '../utils/beltUtils';
import {
  formatDateTR,
  getTodayISO,
  getWeekdayIndex,
  shiftISODate,
  TURKISH_WEEKDAYS_FULL,
} from '../utils/dateUtils';
import { BeltBadge } from './BeltBadge';

interface QuickAttendanceViewProps {
  athletes: Athlete[];
  attendance: AttendanceRecord[];
  selectedDate: string;
  onChangeDate: (dateISO: string) => void;
  onSaveAttendance: (
    dateISO: string,
    entries: Array<{ athleteId: string; status: AttendanceStatus | null; note?: string }>
  ) => void;
  onGoToAthletes: () => void;
}

interface DraftRowState {
  status: AttendanceStatus | null;
  note: string;
}

export const QuickAttendanceView: React.FC<QuickAttendanceViewProps> = ({
  athletes,
  attendance,
  selectedDate,
  onChangeDate,
  onSaveAttendance,
  onGoToAthletes,
}) => {
  const [groupFilter, setGroupFilter] = useState<TrainingGroup | 'Tümü'>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<string, DraftRowState>>({});
  const [openNoteIds, setOpenNoteIds] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const activeAthletes = useMemo(
    () => athletes.filter((a) => a.status === 'Aktif'),
    [athletes]
  );

  // Sync draft state whenever date or stored attendance changes
  useEffect(() => {
    const existingForDate = attendance.filter((r) => r.date === selectedDate);
    const map: Record<string, DraftRowState> = {};
    const openNotes: Record<string, boolean> = {};

    activeAthletes.forEach((athlete) => {
      const rec = existingForDate.find((r) => r.athleteId === athlete.id);
      map[athlete.id] = {
        status: rec ? rec.status : null,
        note: rec?.note ?? '',
      };
      if (rec?.note) {
        openNotes[athlete.id] = true;
      }
    });

    setDrafts(map);
    setOpenNoteIds(openNotes);
    setHasUnsavedChanges(false);
  }, [selectedDate, attendance, activeAthletes]);

  const visibleAthletes = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return activeAthletes.filter((a) => {
      if (groupFilter !== 'Tümü' && a.trainingGroup !== groupFilter) return false;
      if (q && !a.fullName.toLocaleLowerCase('tr-TR').includes(q)) return false;
      return true;
    });
  }, [activeAthletes, groupFilter, searchQuery]);

  const summary = useMemo(() => {
    let g = 0;
    let x = 0;
    let i = 0;
    let empty = 0;

    visibleAthletes.forEach((athlete) => {
      const st = drafts[athlete.id]?.status;
      if (st === 'G') g++;
      else if (st === 'X') x++;
      else if (st === 'I') i++;
      else empty++;
    });

    return { g, x, i, empty, total: visibleAthletes.length };
  }, [visibleAthletes, drafts]);

  const setStatusForAthlete = (athleteId: string, nextStatus: AttendanceStatus) => {
    setDrafts((prev) => {
      const current = prev[athleteId] ?? { status: null, note: '' };
      const toggled = current.status === nextStatus ? null : nextStatus;
      return {
        ...prev,
        [athleteId]: { ...current, status: toggled },
      };
    });
    setHasUnsavedChanges(true);
  };

  const setNoteForAthlete = (athleteId: string, note: string) => {
    setDrafts((prev) => {
      const current = prev[athleteId] ?? { status: null, note: '' };
      return {
        ...prev,
        [athleteId]: { ...current, note },
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    setDrafts((prev) => {
      const next = { ...prev };
      visibleAthletes.forEach((athlete) => {
        const current = next[athlete.id] ?? { status: null, note: '' };
        next[athlete.id] = { ...current, status: 'G' };
      });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const entries = activeAthletes.map((athlete) => {
      const row = drafts[athlete.id] ?? { status: null, note: '' };
      return {
        athleteId: athlete.id,
        status: row.status,
        note: row.note,
      };
    });
    onSaveAttendance(selectedDate, entries);
    setHasUnsavedChanges(false);
  };

  const todayISO = getTodayISO();
  const weekdayName = TURKISH_WEEKDAYS_FULL[getWeekdayIndex(selectedDate)];
  const hasExistingRecordsForDate = attendance.some((r) => r.date === selectedDate);

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Hızlı Antrenman Yoklaması
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {formatDateTR(selectedDate)} · {weekdayName}
            {hasExistingRecordsForDate && (
              <span className="text-blue-700 font-medium"> · Kayıtlı yoklama düzenleniyor</span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="hidden sm:inline-flex min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors items-center gap-2 shadow-xs whitespace-nowrap shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{hasUnsavedChanges ? 'Yoklamayı Kaydet' : 'Kaydet / Güncelle'}</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Date Selector with Quick Prev/Today/Next */}
          <div className="md:col-span-5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangeDate(shiftISODate(selectedDate, -1))}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shrink-0"
              aria-label="Önceki gün"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onChangeDate(e.target.value)}
              aria-label="Yoklama tarihi"
              className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => onChangeDate(shiftISODate(selectedDate, 1))}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shrink-0"
              aria-label="Sonraki gün"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            {selectedDate !== todayISO && (
              <button
                type="button"
                onClick={() => onChangeDate(todayISO)}
                className="min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 whitespace-nowrap shrink-0"
              >
                Bugün
              </button>
            )}
          </div>

          {/* Group Filter */}
          <div className="md:col-span-4">
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as TrainingGroup | 'Tümü')}
              aria-label="Antrenman grubu"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Tümü">Tüm Gruplar ({activeAthletes.length})</option>
              {TRAINING_GROUPS.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim ara..."
              className="w-full min-h-[44px] pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Action & Live Tally Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={visibleAthletes.length === 0}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tümünü Geldi İşaretle</span>
          </button>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold tabular-nums">
            <span className="text-emerald-700">Geldi: {summary.g}</span>
            <span className="text-red-700">Gelmedi: {summary.x}</span>
            <span className="text-amber-700">İzinli: {summary.i}</span>
            <span className="text-slate-500">İşaretsiz: {summary.empty}</span>
          </div>
        </div>
      </div>

      {/* Athlete Attendance List */}
      {visibleAthletes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Aktif Sporcu Listesi Boş
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Seçili antrenman grubunda aktif sporcu bulunmuyor. Sporcu kütüphanesinden yeni aktif sporcu ekleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={onGoToAthletes}
            className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Sporcu Kütüphanesine Git
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {visibleAthletes.map((athlete) => {
            const row = drafts[athlete.id] ?? { status: null, note: '' };
            const isNoteOpen = Boolean(openNoteIds[athlete.id]);

            return (
              <div key={athlete.id} className="p-3.5 sm:px-5 sm:py-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Athlete Identity */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-slate-900 truncate">
                        {athlete.fullName}
                      </span>
                      <BeltBadge belt={athlete.beltLevel} size="sm" showText={false} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>{athlete.beltLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{athlete.trainingGroup}</span>
                    </div>
                  </div>

                  {/* Large Touch-Friendly Status Buttons + Note Trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatusForAthlete(athlete.id, 'G')}
                      aria-pressed={row.status === 'G'}
                      className={`flex-1 sm:flex-none min-h-[48px] min-w-[74px] sm:min-w-[88px] px-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                        row.status === 'G'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span>G</span>
                      <span className="text-xs font-medium">Geldi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusForAthlete(athlete.id, 'X')}
                      aria-pressed={row.status === 'X'}
                      className={`flex-1 sm:flex-none min-h-[48px] min-w-[80px] sm:min-w-[94px] px-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                        row.status === 'X'
                          ? 'bg-red-600 text-white border-red-700 shadow-xs'
                          : 'bg-red-50/50 text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <span>X</span>
                      <span className="text-xs font-medium">Gelmedi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusForAthlete(athlete.id, 'I')}
                      aria-pressed={row.status === 'I'}
                      className={`flex-1 sm:flex-none min-h-[48px] min-w-[74px] sm:min-w-[84px] px-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                        row.status === 'I'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span>İ</span>
                      <span className="text-xs font-medium">İzinli</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenNoteIds((prev) => ({
                          ...prev,
                          [athlete.id]: !prev[athlete.id],
                        }))
                      }
                      className={`min-h-[48px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors ${
                        row.note.trim() || isNoteOpen
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Kısa not ekle"
                      aria-label={`${athlete.fullName} için not ekle`}
                    >
                      <MessageSquarePlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Short Note Input */}
                {isNoteOpen && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => setNoteForAthlete(athlete.id, e.target.value)}
                      placeholder="Kısa not: Örn. Geç kaldı, sakatlık izni, okul sınavı..."
                      className="flex-1 min-h-[40px] px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop Bottom Save Bar */}
      {visibleAthletes.length > 0 && (
        <div className="hidden sm:flex items-center justify-between bg-slate-900 text-white rounded-2xl px-5 py-3.5">
          <div className="text-sm">
            <span className="font-semibold">{formatDateTR(selectedDate)}</span> tarihli yoklamada{' '}
            <span className="font-mono font-bold text-emerald-400">{summary.g} geldi</span>,{' '}
            <span className="font-mono font-bold text-red-400">{summary.x} gelmedi</span>,{' '}
            <span className="font-mono font-bold text-amber-400">{summary.i} izinli</span>.
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            <span>Yoklamayı Kaydet</span>
          </button>
        </div>
      )}

      {/* Mobile Sticky Save CTA (Positioned cleanly above the 64px Bottom Nav Bar) */}
      {visibleAthletes.length > 0 && (
        <div className="sm:hidden fixed bottom-[68px] left-0 right-0 z-30 px-4 py-2 pointer-events-none">
          <button
            type="button"
            onClick={handleSave}
            className="pointer-events-auto w-full min-h-[48px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-transform"
          >
            <Save className="w-4 h-4" />
            <span>
              Yoklamayı Kaydet ({summary.g}G / {summary.x}X / {summary.i}İ)
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

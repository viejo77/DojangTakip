import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileDown,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Athlete,
  AttendanceRecord,
  AttendanceStatus,
  ClubMetadata,
  TrainingGroup,
} from '../types/club';
import { TRAINING_GROUPS } from '../utils/beltUtils';
import {
  formatDateTR,
  getMonthDaysISO,
  getTodayISO,
  getWeekdayIndex,
  parseISODate,
  TURKISH_MONTHS,
  TURKISH_WEEKDAYS_SHORT,
} from '../utils/dateUtils';
import {
  downloadClubBackupJSON,
  downloadMonthlyAttendanceCSV,
  downloadMonthlyAttendancePDF,
} from '../utils/exportUtils';
import { BeltBadge } from './BeltBadge';

interface MonthlyMatrixViewProps {
  athletes: Athlete[];
  attendance: AttendanceRecord[];
  metadata: ClubMetadata;
  onUpdateCell: (dateISO: string, athleteId: string, status: AttendanceStatus | null) => void;
  onImportBackup: (file: File) => void;
  onRequestResetSeed: () => void;
  onRequestClearData: () => void;
}

export const MonthlyMatrixView: React.FC<MonthlyMatrixViewProps> = ({
  athletes,
  attendance,
  metadata,
  onUpdateCell,
  onImportBackup,
  onRequestResetSeed,
  onRequestClearData,
}) => {
  const todayParts = parseISODate(getTodayISO());
  const [selectedYear, setSelectedYear] = useState(todayParts.year);
  const [selectedMonth, setSelectedMonth] = useState(todayParts.month);
  const [groupFilter, setGroupFilter] = useState<TrainingGroup | 'Tümü'>('Tümü');
  const [onlyRecordedDays, setOnlyRecordedDays] = useState(false);

  // Quick inline edit popover state: { athleteId, dateISO, athleteName }
  const [editingCell, setEditingCell] = useState<{
    athleteId: string;
    dateISO: string;
    athleteName: string;
    currentStatus: AttendanceStatus | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-`;

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (a.status === 'Ayrıldı') return false;
      if (groupFilter !== 'Tümü' && a.trainingGroup !== groupFilter) return false;
      return true;
    });
  }, [athletes, groupFilter]);

  const { attendanceMap, recordedDatesSet, visibleDays } = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    const recordedSet = new Set<string>();

    const athleteIdSet = new Set(filteredAthletes.map((a) => a.id));

    attendance.forEach((rec) => {
      if (rec.date.startsWith(monthPrefix)) {
        map.set(`${rec.date}_${rec.athleteId}`, rec);
        if (athleteIdSet.has(rec.athleteId)) {
          recordedSet.add(rec.date);
        }
      }
    });

    const allDays = getMonthDaysISO(selectedYear, selectedMonth);
    const days = onlyRecordedDays ? allDays.filter((d) => recordedSet.has(d)) : allDays;

    return {
      attendanceMap: map,
      recordedDatesSet: recordedSet,
      visibleDays: days,
    };
  }, [attendance, filteredAthletes, monthPrefix, selectedYear, selectedMonth, onlyRecordedDays]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([todayParts.year - 1, todayParts.year, todayParts.year + 1]);
    attendance.forEach((r) => {
      years.add(parseISODate(r.date).year);
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [attendance, todayParts.year]);

  const handlePrint = () => {
    window.print();
  };

  const handleCSVExport = () => {
    downloadMonthlyAttendanceCSV({
      year: selectedYear,
      month: selectedMonth,
      athletes: filteredAthletes,
      attendanceMap,
      onlyRecordedDays,
      recordedDatesSet,
      clubName: metadata.clubName,
    });
  };

  const handlePDFExport = () => {
    downloadMonthlyAttendancePDF({
      year: selectedYear,
      month: selectedMonth,
      groupLabel: groupFilter === 'Tümü' ? 'Tüm Gruplar' : groupFilter,
      athletes: filteredAthletes,
      attendanceMap,
      onlyRecordedDays,
      recordedDatesSet,
      metadata,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-5 print-container">
      {/* Print-Only Formal Header */}
      <div className="hidden print-only border-b border-slate-300 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {metadata.clubName} — Aylık Devam-Devamsızlık Çizelgesi
            </h1>
            <p className="text-xs text-slate-600">
              Dönem: {TURKISH_MONTHS[selectedMonth - 1]} {selectedYear} · Grup:{' '}
              {groupFilter === 'Tümü' ? 'Tüm Gruplar' : groupFilter}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>{metadata.coachName}</div>
            <div>Yazdırma: {formatDateTR(getTodayISO())}</div>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Aylık Devam-Devamsızlık Çizelgesi
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Hücrelere tıklayarak yoklama durumunu tablo üzerinden hızlıca düzenleyebilirsiniz
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePDFExport}
            disabled={filteredAthletes.length === 0}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF Rapor İndir</span>
          </button>
          <button
            type="button"
            onClick={handleCSVExport}
            disabled={filteredAthletes.length === 0}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (CSV) İndir</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={filteredAthletes.length === 0}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            aria-label="Ay seçimi"
            className="min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          >
            {TURKISH_MONTHS.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Yıl seçimi"
            className="min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-medium"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as TrainingGroup | 'Tümü')}
            aria-label="Grup filtresi"
            className="col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Tümü">Tüm Gruplar</option>
            {TRAINING_GROUPS.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle: All Days vs Only Recorded Days */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setOnlyRecordedDays(false)}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              !onlyRecordedDays
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tüm Günler
          </button>
          <button
            type="button"
            onClick={() => setOnlyRecordedDays(true)}
            className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              onlyRecordedDays
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sadece Yoklama Alınanlar ({recordedDatesSet.size})
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300">
              G
            </span>
            <span>Geldi</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-red-100 text-red-800 font-bold flex items-center justify-center border border-red-300">
              X
            </span>
            <span>Gelmedi</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center border border-amber-300">
              İ
            </span>
            <span>İzinli / Raporlu</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-400 font-bold flex items-center justify-center border border-slate-200">
              -
            </span>
            <span>Yoklama Yok</span>
          </span>
        </div>

        <div className="text-xs text-slate-500">
          Kuşak Sınavı Yeterliliği: <strong className="text-emerald-700">%85+</strong> Uygun ·{' '}
          <strong className="text-amber-600">%60–84</strong> Sınırda ·{' '}
          <strong className="text-red-600">%60 altı</strong> Yetersiz
        </div>
      </div>

      {/* Interactive Matrix Table */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          Bu görünümde listelenecek aktif sporcu bulunmuyor.
        </div>
      ) : visibleDays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">
            {TURKISH_MONTHS[selectedMonth - 1]} {selectedYear} için henüz yoklama alınmış gün bulunmuyor.
          </p>
          <button
            type="button"
            onClick={() => setOnlyRecordedDays(false)}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
          >
            Ayın Tüm Günlerini Göster
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden print-table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="sticky left-0 z-20 bg-slate-900 py-2.5 px-3 text-left font-semibold min-w-[180px] sm:min-w-[220px] border-r border-slate-700 sticky-col-left">
                    Sporcu / Kuşak
                  </th>
                  {visibleDays.map((iso) => {
                    const dayNum = parseISODate(iso).day;
                    const wdShort = TURKISH_WEEKDAYS_SHORT[getWeekdayIndex(iso)];
                    const hasData = recordedDatesSet.has(iso);

                    return (
                      <th
                        key={iso}
                        className={`py-2 px-1 text-center font-medium min-w-[32px] border-r border-slate-800 tabular-nums ${
                          hasData ? 'bg-slate-800/80 text-white' : 'text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] leading-none opacity-80">{wdShort}</div>
                        <div className="text-xs font-bold mt-0.5">{dayNum}</div>
                      </th>
                    );
                  })}
                  <th
                    title="Toplam Antrenman Günü"
                    className="py-2 px-2 text-center font-semibold bg-slate-800 border-l border-slate-700 min-w-[40px]"
                  >
                    Top
                  </th>
                  <th
                    title="Geldiği Gün"
                    className="py-2 px-2 text-center font-semibold bg-slate-800 text-emerald-300 min-w-[36px]"
                  >
                    G
                  </th>
                  <th
                    title="Gelmediği Gün"
                    className="py-2 px-2 text-center font-semibold bg-slate-800 text-red-300 min-w-[36px]"
                  >
                    X
                  </th>
                  <th
                    title="İzinli Gün"
                    className="py-2 px-2 text-center font-semibold bg-slate-800 text-amber-300 min-w-[36px]"
                  >
                    İ
                  </th>
                  <th
                    title="Devam Yüzdesi"
                    className="sticky right-0 z-20 py-2 px-2.5 text-right font-semibold bg-slate-900 border-l border-slate-700 min-w-[74px] sticky-col-right"
                  >
                    Devam %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAthletes.map((athlete) => {
                  let gCount = 0;
                  let xCount = 0;
                  let iCount = 0;

                  // Always calculate monthly totals from all days in the month
                  const allMonthDays = getMonthDaysISO(selectedYear, selectedMonth);
                  allMonthDays.forEach((iso) => {
                    const r = attendanceMap.get(`${iso}_${athlete.id}`);
                    if (r?.status === 'G') gCount++;
                    else if (r?.status === 'X') xCount++;
                    else if (r?.status === 'I') iCount++;
                  });

                  const totalSessions = gCount + xCount + iCount;
                  const rate = totalSessions > 0 ? Math.round((gCount / totalSessions) * 100) : null;

                  return (
                    <tr key={athlete.id} className="hover:bg-slate-50/70">
                      <td className="sticky left-0 z-10 bg-white py-2 px-3 border-r border-slate-200 sticky-col-left">
                        <div className="font-semibold text-slate-900 truncate max-w-[190px]">
                          {athlete.fullName}
                        </div>
                        <div className="mt-0.5">
                          <BeltBadge belt={athlete.beltLevel} size="sm" />
                        </div>
                      </td>

                      {visibleDays.map((iso) => {
                        const rec = attendanceMap.get(`${iso}_${athlete.id}`);
                        const status = rec?.status ?? null;

                        let cellClass =
                          'bg-slate-50/60 text-slate-300 hover:bg-slate-100 hover:text-slate-600';
                        let label = '-';

                        if (status === 'G') {
                          cellClass =
                            'bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100';
                          label = 'G';
                        } else if (status === 'X') {
                          cellClass = 'bg-red-50 text-red-700 font-bold hover:bg-red-100';
                          label = 'X';
                        } else if (status === 'I') {
                          cellClass = 'bg-amber-50 text-amber-700 font-bold hover:bg-amber-100';
                          label = 'İ';
                        }

                        return (
                          <td
                            key={iso}
                            className="p-0.5 text-center border-r border-slate-100"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCell({
                                  athleteId: athlete.id,
                                  dateISO: iso,
                                  athleteName: athlete.fullName,
                                  currentStatus: status,
                                })
                              }
                              title={`${athlete.fullName} · ${formatDateTR(iso)}${
                                rec?.note ? ` (${rec.note})` : ''
                              }`}
                              className={`w-full h-8 min-w-[28px] rounded-md flex items-center justify-center transition-colors ${cellClass}`}
                            >
                              {label}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-2 px-2 text-center font-mono font-semibold text-slate-800 bg-slate-50 border-l border-slate-200 tabular-nums">
                        {totalSessions}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-emerald-700 bg-slate-50 tabular-nums">
                        {gCount}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-red-700 bg-slate-50 tabular-nums">
                        {xCount}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold text-amber-700 bg-slate-50 tabular-nums">
                        {iCount}
                      </td>
                      <td className="sticky right-0 z-10 bg-white py-2 px-2.5 text-right font-mono font-bold border-l border-slate-200 tabular-nums sticky-col-right">
                        {rate === null ? (
                          <span className="text-slate-400">—</span>
                        ) : rate >= 85 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 no-print" />
                            <span>%{rate}</span>
                          </span>
                        ) : rate >= 60 ? (
                          <span className="text-amber-600">%{rate}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 no-print" />
                            <span>%{rate}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backup & Seed Data Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 no-print">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Veri Yedekleme ve Başlangıç Verileri
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tüm kulüp sporcu ve yoklama verileri tarayıcınızda güvenle saklanır. Düzenli aralıklarla JSON yedeği alabilirsiniz.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={downloadClubBackupJSON}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>JSON Yedek İndir</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Yedekten Geri Yükle</span>
          </button>

          <button
            type="button"
            onClick={onRequestResetSeed}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Örnek Verileri Yükle</span>
          </button>

          <button
            type="button"
            onClick={onRequestClearData}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span>Örnek Verileri Temizle</span>
          </button>
        </div>
      </div>

      {/* Quick Inline Cell Edit Modal */}
      {editingCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 no-print"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">{editingCell.athleteName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDateTR(editingCell.dateISO)} yoklama durumu
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onUpdateCell(editingCell.dateISO, editingCell.athleteId, 'G');
                  setEditingCell(null);
                }}
                className={`min-h-[48px] rounded-xl font-bold text-sm border transition-colors ${
                  editingCell.currentStatus === 'G'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                G · Geldi
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateCell(editingCell.dateISO, editingCell.athleteId, 'X');
                  setEditingCell(null);
                }}
                className={`min-h-[48px] rounded-xl font-bold text-sm border transition-colors ${
                  editingCell.currentStatus === 'X'
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                }`}
              >
                X · Gelmedi
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateCell(editingCell.dateISO, editingCell.athleteId, 'I');
                  setEditingCell(null);
                }}
                className={`min-h-[48px] rounded-xl font-bold text-sm border transition-colors ${
                  editingCell.currentStatus === 'I'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                İ · İzinli
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateCell(editingCell.dateISO, editingCell.athleteId, null);
                  setEditingCell(null);
                }}
                className="min-h-[48px] rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Kaydı Kaldır (-)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setEditingCell(null)}
              className="w-full min-h-[40px] text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

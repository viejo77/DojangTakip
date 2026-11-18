import React, { useMemo } from 'react';
import {
  AlertCircle,
  Award,
  CalendarCheck2,
  ClipboardCheck,
  Settings,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Athlete, AttendanceRecord, ClubMetadata } from '../types/club';
import { BELT_DEFINITIONS, getBeltMeta } from '../utils/beltUtils';
import {
  calculateAgeAndCategory,
  formatDateTR,
  getTodayISO,
  getWeekdayIndex,
  monthsBetweenISO,
  parseISODate,
  shiftISODate,
  TURKISH_MONTHS,
  TURKISH_WEEKDAYS_SHORT,
} from '../utils/dateUtils';
import { BeltBadge } from './BeltBadge';

interface DashboardViewProps {
  athletes: Athlete[];
  attendance: AttendanceRecord[];
  metadata: ClubMetadata;
  onGoToTodayAttendance: () => void;
  onAddAthlete: () => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onPromoteBelt: (athlete: Athlete) => void;
  onOpenClubSettings: () => void;
}

interface SevenDayPoint {
  dateISO: string;
  shortLabel: string;
  fullLabel: string;
  rate: number | null;
  presentCount: number;
  totalCount: number;
}

interface BeltPiePoint {
  level: string;
  count: number;
  pct: number;
  fill: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  athletes,
  attendance,
  metadata,
  onGoToTodayAttendance,
  onAddAthlete,
  onSelectAthlete,
  onPromoteBelt,
  onOpenClubSettings,
}) => {
  const todayISO = getTodayISO();
  const { year: curYear, month: curMonth } = parseISODate(todayISO);
  const currentMonthPrefix = `${curYear}-${String(curMonth).padStart(2, '0')}-`;

  const stats = useMemo(() => {
    const activeAthletes = athletes.filter((a) => a.status === 'Aktif');
    const activeIds = new Set(activeAthletes.map((a) => a.id));

    // Today's attendance rate
    const todayRecords = attendance.filter(
      (r) => r.date === todayISO && activeIds.has(r.athleteId)
    );
    const todayPresent = todayRecords.filter((r) => r.status === 'G').length;
    const todayRate =
      todayRecords.length > 0 ? Math.round((todayPresent / todayRecords.length) * 100) : null;

    // This month's general attendance average
    const monthRecords = attendance.filter(
      (r) => r.date.startsWith(currentMonthPrefix) && activeIds.has(r.athleteId)
    );
    const monthPresent = monthRecords.filter((r) => r.status === 'G').length;
    const monthAverage =
      monthRecords.length > 0 ? Math.round((monthPresent / monthRecords.length) * 100) : null;

    // Last 7 days attendance trend
    const sevenDayTrend: SevenDayPoint[] = [];
    for (let offset = -6; offset <= 0; offset++) {
      const dateISO = shiftISODate(todayISO, offset);
      const { month, day } = parseISODate(dateISO);
      const wd = TURKISH_WEEKDAYS_SHORT[getWeekdayIndex(dateISO)];
      const dayRecords = attendance.filter(
        (r) => r.date === dateISO && activeIds.has(r.athleteId)
      );
      const presentCount = dayRecords.filter((r) => r.status === 'G').length;
      const totalCount = dayRecords.length;
      const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;

      sevenDayTrend.push({
        dateISO,
        shortLabel: `${day} ${TURKISH_MONTHS[month - 1].slice(0, 3)}`,
        fullLabel: `${formatDateTR(dateISO)} (${wd})`,
        rate,
        presentCount,
        totalCount,
      });
    }

    const sevenDayRecordedCount = sevenDayTrend.filter((d) => d.rate !== null).length;

    // Per-athlete monthly attendance & exam readiness
    const athleteAttentionList: Array<{
      athlete: Athlete;
      reason: 'devamsizlik' | 'sinav';
      detail: string;
      rate: number;
    }> = [];

    const byAthleteMonth = new Map<string, AttendanceRecord[]>();
    monthRecords.forEach((r) => {
      const list = byAthleteMonth.get(r.athleteId) ?? [];
      list.push(r);
      byAthleteMonth.set(r.athleteId, list);
    });

    activeAthletes.forEach((athlete) => {
      const recs = byAthleteMonth.get(athlete.id) ?? [];
      const presentCount = recs.filter((r) => r.status === 'G').length;
      const rate = recs.length > 0 ? Math.round((presentCount / recs.length) * 100) : 0;

      const beltMeta = getBeltMeta(athlete.beltLevel);
      const monthsSincePromotion = monthsBetweenISO(athlete.lastBeltDate, todayISO);

      if (recs.length >= 3 && rate < 65) {
        athleteAttentionList.push({
          athlete,
          reason: 'devamsizlik',
          detail: `Bu ay %${rate} devam (${presentCount}/${recs.length} gün)`,
          rate,
        });
      } else if (
        monthsSincePromotion >= beltMeta.minMonthsForNextExam &&
        (recs.length === 0 || rate >= 75)
      ) {
        athleteAttentionList.push({
          athlete,
          reason: 'sinav',
          detail: `${monthsSincePromotion} aydır ${athlete.beltLevel} kuşakta`,
          rate,
        });
      }
    });

    // Belt distribution across active athletes for Pie Chart
    const beltCounts = BELT_DEFINITIONS.map((belt) => {
      const count = activeAthletes.filter((a) => a.beltLevel === belt.level).length;
      return { ...belt, count };
    }).filter((item) => item.count > 0);

    const beltPieData: BeltPiePoint[] = beltCounts.map((b) => {
      let fill = b.primaryHex;
      if (b.level === 'Beyaz') fill = '#CBD5E1';
      else if (b.level === 'Sarı-Yeşil') fill = '#84CC16';
      else if (b.level === 'Yeşil-Mavi') fill = '#0D9488';
      else if (b.level === 'Mavi-Kırmızı') fill = '#4F46E5';
      else if (b.level === 'Kırmızı-Siyah') fill = '#991B1B';
      else if (b.level === 'Siyah 1. Poom') fill = '#7F1D1D';

      return {
        level: b.level,
        count: b.count,
        pct: activeAthletes.length > 0 ? Math.round((b.count / activeAthletes.length) * 100) : 0,
        fill,
      };
    });

    return {
      totalCount: athletes.length,
      activeCount: activeAthletes.length,
      frozenCount: athletes.filter((a) => a.status === 'Dondurulmuş').length,
      todayRecordsCount: todayRecords.length,
      todayPresent,
      todayRate,
      monthRecordsCount: monthRecords.length,
      monthAverage,
      sevenDayTrend,
      sevenDayRecordedCount,
      attentionCount: athleteAttentionList.length,
      highAbsenceCount: athleteAttentionList.filter((i) => i.reason === 'devamsizlik').length,
      examReadyCount: athleteAttentionList.filter((i) => i.reason === 'sinav').length,
      athleteAttentionList,
      beltCounts,
      beltPieData,
    };
  }, [athletes, attendance, todayISO, currentMonthPrefix]);

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kulüp Kontrol Paneli
          </h1>
          <div className="text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{formatDateTR(todayISO)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {TURKISH_MONTHS[curMonth - 1]} {curYear}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenClubSettings}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 font-medium transition-colors"
              title="Kulüp ve antrenör bilgilerini düzenle"
            >
              <span>
                {metadata.clubName} ({metadata.coachName})
              </span>
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAddAthlete}
            className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Yeni Sporcu Ekle</span>
          </button>
          <button
            type="button"
            onClick={onGoToTodayAttendance}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Bugünün Yoklamasını Al</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aktif Sporcu Sayısı</span>
            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {stats.activeCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              Toplam {stats.totalCount} kayıt · {stats.frozenCount} dondurulmuş
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bugünkü Katılım Oranı</span>
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {stats.todayRate !== null ? `%${stats.todayRate}` : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {stats.todayRecordsCount > 0
                ? `${stats.todayPresent} / ${stats.todayRecordsCount} sporcu salonda`
                : 'Bugün henüz yoklama alınmadı'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {TURKISH_MONTHS[curMonth - 1]} Devam Ortalaması
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {stats.monthAverage !== null ? `%${stats.monthAverage}` : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              Bu ay {stats.monthRecordsCount} yoklama kaydı işlendi
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Sınav ve Devam Takibi
            </span>
            <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {stats.attentionCount}
            </div>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {stats.examReadyCount} sınava hazır · {stats.highAbsenceCount} yüksek devamsız
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row: 7-Day Trend Line Chart + Belt Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Attendance Trend Line Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Son 7 Gün Antrenman Katılım Trendi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Günlük yoklama oranları (%) · {stats.sevenDayRecordedCount} antrenman günü kayıtlı
              </p>
            </div>
            <span className="text-xs font-semibold text-red-600 tabular-nums">
              % Katılım Oranı
            </span>
          </div>

          {stats.sevenDayRecordedCount === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center text-sm text-slate-500">
              Son 7 gün içinde henüz kaydedilmiş antrenman yoklaması bulunmuyor.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.sevenDayTrend}
                  margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `%${v}`}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const pt = payload[0].payload as SevenDayPoint;
                      return (
                        <div className="rounded-xl bg-slate-900 text-white px-3.5 py-2.5 shadow-lg border border-slate-700 text-xs space-y-1">
                          <div className="font-semibold text-slate-200">{pt.fullLabel}</div>
                          {pt.rate !== null ? (
                            <div className="font-mono font-bold text-emerald-400 tabular-nums">
                              Katılım: %{pt.rate} ({pt.presentCount}/{pt.totalCount} sporcu)
                            </div>
                          ) : (
                            <div className="text-slate-400">Bu günde yoklama kaydı yok</div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    connectNulls={true}
                    stroke="#DC2626"
                    strokeWidth={3}
                    dot={{ r: 4.5, fill: '#DC2626', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 6.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Belt Distribution Pie Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Kuşak Dağılımı</h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {stats.activeCount} aktif sporcu
            </span>
          </div>

          {stats.beltPieData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-center text-sm text-slate-500">
              Henüz aktif sporcu kaydı bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.beltPieData}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2.5}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {stats.beltPieData.map((entry) => (
                        <Cell key={entry.level} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const item = payload[0].payload as BeltPiePoint;
                        return (
                          <div className="rounded-xl bg-slate-900 text-white px-3 py-2 shadow-lg border border-slate-700 text-xs">
                            <div className="font-semibold">{item.level} Kuşak</div>
                            <div className="font-mono text-slate-300 mt-0.5 tabular-nums">
                              {item.count} sporcu (%{item.pct})
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {stats.beltPieData.map((item) => (
                  <div
                    key={item.level}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0"
                  >
                    <BeltBadge belt={item.level as Athlete['beltLevel']} size="sm" />
                    <span className="font-mono text-slate-700 font-semibold tabular-nums">
                      {item.count} (%{item.pct})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attention & Promotion Readiness List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Kuşak Sınavı ve Devamsızlık Bildirimleri
          </h2>
          <span className="text-xs text-slate-500">Tıklayarak detaya gidin</span>
        </div>

        {stats.athleteAttentionList.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Şu anda yüksek devamsızlık uyarısı veya bekleyen sınav bildirimi yok.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.athleteAttentionList.map(({ athlete, reason, detail }) => {
              const { category } = calculateAgeAndCategory(athlete.birthDate);
              return (
                <button
                  key={athlete.id}
                  type="button"
                  onClick={() => onSelectAthlete(athlete)}
                  className="w-full py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-left min-h-[56px]"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {athlete.fullName}
                      </span>
                      <BeltBadge belt={athlete.beltLevel} size="sm" showText={false} />
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                      <span>{athlete.trainingGroup}</span>
                      <span aria-hidden="true">·</span>
                      <span>{category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700 font-medium">{detail}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {reason === 'devamsizlik' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Devamsızlık Yüksek</span>
                      </span>
                    ) : (
                      <>
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                          <Award className="w-3.5 h-3.5" />
                          <span>Sınava Hazır</span>
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPromoteBelt(athlete);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onPromoteBelt(athlete);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Kuşak Atlat</span>
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

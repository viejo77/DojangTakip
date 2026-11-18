import React, { useEffect, useState } from 'react';
import {
  CalendarRange,
  ClipboardCheck,
  Download,
  LayoutDashboard,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ActiveTab,
  Athlete,
  AttendanceRecord,
  AttendanceStatus,
  BeltLevel,
  ClubMetadata,
  ToastMessage,
} from './types/club';
import {
  athleteService,
  attendanceService,
  clubDataService,
  initializeDatabaseIfNeeded,
} from './services/storageService';
import { getTodayISO } from './utils/dateUtils';
import { downloadClubBackupJSON } from './utils/exportUtils';
import { DashboardView } from './components/DashboardView';
import { AthletesView } from './components/AthletesView';
import { QuickAttendanceView } from './components/QuickAttendanceView';
import { MonthlyMatrixView } from './components/MonthlyMatrixView';
import { AthleteFormModal } from './components/AthleteFormModal';
import { AthleteDetailModal } from './components/AthleteDetailModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/ToastContainer';
import { WhatsAppMessageModal } from './components/WhatsAppMessageModal';
import { BeltPromotionModal } from './components/BeltPromotionModal';
import { ClubSettingsModal } from './components/ClubSettingsModal';

type ConfirmAction =
  | { type: 'delete-athlete'; athlete: Athlete }
  | { type: 'clear-all' }
  | { type: 'reset-seed' }
  | null;

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [metadata, setMetadata] = useState<ClubMetadata>({
    clubName: 'Anadolu Dojang Taekwondo S.K.',
    coachName: 'Antrenör Serkan Yılmaz',
    seedLoaded: true,
  });

  const [attendanceDate, setAttendanceDate] = useState<string>(getTodayISO());
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [detailAthleteId, setDetailAthleteId] = useState<string | null>(null);
  const [whatsAppAthlete, setWhatsAppAthlete] = useState<Athlete | null>(null);
  const [promoteAthlete, setPromoteAthlete] = useState<Athlete | null>(null);
  const [clubSettingsOpen, setClubSettingsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hydrate initial state from localStorage (with seed data on first launch)
  useEffect(() => {
    const initial = initializeDatabaseIfNeeded();
    setAthletes(initial.athletes);
    setAttendance(initial.attendance);
    setMetadata(initial.metadata);
  }, []);

  const pushToast = (text: string, type: ToastMessage['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Athlete CRUD handlers
  const handleOpenAddAthlete = () => {
    setEditingAthlete(null);
    setFormModalOpen(true);
  };

  const handleOpenEditAthlete = (athlete: Athlete) => {
    setDetailAthleteId(null);
    setEditingAthlete(athlete);
    setFormModalOpen(true);
  };

  const handleSaveAthlete = (
    payload: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const updated = athleteService.update(editingId, payload);
      setAthletes(updated);
      pushToast(`${payload.fullName} bilgileri güncellendi.`);
    } else {
      const created = athleteService.create(payload);
      setAthletes(created);
      pushToast(`${payload.fullName} kulüp kütüphanesine eklendi.`);
    }
    setFormModalOpen(false);
    setEditingAthlete(null);
  };

  const handleConfirmExecute = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'delete-athlete') {
      const { athlete } = confirmAction;
      const result = athleteService.remove(athlete.id);
      setAthletes(result.athletes);
      setAttendance(result.attendance);
      if (detailAthleteId === athlete.id) {
        setDetailAthleteId(null);
      }
      pushToast(`${athlete.fullName} ve yoklama kayıtları silindi.`, 'info');
    } else if (confirmAction.type === 'clear-all') {
      const cleared = clubDataService.clearAllData();
      setAthletes(cleared.athletes);
      setAttendance(cleared.attendance);
      setMetadata(cleared.metadata);
      setDetailAthleteId(null);
      pushToast('Tüm örnek veriler temizlendi. Sıfırdan başlayabilirsiniz.', 'info');
    } else if (confirmAction.type === 'reset-seed') {
      const reset = clubDataService.resetToSeedData();
      setAthletes(reset.athletes);
      setAttendance(reset.attendance);
      setMetadata(reset.metadata);
      pushToast('Örnek Taekwondo kulüp verileri yeniden yüklendi.');
    }

    setConfirmAction(null);
  };

  // Attendance handlers
  const handleSaveAttendanceBatch = (
    dateISO: string,
    entries: Array<{ athleteId: string; status: AttendanceStatus | null; note?: string }>
  ) => {
    const next = attendanceService.upsertBatch(dateISO, entries);
    setAttendance(next);
    const presentCount = entries.filter((e) => e.status === 'G').length;
    pushToast(`Yoklama kaydedildi (${presentCount} sporcu geldi).`);
  };

  const handleUpdateMatrixCell = (
    dateISO: string,
    athleteId: string,
    status: AttendanceStatus | null
  ) => {
    const next = attendanceService.upsertSingle(dateISO, athleteId, status);
    setAttendance(next);
    pushToast('Yoklama hücresi güncellendi.');
  };

  const handleConfirmPromoteBelt = (
    athleteId: string,
    toBelt: BeltLevel,
    promotedAt: string,
    note?: string
  ) => {
    const target = athletes.find((a) => a.id === athleteId);
    const updated = athleteService.promoteBelt(athleteId, toBelt, promotedAt, note);
    setAthletes(updated);
    setPromoteAthlete(null);
    pushToast(`${target?.fullName || 'Sporcu'} ${toBelt} kuşağına terfi etti.`);
  };

  const handleSaveClubSettings = (patch: Partial<ClubMetadata>) => {
    const updated = clubDataService.updateMetadata(patch);
    setMetadata(updated);
    pushToast('Kulüp ve antrenör bilgileri güncellendi.');
  };

  // JSON Backup Restore handler
  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const restored = clubDataService.restoreFromBackup(parsed);
      setAthletes(restored.athletes);
      setAttendance(restored.attendance);
      setMetadata(restored.metadata);
      pushToast(
        `Yedek yüklendi: ${restored.athletes.length} sporcu ve ${restored.attendance.length} yoklama kaydı.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Yedek dosyası okunamadı.';
      pushToast(msg, 'error');
    }
  };

  const detailAthlete = detailAthleteId
    ? athletes.find((a) => a.id === detailAthleteId) ?? null
    : null;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Kontrol Paneli', shortLabel: 'Panel', icon: LayoutDashboard },
    { id: 'athletes', label: 'Sporcular', shortLabel: 'Sporcular', icon: Users },
    { id: 'attendance', label: 'Hızlı Yoklama', shortLabel: 'Yoklama', icon: ClipboardCheck },
    { id: 'matrix', label: 'Aylık Çizelge', shortLabel: 'Çizelge', icon: CalendarRange },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-white border-r border-slate-800 no-print">
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {/* Taegeuk-inspired Emblem */}
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
              <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="#DC2626" />
                <path d="M 2 16 A 14 14 0 0 0 30 16 A 7 7 0 0 1 16 16 A 7 7 0 0 0 2 16 Z" fill="#2563EB" />
                <circle cx="9" cy="16" r="3.5" fill="#DC2626" />
                <circle cx="23" cy="16" r="3.5" fill="#2563EB" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold tracking-tight leading-none text-white">
                Dojang Takip
              </div>
              <div className="text-xs text-slate-400 truncate mt-1">
                {metadata.clubName}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Ana menü">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom Utilities */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="text-xs text-slate-400 px-1 truncate">{metadata.coachName}</div>
          <button
            type="button"
            onClick={() => setClubSettingsOpen(true)}
            className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Settings className="w-4 h-4 text-slate-300 shrink-0" />
            <span>Kulüp &amp; Antrenör Ayarları</span>
          </button>
          <button
            type="button"
            onClick={downloadClubBackupJSON}
            className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Verileri Yedekle (JSON)</span>
          </button>
          {athletes.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmAction({ type: 'clear-all' })}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-red-300 text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Örnek Verileri Temizle</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0" aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="#DC2626" />
            <path d="M 2 16 A 14 14 0 0 0 30 16 A 7 7 0 0 1 16 16 A 7 7 0 0 0 2 16 Z" fill="#2563EB" />
            <circle cx="9" cy="16" r="3.5" fill="#DC2626" />
            <circle cx="23" cy="16" r="3.5" fill="#2563EB" />
          </svg>
          <div className="min-w-0">
            <span className="font-display font-bold text-base tracking-tight truncate block leading-tight">
              {metadata.clubName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setClubSettingsOpen(true)}
            className="min-h-[38px] min-w-[38px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
            aria-label="Kulüp ve antrenör ayarları"
            title="Kulüp & Antrenör Ayarları"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenAddAthlete}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Sporcu Ekle</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          {activeTab === 'dashboard' && (
            <DashboardView
              athletes={athletes}
              attendance={attendance}
              metadata={metadata}
              onGoToTodayAttendance={() => {
                setAttendanceDate(getTodayISO());
                setActiveTab('attendance');
              }}
              onAddAthlete={handleOpenAddAthlete}
              onSelectAthlete={(athlete) => setDetailAthleteId(athlete.id)}
              onPromoteBelt={(athlete) => setPromoteAthlete(athlete)}
              onOpenClubSettings={() => setClubSettingsOpen(true)}
            />
          )}

          {activeTab === 'athletes' && (
            <AthletesView
              athletes={athletes}
              metadata={metadata}
              onAddAthlete={handleOpenAddAthlete}
              onEditAthlete={handleOpenEditAthlete}
              onDeleteAthlete={(athlete) =>
                setConfirmAction({ type: 'delete-athlete', athlete })
              }
              onSelectAthlete={(athlete) => setDetailAthleteId(athlete.id)}
              onOpenWhatsApp={(athlete) => setWhatsAppAthlete(athlete)}
              onPromoteBelt={(athlete) => setPromoteAthlete(athlete)}
            />
          )}

          {activeTab === 'attendance' && (
            <QuickAttendanceView
              athletes={athletes}
              attendance={attendance}
              selectedDate={attendanceDate}
              onChangeDate={setAttendanceDate}
              onSaveAttendance={handleSaveAttendanceBatch}
              onGoToAthletes={() => setActiveTab('athletes')}
            />
          )}

          {activeTab === 'matrix' && (
            <MonthlyMatrixView
              athletes={athletes}
              attendance={attendance}
              metadata={metadata}
              onUpdateCell={handleUpdateMatrixCell}
              onImportBackup={handleImportBackup}
              onRequestResetSeed={() => setConfirmAction({ type: 'reset-seed' })}
              onRequestClearData={() => setConfirmAction({ type: 'clear-all' })}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 no-print"
        aria-label="Mobil alt menü"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                isActive ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold tracking-tight leading-none">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Toasts */}
      <AthleteFormModal
        open={formModalOpen}
        editingAthlete={editingAthlete}
        onClose={() => {
          setFormModalOpen(false);
          setEditingAthlete(null);
        }}
        onSave={handleSaveAthlete}
      />

      <AthleteDetailModal
        athlete={detailAthlete}
        attendance={attendance}
        onClose={() => setDetailAthleteId(null)}
        onEdit={handleOpenEditAthlete}
        onOpenWhatsApp={(athlete) => setWhatsAppAthlete(athlete)}
        onPromoteBelt={(athlete) => setPromoteAthlete(athlete)}
      />

      <BeltPromotionModal
        athlete={promoteAthlete}
        onClose={() => setPromoteAthlete(null)}
        onConfirmPromote={handleConfirmPromoteBelt}
      />

      <ClubSettingsModal
        open={clubSettingsOpen}
        metadata={metadata}
        onClose={() => setClubSettingsOpen(false)}
        onSave={handleSaveClubSettings}
      />

      <WhatsAppMessageModal
        athlete={whatsAppAthlete}
        onClose={() => setWhatsAppAthlete(null)}
        onSent={(athlete) =>
          pushToast(
            `${athlete.parentName || athlete.fullName} için WhatsApp sohbeti başlatıldı.`
          )
        }
      />

      <ConfirmModal
        open={confirmAction !== null}
        title={
          confirmAction?.type === 'delete-athlete'
            ? 'Sporcuyu Sil'
            : confirmAction?.type === 'clear-all'
              ? 'Tüm Verileri Temizle'
              : 'Örnek Verileri Yükle'
        }
        description={
          confirmAction?.type === 'delete-athlete'
            ? `${confirmAction.athlete.fullName} isimli sporcu ve geçmiş tüm yoklama kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : confirmAction?.type === 'clear-all'
              ? 'Kayıtlı tüm sporcular ve yoklama geçmişi tarayıcı hafızasından temizlenecek. İsterseniz öncesinde JSON yedeği alabilirsiniz.'
              : 'Mevcut verilerin üzerine 8 örnek sporcu ve son 1 aya ait örnek antrenman yoklamaları yüklenecek.'
        }
        confirmLabel={
          confirmAction?.type === 'delete-athlete'
            ? 'Evet, Sil'
            : confirmAction?.type === 'clear-all'
              ? 'Evet, Temizle'
              : 'Örnek Verileri Yükle'
        }
        variant={confirmAction?.type === 'reset-seed' ? 'primary' : 'danger'}
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirmAction(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

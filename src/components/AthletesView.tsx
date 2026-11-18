import React, { useMemo, useState } from 'react';
import {
  Award,
  Edit3,
  FileDown,
  MessageCircle,
  Phone,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Athlete, AthleteStatus, BeltLevel, ClubMetadata, TrainingGroup } from '../types/club';
import { BELT_DEFINITIONS, TRAINING_GROUPS } from '../utils/beltUtils';
import { calculateAgeAndCategory } from '../utils/dateUtils';
import { downloadAthletesListPDF } from '../utils/exportUtils';
import { BeltBadge } from './BeltBadge';

interface AthletesViewProps {
  athletes: Athlete[];
  metadata: ClubMetadata;
  onAddAthlete: () => void;
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
  onSelectAthlete: (athlete: Athlete) => void;
  onOpenWhatsApp: (athlete: Athlete) => void;
  onPromoteBelt: (athlete: Athlete) => void;
}

export const AthletesView: React.FC<AthletesViewProps> = ({
  athletes,
  metadata,
  onAddAthlete,
  onEditAthlete,
  onDeleteAthlete,
  onSelectAthlete,
  onOpenWhatsApp,
  onPromoteBelt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState<BeltLevel | 'Tümü'>('Tümü');
  const [groupFilter, setGroupFilter] = useState<TrainingGroup | 'Tümü'>('Tümü');
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | 'Tümü'>('Aktif');

  const filteredAthletes = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return athletes.filter((athlete) => {
      if (q && !athlete.fullName.toLocaleLowerCase('tr-TR').includes(q)) {
        return false;
      }
      if (beltFilter !== 'Tümü' && athlete.beltLevel !== beltFilter) {
        return false;
      }
      if (groupFilter !== 'Tümü' && athlete.trainingGroup !== groupFilter) {
        return false;
      }
      if (statusFilter !== 'Tümü' && athlete.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [athletes, searchQuery, beltFilter, groupFilter, statusFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setBeltFilter('Tümü');
    setGroupFilter('Tümü');
    setStatusFilter('Tümü');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Sporcu Kütüphanesi
          </h1>
          <p className="text-sm text-slate-600 mt-1 tabular-nums">
            Toplam {athletes.length} sporcu kayıtlı · Listelenen: {filteredAthletes.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={filteredAthletes.length === 0}
            onClick={() =>
              downloadAthletesListPDF({
                athletes: filteredAthletes,
                metadata,
                filterSummary: [
                  groupFilter !== 'Tümü' ? groupFilter : null,
                  beltFilter !== 'Tümü' ? `${beltFilter} Kuşak` : null,
                  statusFilter !== 'Tümü' ? statusFilter : null,
                ]
                  .filter(Boolean)
                  .join(' · '),
              })
            }
            className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>PDF Rapor</span>
          </button>

          <button
            type="button"
            onClick={onAddAthlete}
            className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Sporcu Ekle</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sporcu adı ara..."
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value as BeltLevel | 'Tümü')}
            aria-label="Kuşak filtresi"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Tümü">Tüm Kuşaklar</option>
            {BELT_DEFINITIONS.map((b) => (
              <option key={b.level} value={b.level}>
                {b.level}
              </option>
            ))}
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as TrainingGroup | 'Tümü')}
            aria-label="Antrenman grubu filtresi"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Tümü">Tüm Antrenman Grupları</option>
            {TRAINING_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AthleteStatus | 'Tümü')}
            aria-label="Durum filtresi"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Tümü">Tüm Durumlar</option>
            <option value="Aktif">Aktif</option>
            <option value="Dondurulmuş">Dondurulmuş</option>
            <option value="Ayrıldı">Ayrıldı</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {athletes.length === 0 ? 'Kayıtlı Sporcu Bulunmuyor' : 'Aramaya Uygun Sporcu Yok'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {athletes.length === 0
              ? 'Kulübünüze ilk sporcuyu ekleyerek yoklama ve aylık takip işlemlerine başlayabilirsiniz.'
              : 'Seçili arama veya filtre kriterlerine uyan sporcu bulunamadı.'}
          </p>
          <div className="pt-2">
            {athletes.length === 0 ? (
              <button
                type="button"
                onClick={onAddAthlete}
                className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                İlk Sporcuyu Ekle
              </button>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-4">Sporcu</th>
                    <th className="py-3.5 px-4">Kuşak</th>
                    <th className="py-3.5 px-4">Grup &amp; Kategori</th>
                    <th className="py-3.5 px-4">Lisans</th>
                    <th className="py-3.5 px-4">Veli İletişim</th>
                    <th className="py-3.5 px-4">Durum</th>
                    <th className="py-3.5 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredAthletes.map((athlete) => {
                    const { age, category } = calculateAgeAndCategory(athlete.birthDate);
                    return (
                      <tr
                        key={athlete.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => onSelectAthlete(athlete)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{athlete.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {athlete.gender} · <span className="tabular-nums">{age}</span> yaş
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <BeltBadge belt={athlete.beltLevel} />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{athlete.trainingGroup}</div>
                          <div className="text-xs text-slate-500">{category}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div
                            className={`text-xs font-semibold ${
                              athlete.licenseStatus === 'Aktif'
                                ? 'text-emerald-700'
                                : athlete.licenseStatus === 'Beklemede'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                            }`}
                          >
                            {athlete.licenseStatus}
                          </div>
                          {athlete.licenseNo && (
                            <div className="text-xs font-mono text-slate-500 mt-0.5">
                              {athlete.licenseNo}
                            </div>
                          )}
                        </td>
                        <td
                          className="py-3.5 px-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-slate-800 text-xs font-medium">
                            {athlete.parentName || '-'}
                          </div>
                          {athlete.parentPhone && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <button
                                type="button"
                                onClick={() => onOpenWhatsApp(athlete)}
                                className="text-xs font-mono text-emerald-700 hover:text-emerald-800 hover:underline font-semibold text-left"
                                title="WhatsApp sohbeti başlat"
                              >
                                {athlete.parentPhone}
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenWhatsApp(athlete)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-semibold transition-colors whitespace-nowrap"
                                title="Şablon seçerek WhatsApp mesajı gönder"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>Mesaj Gönder</span>
                              </button>
                              <a
                                href={`tel:${athlete.parentPhone.replace(/\s+/g, '')}`}
                                className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                                title="Ara"
                                aria-label="Veli ara"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs font-semibold ${
                              athlete.status === 'Aktif'
                                ? 'text-emerald-700'
                                : athlete.status === 'Dondurulmuş'
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                            }`}
                          >
                            {athlete.status}
                          </span>
                        </td>
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onPromoteBelt(athlete)}
                              className="min-h-[36px] px-2.5 flex items-center justify-center gap-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
                              title="Kuşak Atlat"
                              aria-label={`${athlete.fullName} kuşak atlat`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Kuşak Atlat</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditAthlete(athlete)}
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Düzenle"
                              aria-label={`${athlete.fullName} düzenle`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAthlete(athlete)}
                              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Sil"
                              aria-label={`${athlete.fullName} sil`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Touch Card List */}
          <div className="md:hidden space-y-3">
            {filteredAthletes.map((athlete) => {
              const { age, category } = calculateAgeAndCategory(athlete.birthDate);
              return (
                <div
                  key={athlete.id}
                  onClick={() => onSelectAthlete(athlete)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{athlete.fullName}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {athlete.trainingGroup} · {age} yaş ({category})
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        athlete.status === 'Aktif'
                          ? 'text-emerald-700'
                          : athlete.status === 'Dondurulmuş'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {athlete.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <BeltBadge belt={athlete.beltLevel} />
                    <span className="text-xs text-slate-500">
                      Lisans: <strong className="text-slate-800">{athlete.licenseStatus}</strong>
                    </span>
                  </div>

                  {athlete.parentPhone && (
                    <div
                      className="text-xs text-slate-600 flex items-center justify-between pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Veli: {athlete.parentName || '-'}</span>
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp(athlete)}
                        className="font-mono font-semibold text-emerald-700 hover:underline"
                      >
                        {athlete.parentPhone}
                      </button>
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      {athlete.parentPhone && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(athlete)}
                            className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Mesaj Gönder</span>
                          </button>
                          <a
                            href={`tel:${athlete.parentPhone.replace(/\s+/g, '')}`}
                            className="min-h-[44px] min-w-[44px] rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center"
                            aria-label="Veli ara"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onPromoteBelt(athlete)}
                        className="min-h-[44px] min-w-[44px] rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center justify-center"
                        aria-label="Kuşak atlat"
                        title="Kuşak Atlat"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditAthlete(athlete)}
                        className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-slate-700 flex items-center justify-center"
                        aria-label="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAthlete(athlete)}
                        className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-red-600 flex items-center justify-center"
                        aria-label="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

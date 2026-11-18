import React, { useEffect, useState } from 'react';
import { ChevronDown, Phone, MessageCircle, X } from 'lucide-react';
import {
  Athlete,
  AthleteStatus,
  BeltLevel,
  Gender,
  LicenseStatus,
  TrainingGroup,
} from '../types/club';
import { BELT_DEFINITIONS, TRAINING_GROUPS } from '../utils/beltUtils';
import { calculateAgeAndCategory, formatWhatsAppUrl, getTodayISO } from '../utils/dateUtils';
import { BeltBadge } from './BeltBadge';

interface AthleteFormModalProps {
  open: boolean;
  editingAthlete: Athlete | null;
  onClose: () => void;
  onSave: (
    payload: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>,
    editingId?: string
  ) => void;
}

const INITIAL_FORM = (): Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'> => ({
  fullName: '',
  birthDate: '2014-05-15',
  gender: 'Erkek',
  tcIdentityNo: '',
  licenseNo: '',
  licenseStatus: 'Beklemede',
  beltLevel: 'Beyaz',
  lastBeltDate: getTodayISO(),
  trainingGroup: 'Minik Başlangıç',
  parentName: '',
  parentPhone: '',
  healthNotes: '',
  status: 'Aktif',
});

export const AthleteFormModal: React.FC<AthleteFormModalProps> = ({
  open,
  editingAthlete,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [beltMenuOpen, setBeltMenuOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    setBeltMenuOpen(false);
    if (editingAthlete) {
      setForm({
        fullName: editingAthlete.fullName,
        birthDate: editingAthlete.birthDate,
        gender: editingAthlete.gender,
        tcIdentityNo: editingAthlete.tcIdentityNo ?? '',
        licenseNo: editingAthlete.licenseNo ?? '',
        licenseStatus: editingAthlete.licenseStatus,
        beltLevel: editingAthlete.beltLevel,
        lastBeltDate: editingAthlete.lastBeltDate,
        trainingGroup: editingAthlete.trainingGroup,
        parentName: editingAthlete.parentName,
        parentPhone: editingAthlete.parentPhone,
        healthNotes: editingAthlete.healthNotes ?? '',
        status: editingAthlete.status,
      });
    } else {
      setForm(INITIAL_FORM());
    }
  }, [open, editingAthlete]);

  if (!open) return null;

  const { age, category } = calculateAgeAndCategory(form.birthDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setErrorMsg('Sporcu Adı Soyadı alanı zorunludur.');
      return;
    }
    if (form.tcIdentityNo && !/^\d{11}$/.test(form.tcIdentityNo.trim())) {
      setErrorMsg('T.C. Kimlik No girildiyse 11 haneli rakam olmalıdır.');
      return;
    }

    onSave(
      {
        ...form,
        fullName: form.fullName.trim(),
        tcIdentityNo: form.tcIdentityNo?.trim() || '',
        licenseNo: form.licenseNo?.trim() || '',
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        healthNotes: form.healthNotes?.trim() || '',
      },
      editingAthlete?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="athlete-form-title"
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div>
            <h2 id="athlete-form-title" className="text-lg font-bold tracking-tight">
              {editingAthlete ? 'Sporcu Bilgilerini Düzenle' : 'Yeni Sporcu Kaydı'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Kulüp kütüphanesi ve lisans takibi için sporcu kartını doldurun
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Formu kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Kişisel ve Kategori Bilgileri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ad Soyad <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Örn: Zeynep Sude Kaya"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Doğum Tarihi
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  max={getTodayISO()}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                  <span>
                    Yaş: <strong className="text-slate-900 tabular-nums">{age}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Kategori: <strong className="text-blue-700">{category}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cinsiyet
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Erkek', 'Kadın'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
                        form.gender === g
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  T.C. Kimlik No (Opsiyonel)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.tcIdentityNo}
                  onChange={(e) =>
                    setForm({ ...form, tcIdentityNo: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="11 haneli T.C. Kimlik No"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kulüp Üyelik Durumu
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as AthleteStatus })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Dondurulmuş">Dondurulmuş</option>
                  <option value="Ayrıldı">Ayrıldı</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kuşak, Grup ve Lisans */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Kuşak, Antrenman Grubu ve Lisans
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Custom Visual Belt Selector with Swatches */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kuşak Seviyesi
                </label>
                <button
                  type="button"
                  onClick={() => setBeltMenuOpen((prev) => !prev)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white flex items-center justify-between hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <BeltBadge belt={form.beltLevel} />
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                </button>

                {beltMenuOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-30 max-h-64 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1">
                    {BELT_DEFINITIONS.map((belt) => (
                      <button
                        key={belt.level}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, beltLevel: belt.level as BeltLevel });
                          setBeltMenuOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          form.beltLevel === belt.level ? 'bg-blue-50/70' : ''
                        }`}
                      >
                        <BeltBadge belt={belt.level} />
                        {form.beltLevel === belt.level && (
                          <span className="text-xs font-semibold text-blue-600">Seçili</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Son Kuşak Terfi Tarihi
                </label>
                <input
                  type="date"
                  value={form.lastBeltDate}
                  max={getTodayISO()}
                  onChange={(e) => setForm({ ...form, lastBeltDate: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Antrenman Grubu
                </label>
                <select
                  value={form.trainingGroup}
                  onChange={(e) =>
                    setForm({ ...form, trainingGroup: e.target.value as TrainingGroup })
                  }
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {TRAINING_GROUPS.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lisans Durumu
                  </label>
                  <select
                    value={form.licenseStatus}
                    onChange={(e) =>
                      setForm({ ...form, licenseStatus: e.target.value as LicenseStatus })
                    }
                    className="w-full min-h-[44px] px-2.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Beklemede">Beklemede</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lisans No
                  </label>
                  <input
                    type="text"
                    value={form.licenseNo}
                    onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                    placeholder="34-TKD-..."
                    className="w-full min-h-[44px] px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Veli ve Sağlık Notları */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Veli İletişim ve Sağlık Notları
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Veli Adı Soyadı
                </label>
                <input
                  type="text"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  placeholder="Örn: Ayşe Kaya"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Veli Telefon Numarası
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                    className="flex-1 min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  {form.parentPhone.trim().length >= 10 && (
                    <>
                      <a
                        href={formatWhatsAppUrl(form.parentPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="WhatsApp mesajı gönder"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                      <a
                        href={`tel:${form.parentPhone.replace(/\s+/g, '')}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        title="Telefon ile ara"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sağlık / Özel Notlar (Alerji, sakatlık, kulüp notu)
                </label>
                <textarea
                  rows={2}
                  value={form.healthNotes}
                  onChange={(e) => setForm({ ...form, healthNotes: e.target.value })}
                  placeholder="Örn: Toz alerjisi mevcut, müsabık adayı..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              İptal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors whitespace-nowrap"
            >
              {editingAthlete ? 'Değişiklikleri Kaydet' : 'Sporcuyu Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

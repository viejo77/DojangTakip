import React, { useEffect, useState } from 'react';
import { Building2, X } from 'lucide-react';
import { ClubMetadata } from '../types/club';

interface ClubSettingsModalProps {
  open: boolean;
  metadata: ClubMetadata;
  onClose: () => void;
  onSave: (patch: Partial<ClubMetadata>) => void;
}

export const ClubSettingsModal: React.FC<ClubSettingsModalProps> = ({
  open,
  metadata,
  onClose,
  onSave,
}) => {
  const [clubName, setClubName] = useState(metadata.clubName);
  const [coachName, setCoachName] = useState(metadata.coachName);
  const [city, setCity] = useState(metadata.city ?? '');
  const [phone, setPhone] = useState(metadata.phone ?? '');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setClubName(metadata.clubName);
    setCoachName(metadata.coachName);
    setCity(metadata.city ?? '');
    setPhone(metadata.phone ?? '');
    setErrorMsg('');
  }, [open, metadata]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !coachName.trim()) {
      setErrorMsg('Kulüp Adı ve Antrenör Adı Soyadı alanları zorunludur.');
      return;
    }
    onSave({
      clubName: clubName.trim(),
      coachName: coachName.trim(),
      city: city.trim(),
      phone: phone.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-settings-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="club-settings-title" className="text-base font-bold">
                Kulüp ve Antrenör Bilgileri
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Raporlarda ve başlıklarda görünecek kulüp bilgileri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kulüp Adı <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Örn: Anadolu Dojang Taekwondo S.K."
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Baş Antrenör Adı Soyadı <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              placeholder="Örn: Antrenör Serkan Yılmaz"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Şehir / İlçe
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Örn: Kadıköy, İstanbul"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kulüp Telefonu
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap"
            >
              İptal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors whitespace-nowrap"
            >
              Bilgileri Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

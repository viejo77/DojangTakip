import React, { useEffect, useState } from 'react';
import { ArrowRight, Award, ChevronDown, X } from 'lucide-react';
import { Athlete, BeltLevel } from '../types/club';
import { BELT_DEFINITIONS, getBeltMeta, getNextBelt } from '../utils/beltUtils';
import { formatDateTR, getTodayISO, monthsBetweenISO } from '../utils/dateUtils';
import { BeltBadge } from './BeltBadge';

interface BeltPromotionModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  onConfirmPromote: (
    athleteId: string,
    toBelt: BeltLevel,
    promotedAt: string,
    note?: string
  ) => void;
}

export const BeltPromotionModal: React.FC<BeltPromotionModalProps> = ({
  athlete,
  onClose,
  onConfirmPromote,
}) => {
  const [targetBelt, setTargetBelt] = useState<BeltLevel>('Sarı');
  const [promotedAt, setPromotedAt] = useState<string>(getTodayISO());
  const [note, setNote] = useState<string>('');
  const [beltMenuOpen, setBeltMenuOpen] = useState(false);

  useEffect(() => {
    if (!athlete) return;
    const suggested = getNextBelt(athlete.beltLevel) ?? athlete.beltLevel;
    setTargetBelt(suggested);
    setPromotedAt(getTodayISO());
    setNote('');
    setBeltMenuOpen(false);
  }, [athlete]);

  if (!athlete) return null;

  const currentMeta = getBeltMeta(athlete.beltLevel);
  const monthsAtBelt = monthsBetweenISO(athlete.lastBeltDate);
  const isSameBelt = targetBelt === athlete.beltLevel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSameBelt) return;
    onConfirmPromote(athlete.id, targetBelt, promotedAt, note);
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="belt-promote-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="belt-promote-title" className="text-base font-bold truncate">
                Kuşak Terfi / Atlatma
              </h2>
              <p className="text-xs text-slate-300 truncate mt-0.5">{athlete.fullName}</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Current -> Target Belt Visual Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Mevcut Kuşak</div>
              <BeltBadge belt={athlete.beltLevel} />
              <div className="text-[11px] text-slate-500">
                {monthsAtBelt} ay · {formatDateTR(athlete.lastBeltDate)}
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />

            <div className="space-y-1 text-right">
              <div className="text-[11px] font-semibold text-blue-700">Yeni Kuşak</div>
              <div className="flex justify-end">
                <BeltBadge belt={targetBelt} />
              </div>
              <div className="text-[11px] text-slate-500">
                Min. bekleme: {currentMeta.minMonthsForNextExam} ay
              </div>
            </div>
          </div>

          {/* Target Belt Picker */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Terfi Edilecek Kuşak Seviyesi
            </label>
            <button
              type="button"
              onClick={() => setBeltMenuOpen((p) => !p)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white flex items-center justify-between hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <BeltBadge belt={targetBelt} />
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {beltMenuOpen && (
              <div className="absolute left-0 right-0 mt-1.5 z-30 max-h-56 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1">
                {BELT_DEFINITIONS.map((belt) => (
                  <button
                    key={belt.level}
                    type="button"
                    onClick={() => {
                      setTargetBelt(belt.level);
                      setBeltMenuOpen(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-slate-50 ${
                      targetBelt === belt.level ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <BeltBadge belt={belt.level} />
                    {belt.level === athlete.beltLevel && (
                      <span className="text-[11px] text-slate-400">Mevcut</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Promotion Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Terfi / Sınav Tarihi
            </label>
            <input
              type="date"
              value={promotedAt}
              max={getTodayISO()}
              onChange={(e) => setPromotedAt(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sınav / Terfi Notu (Opsiyonel)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: Kasım 2026 Kuşak Sınavı - Üstün başarı"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {isSameBelt && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Sporcu zaten bu kuşak seviyesinde. Lütfen terfi için farklı bir kuşak seçin.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSameBelt}
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Award className="w-4 h-4" />
              <span>Kuşak Atlat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

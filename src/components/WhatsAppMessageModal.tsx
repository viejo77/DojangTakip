import React, { useEffect, useMemo, useState } from 'react';
import { Check, MessageCircle, Phone, Send, X } from 'lucide-react';
import { Athlete } from '../types/club';
import { formatWhatsAppUrl } from '../utils/dateUtils';

interface WhatsAppMessageModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  onSent?: (athlete: Athlete) => void;
}

interface MessageTemplate {
  id: string;
  title: string;
  buildText: (athlete: Athlete) => string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'training-expected',
    title: 'Antrenman Katılım Hatırlatması',
    buildText: (athlete) =>
      `Sayın velimiz, sporcumuz ${athlete.fullName}'ın bugün antrenmana katılımı beklenmektedir.`,
  },
  {
    id: 'absence-notice',
    title: 'Devamsızlık Bilgilendirmesi',
    buildText: (athlete) =>
      `Sayın ${athlete.parentName || 'velimiz'}, sporcumuz ${athlete.fullName} bugünkü antrenmana katılmamıştır. Bilginize sunarız.`,
  },
  {
    id: 'belt-exam',
    title: 'Kuşak Sınavı Duyurusu',
    buildText: (athlete) =>
      `Sayın velimiz, sporcumuz ${athlete.fullName} yaklaşan Taekwondo kuşak terfi sınavı hazırlık listesindedir. Detaylar için dönüş yapabilirsiniz.`,
  },
  {
    id: 'license-reminder',
    title: 'Lisans / Evrak Hatırlatması',
    buildText: (athlete) =>
      `Sayın velimiz, sporcumuz ${athlete.fullName}'ın kulüp lisans ve kayıt işlemleri hakkında sizinle görüşmek isteriz.`,
  },
  {
    id: 'general-greeting',
    title: 'Genel Bilgilendirme',
    buildText: (athlete) =>
      `Merhaba ${athlete.parentName || 'Sayın Velimiz'}, sporcumuz ${athlete.fullName} hakkında kulübümüzden bilgi paylaşmak istiyoruz.`,
  },
];

export const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  athlete,
  onClose,
  onSent,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(MESSAGE_TEMPLATES[0].id);
  const [messageText, setMessageText] = useState<string>('');

  const templatesWithText = useMemo(() => {
    if (!athlete) return [];
    return MESSAGE_TEMPLATES.map((tpl) => ({
      ...tpl,
      text: tpl.buildText(athlete),
    }));
  }, [athlete]);

  useEffect(() => {
    if (!athlete) return;
    const defaultTpl = MESSAGE_TEMPLATES[0];
    setSelectedTemplateId(defaultTpl.id);
    setMessageText(defaultTpl.buildText(athlete));
  }, [athlete]);

  if (!athlete) return null;

  const hasValidPhone = athlete.parentPhone.replace(/\D/g, '').length >= 10;
  const whatsappHref = hasValidPhone ? formatWhatsAppUrl(athlete.parentPhone, messageText) : '#';

  const handleSelectTemplate = (tplId: string, text: string) => {
    setSelectedTemplateId(tplId);
    setMessageText(text);
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="whatsapp-modal-title" className="text-base font-bold truncate">
                Veliye WhatsApp Mesajı Gönder
              </h2>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {athlete.parentName || 'Veli'} ·{' '}
                <span className="font-mono">{athlete.parentPhone || 'Telefon yok'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasValidPhone && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
              Bu sporcu için geçerli bir veli telefon numarası kayıtlı değil. Lütfen sporcu kartından telefon numarası ekleyin.
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Hazır Mesaj Şablonu Seçin
            </label>
            <div className="space-y-2">
              {templatesWithText.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id, tpl.text)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 text-slate-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-bold text-slate-900">{tpl.title}</div>
                      <div className="text-xs text-slate-600 leading-relaxed">{tpl.text}</div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Gönderilecek Mesaj (Düzenlenebilir)
            </label>
            <textarea
              rows={3}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                setSelectedTemplateId('custom');
              }}
              placeholder="Mesajınızı yazın veya yukarıdan bir şablon seçin..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2.5 px-5 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          {hasValidPhone ? (
            <a
              href={`tel:${athlete.parentPhone.replace(/\s+/g, '')}`}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Ara</span>
            </a>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors whitespace-nowrap"
            >
              Vazgeç
            </button>

            {hasValidPhone ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onSent?.(athlete);
                  onClose();
                }}
                className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp ile Gönder</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-slate-300 rounded-xl cursor-not-allowed whitespace-nowrap"
              >
                WhatsApp ile Gönder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Smartphone, KeyRound, ArrowRight, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { loginSubBot } from '../api.js';
import type { SubBotInstance } from '../types.js';
import { useTranslation } from '../i18n/LanguageContext.js';

interface LoginSubBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubBotLoaded: (instance: SubBotInstance, token: string) => void;
  onSwitchToCreate: () => void;
}

const COMMON_COUNTRY_CODES = [
  { code: '+55', country: 'Brasil 🇧🇷' },
  { code: '+34', country: 'España 🇪🇸' },
  { code: '+52', country: 'México 🇲🇽' },
  { code: '+54', country: 'Argentina 🇦🇷' },
  { code: '+57', country: 'Colombia 🇨🇴' },
  { code: '+51', country: 'Perú 🇵🇪' },
  { code: '+56', country: 'Chile 🇨🇱' },
  { code: '+58', country: 'Venezuela 🇻🇪' },
  { code: '+593', country: 'Ecuador 🇪🇨' },
  { code: '+502', country: 'Guatemala 🇬🇹' },
  { code: '+1', country: 'EE.UU. / Canada 🇺🇸/🇨🇦' },
  { code: '+351', country: 'Portugal 🇵🇹' },
];

export function LoginSubBotModal({
  isOpen,
  onClose,
  onSubBotLoaded,
  onSwitchToCreate,
}: LoginSubBotModalProps) {
  const { lang, t } = useTranslation();
  const [countryCode, setCountryCode] = useState(() => (lang === 'pt' ? '+55' : lang === 'es' ? '+34' : '+1'));
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginSubBot({ phone: fullPhone, pin });
      onSubBotLoaded(res.instance, res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{t.login_modal_title}</h2>
              <p className="text-xs text-slate-400">{t.login_modal_subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.login_country_label} & {t.login_phone_label}
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {COMMON_COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.country} ({c.code})
                  </option>
                ))}
              </select>

              <input
                type="tel"
                required
                placeholder={t.login_phone_placeholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.login_pin_label}
            </label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder={t.login_pin_placeholder}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.login_submitting}</span>
              </>
            ) : (
              <>
                <span>{t.login_submit_btn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            {t.login_no_bot}{' '}
            <button
              onClick={onSwitchToCreate}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-1"
            >
              {t.login_create_link}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

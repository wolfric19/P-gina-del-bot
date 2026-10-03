import React, { useState } from 'react';
import { X, Crown, Zap, Flame, Copy, Check, Terminal, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.js';

interface CreatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorsModal({ isOpen, onClose }: CreatorsModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const creators = [
    {
      handle: 'wolfric_19',
      role: t.creator_wolfric_role,
      desc: t.creator_wolfric_desc,
      icon: Crown,
      badge: 'FUNDADOR & LEAD',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/30',
      avatarBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      spec: 'Core Engine & Baileys Multi-Device',
    },
    {
      handle: 'The L',
      role: t.creator_thel_role,
      desc: t.creator_thel_desc,
      icon: Zap,
      badge: 'CO-CREADOR & CORE',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/30',
      avatarBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      spec: 'Seguridad, Tokens & Anti-Crash',
    },
    {
      handle: 'zerrDMC_',
      role: t.creator_zerrdmc_role,
      desc: t.creator_zerrdmc_desc,
      icon: Flame,
      badge: 'CO-CREADOR & DEV',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
      avatarBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      spec: 'Infraestructura Cloud & UI',
    },
  ];

  const handleCopyCredits = () => {
    const text = `╭━━━〔 🐺 *CRÉDITOS OFICIALES WOLFRIC* 〕━━━╮\n┃\n┃ 👑 *wolfric_19* — Fundador & Desarrollador Principal\n┃ ⚡ *The L* — Co-Creador & Desarrollador Core\n┃ 🔥 *zerrDMC_* — Co-Creador & Desarrollador\n┃\n┃ 🚀 Plataforma Oficial SubBot Cloud\n┃ 💬 Comandos oficiales: .menu | .creador | .ping\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                Equipo Oficial
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {t.creators_modal_title}
            </h2>
          </div>
        </div>

        {/* Creators List */}
        <div className="space-y-3.5 mb-6">
          {creators.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.handle}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${c.avatarBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-white text-sm sm:text-base font-mono">
                        {c.handle}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${c.badgeColor}`}>
                        {c.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{c.role}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Command Callout */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5 mb-6">
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {t.creators_command_hint}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleCopyCredits}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t.creators_copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.creators_copy_btn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

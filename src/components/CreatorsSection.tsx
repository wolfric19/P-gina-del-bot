import React, { useState } from 'react';
import { Crown, Zap, Flame, Shield, Check, Copy, Sparkles, Terminal, Code2, Heart } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext.js';

export function CreatorsSection() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const creators = [
    {
      handle: 'wolfric_19',
      role: t.creator_wolfric_role,
      desc: t.creator_wolfric_desc,
      icon: Crown,
      badge: 'FOUNDER & LEAD',
      gradient: 'from-cyan-400 to-blue-500',
      borderGlow: 'hover:border-cyan-400/50 hover:shadow-cyan-500/10',
      avatarBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/30',
      tags: ['Founder', 'Baileys Multi-Device', 'Core Logic'],
    },
    {
      handle: 'The L',
      role: t.creator_thel_role,
      desc: t.creator_thel_desc,
      icon: Zap,
      badge: 'CO-CREATOR & CORE',
      gradient: 'from-amber-400 to-orange-500',
      borderGlow: 'hover:border-amber-400/50 hover:shadow-amber-500/10',
      avatarBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/30',
      tags: ['Security', 'Socket Optimization', 'Concurrency'],
    },
    {
      handle: 'zerrDMC_',
      role: t.creator_zerrdmc_role,
      desc: t.creator_zerrdmc_desc,
      icon: Flame,
      badge: 'CO-CREATOR & DEV',
      gradient: 'from-emerald-400 to-teal-500',
      borderGlow: 'hover:border-emerald-400/50 hover:shadow-emerald-500/10',
      avatarBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
      tags: ['Cloud Infra', 'UI Architecture', 'Session Storage'],
    },
  ];

  const handleCopyCredits = () => {
    const text = `╭━━━〔 🐺 *CRÉDITOS OFICIALES WOLFRIC* 〕━━━╮\n┃\n┃ 👑 *wolfric_19* — Fundador & Desarrollador Principal\n┃ ⚡ *The L* — Co-Creador & Desarrollador Core\n┃ 🔥 *zerrDMC_* — Co-Creador & Desarrollador\n┃\n┃ 🚀 Plataforma Oficial SubBot Cloud\n┃ 💬 Comandos oficiales: .menu | .creador | .ping\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="creators-section" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-950/40 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[250px] bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Header Badge & Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold tracking-wider uppercase mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.creators_section_badge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.creators_section_title}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t.creators_section_subtitle}
          </p>
        </div>

        {/* 3 Creators Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creators.map((c) => {
            const IconComponent = c.icon;
            return (
              <div
                key={c.handle}
                className={`group relative p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm transition-all duration-300 shadow-xl ${c.borderGlow} hover:-translate-y-1`}
              >
                {/* Header with avatar & role badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${c.avatarBg} transition-transform group-hover:scale-105`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                        <span>{c.handle}</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        {c.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div className="mb-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300/90 leading-relaxed mb-4">
                  {c.desc}
                </p>

                {/* Tech tags */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950/70 border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar: WhatsApp Credits Copy & Terminal Command Hint */}
        <div className="mt-10 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {t.creators_command_hint}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Comandos: <span className="text-cyan-300">.creador</span> • <span className="text-cyan-300">.creadores</span> • <span className="text-cyan-300">.creditos</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCredits}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">{t.creators_copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.creators_copy_btn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

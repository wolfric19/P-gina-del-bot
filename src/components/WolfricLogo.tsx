import React, { useState } from 'react';
import { playMemeSound, playSharePop } from '../utils/audioFeedback.js';

export function WolfricLogo({
  size = 'md',
  showSubtitle = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}) {
  const [clickCount, setClickCount] = useState(0);
  const [chadActive, setChadActive] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = clickCount + 1;
    setClickCount(next);

    if (next >= 5) {
      setClickCount(0);
      setChadActive(true);
      playMemeSound('chad');
      setTimeout(() => setChadActive(false), 2500);
    } else {
      playSharePop(next);
    }
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  return (
    <div
      onClick={handleLogoClick}
      title="Toca 5 veces para Easter Egg secreto"
      className="flex items-center gap-3 select-none group cursor-pointer relative"
    >
      {chadActive && (
        <div className="absolute -top-7 left-0 px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[10px] animate-bounce z-50 shadow-lg whitespace-nowrap">
          🗿🍷 ¡MODO CHAD ACTIVADO!
        </div>
      )}
      {/* Formal Heraldic Wolf Crest */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-b from-[#141b24] via-[#0d121a] to-[#080b10] border border-white/[0.1] p-1.5 shadow-xl transition-all duration-300 group-hover:border-emerald-400/50 group-hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)] ${
          chadActive ? 'ring-2 ring-emerald-400 scale-110' : ''
        } ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
        >
          {/* Outer Heraldic Shield */}
          <path
            d="M24 3L42 9V24C42 34 24 45 24 45C24 45 6 34 6 24V9L24 3Z"
            fill="url(#crest_fill)"
            stroke="url(#crest_stroke)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Inner Accent Inset */}
          <path
            d="M24 6.5L38.5 11.5V23.5C38.5 31.5 24 40.5 24 40.5C24 40.5 9.5 31.5 9.5 23.5V11.5L24 6.5Z"
            stroke="#10b981"
            strokeWidth="0.8"
            strokeOpacity="0.4"
            fill="none"
          />

          {/* Noble Wolf Head Silhouette */}
          {/* Left Ear */}
          <polygon points="15,13 19,8 22,17" fill="#e2e8f0" />
          {/* Right Ear */}
          <polygon points="33,13 29,8 26,17" fill="#cbd5e1" />
          {/* Forehead & Brow */}
          <polygon points="24,12 28,19 24,23 20,19" fill="#06b6d4" />
          {/* Left Cheek */}
          <polygon points="14,21 21,18 20,27 15,30" fill="#94a3b8" />
          {/* Right Cheek */}
          <polygon points="34,21 27,18 28,27 33,30" fill="#64748b" />
          {/* Muzzle Snout */}
          <polygon points="20,26 28,26 24,37" fill="#10b981" />
          {/* Piercing Noble Eyes */}
          <circle cx="19" cy="20.5" r="1.2" fill="#ffffff" />
          <circle cx="29" cy="20.5" r="1.2" fill="#ffffff" />

          <defs>
            <linearGradient id="crest_fill" x1="24" y1="3" x2="24" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#101824" />
              <stop offset="1" stopColor="#070a0e" />
            </linearGradient>
            <linearGradient id="crest_stroke" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="0.5" stopColor="#38bdf8" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Title & Official Label */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-[0.12em] font-display text-white transition-colors duration-200 group-hover:text-emerald-400 ${textSizes[size]}`}
          >
            WOLFRIC
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md shadow-sm">
            OFFICIAL
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            Plataforma Multi-Device • Baileys
          </span>
        )}
      </div>
    </div>
  );
}

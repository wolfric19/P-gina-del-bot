import React from 'react';
import { Smartphone, CheckCircle2, Radio, Wifi, ShieldCheck } from 'lucide-react';

interface WhatsAppConnectionPulseProps {
  status?: 'online' | 'pairing' | 'idle' | 'offline';
  phone?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WhatsAppConnectionPulse({
  status = 'idle',
  phone,
  size = 'md',
}: WhatsAppConnectionPulseProps) {
  const isOnline = status === 'online';
  const isPairing = status === 'pairing';
  const isOffline = status === 'offline';

  const containerSizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  }[size];

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center select-none py-2">
      <div className={`relative flex items-center justify-center ${containerSizes}`}>
        {/* Concentric Ambient Pulse Rings */}
        {isPairing && (
          <>
            <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-amber-400/10 blur-xl animate-pulse pointer-events-none" />
          </>
        )}

        {isOnline && (
          <>
            <div className="absolute inset-0 rounded-full border border-emerald-400/25 animate-pulse pointer-events-none" />
            <div className="absolute -inset-2 rounded-full bg-emerald-500/15 blur-xl pointer-events-none" />
          </>
        )}

        {/* Central Core Emblem */}
        <div
          className={`relative z-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border ${
            isOnline
              ? 'bg-gradient-to-b from-emerald-950/80 to-[#080e0c] border-emerald-400/50 text-emerald-400 shadow-emerald-500/20'
              : isPairing
              ? 'bg-gradient-to-b from-amber-950/80 to-[#0e0c08] border-amber-400/50 text-amber-300 shadow-amber-500/20'
              : isOffline
              ? 'bg-gradient-to-b from-rose-950/70 to-[#0e0809] border-rose-500/40 text-rose-300'
              : 'bg-gradient-to-b from-[#141b24] to-[#090c12] border-white/[0.1] text-slate-300'
          } ${size === 'sm' ? 'p-4' : 'p-6'}`}
        >
          {isOnline ? (
            <CheckCircle2 className={`${iconSizes} animate-in zoom-in-75 duration-300`} />
          ) : isPairing ? (
            <Smartphone className={`${iconSizes} animate-bounce`} />
          ) : (
            <Wifi className={`${iconSizes} text-slate-400`} />
          )}

          {/* Active status beacon dot */}
          <span
            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-[#07080c] ${
              isOnline
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                : isPairing
                ? 'bg-amber-400 animate-ping shadow-[0_0_8px_#f59e0b]'
                : 'bg-slate-600'
            }`}
          />
        </div>
      </div>

      {/* Label under icon */}
      <div className="mt-2 text-center">
        <div className="text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-emerald-400' : isPairing ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className={isOnline ? 'text-emerald-400' : isPairing ? 'text-amber-300' : 'text-slate-400'}>
            {isOnline ? 'Socket Baileys Activo' : isPairing ? 'Esperando Conexión' : 'Desconectado'}
          </span>
        </div>
        {phone && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{phone}</div>}
      </div>
    </div>
  );
}

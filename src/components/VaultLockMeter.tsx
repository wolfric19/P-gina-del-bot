import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, ShieldCheck, ShieldAlert, KeyRound, Sparkles } from 'lucide-react';
import { playVaultRatchet, playVaultOpen } from '../utils/audioFeedback.js';

interface VaultLockMeterProps {
  value: string;
  isUnlocked?: boolean;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function VaultLockMeter({
  value,
  isUnlocked = false,
  label = 'Bóveda de Seguridad Wolfric Root',
  className = '',
  compact = false,
}: VaultLockMeterProps) {
  const prevLenRef = useRef(value.length);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Calculate password strength & entropy
  const len = value.length;
  let pool = 0;
  if (/[a-z]/.test(value)) pool += 26;
  if (/[A-Z]/.test(value)) pool += 26;
  if (/[0-9]/.test(value)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(value)) pool += 33;
  if (pool === 0) pool = 10;

  const entropyBits = len > 0 ? Math.min(100, Math.round(len * Math.log2(pool))) : 0;

  // Determine tier (1 to 4)
  let tier = 0;
  let tierName = 'Bóveda Bloqueada';
  let crackTime = 'Introduce la clave de acceso';
  let color = 'slate';

  if (len > 0) {
    if (entropyBits < 28) {
      tier = 1;
      tierName = 'Caja de Cartón';
      crackTime = 'Vulnerable en segundos';
      color = 'rose';
    } else if (entropyBits < 48) {
      tier = 2;
      tierName = 'Candado de Bicicleta';
      crackTime = 'Vulnerable en pocas horas';
      color = 'amber';
    } else if (entropyBits < 68) {
      tier = 3;
      tierName = 'Cerradura Blindada';
      crackTime = 'Vulnerable en varios meses';
      color = 'yellow';
    } else {
      tier = 4;
      tierName = 'Bóveda Bancaria Criptográfica';
      crackTime = 'Vulnerable en más de 3,000 años';
      color = 'emerald';
    }
  }

  // Audio feedback & safe wheel rotation on input change
  useEffect(() => {
    if (len !== prevLenRef.current) {
      const delta = len - prevLenRef.current;
      setRotationAngle((prev) => prev + delta * 45);
      if (len > 0) {
        playVaultRatchet(len);
      }
      prevLenRef.current = len;
    }
  }, [len]);

  const unlockedState = Boolean(isUnlocked);
  const wasUnlockedRef = useRef(unlockedState);

  useEffect(() => {
    if (unlockedState && !wasUnlockedRef.current) {
      playVaultOpen();
    }
    wasUnlockedRef.current = unlockedState;
  }, [unlockedState]);

  return (
    <div
      className={`rounded-2xl p-4 bg-slate-950/80 border border-slate-800/90 shadow-xl relative overflow-hidden backdrop-blur-md transition-all ${
        unlockedState
          ? 'border-emerald-500/50 shadow-emerald-500/10'
          : tier >= 3
          ? 'border-amber-500/40'
          : 'border-slate-800'
      } ${className}`}
    >
      {/* Top Laser Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500 ${
          unlockedState
            ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
            : tier === 3
            ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'
            : tier >= 1
            ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent'
            : 'bg-transparent'
        }`}
      />

      <div className="flex items-center gap-4">
        {/* Animated Vault Safe Door */}
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Outer Heavy Steel Rim */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center transition-colors duration-500 relative ${
              unlockedState
                ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/50 to-slate-900 shadow-lg shadow-emerald-500/25'
                : tier === 3
                ? 'border-amber-400 bg-gradient-to-b from-amber-950/40 to-slate-900'
                : tier === 2
                ? 'border-amber-600 bg-gradient-to-b from-slate-900 to-slate-950'
                : tier === 1
                ? 'border-rose-500/70 bg-gradient-to-b from-rose-950/40 to-slate-950'
                : 'border-slate-700 bg-slate-900'
            }`}
          >
            {/* Rivets / Bolts on Rim */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <span
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-500/80"
                style={{
                  transform: `rotate(${deg}deg) translate(0, -${compact ? '26px' : '32px'})`,
                }}
              />
            ))}

            {/* Retracting Pneumatic Deadbolts (top, right, bottom, left) */}
            {[0, 90, 180, 270].map((boltDeg) => (
              <motion.div
                key={boltDeg}
                className="absolute w-1.5 h-3.5 bg-gradient-to-t from-slate-300 to-slate-500 rounded-sm shadow-sm"
                animate={{
                  y: unlockedState ? -16 : -28,
                  opacity: unlockedState ? 0.4 : 1,
                }}
                transition={{ type: 'spring', damping: 18, stiffness: 200 }}
                style={{
                  transformOrigin: 'center center',
                  transform: `rotate(${boltDeg}deg) translateY(-26px)`,
                }}
              />
            ))}

            {/* Inner Rotating Dial / Wheel with Spoke Handles */}
            <motion.div
              animate={{ rotate: rotationAngle }}
              transition={{ type: 'spring', damping: 15, stiffness: 250 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-2 border-slate-500/80 flex items-center justify-center relative shadow-inner cursor-pointer"
              title="Gira el timón al escribir la clave"
            >
              {/* Spoke handles of the safe wheel */}
              {[0, 60, 120, 180, 240, 300].map((spokeDeg) => (
                <div
                  key={spokeDeg}
                  className="absolute w-1 h-5 bg-gradient-to-t from-slate-400 to-slate-200 rounded-full"
                  style={{
                    transform: `rotate(${spokeDeg}deg) translateY(-8px)`,
                  }}
                />
              ))}

              {/* Center Lock Status Indicator Hub */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md relative z-10 transition-colors ${
                  unlockedState
                    ? 'bg-emerald-500 text-slate-950'
                    : tier >= 3
                    ? 'bg-amber-400 text-slate-950'
                    : tier >= 1
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {unlockedState ? (
                  <Unlock className="w-2.5 h-2.5" />
                ) : (
                  <Lock className="w-2.5 h-2.5" />
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Vault Information & 4-Segment Strength Meter */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold text-slate-300 truncate flex items-center gap-1.5">
              {unlockedState ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <KeyRound className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              )}
              {label}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-cyan-300 shrink-0 font-semibold">
              {entropyBits} bits de entropía
            </span>
          </div>

          {/* 4 Segmented Color Bars (from screenshot) */}
          <div className="grid grid-cols-4 gap-1.5 my-2">
            {/* Segment 1: Red */}
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                tier >= 1
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-sm shadow-rose-500/40'
                  : 'bg-slate-800'
              }`}
            />
            {/* Segment 2: Orange */}
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                tier >= 2
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-amber-500/40'
                  : 'bg-slate-800'
              }`}
            />
            {/* Segment 3: Yellow */}
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                tier >= 3
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 shadow-sm shadow-yellow-400/40'
                  : 'bg-slate-800'
              }`}
            />
            {/* Segment 4: Emerald / Bank Vault */}
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                tier >= 4
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-sm shadow-emerald-400/50 animate-pulse'
                  : 'bg-slate-800'
              }`}
            />
          </div>

          {/* Dynamic description & crack estimation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 mt-1">
            <span
              className={`font-semibold ${
                tier === 4
                  ? 'text-emerald-400'
                  : tier === 3
                  ? 'text-yellow-400'
                  : tier === 2
                  ? 'text-amber-400'
                  : tier === 1
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {tierName}
            </span>
            <span className="text-[11px] text-slate-400 truncate font-mono">
              {crackTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

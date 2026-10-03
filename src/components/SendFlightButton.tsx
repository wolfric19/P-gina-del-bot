import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Check, RefreshCw } from 'lucide-react';
import { playPaperPlaneFly, playKeyClick } from '../utils/audioFeedback.js';

interface SendFlightButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  variant?: 'emerald' | 'cyan' | 'indigo' | 'slate' | 'violet' | 'amber';
  className?: string;
  icon?: React.ReactNode;
  id?: string;
}

export function SendFlightButton({
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children = 'Enviar',
  variant = 'violet',
  className = '',
  icon,
  id,
}: SendFlightButtonProps) {
  const [isFlying, setIsFlying] = useState(false);
  const [flightKey, setFlightKey] = useState(0);

  const colorStyles = {
    violet: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:brightness-110 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] border-violet-400/40',
    amber: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.35)] border-amber-300/40',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border-emerald-500/30',
    cyan: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/40 border-cyan-500/30',
    indigo: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40 border-indigo-500/30',
    slate: 'bg-[#1a1538] hover:bg-[#251e50] text-white shadow-black/40 border-violet-900/40',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // If part of a form, verify validation before triggering flight animation
    const form = e.currentTarget.form;
    if (type === 'submit' && form && !form.checkValidity()) {
      // Let standard form validation display errors
      return;
    }

    // Trigger paper plane launch sequence
    setIsFlying(true);
    setFlightKey((prev) => prev + 1);
    playPaperPlaneFly();

    if (onClick) {
      onClick(e);
    }

    // Reset flight state after animation completes
    setTimeout(() => {
      setIsFlying(false);
    }, 1200);
  };

  return (
    <motion.button
      id={id}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`relative overflow-hidden px-6 py-3 rounded-xl font-bold text-sm tracking-wide border shadow-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group ${colorStyles[variant]} ${className}`}
    >
      {/* Background Glow Ripple */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

      {/* Wind / Speed Trail Particles when flying */}
      {isFlying && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: [0, 0.8, 0], x: 80 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-y-0 left-1/4 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
        />
      )}

      {/* Flying Paper Plane Animation */}
      <AnimatePresence>
        {isFlying && (
          <motion.div
            key={flightKey}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, 15, 60, 180],
              y: [0, -4, -12, -35],
              rotate: [0, -10, -22, -35],
              scale: [1, 1.15, 0.9, 0.5],
              opacity: [1, 1, 0.9, 0],
            }}
            transition={{
              duration: 0.75,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="absolute z-20 pointer-events-none text-white drop-shadow-md"
          >
            {/* Detailed Faceted Paper Plane SVG */}
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              className="fill-current transform rotate-45"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Content / Label */}
      <div
        className={`flex items-center gap-2.5 transition-all duration-300 ${
          isFlying ? 'opacity-30 blur-[0.5px] translate-x-1' : 'opacity-100'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white/90" />
            <span>Procesando...</span>
          </>
        ) : (
          <>
            {icon ? (
              icon
            ) : (
              <Send
                className={`w-4 h-4 transition-transform duration-300 ${
                  isFlying ? 'opacity-0 scale-50' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                }`}
              />
            )}
            <span>{children}</span>
          </>
        )}
      </div>
    </motion.button>
  );
}

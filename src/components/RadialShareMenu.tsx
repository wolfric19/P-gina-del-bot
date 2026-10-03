import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  X,
  Link,
  Check,
  QrCode,
  MessageCircle,
  Send,
  Twitter,
  Copy,
} from 'lucide-react';
import { playSharePop, playAccessGranted } from '../utils/audioFeedback.js';

interface RadialShareMenuProps {
  floating?: boolean;
  className?: string;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  action: () => void;
}

export function RadialShareMenu({ floating = true, className = '' }: RadialShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return 'https://whatsapp.com/channel/0029VbDSzOv8KMqcStjGog1T';
  };

  const shareText = encodeURIComponent(
    '🐺 ¡Conecta tu WhatsApp a Wolfric en segundos con código de 8 dígitos y progreso en la nube!'
  );

  const handleCopyLink = async () => {
    try {
      const url = getShareUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      playAccessGranted();
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // ignore
    }
  };

  const openSafeLink = (url: string) => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5 fill-current" />,
      bg: 'bg-emerald-600 hover:bg-emerald-500',
      border: 'border-emerald-400/50',
      text: 'text-white',
      action: () => {
        const url = `https://wa.me/?text=${shareText}%20${encodeURIComponent(getShareUrl())}`;
        openSafeLink(url);
      },
    },
    {
      id: 'copy',
      name: copied ? '¡Copiado!' : 'Copiar Link',
      icon: copied ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />,
      bg: copied ? 'bg-cyan-500' : 'bg-slate-800 hover:bg-slate-700',
      border: copied ? 'border-cyan-300' : 'border-slate-600',
      text: copied ? 'text-slate-950 font-bold' : 'text-slate-200',
      action: handleCopyLink,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-5 h-5 fill-current" />,
      bg: 'bg-sky-500 hover:bg-sky-400',
      border: 'border-sky-300/50',
      text: 'text-white',
      action: () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${shareText}`;
        openSafeLink(url);
      },
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: <Twitter className="w-4 h-4 fill-current" />,
      bg: 'bg-slate-900 hover:bg-black',
      border: 'border-slate-700',
      text: 'text-white',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(getShareUrl())}`;
        openSafeLink(url);
      },
    },
    {
      id: 'qr',
      name: 'Código QR',
      icon: <QrCode className="w-5 h-5" />,
      bg: 'bg-emerald-950/80 hover:bg-emerald-900',
      border: 'border-emerald-500/50',
      text: 'text-emerald-300',
      action: () => {
        setShowQrModal(true);
        setIsOpen(false);
      },
    },
  ];

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    playSharePop(next ? 1 : 4);
  };

  // Radial fan angles:
  // When floating on bottom-right, the fan fans out upwards and to the left (from ~180° to ~270°)
  // Angle distribution in radians:
  const baseAngleDeg = 180; // left
  const totalSpanDeg = 90; // up to 270°
  const radius = 100; // pixels distance from center

  return (
    <>
      <div
        ref={menuRef}
        className={`${
          floating ? 'fixed bottom-6 right-6 z-50' : 'relative inline-block'
        } ${className}`}
      >
        {/* Floating "Copiado!" pill notification */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -15, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="absolute -top-10 right-0 px-3 py-1.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 whitespace-nowrap pointer-events-none"
            >
              <Check className="w-3.5 h-3.5" />
              <span>¡Enlace copiado!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Radial Satellite Buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {shareOptions.map((opt, i) => {
                const count = shareOptions.length;
                const angleDeg = baseAngleDeg + (i / (count - 1)) * totalSpanDeg;
                const angleRad = (angleDeg * Math.PI) / 180;
                const targetX = Math.round(Math.cos(angleRad) * radius);
                const targetY = Math.round(Math.sin(angleRad) * radius);

                return (
                  <motion.div
                    key={opt.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: targetX,
                      y: targetY,
                      scale: 1,
                      opacity: 1,
                    }}
                    exit={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 18,
                      delay: i * 0.04,
                    }}
                    className="absolute pointer-events-auto group/item"
                  >
                    <button
                      onClick={() => {
                        playSharePop(i);
                        opt.action();
                      }}
                      title={opt.name}
                      className={`w-11 h-11 rounded-full ${opt.bg} ${opt.text} border ${opt.border} shadow-xl flex items-center justify-center transition-transform hover:scale-115 active:scale-95 cursor-pointer`}
                    >
                      {opt.icon}
                    </button>

                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-semibold text-white whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none shadow-md">
                      {opt.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Central Master Share Button */}
        <motion.button
          onClick={toggleOpen}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center border shadow-2xl relative z-10 transition-colors cursor-pointer ${
            isOpen
              ? 'bg-rose-600 border-rose-400 text-white shadow-rose-950/60'
              : 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300/40 text-white shadow-emerald-950/60'
          }`}
          title={isOpen ? 'Cerrar compartir' : 'Compartir Wolfric'}
        >
          {/* Subtle Ambient Pulse Ring */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
          )}

          <motion.div
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Quick QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                <QrCode className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">
                Escanear para abrir Wolfric
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Apunta con la cámara de tu teléfono para abrir esta plataforma al instante.
              </p>

              {/* QR Image using standard API */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    getShareUrl()
                  )}`}
                  alt="QR Code"
                  className="w-44 h-44 mx-auto"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

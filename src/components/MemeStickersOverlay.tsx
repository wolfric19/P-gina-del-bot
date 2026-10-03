import React, { useState } from 'react';
import { Sparkles, MessageCircleHeart, Flame, Ghost, Zap, Heart, PartyPopper, Smile, X, Volume2 } from 'lucide-react';
import { playSharePop, playKeyClick, playMemeSound, type MemeSoundType } from '../utils/audioFeedback.js';

interface StickerItem {
  id: string;
  emoji: string;
  text: string;
  subText?: string;
  badge?: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: string;
  floatAnim: string;
  bgGrad: string;
  borderCol: string;
  sound?: MemeSoundType;
}

const STICKERS: StickerItem[] = [
  // 1. Superior izquierda
  {
    id: 's1',
    emoji: '🗿🍷',
    text: 'Fino señores',
    subText: 'Wolfric 100% Anti-Ban',
    badge: 'CHAD',
    top: '12%',
    left: '2%',
    rotate: '-rotate-6',
    floatAnim: 'animate-bounce',
    bgGrad: 'from-amber-950/60 to-black/80',
    borderCol: 'border-amber-500/40',
    sound: 'chad',
  },
  // 2. Superior derecha
  {
    id: 's2',
    emoji: '🐺🔥',
    text: 'Lobo Solitario',
    subText: 'Termux modo diablo',
    badge: 'GOD',
    top: '15%',
    right: '2%',
    rotate: 'rotate-6',
    floatAnim: 'animate-pulse',
    bgGrad: 'from-orange-950/60 to-black/80',
    borderCol: 'border-orange-500/40',
    sound: 'levelUp',
  },
  // 3. Lateral izquierdo centro
  {
    id: 's3',
    emoji: '📱⚡',
    text: 'Cero Lag',
    subText: 'Latencia 20ms real',
    badge: 'FAST',
    top: '44%',
    left: '1.5%',
    rotate: 'rotate-3',
    floatAnim: 'animate-bounce',
    bgGrad: 'from-cyan-950/60 to-black/80',
    borderCol: 'border-cyan-500/40',
    sound: 'pew',
  },
  // 4. Lateral derecho centro
  {
    id: 's4',
    emoji: '😎🤙',
    text: 'Modo Fachero',
    subText: 'SubBots activos 24/7',
    badge: 'PRO',
    top: '48%',
    right: '2%',
    rotate: '-rotate-12',
    floatAnim: 'animate-pulse',
    bgGrad: 'from-emerald-950/60 to-black/80',
    borderCol: 'border-emerald-500/40',
    sound: 'coin',
  },
  // 5. Abajo izquierda
  {
    id: 's5',
    emoji: '💀⚰️',
    text: 'Los que no usan Wolfric',
    subText: 'baneados por WhatsApp xd',
    badge: 'F',
    bottom: '12%',
    left: '3%',
    rotate: '-rotate-6',
    floatAnim: 'animate-pulse',
    bgGrad: 'from-red-950/60 to-black/80',
    borderCol: 'border-red-500/40',
    sound: 'bruh',
  },
  // 6. Abajo derecha
  {
    id: 's6',
    emoji: '🐸☕',
    text: 'Pero bueno...',
    subText: 'cada quien con su bot xd',
    badge: 'MEME',
    bottom: '10%',
    right: '3%',
    rotate: 'rotate-12',
    floatAnim: 'animate-bounce',
    bgGrad: 'from-purple-950/60 to-black/80',
    borderCol: 'border-purple-500/40',
    sound: 'badumtss',
  },
  // 7. Mini sticker flotante extra
  {
    id: 's7',
    emoji: '🐧📦',
    text: 'pkg update -y',
    subText: 'Termux supremacy',
    badge: 'BASH',
    top: '28%',
    left: '3.5%',
    rotate: 'rotate-12',
    floatAnim: 'animate-pulse',
    bgGrad: 'from-yellow-950/60 to-black/80',
    borderCol: 'border-yellow-500/40',
    sound: 'pew',
  },
  // 8. Mini sticker flotante extra der
  {
    id: 's8',
    emoji: '🤡🎈',
    text: 'Los que pagan VPS',
    subText: 'cuando Termux es gratis JAJA',
    badge: 'XD',
    top: '30%',
    right: '2.5%',
    rotate: '-rotate-6',
    floatAnim: 'animate-bounce',
    bgGrad: 'from-pink-950/60 to-black/80',
    borderCol: 'border-pink-500/40',
    sound: 'quack',
  },
  // 9. Antiban Chad
  {
    id: 's9',
    emoji: '🛡️🕶️',
    text: 'Antiban Activado',
    subText: 'WhatsApp ni se entera rey',
    badge: 'SAFE',
    bottom: '26%',
    left: '2%',
    rotate: 'rotate-3',
    floatAnim: 'animate-pulse',
    bgGrad: 'from-blue-950/60 to-black/80',
    borderCol: 'border-blue-500/40',
    sound: 'chad',
  },
  // 10. Rey de los bots
  {
    id: 's10',
    emoji: '👑🔥',
    text: 'El Admin Supremo',
    subText: 'Manda en el grupo bro',
    badge: 'BOSS',
    bottom: '24%',
    right: '2%',
    rotate: '-rotate-3',
    floatAnim: 'animate-bounce',
    bgGrad: 'from-amber-950/60 to-black/80',
    borderCol: 'border-amber-400/40',
    sound: 'airhorn',
  },
];

export function MemeStickersOverlay() {
  const [clickedSticker, setClickedSticker] = useState<string | null>(null);
  const [activeReaction, setActiveReaction] = useState<{ id: string; text: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleClick = (stk: StickerItem) => {
    if (stk.sound) {
      playMemeSound(stk.sound);
    } else {
      playSharePop(Math.floor(Math.random() * 6));
    }
    setClickedSticker(stk.id);
    setActiveReaction({ id: stk.id, text: `${stk.emoji} ${stk.text}` });
    
    setTimeout(() => {
      setClickedSticker(null);
    }, 1200);

    setTimeout(() => {
      setActiveReaction(null);
    }, 2000);
  };

  if (!visible) {
    return (
      <button
        onClick={() => {
          playKeyClick();
          setVisible(true);
        }}
        className="fixed bottom-3 left-3 z-30 px-3 py-1.5 text-xs font-mono font-semibold text-amber-400 bg-black/80 border border-amber-500/40 rounded-full hover:bg-black/90 transition-all flex items-center gap-1.5 shadow-xl backdrop-blur-md hover:scale-105 active:scale-95 cursor-pointer"
        title="Mostrar stickers y memes"
      >
        <span>🎭 Memes & Stickers</span>
      </button>
    );
  }

  return (
    <>
      {/* Botón flotante móvil para abrir stickers en celulares sin estorbar */}
      <div className="sm:hidden fixed bottom-3 left-3 z-30 flex items-center gap-2">
        <button
          onClick={() => {
            playKeyClick();
            setMobileDrawerOpen(!mobileDrawerOpen);
          }}
          className="px-3 py-1.5 text-xs font-mono font-medium text-amber-300 bg-black/85 border border-amber-500/40 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span>🎭 {mobileDrawerOpen ? 'Cerrar Memes' : 'Ver Memes XD'}</span>
        </button>
      </div>

      {/* Drawer desplegable en móvil */}
      {mobileDrawerOpen && (
        <div className="sm:hidden fixed inset-x-3 bottom-14 z-30 p-3 bg-zinc-950/95 border border-amber-500/30 rounded-2xl shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>🎭 Memes & Stickers Wolfric</span>
            </span>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {STICKERS.map((stk) => (
              <div
                key={stk.id}
                onClick={() => handleClick(stk)}
                className={`p-2 rounded-xl bg-gradient-to-br ${stk.bgGrad} border ${stk.borderCol} cursor-pointer active:scale-95 transition-all text-left relative overflow-hidden`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{stk.emoji}</span>
                  <div>
                    <div className="text-[11px] font-bold text-amber-200 leading-tight">
                      {stk.text}
                    </div>
                    {stk.subText && (
                      <div className="text-[9px] text-zinc-400 leading-none mt-0.5 truncate">
                        {stk.subText}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reacción flotante al centro cuando tocas un meme */}
      {activeReaction && (
        <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-2 bg-black/90 border border-amber-500/60 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="text-sm font-bold text-amber-300 font-mono">
              {activeReaction.text}
            </span>
            <span className="text-xs">✨</span>
          </div>
        </div>
      )}

      {/* Overlay principal con stickers colocados en los costados para no estorbar el centro */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        {/* Botoncito discreto en desktop para ocultar si se desea */}
        <button
          onClick={() => {
            playKeyClick();
            setVisible(false);
          }}
          className="pointer-events-auto hidden sm:flex fixed bottom-3 left-3 z-30 px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-amber-300 bg-black/60 hover:bg-black/85 border border-zinc-800 hover:border-amber-500/40 rounded-full transition-all items-center gap-1 backdrop-blur-md opacity-60 hover:opacity-100 cursor-pointer shadow-lg"
          title="Ocultar stickers"
        >
          <span>🎭 Ocultar Stickers</span>
        </button>

        {/* Stickers regados por la pantalla en pantallas medianas y grandes */}
        {STICKERS.map((stk) => {
          const isClicked = clickedSticker === stk.id;
          const style: React.CSSProperties = {
            position: 'absolute',
            top: stk.top,
            bottom: stk.bottom,
            left: stk.left,
            right: stk.right,
            maxWidth: '190px',
          };

          return (
            <div
              key={stk.id}
              style={style}
              onClick={() => handleClick(stk)}
              className={`pointer-events-auto cursor-pointer select-none transition-all duration-300 ease-out transform ${stk.rotate} ${
                isClicked
                  ? 'scale-125 rotate-0 z-40'
                  : 'hover:scale-115 hover:rotate-0 hover:z-30 hover:-translate-y-1'
              } hidden md:block`}
            >
              <div
                className={`relative px-3 py-2 rounded-2xl bg-gradient-to-br ${stk.bgGrad} border ${stk.borderCol} shadow-xl shadow-black/70 backdrop-blur-md transition-all group`}
              >
                {/* Badge superior */}
                {stk.badge && (
                  <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-[9px] rounded-full uppercase tracking-wider shadow-sm">
                    {stk.badge}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-2xl filter drop-shadow group-hover:scale-125 transition-transform duration-200">
                    {stk.emoji}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-amber-200 leading-tight group-hover:text-amber-400 transition-colors">
                      {stk.text}
                    </span>
                    {stk.subText && (
                      <span className="text-[9px] text-zinc-400 leading-tight font-medium">
                        {stk.subText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Efecto al clickear */}
                {isClicked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 backdrop-blur-xs rounded-2xl animate-ping pointer-events-none">
                    <span className="text-lg">✨</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

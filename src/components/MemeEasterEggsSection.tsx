import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  Skull,
  Zap,
  Radio,
  Trophy,
  PartyPopper,
  AlertTriangle,
  Smile,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  playMemeSound,
  playSecretUnlocked,
  playSharePop,
  playKeyClick,
  isAudioEnabled,
  setAudioEnabled,
  type MemeSoundType,
} from '../utils/audioFeedback.js';

interface SoundItem {
  id: MemeSoundType;
  label: string;
  emoji: string;
  description: string;
  badge: string;
  color: string;
}

const SOUNDS: SoundItem[] = [
  {
    id: 'chad',
    label: 'Fino Señores',
    emoji: '🗿🍷',
    description: 'Acorde majestuoso para momentos de respeto absoluto.',
    badge: 'CHAD',
    color: 'from-amber-600/30 to-amber-950/40 border-amber-500/40 text-amber-200',
  },
  {
    id: 'bruh',
    label: 'Bruh Moment',
    emoji: '💀⚰️',
    description: 'Tono bajo descendente cuando alguien la riega feo.',
    badge: 'F',
    color: 'from-rose-600/30 to-rose-950/40 border-rose-500/40 text-rose-200',
  },
  {
    id: 'airhorn',
    label: 'Airhorn MLG',
    emoji: '🎺🔥',
    description: 'Bocina triple de DJ cuando el bot entra a un grupo.',
    badge: 'HYPE',
    color: 'from-orange-600/30 to-orange-950/40 border-orange-500/40 text-orange-200',
  },
  {
    id: 'pew',
    label: 'Láser Pew Pew',
    emoji: '⚡👽',
    description: 'Disparo 8-bit retro para eliminar spammers al instante.',
    badge: 'RETRO',
    color: 'from-cyan-600/30 to-cyan-950/40 border-cyan-500/40 text-cyan-200',
  },
  {
    id: 'coin',
    label: 'Moneda 8-Bit',
    emoji: '🪙✨',
    description: 'Sonido nostálgico de bonus o nivel completado.',
    badge: '1-UP',
    color: 'from-yellow-600/30 to-yellow-950/40 border-yellow-500/40 text-yellow-200',
  },
  {
    id: 'badumtss',
    label: 'Ba-Dum Tss!',
    emoji: '🥁🤡',
    description: 'Redoble de batería y platillo para chistes pésimos.',
    badge: 'CHISTE',
    color: 'from-purple-600/30 to-purple-950/40 border-purple-500/40 text-purple-200',
  },
  {
    id: 'levelUp',
    label: 'Level Up',
    emoji: '🚀🏆',
    description: 'Escala musical triunfante al vincular tu bot con éxito.',
    badge: 'GOAT',
    color: 'from-emerald-600/30 to-emerald-950/40 border-emerald-500/40 text-emerald-200',
  },
  {
    id: 'quack',
    label: 'Cuac Cuac',
    emoji: '🦆📦',
    description: 'Efecto cómico para cuando se cae el internet de la casa.',
    badge: 'XD',
    color: 'from-sky-600/30 to-sky-950/40 border-sky-500/40 text-sky-200',
  },
];

const FUNNY_QUOTES = [
  '⚠️ ¡Te dije que no lo tocaras! Ahora tu WhatsApp enviará stickers de Piolín a las 6 AM 👵',
  '🚀 Descargando 128 GB de memoria RAM imaginaria para tu Termux...',
  '🐺 Modo Lobo Alfa activado: el bot ahora responde con stickers en 0.05 segundos.',
  '👁️👄👁️ WhatsApp: "¿Quién anda vinculando bots a estas horas de la noche?"',
  '🍷 Fino señores: has desbloqueado la bendición eterna del antiban.',
  '⚡ Alerta: la batería de tu teléfono acaba de subir al 101%.',
  '☕ Tranquilo bro, el bot de Wolfric no duerme para que tú sí puedas.',
];

interface MemeParticle {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
}

export function MemeEasterEggsSection() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState<number>(() => {
    return Number(localStorage.getItem('wolfric_meme_clicks') || '0');
  });
  const [dangerAlert, setDangerAlert] = useState<string | null>(null);
  const [particles, setParticles] = useState<MemeParticle[]>([]);
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [konamiUnlocked, setKonamiUnlocked] = useState(false);
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [copiedCheat, setCopiedCheat] = useState(false);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !audioOn;
    setAudioOn(next);
    setAudioEnabled(next);
    if (next) playSharePop(2);
  };

  // Sound trigger
  const handleTriggerSound = (id: MemeSoundType) => {
    playMemeSound(id);
    setActiveSound(id);
    setTimeout(() => {
      setActiveSound(null);
    }, 600);
  };

  // Meme clicker
  const handleMemeClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    localStorage.setItem('wolfric_meme_clicks', String(nextCount));

    if (nextCount % 10 === 0) {
      playMemeSound('levelUp');
      spawnParticles('🔥', 8);
    } else {
      playSharePop(nextCount % 6);
    }
  };

  // Spawn lightweight falling meme particles that auto cleanup
  const spawnParticles = (customEmoji?: string, count: number = 10) => {
    const pool = ['🗿', '🐺', '🍷', '🔥', '⚡', '👑', '😎', '☕', '🐸'];
    const newItems: MemeParticle[] = [];
    const baseId = Date.now();

    for (let i = 0; i < count; i++) {
      newItems.push({
        id: baseId + i,
        emoji: customEmoji || pool[Math.floor(Math.random() * pool.length)],
        left: Math.floor(Math.random() * 90) + 5,
        size: Math.floor(Math.random() * 16) + 20,
        duration: 1.5 + Math.random() * 1,
      });
    }

    setParticles((prev) => [...prev, ...newItems]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id < baseId));
    }, 2500);
  };

  // Danger Button handler
  const handleDangerButton = () => {
    playMemeSound('alarm');
    const randomQuote = FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
    setDangerAlert(randomQuote);
    spawnParticles('💀', 12);

    setTimeout(() => {
      playMemeSound('badumtss');
    }, 400);

    setTimeout(() => {
      setDangerAlert(null);
    }, 4500);
  };

  // Konami Code detector (Keyboard)
  useEffect(() => {
    const sequence = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];
    let currentIndex = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === sequence[currentIndex].toLowerCase()) {
        currentIndex++;
        if (currentIndex === sequence.length) {
          currentIndex = 0;
          setKonamiUnlocked(true);
          playSecretUnlocked();
          spawnParticles('✨', 16);
        }
      } else {
        currentIndex = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Compute Rank based on clicks
  const getRank = (c: number) => {
    if (c >= 100) return { title: 'Dios Lobo de Baileys', emoji: '🐺👑', desc: 'Control total de la matriz de WhatsApp' };
    if (c >= 50) return { title: 'Admin Supremo Inmune', emoji: '🛡️🔥', desc: 'WhatsApp no se atreve a tocarte' };
    if (c >= 25) return { title: 'Hacker de Termux', emoji: '🐧⚡', desc: 'pkg update -y dominado al 100%' };
    if (c >= 10) return { title: 'Spammer de Stickers', emoji: '📱🗿', desc: 'Inundando los grupos con memes' };
    return { title: 'Novato Curioso', emoji: '👶🍷', desc: 'Haz clics para subir de rango' };
  };

  const rank = getRank(clickCount);

  return (
    <div className="relative space-y-8">
      {/* Falling particles overlay (strictly bounded and lightweight) */}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                top: '-40px',
                left: `${p.left}%`,
                fontSize: `${p.size}px`,
                animation: `float-particle ${p.duration}s linear forwards`,
              }}
            >
              {p.emoji}
            </div>
          ))}
          <style>{`
            @keyframes float-particle {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Header with Sound Toggle & Title */}
      <div className="bento-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              Zona de Memes, Sonidos &amp; Easter Eggs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Efectos de sonido interactivos sintetizados en tiempo real y secretos divertidos de Wolfric.
          </p>
        </div>

        <button
          onClick={handleToggleSound}
          className={`self-start sm:self-auto px-4 py-2.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
            audioOn
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
              : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
          }`}
          title={audioOn ? 'Silenciar sonidos' : 'Activar sonidos'}
        >
          {audioOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          <span>{audioOn ? 'Audio: ACTIVADO' : 'Audio: SILENCIADO'}</span>
        </button>
      </div>

      {/* Danger Banner if triggered */}
      {dangerAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-amber-950/90 border-2 border-rose-500 text-white shadow-2xl flex items-center gap-3.5 animate-bounce">
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold block">
              ADVERTENCIA DEL SISTEMA WOLFRIC
            </span>
            <p className="text-xs sm:text-sm font-semibold text-rose-100">{dangerAlert}</p>
          </div>
        </div>
      )}

      {/* GRID: SOUNDBOARD & MEME CLICKER (BENTO GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: SOUNDBOARD */}
        <div className="lg:col-span-2 bento-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Meme Soundboard Sintetizado
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">8 Efectos de audio en vivo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SOUNDS.map((snd) => {
              const isPlaying = activeSound === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => handleTriggerSound(snd.id)}
                  className={`p-3.5 rounded-2xl bg-gradient-to-b ${snd.color} border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between h-28 relative overflow-hidden group transform-gpu ${
                    isPlaying
                      ? 'scale-95 brightness-125 ring-2 ring-amber-400 shadow-lg'
                      : 'hover:scale-[1.03] hover:shadow-lg hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl transition-transform group-hover:scale-125">
                      {snd.emoji}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-white/90">
                      {snd.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold block text-white group-hover:text-amber-200">
                      {snd.label}
                    </span>
                    <span className="text-[9px] text-slate-300 line-clamp-1 opacity-80 mt-0.5">
                      {snd.description}
                    </span>
                  </div>

                  {/* Sound Wave Animation if active */}
                  {isPlaying && (
                    <div className="absolute bottom-1 right-2 flex items-end gap-0.5 h-3">
                      <span className="w-1 h-2 bg-amber-400 animate-pulse" />
                      <span className="w-1 h-3 bg-amber-400 animate-bounce" />
                      <span className="w-1 h-1.5 bg-amber-400 animate-pulse" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* DANGER BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleDangerButton}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 group"
            >
              <AlertTriangle className="w-4 h-4 text-white group-hover:animate-spin" />
              <span>⚠️ NO TOCAR ESTE BOTÓN (PELIGRO DE MEME)</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: MEME CLICKER & RANK */}
        <div className="bento-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                  Nivel de Fachero
                </h3>
              </div>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                {clickCount} clics
              </span>
            </div>

            {/* Current Rank Card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
              <span className="text-3xl block mb-1">{rank.emoji}</span>
              <h4 className="text-sm font-bold text-amber-300 font-display">{rank.title}</h4>
              <p className="text-[11px] text-slate-400">{rank.desc}</p>
            </div>

            {/* Tap Button */}
            <button
              onClick={handleMemeClick}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20 group hover:brightness-110"
            >
              <Flame className="w-4 h-4 text-slate-950 group-hover:scale-125 transition-transform" />
              <span>Subir Nivel de Fachero (+1 Clic)</span>
            </button>
          </div>

          {/* Quick Cheat / Easter Egg shortcut */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold text-slate-200">Truco Secreto (Konami):</span>
              <button
                onClick={() => {
                  setKonamiUnlocked(true);
                  playSecretUnlocked();
                  spawnParticles('✨', 16);
                }}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer font-bold"
              >
                Activar
              </button>
            </div>
            <div className="font-mono text-[10px] text-amber-300/90 bg-black/40 border border-white/[0.06] px-2.5 py-1.5 rounded-lg select-all">
              ↑ ↑ ↓ ↓ ← → ← → B A
            </div>
          </div>
        </div>
      </div>

      {/* SECRET KONAMI BANNER (IF UNLOCKED) */}
      {konamiUnlocked && (
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-950/80 via-black to-orange-950/80 border-2 border-amber-500/60 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <span className="text-4xl">🔥🐺</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-black uppercase tracking-wider">
                    SECRETO REVELADO
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">MODO DIABLO WOLFRIC</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1 font-display">
                  ¡Has desbloqueado el Modo Chad Legendario!
                </h3>
                <p className="text-xs text-slate-300">
                  Usa el comando especial <code className="text-amber-400 font-mono font-bold">.wolfric overdrive</code> en tu grupo de WhatsApp para invocar al lobo supremo.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText('.wolfric overdrive');
                setCopiedCheat(true);
                playKeyClick();
                setTimeout(() => setCopiedCheat(false), 2000);
              }}
              className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
            >
              {copiedCheat ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCheat ? '¡Copiado!' : 'Copiar Comando Oculto'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MEMES DE LA COMUNIDAD (BENTO CARDS) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <span>Humor Oficial &amp; Cultura de WhatsApp SubBots</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bento-card p-5 rounded-2xl hover:border-amber-400/40 transition-colors">
            <div className="text-2xl mb-2">⚡🏃💨</div>
            <h4 className="text-xs font-bold text-amber-200">Velocidad Relámpago</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              &quot;Cuando tu crush tarda 4 horas en responderte pero tu SubBot de Wolfric le responde con un sticker en 0.2 segundos.&quot;
            </p>
          </div>

          <div className="bento-card p-5 rounded-2xl hover:border-amber-400/40 transition-colors">
            <div className="text-2xl mb-2">🛡️🗿🍷</div>
            <h4 className="text-xs font-bold text-amber-200">El Escudo Antiban</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              &quot;WhatsApp intentando detectar si eres un bot, pero Wolfric tiene Baileys oficial multi-device y ni se entera.&quot;
            </p>
          </div>

          <div className="bento-card p-5 rounded-2xl hover:border-amber-400/40 transition-colors">
            <div className="text-2xl mb-2">👑🐧📱</div>
            <h4 className="text-xs font-bold text-amber-200">El Admin Silencioso</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              &quot;Alguien envía un enlace sospechoso al grupo a las 3 AM: el bot procede a eliminarlo antes de que despierte el admin.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

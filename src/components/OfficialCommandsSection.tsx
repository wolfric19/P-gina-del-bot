import React, { useState } from 'react';
import { Terminal, Copy, Check, Sparkles, Shield, Users, Image as ImageIcon, Flame } from 'lucide-react';
import { playKeyClick, playSharePop } from '../utils/audioFeedback.js';

interface BotCommand {
  cmd: string;
  desc: string;
  usage: string;
  category: 'basic' | 'group' | 'media' | 'security';
  badge?: string;
}

const COMMANDS: BotCommand[] = [
  // BÁSICOS
  {
    cmd: '.menu',
    desc: 'Despliega la lista interactiva completa de comandos del bot.',
    usage: '.menu',
    category: 'basic',
    badge: 'POPULAR',
  },
  {
    cmd: '.ping',
    desc: 'Mide la latencia de respuesta y velocidad del servidor Baileys.',
    usage: '.ping',
    category: 'basic',
    badge: '20ms',
  },
  {
    cmd: '.botinfo',
    desc: 'Muestra versión oficial, creadores (wolfric_19, The L, zerrDMC_) y tiempo activo.',
    usage: '.botinfo',
    category: 'basic',
  },
  {
    cmd: '.ayuda',
    desc: 'Guía de inicio rápido para nuevos usuarios del grupo.',
    usage: '.ayuda',
    category: 'basic',
  },

  // STICKERS Y MULTIMEDIA
  {
    cmd: '.s',
    desc: 'Convierte cualquier imagen o video corto en sticker de WhatsApp.',
    usage: 'Responde a una imagen con .s',
    category: 'media',
    badge: 'HOT',
  },
  {
    cmd: '.sticker',
    desc: 'Alias de .s con autor y nombre de pack personalizado.',
    usage: 'Responde a imagen con .sticker Wolfric',
    category: 'media',
  },
  {
    cmd: '.toimg',
    desc: 'Convierte un sticker de nuevo en fotografía descargable.',
    usage: 'Responde a sticker con .toimg',
    category: 'media',
  },
  {
    cmd: '.meme',
    desc: 'Genera un meme automático con el texto que especifiques.',
    usage: '.meme texto_arriba | texto_abajo',
    category: 'media',
  },

  // GRUPOS Y ADMINISTRACIÓN
  {
    cmd: '.tagall',
    desc: 'Menciona a todos los integrantes del grupo para avisos urgentes.',
    usage: '.tagall [mensaje opcional]',
    category: 'group',
    badge: 'ADMIN',
  },
  {
    cmd: '.kick',
    desc: 'Expulsa a un infractor del grupo (requiere admin en el bot).',
    usage: '.kick @usuario',
    category: 'group',
    badge: 'ADMIN',
  },
  {
    cmd: '.abrir',
    desc: 'Abre el grupo para que todos los participantes puedan escribir.',
    usage: '.abrir',
    category: 'group',
  },
  {
    cmd: '.cerrar',
    desc: 'Cierra el grupo para que solo administradores envíen mensajes.',
    usage: '.cerrar',
    category: 'group',
  },

  // SEGURIDAD Y ANTIBAN
  {
    cmd: '.antilink',
    desc: 'Elimina automáticamente cualquier enlace prohibido o de spam.',
    usage: '.antilink on / off',
    category: 'security',
    badge: 'ESCUDO',
  },
  {
    cmd: '.antispam',
    desc: 'Protege el chat contra floods masivos de mensajes y stickers.',
    usage: '.antispam on / off',
    category: 'security',
  },
  {
    cmd: '.bienvenida',
    desc: 'Saluda automáticamente a los nuevos miembros que ingresen.',
    usage: '.bienvenida on / off',
    category: 'security',
  },
  {
    cmd: '.wolfric overdrive',
    desc: 'Comando secreto de Easter Egg. Invoca el modo festivo.',
    usage: '.wolfric overdrive',
    category: 'security',
    badge: 'SECRETO',
  },
];

export function OfficialCommandsSection() {
  const [selectedCat, setSelectedCat] = useState<'all' | 'basic' | 'media' | 'group' | 'security'>('all');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (cmd: string) => {
    playKeyClick();
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    playSharePop(4);
    setTimeout(() => {
      setCopiedCmd(null);
    }, 1800);
  };

  const filteredCommands = COMMANDS.filter((item) => {
    const matchesCat = selectedCat === 'all' || item.category === selectedCat;
    const matchesSearch =
      item.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls Bento Card */}
      <div className="bento-card p-6 sm:p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Catálogo de Comandos Oficiales
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Comandos de producción listos para WhatsApp. Copia cualquier sintaxis con un solo clic.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar (.s, .menu, .tagall...)"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
            />
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 scrollbar-none">
          <button
            onClick={() => {
              playKeyClick();
              setSelectedCat('all');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCat === 'all'
                ? 'bg-white/[0.12] text-white border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Todos ({COMMANDS.length})
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setSelectedCat('basic');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCat === 'basic'
                ? 'bg-white/[0.12] text-white border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            ⚡ Básicos
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setSelectedCat('media');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCat === 'media'
                ? 'bg-white/[0.12] text-white border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            🎨 Stickers &amp; Multimedia
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setSelectedCat('group');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCat === 'group'
                ? 'bg-white/[0.12] text-white border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            👥 Grupos &amp; Moderación
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setSelectedCat('security');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCat === 'security'
                ? 'bg-white/[0.12] text-white border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            🛡️ Seguridad &amp; Anti-Ban
          </button>
        </div>
      </div>

      {/* Bento Grid of Commands */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommands.map((item) => {
          const isCopied = copiedCmd === item.cmd;
          return (
            <div
              key={item.cmd}
              className="bento-card p-5 rounded-2xl transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                      {item.cmd}
                    </span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(item.cmd)}
                    className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/[0.08] hover:border-cyan-400/40 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Copiar comando"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">{item.desc}</p>
              </div>

              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Sintaxis:</span>
                <span className="text-slate-200 truncate max-w-[190px]">{item.usage}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

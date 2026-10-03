import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Coins,
  Compass,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Crown,
  Medal,
} from 'lucide-react';
import { getPublicRankings } from '../api.js';

export function PublicRankingsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bounty' | 'coins' | 'prestige' | 'level'>('bounty');

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicRankings();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los rankings del bot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
    const interval = setInterval(loadRankings, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40';
    if (rank === 2) return 'bg-violet-400/20 text-violet-200 border-violet-400/50 shadow-sm';
    if (rank === 3) return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-sm';
    return 'bg-[#151030] text-slate-400 border-violet-900/40';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_#fbbf24]" />;
    if (rank === 2) return <Medal className="w-3.5 h-3.5 text-violet-300" />;
    if (rank === 3) return <Medal className="w-3.5 h-3.5 text-fuchsia-300" />;
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header with Privacy Guarantee */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e0b22]/90 border border-violet-900/40 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <Trophy className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-display">
                  Salón de la Fama & Clasificaciones
                </h1>
                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Wolfric Multi-Device RPG Core
                </span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Clasificaciones oficiales del RPG de Wolfric. Compite con otros aventureros, conquista duelos PvP y alcanza la gloria.
            </p>
          </div>

          <button
            onClick={loadRankings}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 border border-violet-400/40 transition-all self-start md:self-auto cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.35)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Privacy Notice Banner */}
        <div className="mt-5 pt-4 border-t border-violet-900/30 flex items-center gap-3 text-xs text-violet-200 font-medium bg-[#130e2c]/70 p-3.5 rounded-2xl border border-violet-500/30 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300">Privacidad Garantizada:</strong> Los rankings públicos muestran exclusivamente los nombres y seudónimos de juego. Los números de teléfono y LIDs están 100% protegidos.
          </span>
        </div>
      </div>

      {/* Quick KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0e0b22]/90 border border-violet-900/40 backdrop-blur-md">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Top Recompensa</span>
          <span className="text-xl font-black text-rose-400 font-mono">
            {data?.bountyTop?.[0] ? `$${data.bountyTop[0].bounty?.toLocaleString()}` : '$0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            👑 {data?.bountyTop?.[0]?.name || 'Vacante'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e0b22]/90 border border-violet-900/40 backdrop-blur-md">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Mayor Fortuna</span>
          <span className="text-xl font-black text-amber-300 font-mono">
            {data?.coinsTop?.[0] ? `$${data.coinsTop[0].coins?.toLocaleString()}` : '$0'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            🪙 {data?.coinsTop?.[0]?.name || 'Vacante'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e0b22]/90 border border-violet-900/40 backdrop-blur-md">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Líder Prestigio</span>
          <span className="text-xl font-black text-violet-300 font-mono">
            {data?.prestigeTop?.[0] ? `${data.prestigeTop[0].prestige?.toLocaleString()} pts` : '0 pts'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            🧭 {data?.prestigeTop?.[0]?.name || 'Vacante'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e0b22]/90 border border-violet-900/40 backdrop-blur-md">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Nivel Máximo</span>
          <span className="text-xl font-black text-amber-300 font-mono">
            {data?.levelTop?.[0] ? `Nv. ${data.levelTop[0].level}` : 'Nv. 1'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            ⚡ {data?.levelTop?.[0]?.name || 'Vacante'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0e0b22]/90 border border-violet-900/40 rounded-2xl overflow-x-auto shadow-inner">
        <button
          onClick={() => setActiveTab('bounty')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'bounty'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
              : 'text-slate-400 hover:text-white hover:bg-[#1a143b]'
          }`}
        >
          <Award className="w-4 h-4 text-rose-300" />
          <span>Top Bounty 💀</span>
        </button>

        <button
          onClick={() => setActiveTab('coins')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'coins'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-950/60'
              : 'text-slate-400 hover:text-white hover:bg-[#1a143b]'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-300" />
          <span>Top Monedas 🪙</span>
        </button>

        <button
          onClick={() => setActiveTab('prestige')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'prestige'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-950/60'
              : 'text-slate-400 hover:text-white hover:bg-[#1a143b]'
          }`}
        >
          <Compass className="w-4 h-4 text-violet-300" />
          <span>Top Prestigio 🧭</span>
        </button>

        <button
          onClick={() => setActiveTab('level')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'level'
              ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-pink-950/60'
              : 'text-slate-400 hover:text-white hover:bg-[#1a143b]'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-fuchsia-300" />
          <span>Top Nivel ⬆️</span>
        </button>
      </div>

      {/* Rankings Table */}
      <div className="bg-[#0e0b22]/90 border border-violet-900/40 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl">
        {loading && !data ? (
          <div className="p-14 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-sm font-medium">Cargando clasificaciones oficiales...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            <span>{error}</span>
          </div>
        ) : (
          <div className="divide-y divide-violet-900/30">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-4 bg-[#090717]/80 text-[11px] font-bold text-violet-300 uppercase tracking-wider border-b border-violet-900/30">
              <div className="col-span-2 sm:col-span-1 text-center">Puesto</div>
              <div className="col-span-6 sm:col-span-7">Aventurero</div>
              <div className="col-span-4 text-right">
                {activeTab === 'bounty' && 'Recompensa ($)'}
                {activeTab === 'coins' && 'Saldo ($)'}
                {activeTab === 'prestige' && 'Puntos de Prestigio'}
                {activeTab === 'level' && 'Nivel & Experiencia'}
              </div>
            </div>

            {/* Rows */}
            {activeTab === 'bounty' && (
              data?.bountyTop?.length ? (
                data.bountyTop.map((item: any) => (
                  <motion.div
                    key={item.rank}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                      item.rank === 1 ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#151032]/60'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1">
                      <span className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border ${getRankBadge(item.rank)}`}>
                        {getRankIcon(item.rank) || `#${item.rank}`}
                      </span>
                    </div>
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                      <div>
                        <span className="font-bold text-white text-sm block">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#181238] text-violet-300 border border-violet-800/40 font-mono">
                            Nv. {item.level}
                          </span>
                          {item.fruit && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/40 flex items-center gap-1 font-medium">
                              🍎 {item.fruit}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="font-mono font-black text-rose-400 text-base">
                        💀 ${item.bounty?.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-xs">Sin registros de Bounty todavía.</div>
              )
            )}

            {activeTab === 'coins' && (
              data?.coinsTop?.length ? (
                data.coinsTop.map((item: any) => (
                  <motion.div
                    key={item.rank}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                      item.rank === 1 ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#151032]/60'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1">
                      <span className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border ${getRankBadge(item.rank)}`}>
                        {getRankIcon(item.rank) || `#${item.rank}`}
                      </span>
                    </div>
                    <div className="col-span-6 sm:col-span-7">
                      <span className="font-bold text-white text-sm block">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-violet-400 font-mono">
                        Nivel {item.level}
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="font-mono font-black text-amber-300 text-base">
                        🪙 ${item.coins?.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-xs">Sin registros de monedas todavía.</div>
              )
            )}

            {activeTab === 'prestige' && (
              data?.prestigeTop?.length ? (
                data.prestigeTop.map((item: any) => (
                  <motion.div
                    key={item.rank}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                      item.rank === 1 ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#151032]/60'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1">
                      <span className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border ${getRankBadge(item.rank)}`}>
                        {getRankIcon(item.rank) || `#${item.rank}`}
                      </span>
                    </div>
                    <div className="col-span-6 sm:col-span-7">
                      <span className="font-bold text-white text-sm block">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-violet-300 font-medium">
                        Explorador de Frontera · Nv. {item.level}
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="font-mono font-black text-violet-300 text-base">
                        🧭 {item.prestige?.toLocaleString()} pts
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-xs">Sin exploradores en el registro todavía.</div>
              )
            )}

            {activeTab === 'level' && (
              data?.levelTop?.length ? (
                data.levelTop.map((item: any) => (
                  <motion.div
                    key={item.rank}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`grid grid-cols-12 px-6 py-4 items-center transition-colors ${
                      item.rank === 1 ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#151032]/60'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1">
                      <span className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center border ${getRankBadge(item.rank)}`}>
                        {getRankIcon(item.rank) || `#${item.rank}`}
                      </span>
                    </div>
                    <div className="col-span-6 sm:col-span-7">
                      <span className="font-bold text-white text-sm block">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono">
                        {item.exp?.toLocaleString()} EXP acumulada
                      </span>
                    </div>
                    <div className="col-span-4 text-right">
                      <span className="font-mono font-black text-amber-300 text-base">
                        ⚡ Nivel {item.level}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-xs">Sin registros de nivel todavía.</div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

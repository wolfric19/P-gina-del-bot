import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Coins,
  Gem,
  Apple,
  Package,
  Heart,
  Zap,
  Crown,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Sliders,
  Shield,
  Send,
  UserCheck,
} from 'lucide-react';
import { getOwnerRpgData, grantOwnerRpgAsset } from '../api.js';

interface RpgOverdriveSectionProps {
  ownerKey: string;
}

export function RpgOverdriveSection({ ownerKey }: RpgOverdriveSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<string>('');

  // Form states for granting
  const [grantType, setGrantType] = useState<'coins' | 'gems' | 'fruit' | 'item' | 'heal' | 'stats' | 'title'>('coins');
  const [coinAmount, setCoinAmount] = useState<number>(10000);
  const [coinAction, setCoinAction] = useState<'add' | 'set'>('add');
  const [gemAmount, setGemAmount] = useState<number>(100);
  const [gemAction, setGemAction] = useState<'add' | 'set'>('add');
  const [selectedFruit, setSelectedFruit] = useState<string>('Magma');
  const [fruitAwakened, setFruitAwakened] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string>('Kit de Primeros Auxilios');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [statStr, setStatStr] = useState<number>(20);
  const [statDef, setStatDef] = useState<number>(20);
  const [statAgi, setStatAgi] = useState<number>(20);
  const [statInt, setStatInt] = useState<number>(20);
  const [statMaxHp, setStatMaxHp] = useState<number>(150);
  const [titleInput, setTitleInput] = useState<string>('Leyenda Viviente');

  const [executing, setExecuting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOwnerRpgData(ownerKey);
      setData(res);
      if (res.players?.length && !selectedPlayerKey) {
        setSelectedPlayerKey(res.players[0].rawKey);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del RPG');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerKey) loadData();
  }, [ownerKey]);

  const selectedPlayer = data?.players?.find((p: any) => p.rawKey === selectedPlayerKey) || null;

  const handleGrant = async () => {
    if (!selectedPlayerKey) {
      setActionFeedback({ type: 'error', message: 'Por favor selecciona un jugador objetivo.' });
      return;
    }

    setExecuting(true);
    setActionFeedback(null);
    try {
      const payload: any = {
        targetKey: selectedPlayerKey,
        type: grantType,
      };

      if (grantType === 'coins') {
        payload.amount = coinAmount;
        payload.action = coinAction;
      } else if (grantType === 'gems') {
        payload.amount = gemAmount;
        payload.action = gemAction;
      } else if (grantType === 'fruit') {
        const fruitObj = data?.catalog?.fruits?.find((f: any) => f.nombre === selectedFruit);
        payload.fruitName = selectedFruit;
        payload.fruitCategory = fruitObj?.categoria || 'rara';
        payload.awakened = fruitAwakened;
      } else if (grantType === 'item') {
        payload.itemName = selectedItem;
        payload.itemQuantity = itemQuantity;
      } else if (grantType === 'stats') {
        payload.stats = { str: statStr, def: statDef, agi: statAgi, int: statInt, maxHp: statMaxHp };
      } else if (grantType === 'title') {
        payload.titleName = titleInput;
      } else if (grantType === 'heal') {
        // heal requires no extra payload
      }

      const res = await grantOwnerRpgAsset(ownerKey, payload);
      setActionFeedback({ type: 'success', message: res.message || 'Recurso otorgado con éxito.' });
      await loadData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Error al ejecutar Overdrive' });
    } finally {
      setExecuting(false);
    }
  };

  const filteredPlayers = (data?.players || []).filter((p: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.displayName.toLowerCase().includes(q) || p.maskedId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight font-display">
              Gestión RPG &amp; Overdrive Web
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
              Web Direct
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Asigna monedas, gemas, Frutas del Diablo (con despertar), objetos y atributos a cualquier jugador del bot directamente desde la interfaz web, sin necesidad de comandos en el chat.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold flex items-center gap-2 border border-white/[0.1] transition-colors cursor-pointer self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {actionFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 border shadow-md ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </motion.div>
      )}

      {loading && !data ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3 bento-card rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
          <span className="text-sm font-mono">Cargando base de datos de aventureros...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm bento-card">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Player Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bento-card p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  Seleccionar Jugador ({data?.players?.length || 0})
                </span>
                <span className="text-[10px] font-mono text-slate-400">ID Oculto</span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por seudónimo o ID..."
                  className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 font-mono transition-all"
                />
              </div>

              {/* Player list */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredPlayers.length ? (
                  filteredPlayers.map((p: any) => {
                    const isSelected = p.rawKey === selectedPlayerKey;
                    return (
                      <button
                        key={p.rawKey}
                        onClick={() => {
                          setSelectedPlayerKey(p.rawKey);
                          setActionFeedback(null);
                        }}
                        className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/70 border-purple-400/60 shadow-sm'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-bold text-slate-100 block truncate">
                            {p.displayName}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span className="font-mono text-amber-400 font-bold">${p.coins.toLocaleString()}</span>
                            <span>•</span>
                            <span className="font-mono text-cyan-400">{p.gems}💎</span>
                            <span>•</span>
                            <span>Nv.{p.level}</span>
                          </div>
                        </div>

                        {p.fruit && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 shrink-0">
                            🍎 {p.fruit}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No se encontraron jugadores que coincidan con la búsqueda.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Player Profile Card */}
            {selectedPlayer && (
              <div className="bento-card p-5 rounded-3xl border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                  <div>
                    <span className="text-xs font-bold text-purple-300 block">
                      Perfil Seleccionado
                    </span>
                    <span className="text-sm font-black text-white font-display">
                      {selectedPlayer.displayName}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                    {selectedPlayer.maskedId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">Monedas</span>
                    <span className="font-mono font-bold text-amber-300 tabular-nums">${selectedPlayer.coins?.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">Gemas</span>
                    <span className="font-mono font-bold text-cyan-300 tabular-nums">{selectedPlayer.gems?.toLocaleString()} 💎</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">Salud &amp; Energía</span>
                    <span className="font-mono font-bold text-rose-400 tabular-nums">
                      ❤️ {selectedPlayer.hp}/{selectedPlayer.maxHp} · ⚡ {selectedPlayer.energy}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">Fruta del Diablo</span>
                    <span className="font-mono font-bold text-rose-300 truncate block">
                      {selectedPlayer.fruit ? `🍎 ${selectedPlayer.fruit} ${selectedPlayer.fruitAwakened ? '✨' : ''}` : 'Ninguna'}
                    </span>
                  </div>
                </div>

                {selectedPlayer.inventory?.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      Inventario ({selectedPlayer.inventory.length} objetos):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {selectedPlayer.inventory.map((item: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                          🎒 {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Overdrive Action Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2 font-display">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Consola de Inyección de Recursos
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedPlayer ? `Destino: ${selectedPlayer.displayName}` : 'Ningún usuario seleccionado'}
                </span>
              </div>

              {/* Resource Type Selector */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setGrantType('coins')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'coins'
                      ? 'bg-amber-600/30 border-amber-500/60 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Monedas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrantType('gems')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'gems'
                      ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Gem className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gemas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrantType('fruit')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'fruit'
                      ? 'bg-rose-600/30 border-rose-500/60 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5 text-rose-400" />
                  <span>Fruta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrantType('item')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'item'
                      ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Objetos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrantType('heal')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'heal'
                      ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Curar 100%</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrantType('stats')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'stats'
                      ? 'bg-purple-600/30 border-purple-500/60 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Stats</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrantType('title')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                    grantType === 'title'
                      ? 'bg-amber-600/30 border-amber-500/60 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Título</span>
                </button>
              </div>

              {/* Dynamic controls according to selected resource type */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
                {grantType === 'coins' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Cantidad de Monedas</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCoinAction('add')}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition-all ${
                            coinAction === 'add'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-white/[0.04] text-slate-400 hover:text-white'
                          }`}
                        >
                          Sumar (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoinAction('set')}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition-all ${
                            coinAction === 'set'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-white/[0.04] text-slate-400 hover:text-white'
                          }`}
                        >
                          Fijar Valor (=)
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={coinAmount}
                      onChange={(e) => setCoinAmount(Number(e.target.value))}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[5000, 20000, 50000, 200000, 1000000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCoinAmount(val)}
                          className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 cursor-pointer border border-white/[0.08] transition-colors"
                        >
                          +${val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {grantType === 'gems' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Cantidad de Gemas 💎</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGemAction('add')}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition-all ${
                            gemAction === 'add'
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-white/[0.04] text-slate-400 hover:text-white'
                          }`}
                        >
                          Sumar (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setGemAction('set')}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer transition-all ${
                            gemAction === 'set'
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'bg-white/[0.04] text-slate-400 hover:text-white'
                          }`}
                        >
                          Fijar Valor (=)
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={gemAmount}
                      onChange={(e) => setGemAmount(Number(e.target.value))}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[50, 200, 500, 2000, 10000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setGemAmount(val)}
                          className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 cursor-pointer border border-white/[0.08] transition-colors"
                        >
                          +{val} 💎
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {grantType === 'fruit' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Seleccionar Fruta del Diablo 🍎
                      </label>
                      <select
                        value={selectedFruit}
                        onChange={(e) => setSelectedFruit(e.target.value)}
                        className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-400 cursor-pointer"
                      >
                        {data?.catalog?.fruits?.map((f: any) => (
                          <option key={f.nombre} value={f.nombre} className="bg-[#090c14]">
                            {f.nombre} ({f.categoria.toUpperCase()}) — {f.desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          Despertar de Fruta (Awakening)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Desbloquea la Habilidad Definitiva (Ultimate) sin costo de fragmentos.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={fruitAwakened}
                        onChange={(e) => setFruitAwakened(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {grantType === 'item' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Seleccionar Objeto Consumible 🎒
                      </label>
                      <select
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                      >
                        {data?.catalog?.items?.map((item: any) => (
                          <option key={item.nombre} value={item.nombre} className="bg-[#090c14]">
                            {item.nombre} — {item.desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">
                        Cantidad a otorgar (1-50)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Number(e.target.value))}
                        className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}

                {grantType === 'heal' && (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                    <span className="font-bold block text-emerald-200">
                      Restauración Total de Combate:
                    </span>
                    <p className="leading-relaxed">
                      Al ejecutar esta acción, la salud del jugador volverá inmediatamente al 100% de su capacidad máxima (Max HP), la energía se restaurará a 100⚡, y se limpiarán venenos, quemaduras y efectos negativos.
                    </p>
                  </div>
                )}

                {grantType === 'stats' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      Ajustar Atributos de Combate
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Max HP (Vida)</label>
                        <input
                          type="number"
                          value={statMaxHp}
                          onChange={(e) => setStatMaxHp(Number(e.target.value))}
                          className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg p-2 font-mono text-white focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">STR (Fuerza)</label>
                        <input
                          type="number"
                          value={statStr}
                          onChange={(e) => setStatStr(Number(e.target.value))}
                          className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg p-2 font-mono text-white focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">DEF (Defensa)</label>
                        <input
                          type="number"
                          value={statDef}
                          onChange={(e) => setStatDef(Number(e.target.value))}
                          className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg p-2 font-mono text-white focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">AGI (Agilidad)</label>
                        <input
                          type="number"
                          value={statAgi}
                          onChange={(e) => setStatAgi(Number(e.target.value))}
                          className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg p-2 font-mono text-white focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">INT (Inteligencia)</label>
                        <input
                          type="number"
                          value={statInt}
                          onChange={(e) => setStatInt(Number(e.target.value))}
                          className="w-full bg-[#090c14] border border-white/[0.1] rounded-lg p-2 font-mono text-white focus:border-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {grantType === 'title' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 block">
                      Nombre del Título Honorífico 👑
                    </label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="Ej: Conquistador del Cosmos, El Inmortal..."
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['Leyenda Viviente', 'Soberano de la Red', 'Cazador Divino', 'Señor del Coliseo'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTitleInput(t)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-white/[0.08] cursor-pointer transition-colors"
                        >
                          👑 {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleGrant}
                disabled={executing || !selectedPlayerKey}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:brightness-110 active:scale-95 transition-all"
              >
                {executing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Send className="w-4 h-4 text-slate-950" />
                )}
                <span>
                  {executing
                    ? 'Inyectando recursos en la base de datos...'
                    : `Inyectar ${grantType.toUpperCase()} a ${selectedPlayer?.displayName || 'Usuario'}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Scroll,
  Plus,
  Trash2,
  Power,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Coins,
  Gem,
  Award,
  Apple,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  getOwnerCustomMissions,
  saveOwnerCustomMission,
  deleteOwnerCustomMission,
  toggleOwnerCustomMission,
  getOwnerRpgData,
} from '../api.js';

interface MissionsManagerSectionProps {
  ownerKey: string;
}

export function MissionsManagerSection({ ownerKey }: MissionsManagerSectionProps) {
  const [missions, setMissions] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New mission form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [campo, setCampo] = useState('wins');
  const [meta, setMeta] = useState<number>(5);
  const [rewCoins, setRewCoins] = useState<number>(3000);
  const [rewGems, setRewGems] = useState<number>(50);
  const [rewExp, setRewExp] = useState<number>(200);
  const [rewBounty, setRewBounty] = useState<number>(10000);
  const [rewFruta, setRewFruta] = useState<string>('');
  const [rewItem, setRewItem] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, rpgRes] = await Promise.all([
        getOwnerCustomMissions(ownerKey),
        getOwnerRpgData(ownerKey),
      ]);
      setMissions(mRes.missions || []);
      setCatalog(rpgRes.catalog || null);
    } catch (err: any) {
      setError(err.message || 'Error cargando misiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerKey) loadData();
  }, [ownerKey]);

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !desc.trim()) {
      setFeedback({ type: 'error', message: 'Nombre y descripción son requeridos.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        nombre,
        desc,
        campo,
        meta,
        recompensa: {
          coins: Number(rewCoins) || 0,
          gems: Number(rewGems) || 0,
          exp: Number(rewExp) || 0,
          bounty: Number(rewBounty) || 0,
          fruta: rewFruta ? rewFruta.trim() : undefined,
          item: rewItem ? rewItem.trim() : undefined,
        },
        activa: true,
      };

      await saveOwnerCustomMission(ownerKey, payload);
      setFeedback({ type: 'success', message: `¡Misión "${nombre}" creada y sincronizada con el bot!` });
      setShowCreateModal(false);
      // Reset form
      setNombre('');
      setDesc('');
      setMeta(5);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al guardar la misión.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleOwnerCustomMission(ownerKey, id);
      setMissions((prev) => prev.map((m) => (m.id === id ? res.mission : m)));
      setFeedback({ type: 'success', message: res.message });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al alternar misión.' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteOwnerCustomMission(ownerKey, id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
      setFeedback({ type: 'success', message: `Misión "${name}" eliminada correctamente.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error al eliminar misión.' });
    }
  };

  const fieldOptions = catalog?.missionFields || [
    { id: 'wins', label: 'Duelos PvP ganados (.pvp)', icono: '⚔️' },
    { id: 'monstruosCazados', label: 'Monstruos cazados (.cazar)', icono: '🐲' },
    { id: 'ruletaJugada', label: 'Tiradas en ruleta (.ruleta)', icono: '🎰' },
    { id: 'bossKills', label: 'Jefes mundiales derrotados (.boss)', icono: '👑' },
    { id: 'pescaExitosas', label: 'Capturas de pesca (.pescar)', icono: '🎣' },
    { id: 'dungeonCleared', label: 'Mazmorras superadas (.dungeon)', icono: '🏰' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Scroll className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight font-display">
              Creador de Misiones del Bot (Admin)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
              WhatsApp Synced
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Crea y administra misiones oficiales que los jugadores ven en el bot con el comando <code className="font-mono text-amber-300">.misiones</code>. Cuando un jugador completa los objetivos en el chat, recibe automáticamente las recompensas configuradas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold flex items-center gap-2 border border-white/[0.1] transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 font-bold" />
            <span>Nueva Misión</span>
          </button>
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 border shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Missions Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3 bento-card rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-sm font-mono">Cargando misiones configuradas...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm bento-card">
          {error}
        </div>
      ) : missions.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bento-card rounded-3xl space-y-3">
          <Scroll className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-200">No hay misiones creadas aún.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Crea la primera misión personalizada para que los jugadores en WhatsApp tengan nuevos retos con recompensas exclusivas.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold cursor-pointer hover:brightness-110 transition-all shadow-md"
          >
            Crear Primera Misión
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missions.map((mission) => {
            const fieldInfo = fieldOptions.find((f: any) => f.id === mission.campo);
            return (
              <div
                key={mission.id}
                className={`p-5 rounded-2xl bento-card flex flex-col justify-between transition-all ${
                  mission.activa
                    ? 'hover:border-amber-400/40'
                    : 'opacity-60'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08] flex items-center gap-1">
                      {fieldInfo?.icono || '🎯'} {mission.campo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        mission.activa
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                      }`}
                    >
                      {mission.activa ? 'Activa en Bot' : 'Pausada'}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-tight mb-1">
                      {mission.nombre}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {mission.desc}
                    </p>
                  </div>

                  {/* Target Goal */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Meta requerida:</span>
                    <span className="font-black text-amber-300">
                      {mission.meta} {mission.campo === 'wins' ? 'Victorias' : 'Veces'}
                    </span>
                  </div>

                  {/* Rewards */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recompensas:
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {mission.recompensa?.coins > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/30 font-mono font-bold">
                          🪙 ${mission.recompensa.coins.toLocaleString()}
                        </span>
                      )}
                      {mission.recompensa?.gems > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                          💎 {mission.recompensa.gems}
                        </span>
                      )}
                      {mission.recompensa?.exp > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                          ⚡ {mission.recompensa.exp} EXP
                        </span>
                      )}
                      {mission.recompensa?.fruta && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/30 font-mono font-bold">
                          🍎 {mission.recompensa.fruta}
                        </span>
                      )}
                      {mission.recompensa?.item && (
                        <span className="px-2 py-0.5 rounded-lg bg-teal-950/60 text-teal-300 border border-teal-500/30 font-mono font-bold">
                          🎒 {mission.recompensa.item}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggle(mission.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      mission.activa
                        ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
                        : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{mission.activa ? 'Pausar' : 'Activar'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(mission.id, mission.nombre)}
                    className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Eliminar misión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Create Mission */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bento-card rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Scroll className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-white text-base font-display">
                  Crear Nueva Misión para el Bot
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Nombre de la Misión *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Conquistador del Coliseo"
                  className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Descripción para los Jugadores *
                </label>
                <textarea
                  required
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ej: Gana 5 duelos contra otros jugadores en WhatsApp para recibir recompensas épicas."
                  className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 transition-all leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Acción / Objetivo a Registrar *
                  </label>
                  <select
                    value={campo}
                    onChange={(e) => setCampo(e.target.value)}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {fieldOptions.map((f: any) => (
                      <option key={f.id} value={f.id} className="bg-[#090c14]">
                        {f.icono} {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Cantidad Meta *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={meta}
                    onChange={(e) => setMeta(Number(e.target.value))}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Reward Fields */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                <span className="text-xs font-bold text-amber-300 block">
                  Recompensas Otorgadas al Completar:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Monedas ($)</label>
                    <input
                      type="number"
                      value={rewCoins}
                      onChange={(e) => setRewCoins(Number(e.target.value))}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl p-2 font-mono text-white text-xs focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Gemas 💎</label>
                    <input
                      type="number"
                      value={rewGems}
                      onChange={(e) => setRewGems(Number(e.target.value))}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl p-2 font-mono text-white text-xs focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">EXP ⚡</label>
                    <input
                      type="number"
                      value={rewExp}
                      onChange={(e) => setRewExp(Number(e.target.value))}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl p-2 font-mono text-white text-xs focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Bounty ($)</label>
                    <input
                      type="number"
                      value={rewBounty}
                      onChange={(e) => setRewBounty(Number(e.target.value))}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl p-2 font-mono text-white text-xs focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Fruta del Diablo (Opcional)</label>
                    <select
                      value={rewFruta}
                      onChange={(e) => setRewFruta(e.target.value)}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl p-2 text-xs text-white cursor-pointer"
                    >
                      <option value="" className="bg-[#090c14]">-- Ninguna --</option>
                      {catalog?.fruits?.map((f: any) => (
                        <option key={f.nombre} value={f.nombre} className="bg-[#090c14]">
                          🍎 {f.nombre} ({f.categoria})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Objeto Consumible (Opcional)</label>
                    <select
                      value={rewItem}
                      onChange={(e) => setRewItem(e.target.value)}
                      className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl p-2 text-xs text-white cursor-pointer"
                    >
                      <option value="" className="bg-[#090c14]">-- Ninguno --</option>
                      {catalog?.items?.map((item: any) => (
                        <option key={item.nombre} value={item.nombre} className="bg-[#090c14]">
                          🎒 {item.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  )}
                  <span>{saving ? 'Guardando...' : 'Publicar Misión en Bot'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

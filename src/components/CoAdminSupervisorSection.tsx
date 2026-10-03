import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Power,
  RotateCcw,
  Search,
  Filter,
  Activity,
  Layers,
  FileCheck,
  Database,
  Code2,
  Wand2,
  Trash2,
  UserX,
  UserCheck,
  Radio,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Copy,
  Check,
  Upload,
  ArrowRight,
  Clock,
  Zap,
  Cpu,
} from 'lucide-react';
import {
  getCoAdminStatus,
  executeCoAdminAction,
  getSecurityStatus,
  improveFileWithAi,
  applyAiToDatabase,
} from '../api.js';
import type {
  SentinelAdminStatus,
  RecentJoinEntry,
  SecurityStatusReport,
  SubBotInstance,
} from '../types.js';
import { playKeyClick, playAccessGranted, playAccessDenied } from '../utils/audioFeedback.js';

interface CoAdminSupervisorSectionProps {
  ownerKey: string;
  instances: SubBotInstance[];
  cloudUsersCount: number;
  onRefreshData?: () => void;
  onShowNotice: (notice: { type: 'success' | 'error'; text: string }) => void;
}

export function CoAdminSupervisorSection({
  ownerKey,
  instances,
  cloudUsersCount,
  onRefreshData,
  onShowNotice,
}: CoAdminSupervisorSectionProps) {
  const [status, setStatus] = useState<SentinelAdminStatus | null>(null);
  const [securityReport, setSecurityReport] = useState<SecurityStatusReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'joins' | 'sessions' | 'security' | 'db_maintenance'>('joins');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter for joins
  const [joinFilter, setJoinFilter] = useState<'all' | 'safe' | 'observation' | 'quarantined'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // DB Maintenance tool state
  const [dbContent, setDbContent] = useState('');
  const [dbFilename, setDbFilename] = useState('wolfric-database.json');
  const [dbTaskType, setDbTaskType] = useState<'clean_duplicates' | 'balance_economy' | 'fix_syntax' | 'rpg_upgrade' | 'custom'>('clean_duplicates');
  const [dbCustomPrompt, setDbCustomPrompt] = useState('');
  const [dbProcessing, setDbProcessing] = useState(false);
  const [dbApplying, setDbApplying] = useState(false);
  const [dbResult, setDbResult] = useState<any>(null);
  const [dbCopied, setDbCopied] = useState(false);

  // Load telemetry
  const loadStatus = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [coAdminRes, secRes] = await Promise.all([
        getCoAdminStatus(ownerKey),
        getSecurityStatus(ownerKey).catch(() => null),
      ]);
      setStatus(coAdminRes.data);
      if (secRes?.security) {
        setSecurityReport(secRes.security);
      }
    } catch (err: any) {
      if (!silent) {
        onShowNotice({
          type: 'error',
          text: err.message || 'Error cargando estado del Supervisor Co-Admin.',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => loadStatus(true), 12000);
    return () => clearInterval(interval);
  }, [ownerKey]);

  // Execute Co-Admin Action
  const handleAction = async (action: string, payload?: any) => {
    playKeyClick();
    setActionLoading(action);
    try {
      const res = await executeCoAdminAction(ownerKey, action, payload);
      onShowNotice({
        type: 'success',
        text: res.message || 'Acción de supervisión ejecutada correctamente.',
      });
      await loadStatus(true);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error al ejecutar acción del Co-Admin.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Run full audit
  const handleRunAudit = async () => {
    playKeyClick();
    setActionLoading('run_full_audit');
    try {
      const res = await executeCoAdminAction(ownerKey, 'run_full_audit');
      onShowNotice({
        type: 'success',
        text: 'Auditoría integral completada. Reporte del Supervisor actualizado.',
      });
      await loadStatus(true);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error al realizar la auditoría integral.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // DB Tool: Load current DB
  const handleLoadCurrentDatabase = async () => {
    try {
      setDbProcessing(true);
      const res = await fetch('/api/owner/lids/export', {
        headers: { 'x-owner-key': ownerKey },
      });
      if (!res.ok) throw new Error('No se pudo exportar la base de datos');
      const text = await res.text();
      setDbContent(text);
      setDbFilename(`wolfric-db-actual-${new Date().toISOString().split('T')[0]}.json`);
      setDbResult(null);
      onShowNotice({
        type: 'success',
        text: `Base de datos cargada (${cloudUsersCount} usuarios listos para mantenimiento).`,
      });
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error al cargar la base de datos.',
      });
    } finally {
      setDbProcessing(false);
    }
  };

  // DB Tool: Process with Supervisor Engine
  const handleProcessDb = async () => {
    if (!dbContent.trim()) {
      onShowNotice({
        type: 'error',
        text: 'Carga o pega primero la base de datos o archivo JSON a optimizar.',
      });
      return;
    }

    setDbProcessing(true);
    try {
      const res = await improveFileWithAi(ownerKey, {
        filename: dbFilename,
        content: dbContent,
        taskType: dbTaskType,
        customPrompt: dbTaskType === 'custom' ? dbCustomPrompt : undefined,
      });

      setDbResult(res.result);
      onShowNotice({
        type: 'success',
        text: 'Optimización y saneamiento de base de datos completada por el Supervisor.',
      });
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error en el proceso de mantenimiento.',
      });
    } finally {
      setDbProcessing(false);
    }
  };

  // DB Tool: Apply to cloud
  const handleApplyDbToCloud = async () => {
    if (!dbResult?.improvedContent) return;
    setDbApplying(true);
    try {
      const res = await applyAiToDatabase(ownerKey, dbResult.improvedContent);
      onShowNotice({
        type: 'success',
        text: res.message || 'Base de datos en la nube actualizada correctamente.',
      });
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error al aplicar cambios a la nube.',
      });
    } finally {
      setDbApplying(false);
    }
  };

  // Filtered joins
  const filteredJoins = (status?.recentJoins || []).filter((j) => {
    if (joinFilter !== 'all' && j.riskScore !== joinFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        j.phone.toLowerCase().includes(q) ||
        j.country.toLowerCase().includes(q) ||
        (j.notes && j.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Co-Admin Identity Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#090d16] to-[#06080d] border border-emerald-500/25 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0c121e]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                  Co-Admin de Guardia · Activo
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {status?.supervisorProfile?.version || 'Sentinel v4.2'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight font-display flex items-center gap-2">
                <span>{status?.supervisorProfile?.name || 'Supervisor de Seguridad & Sesiones'}</span>
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Co-Administrador del sistema. Supervisa en tiempo real quién se une, gestiona la salud de los sockets en RAM, previene ataques de fuerza bruta y mantiene las sesiones blindadas sin interrupciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            <button
              onClick={() => handleAction('purge_zombies')}
              disabled={Boolean(actionLoading)}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Limpia códigos expirados y sockets inactivos sin desconectar a nadie"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${actionLoading === 'purge_zombies' ? 'animate-spin' : ''}`} />
              <span>Limpiar Sesiones Inactivas</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={Boolean(actionLoading)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 text-slate-950 ${actionLoading === 'run_full_audit' ? 'animate-spin' : ''}`} />
              <span>Auditar Sistema</span>
            </button>
          </div>
        </div>

        {/* Co-Admin Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.08]">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Ingresos Hoy</span>
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {status?.inspectedToday || status?.recentJoins?.length || 0}
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-0.5">Supervisados &amp; Validados</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Sesiones WhatsApp</span>
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">
              {instances.length}
            </div>
            <div className="text-[10px] text-cyan-400/90 mt-0.5">
              {instances.filter((i) => i.status === 'online').length} en línea · RAM Volátil
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Puntuación Blindaje</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-300 mt-1 font-mono">
              {status?.securityScore || 99}/100
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Defensa Perimetral Activa</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Última Inspección</span>
              <Clock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xs font-bold text-white mt-2 font-mono truncate">
              {status?.lastAudit ? new Date(status.lastAudit).toLocaleTimeString() : 'En curso'}
            </div>
            <div className="text-[10px] text-purple-400/90 mt-0.5">Modo Autónomo 24/7</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('joins');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'joins'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quién Se Une ({status?.recentJoins?.length || 0})</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('sessions');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Gestión de Sesiones &amp; Sockets</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('security');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Decisiones &amp; Auditoría del Supervisor</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveTab('db_maintenance');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'db_maintenance'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Mantenimiento de Base de Datos</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: QUIÉN SE UNE (Vea quién se une)                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'joins' && (
        <div className="space-y-4">
          {/* Controls & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por número o país..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'safe', 'observation', 'quarantined'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => {
                    playKeyClick();
                    setJoinFilter(filterKey);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    joinFilter === filterKey
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.05]'
                  }`}
                >
                  {filterKey === 'all' && 'Todos'}
                  {filterKey === 'safe' && '🟢 Verificados'}
                  {filterKey === 'observation' && '🟡 En Observación'}
                  {filterKey === 'quarantined' && '🔴 Cuarentena'}
                </button>
              ))}
            </div>
          </div>

          {/* Joins Table */}
          <div className="bento-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Ingresos y Nuevas Conexiones Monitoreadas</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  El Supervisor audita cada intento de unión y asigna un diagnóstico de riesgo sin desconectar usuarios válidos.
                </p>
              </div>
              <button
                onClick={() => loadStatus(false)}
                disabled={refreshing}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
                title="Actualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {filteredJoins.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-semibold">No se encontraron registros de ingreso con los filtros aplicados.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cuando nuevos usuarios o SubBots intenten conectarse, aparecerán aquí con su diagnóstico en tiempo real.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-400 font-mono text-[11px]">
                      <th className="py-3 px-4">Usuario / Teléfono</th>
                      <th className="py-3 px-4">País &amp; Origen</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Diagnóstico Co-Admin</th>
                      <th className="py-3 px-4">Hora de Ingreso</th>
                      <th className="py-3 px-4 text-right">Acción de Guardia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredJoins.map((join) => (
                      <tr key={join.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>{join.phone}</span>
                          </div>
                          {join.notes && (
                            <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-xs mt-0.5">
                              {join.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-200 font-medium text-[11px]">
                            {join.country}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-mono text-cyan-300 uppercase">
                            {join.method === 'code' ? 'Código 8 Dígitos' : join.method === 'qr' ? 'Escaneo QR' : 'Credencial'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            {join.riskScore === 'safe' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Verificado Seguro
                              </span>
                            )}
                            {join.riskScore === 'observation' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                En Observación
                              </span>
                            )}
                            {join.riskScore === 'quarantined' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                Cuarentena Preventiva
                              </span>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-tight">
                              {join.riskReason}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(join.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <div className="text-[9px] text-slate-500">
                            {new Date(join.joinedAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {join.riskScore === 'quarantined' || join.riskScore === 'observation' ? (
                              <button
                                onClick={() => handleAction('release_phone', { phone: join.phone })}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Liberar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction('quarantine_phone', { phone: join.phone, reason: 'Puesto en observación por el Propietario.' })}
                                className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-amber-500/15 text-slate-400 hover:text-amber-300 border border-white/[0.08] hover:border-amber-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Observar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: GESTIÓN DE SESIONES (Administre la sesión)              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Sesiones Zombi / Expiradas</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Códigos en espera mayores a 20 min</p>
              </div>
              <button
                onClick={() => handleAction('purge_zombies')}
                disabled={Boolean(actionLoading)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Purgar Seguro
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Buffers de Memoria RAM</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Optimizar logs de sockets activos</p>
              </div>
              <button
                onClick={() => handleAction('optimize_sessions')}
                disabled={Boolean(actionLoading)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Optimizar RAM
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Renovación de Tu Sesión</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Extender validez del token admin</p>
              </div>
              <button
                onClick={() => handleAction('refresh_session')}
                disabled={Boolean(actionLoading)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Renovar Token
              </button>
            </div>
          </div>

          {/* Active Admin Sessions Panel */}
          <div className="bento-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>Sesiones del Panel de Administración (Tokens Activos)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  El Co-Admin supervisa las IPs y sesiones conectadas para prevenir secuestro de tokens.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                {securityReport?.activeSessionsCount || 1} Sesión(es)
              </span>
            </div>

            <div className="space-y-2.5">
              {(securityReport?.activeSessions || []).map((sess, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    sess.isCurrent
                      ? 'bg-emerald-500/[0.05] border-emerald-500/30'
                      : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/[0.04] text-slate-300">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{sess.tokenPrefix}</span>
                        {sess.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            TU SESIÓN ACTUAL
                          </span>
                        )}
                        {sess.pinVerified && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            2FA ELEVADO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>IP: {sess.ip}</span>
                        <span>•</span>
                        <span>Iniciada: {new Date(sess.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => handleAction('terminate_session', { tokenPrefix: sess.tokenPrefix })}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold self-end sm:self-auto cursor-pointer"
                    >
                      Cerrar Sesión Remota
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SubBot WhatsApp Sockets Health */}
          <div className="bento-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Salud de Sockets WhatsApp Baileys ({instances.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aislamiento independiente por instancia para máxima velocidad de respuesta sin caída compartida.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{inst.ownerPhone}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inst.status === 'online'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : inst.status === 'pairing'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {inst.status === 'online' ? '● En Línea' : inst.status === 'pairing' ? '◌ Vinculando' : '○ Desconectado'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    {inst.customAlias || 'SubBot Wolfric'}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono pt-2 border-t border-white/[0.04]">
                    <span>Ping: {inst.stats?.pingMs || 35}ms</span>
                    <span>Mensajes: {inst.stats?.messagesProcessed || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: BLINDAJE & DECISIONES (Ponga seguridad y más)          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Latest Co-Admin Audit Report */}
          <div className="bento-card p-6 rounded-2xl border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Informe Ejecutivo del Supervisor de Seguridad
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Evaluación continua de seguridad perimetral y estabilidad operativa.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRunAudit}
                disabled={Boolean(actionLoading)}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'run_full_audit' ? 'animate-spin' : ''}`} />
                <span>Re-auditar Ahora</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed font-sans">
              <p className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dictamen del Supervisor:</span>
              </p>
              {status?.latestAuditSummary ||
                'Plataforma operando en condiciones óptimas. Todos los sockets Baileys se encuentran aislados en memoria RAM y los intentos de conexión cumplen las políticas de seguridad vigentes.'}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Recomendaciones Operativas del Supervisor:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(status?.recommendations || []).map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Event Stream */}
          <div className="bento-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Registro de Acciones y Decisiones de Seguridad</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Historial de auditoría firmado por el Co-Admin de guardia.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {(status?.recentEvents || []).map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        evt.level === 'threat'
                          ? 'bg-rose-400'
                          : evt.level === 'warn'
                          ? 'bg-amber-400'
                          : evt.level === 'success'
                          ? 'bg-emerald-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <div>
                      <p className="text-slate-200 leading-snug">{evt.message}</p>
                      {evt.actionTaken && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.05] text-slate-400 border border-white/[0.05]">
                          {evt.actionTaken}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: MANTENIMIENTO DE BASE DE DATOS (Co-Admin Utility)       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'db_maintenance' && (
        <div className="space-y-6">
          <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-6 border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                    <span>Herramienta de Mantenimiento &amp; Optimización de Base de Datos</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Operada por el Supervisor de Seguridad. Limpia duplicados de LIDs, balancea la economía RPG, repara sintaxis JSON dañada y enriquece los rangos Wolfric de forma segura.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleLoadCurrentDatabase}
                  disabled={dbProcessing}
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cargar DB Actual ({cloudUsersCount} usuarios)</span>
                </button>

                <label className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20">
                  <Upload className="w-3.5 h-3.5 text-slate-950" />
                  <span>Subir Archivo JSON</span>
                  <input
                    type="file"
                    accept=".json,.js,.ts,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setDbFilename(file.name);
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setDbContent(event.target?.result as string);
                        setDbResult(null);
                        onShowNotice({
                          type: 'success',
                          text: `Archivo "${file.name}" cargado en el editor.`,
                        });
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Task selector */}
            <div className="pt-4 border-t border-white/[0.08]">
              <label className="block text-xs font-semibold text-slate-300 mb-2.5">
                Selecciona la tarea de mantenimiento a ejecutar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'clean_duplicates',
                    title: 'Limpiar LIDs Duplicados',
                    desc: 'Consolida registros repetidos y normaliza identificadores.',
                    icon: FileCheck,
                  },
                  {
                    id: 'balance_economy',
                    title: 'Balancear Economía',
                    desc: 'Topes de monedas y banco, corrección de números corruptos.',
                    icon: Database,
                  },
                  {
                    id: 'fix_syntax',
                    title: 'Reparar Sintaxis JSON',
                    desc: 'Corrige comas, llaves rotas y formato ilegible.',
                    icon: Code2,
                  },
                  {
                    id: 'rpg_upgrade',
                    title: 'Mejorar Roles & Niveles',
                    desc: 'Asigna rangos Wolfric (Novato, Élite, Leyenda) por nivel.',
                    icon: Wand2,
                  },
                ].map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = dbTaskType === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        playKeyClick();
                        setDbTaskType(preset.id as any);
                      }}
                      className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <h4 className="text-xs font-bold text-white">{preset.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor Textarea */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Entrada: {dbFilename}</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {(new Blob([dbContent]).size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <textarea
                  value={dbContent}
                  onChange={(e) => setDbContent(e.target.value)}
                  placeholder="Pega aquí el contenido JSON de la base de datos o sube un archivo..."
                  className="w-full h-80 p-3.5 rounded-2xl bg-[#080b11] border border-white/[0.1] text-emerald-300 font-mono text-xs resize-none focus:outline-none focus:border-emerald-500/50 scrollbar-thin"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Resultado Optimizado</span>
                  {dbResult && (
                    <span className="font-mono text-[10px] text-emerald-400">
                      {dbResult.isValidJson ? 'JSON Válido ✅' : 'Texto'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    value={dbResult?.improvedContent || ''}
                    placeholder="El contenido procesado aparecerá aquí..."
                    className="w-full h-80 p-3.5 rounded-2xl bg-[#080b11] border border-white/[0.1] text-emerald-200 font-mono text-xs resize-none focus:outline-none scrollbar-thin"
                  />
                  {dbResult && (
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(dbResult.improvedContent);
                          setDbCopied(true);
                          setTimeout(() => setDbCopied(false), 2000);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {dbCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{dbCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
              <div className="text-xs text-slate-400">
                {dbResult?.summary && (
                  <span className="text-emerald-400 font-medium">
                    ✓ {dbResult.summary}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleProcessDb}
                  disabled={dbProcessing || !dbContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
                >
                  <Activity className={`w-3.5 h-3.5 ${dbProcessing ? 'animate-spin' : ''}`} />
                  <span>{dbProcessing ? 'Procesando Mantenimiento...' : 'Ejecutar Mantenimiento'}</span>
                </button>

                {dbResult?.improvedContent && (
                  <button
                    onClick={handleApplyDbToCloud}
                    disabled={dbApplying}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-900/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{dbApplying ? 'Aplicando a la Nube...' : 'Aplicar a Base de Datos en Nube'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle RPG / Battle Pass preparation status footer */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Módulo RPG Wolfric: Modo Overdrive y Misiones activas.</span>
        </div>
        <div className="text-slate-400">
          🎮 Próximamente: Pase de Batalla Wolfric (Preparado para la siguiente fase)
        </div>
      </div>
    </div>
  );
}

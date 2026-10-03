import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  RotateCcw,
  Sliders,
  BarChart3,
  HardDrive,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  Download,
  Upload,
  AlertCircle,
  Save,
  MessageSquare,
  Users,
  Copy,
  Check,
  LogOut,
  QrCode,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import {
  getMySubBot,
  triggerSubBotAction,
  updateSubBotConfig,
  createUserBackup,
  restoreUserBackup,
  uploadSubbotBackupFile,
} from '../api.js';
import type { SubBotInstance, BotConfig } from '../types.js';

import { useTranslation } from '../i18n/LanguageContext.js';
import { BackupUploaderModal } from './BackupUploaderModal.js';

interface UserSubBotPanelProps {
  token: string;
  initialInstance: SubBotInstance;
  onLogout: () => void;
  onOpenRePairModal: () => void;
}

export function UserSubBotPanel({
  token,
  initialInstance,
  onLogout,
  onOpenRePairModal,
}: UserSubBotPanelProps) {
  const { t } = useTranslation();
  const [instance, setInstance] = useState<SubBotInstance>(initialInstance);
  const [activeTab, setActiveTab] = useState<'stats' | 'config' | 'backups' | 'logs'>('stats');

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable config state
  const [config, setConfig] = useState<BotConfig>(initialInstance.config);
  const [customAlias, setCustomAlias] = useState(initialInstance.customAlias);
  const [savingConfig, setSavingConfig] = useState(false);

  // Backup creation state
  const [backupName, setBackupName] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedPairingCode, setCopiedPairingCode] = useState(false);

  // Polling to keep instance fresh (fast polling during pairing)
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await getMySubBot(token);
        setInstance(res.instance);
      } catch {
        // silent polling catch
      }
    };

    const intervalMs = instance.status === 'pairing' ? 2500 : 6000;
    const timer = setInterval(fetchLatest, intervalMs);
    return () => clearInterval(timer);
  }, [token, instance.status]);

  const handleAction = async (action: 'restart' | 'disconnect' | 'reconnect' | 'repair') => {
    setLoadingAction(action);
    setFeedbackMsg(null);
    try {
      const res = await triggerSubBotAction(token, action);
      setInstance(res.instance);
      setFeedbackMsg({
        type: 'success',
        text:
          action === 'restart'
            ? 'SubBot reiniciado correctamente.'
            : action === 'disconnect'
            ? 'SubBot desconectado. Sesión segura guardada.'
            : action === 'reconnect'
            ? 'Reconectando con la sesión guardada...'
            : 'Instancia lista para re-vincular.',
      });
      if (action === 'repair') {
        onOpenRePairModal();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al ejecutar acción' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setFeedbackMsg(null);
    try {
      const res = await updateSubBotConfig(token, { config, customAlias });
      setInstance(res.instance);
      setFeedbackMsg({ type: 'success', text: 'Configuraciones guardadas y aplicadas a tu SubBot.' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al guardar configuración' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setFeedbackMsg(null);
    try {
      const res = await createUserBackup(token, backupName || undefined);
      setInstance(res.instance);
      setBackupName('');
      setFeedbackMsg({ type: 'success', text: `Copia de seguridad "${res.backup.name}" creada con éxito.` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al crear backup' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string, name: string) => {
    setFeedbackMsg(null);
    try {
      const res = await restoreUserBackup(token, backupId);
      setInstance(res.instance);
      setConfig(res.instance.config);
      setFeedbackMsg({ type: 'success', text: `Copia de seguridad restaurada correctamente.` });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error al restaurar backup' });
    }
  };

  const handleCopySessionHash = () => {
    navigator.clipboard.writeText(instance.sessionHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const statusConfig = {
    online: {
      label: 'Online',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
      icon: Wifi,
    },
    offline: {
      label: 'Offline (Desconectado)',
      color: 'bg-slate-800 text-slate-400 border-slate-700',
      dot: 'bg-slate-500',
      icon: WifiOff,
    },
    reconnecting: {
      label: 'Reconectando...',
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 animate-ping',
      icon: RefreshCw,
    },
    pairing: {
      label: 'Esperando Vinculación',
      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-400 animate-pulse',
      icon: QrCode,
    },
  }[instance.status];

  // WhatsApp 8-slot code split
  const rawCode = (instance.pairingCode || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const slotPart1 = (rawCode.slice(0, 4) || '----').padEnd(4, '-').split('');
  const slotPart2 = (rawCode.slice(4, 8) || '----').padEnd(4, '-').split('');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Bot Overview Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Smartphone className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{instance.customAlias || instance.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                  <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {instance.version}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                <span>
                  WhatsApp: <strong className="text-slate-200 font-mono">{instance.ownerPhone}</strong>
                </span>
                <span>•</span>
                <span>
                  ID Instancia: <strong className="text-slate-200 font-mono">{instance.id}</strong>
                </span>
                <span>•</span>
                <span>
                  Uptime: <strong className="text-cyan-400 font-mono">{formatUptime(instance.uptimeSeconds)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:self-end lg:self-center">
            {instance.status === 'online' ? (
              <>
                <button
                  onClick={() => handleAction('restart')}
                  disabled={loadingAction !== null}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Reinicia el proceso del bot en la nube sin perder la sesión"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'restart' ? 'animate-spin' : ''}`} />
                  <span>Reiniciar</span>
                </button>

                <button
                  onClick={() => handleAction('disconnect')}
                  disabled={loadingAction !== null}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction('reconnect')}
                disabled={loadingAction !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'reconnect' ? 'animate-spin' : ''}`} />
                <span>Reconectar</span>
              </button>
            )}

            <button
              onClick={() => handleAction('repair')}
              disabled={loadingAction !== null}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-1.5"
              title="Vuelve a generar el código o QR si cambiaste de WhatsApp"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Volver a Vincular</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Cerrar sesión de este panel en este navegador"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security & Credentials Isolation Card */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Hash de Sesión Cifrada</span>
              <span className="font-mono text-cyan-300 font-semibold text-[11px] truncate block max-w-[200px]">
                {instance.sessionHash}
              </span>
            </div>
            <button
              onClick={handleCopySessionHash}
              className="p-1.5 text-slate-400 hover:text-cyan-300 rounded transition-colors"
              title="Copiar hash de sesión"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">PIN de Acceso a tu Instancia</span>
            <span className="font-mono text-emerald-400 font-bold text-sm tracking-wider">
              {instance.userPin}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Aislamiento de Servidor</span>
              <span className="text-slate-200 font-medium text-[11px] flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Contenedor Independiente
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">100% Baileys</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert banner */}
      {feedbackMsg && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-200 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Pending WhatsApp Pairing Banner / Display */}
      {instance.status === 'pairing' && (
        <div className="mt-6 p-6 rounded-2xl bg-slate-900/90 border-2 border-cyan-500/50 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Vinculación Oficial de WhatsApp Multi-Device</span>
              </h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono">
              Esperando confirmación de WhatsApp
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left side: Code or QR */}
            <div className="text-center">
              {instance.pairingMethod === 'qr' ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white text-slate-950 w-56 h-56 mx-auto flex flex-col items-center justify-center shadow-xl border-4 border-cyan-500/30">
                    {instance.qrData ? (
                      <img src={instance.qrData} alt="WhatsApp QR Code" className="w-48 h-48 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
                        <span className="text-xs text-slate-700 font-semibold">Generando QR oficial...</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAction('repair')}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'repair' ? 'animate-spin' : ''}`} />
                    <span>Actualizar código QR</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 max-w-sm mx-auto shadow-xl">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest block mb-2">
                      Código de 8 dígitos para WhatsApp
                    </span>

                    {instance.pairingCode ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <div className="flex gap-1.5">
                          {slotPart1.map((ch, idx) => (
                            <div
                              key={`p1-${idx}`}
                              className="w-9 h-12 rounded-xl bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-xl font-black font-mono text-cyan-200 shadow-md shadow-cyan-500/20"
                            >
                              {ch}
                            </div>
                          ))}
                        </div>
                        <span className="text-xl font-bold text-slate-500 select-none">—</span>
                        <div className="flex gap-1.5">
                          {slotPart2.map((ch, idx) => (
                            <div
                              key={`p2-${idx}`}
                              className="w-9 h-12 rounded-xl bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-xl font-black font-mono text-cyan-200 shadow-md shadow-cyan-500/20"
                            >
                              {ch}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                        <span className="text-xs text-slate-300">Obteniendo código con WhatsApp...</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (instance.pairingCode) {
                            const clean = instance.pairingCode.replace(/[^A-Za-z0-9]/g, '');
                            navigator.clipboard.writeText(clean);
                            setCopiedPairingCode(true);
                            setTimeout(() => setCopiedPairingCode(false), 2000);
                          }
                        }}
                        disabled={!instance.pairingCode}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors disabled:opacity-50"
                      >
                        {copiedPairingCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPairingCode ? '¡Copiado!' : 'Copiar Código'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('repair')}
                        disabled={loadingAction !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'repair' ? 'animate-spin' : ''}`} />
                        <span>Obtener nuevo código</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Clear instructions */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5 text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span>Instrucciones en tu WhatsApp:</span>
              </h3>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Abre la app de WhatsApp en tu teléfono.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Ve a <strong>Ajustes</strong> (o ⋮ arriba a la derecha) &gt; <strong>Dispositivos vinculados</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Toca el botón verde <strong>Vincular un dispositivo</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <span>{instance.pairingMethod === 'qr' ? 'Apunta la cámara al código QR de la izquierda.' : 'En la parte inferior de tu pantalla, presiona "Vincular con el número de teléfono" e introduce los 8 caracteres.'}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-cyan-400/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>En cuanto lo ingreses, la plataforma cambiará automáticamente a En Línea.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="mt-8 flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'stats'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Estado & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'config'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuración del Bot</span>
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'backups'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Mis Backups ({instance.backups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Terminal en Vivo ({instance.logs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="mt-6">
        {/* 1. STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Mensajes</span>
                <span className="text-2xl font-black text-white">{instance.stats.messagesProcessed}</span>
                <span className="text-[10px] text-cyan-400 block mt-1">Procesados hoy</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Comandos</span>
                <span className="text-2xl font-black text-white">{instance.stats.commandsExecuted}</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Ejecutados</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Grupos Activos</span>
                <span className="text-2xl font-black text-white">{instance.stats.activeGroups}</span>
                <span className="text-[10px] text-indigo-400 block mt-1">Chats grupales</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Contactos</span>
                <span className="text-2xl font-black text-white">{instance.stats.contactsSeen}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Interacciones</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Latencia Socket</span>
                <span className="text-2xl font-black text-white">{instance.stats.pingMs}ms</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Ping excelente</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Memoria RAM</span>
                <span className="text-2xl font-black text-white">{instance.stats.memoryMb} MB</span>
                <span className="text-[10px] text-slate-400 block mt-1">Consumo nodo</span>
              </div>
            </div>

            {/* Quick Command Cheat-sheet for Wolfric */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Comandos principales configurados en tu Wolfric SubBot</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Puedes enviar cualquiera de estos comandos desde cualquier chat o grupo donde esté tu número vinculado con
                el prefijo <strong className="text-cyan-300 font-mono">{instance.config.prefix}</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}menu</span>
                  <p className="text-[11px] text-slate-400 mt-1">Muestra la lista de herramientas completas de Wolfric.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}s / {instance.config.prefix}sticker</span>
                  <p className="text-[11px] text-slate-400 mt-1">Convierte imágenes, vídeos o gifs en stickers al instante.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}ping</span>
                  <p className="text-[11px] text-slate-400 mt-1">Comprueba la velocidad de respuesta del servidor del SubBot.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}antilink</span>
                  <p className="text-[11px] text-slate-400 mt-1">Expulsa y elimina enlaces sospechosos en grupos automáticamente.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}infobot</span>
                  <p className="text-[11px] text-slate-400 mt-1">Muestra la versión de Wolfric ({instance.version}) y estadísticas de actividad.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}tagall / {instance.config.prefix}todos</span>
                  <p className="text-[11px] text-slate-400 mt-1">Menciona a los miembros del grupo para avisos urgentes.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <span className="font-mono text-cyan-300 font-bold">{instance.config.prefix}creadores / {instance.config.prefix}creador</span>
                  <p className="text-[11px] text-slate-300 mt-1">Créditos de los creadores oficiales: wolfric_19, The L y zerrDMC_.</p>
                </div>
              </div>

              {/* Creator Attribution Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-indigo-950/40 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Wolfric SubBot desarrollado con orgullo por <strong className="text-white">wolfric_19</strong>, <strong className="text-white">The L</strong> y <strong className="text-white">zerrDMC_</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 shrink-0">
                  Equipo Oficial
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONFIGURATION TAB */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white">Configuración Permitida de tu Instancia</h2>
              <p className="text-xs text-slate-400 mt-1">
                Personaliza cómo responderá tu SubBot. Los cambios se sincronizan en caliente sin desconectar tu WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alias */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Personalizado del SubBot
                </label>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Prefix */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Prefijo de Comandos (ej. . o ! o #)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={config.prefix}
                  onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Operating Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Modo de Operación
                </label>
                <select
                  value={config.mode}
                  onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="public">Público (Responde en chats privados y grupos)</option>
                  <option value="groups_only">Solo Grupos (Ignora comandos en chats privados)</option>
                  <option value="private">Privado (Solo responde al dueño del número)</option>
                </select>
              </div>

              {/* Max Groups */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Límite de Grupos Permitidos
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={config.maxGroups}
                  onChange={(e) => setConfig({ ...config, maxGroups: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Welcome message text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mensaje de Bienvenida para nuevos miembros en grupos
              </label>
              <textarea
                rows={2}
                value={config.welcomeText}
                onChange={(e) => setConfig({ ...config, welcomeText: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Toggle options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Antilink Automático</span>
                  <span className="text-[10px] text-slate-400">Elimina mensajes con links de spam</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.antiLink}
                  onChange={(e) => setConfig({ ...config, antiLink: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Auto-Read (Leído automático)</span>
                  <span className="text-[10px] text-slate-400">Marca los mensajes como vistos</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoRead}
                  onChange={(e) => setConfig({ ...config, autoRead: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Creador de Stickers</span>
                  <span className="text-[10px] text-slate-400">Permite crear stickers en tiempo real</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.stickerMaker}
                  onChange={(e) => setConfig({ ...config, stickerMaker: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Protección Anti-Spam</span>
                  <span className="text-[10px] text-slate-400">Límite de comandos por segundo</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.antiSpam}
                  onChange={(e) => setConfig({ ...config, antiSpam: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Bienvenida en Grupos</span>
                  <span className="text-[10px] text-slate-400">Saluda a quienes entran a tus grupos</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Reacciones con Emojis</span>
                  <span className="text-[10px] text-slate-400">Reacciona a comandos exitosos</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.reactions}
                  onChange={(e) => setConfig({ ...config, reactions: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingConfig ? 'Guardando...' : 'Guardar y Aplicar Cambios'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. BACKUPS TAB (Isolated per user) */}
        {activeTab === 'backups' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h2 className="text-base font-bold text-white mb-1">Copias de Seguridad de tu SubBot</h2>
              <p className="text-xs text-slate-400 mb-4">
                Tus backups se guardan de forma aislada en la nube. Solo tú puedes verlos y restaurarlos.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nombre del backup (ej. Mi Config Favorita)"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{creatingBackup ? 'Creando...' : 'Crear Copia'}</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Archivo (.zip / .json)</span>
                </button>
              </div>
            </div>

            {/* List of Backups */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3">Historial de Copias Guardadas</h3>
              {instance.backups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Aún no has creado copias de seguridad de tu SubBot. ¡Crea una arriba para resguardar tu configuración!
                </div>
              ) : (
                <div className="space-y-3">
                  {instance.backups.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-white font-semibold">{bk.name}</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                            {bk.version}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Fecha: {new Date(bk.date).toLocaleString('es-ES')} • Tamaño: {bk.sizeKb} KB
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestoreBackup(bk.id, bk.name)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>

                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(bk, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `wolfric-backup-${bk.name.replace(/\s+/g, '-')}.json`;
                            a.click();
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Descargar copia en archivo JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Terminal de Eventos en Vivo</h3>
              </div>
              <span className="text-[11px] text-slate-400">Actualización en tiempo real</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2">
              {instance.logs.length === 0 ? (
                <div className="text-slate-600">No hay registros aún...</div>
              ) : (
                instance.logs.map((log, idx) => {
                  const levelColors = {
                    info: 'text-cyan-400',
                    warn: 'text-amber-400',
                    error: 'text-rose-400',
                    success: 'text-emerald-400',
                  }[log.level] || 'text-slate-400';

                  return (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 shrink-0 text-[11px]">
                        [{new Date(log.timestamp).toLocaleTimeString('es-ES')}]
                      </span>
                      <span className={`uppercase font-bold text-[10px] shrink-0 ${levelColors}`}>
                        [{log.level}]
                      </span>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Backup Modal for SubBot Owner */}
      <BackupUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(res) => {
          setFeedbackMsg({
            type: 'success',
            text: `¡Copia sincronizada! Se han registrado ${res.usersImportedCount} usuarios y LIDs en tu SubBot.`,
          });
        }}
        onUpload={(payload) => uploadSubbotBackupFile(token, payload)}
        title="Subir Archivo de Backup de Usuarios (.zip / .json)"
      />
    </div>
  );
}

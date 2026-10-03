import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Server,
  Users,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Power,
  Ban,
  Trash2,
  Upload,
  HardDrive,
  Cpu,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Settings,
  History,
  FileText,
  Play,
  RotateCcw,
  Check,
  X,
  Plus,
  Radio,
  FileCode,
  Database,
  Scroll,
  Zap,
} from 'lucide-react';
import {
  ownerLogin,
  getOwnerInstances,
  ownerInstanceAction,
  assignInstanceVersion,
  getOwnerVersions,
  uploadWolfricVersion,
  deployGlobalUpdate,
  getOwnerBackups,
  createSystemSnapshot,
  restoreSystemBackup,
  getOwnerLogsAndMetrics,
  getOwnerSettings,
  updateOwnerSettings,
  getOwnerLids,
  uploadOwnerBackupFile,
} from '../api.js';
import type {
  SubBotInstance,
  WolfricVersion,
  SystemBackup,
  SystemAuditLog,
  PlatformSettings,
  LidUserProfile,
} from '../types.js';

import { useTranslation } from '../i18n/LanguageContext.js';
import { LidsManagerSection } from './LidsManagerSection.js';
import { BackupUploaderModal } from './BackupUploaderModal.js';
import { CoAdminSupervisorSection } from './CoAdminSupervisorSection.js';
import { SecurityShieldSection } from './SecurityShieldSection.js';
import { RpgOverdriveSection } from './RpgOverdriveSection.js';
import { MissionsManagerSection } from './MissionsManagerSection.js';
import { VaultLockMeter } from './VaultLockMeter.js';
import { SendFlightButton } from './SendFlightButton.js';
import { useNotifications } from './NotificationSystem.js';
import { playKeyClick, playAccessGranted, playAccessDenied } from '../utils/audioFeedback.js';

interface OwnerDashboardProps {
  onBack?: () => void;
}

export function OwnerDashboard({ onBack }: OwnerDashboardProps = {}) {
  const { t } = useTranslation();
  const { notify } = useNotifications();
  const [ownerKey, setOwnerKey] = useState<string>(() => {
    const saved = localStorage.getItem('wolfric_owner_token');
    // Clear legacy demo keys
    if (saved === 'wolfric-owner-2025') {
      localStorage.removeItem('wolfric_owner_token');
      return '';
    }
    return saved || '';
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isEmergencyLockdownActive, setIsEmergencyLockdownActive] = useState(false);

  // Active section tab
  const [activeSection, setActiveSection] = useState<'instances' | 'lids' | 'rpg_overdrive' | 'missions' | 'co_admin' | 'security' | 'versions' | 'backups' | 'logs' | 'settings'>('instances');

  // Data states
  const [instances, setInstances] = useState<SubBotInstance[]>([]);
  const [versions, setVersions] = useState<WolfricVersion[]>([]);
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [lidsUsers, setLidsUsers] = useState<LidUserProfile[]>([]);
  const [lidsStats, setLidsStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  // UI state filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'banned' | 'suspended'>('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Version Assignment Modal State
  const [versionModalTarget, setVersionModalTarget] = useState<SubBotInstance | null>(null);
  const [selectedVersionForInst, setSelectedVersionForInst] = useState('');
  const [autoBackupBeforeAssign, setAutoBackupBeforeAssign] = useState(true);

  // Ban Modal State
  const [banModalTarget, setBanModalTarget] = useState<SubBotInstance | null>(null);
  const [banReason, setBanReason] = useState('Infracción de términos y condiciones de Wolfric');

  // Real File Upload Modal State (.zip / .json / .tar.gz)
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [uploadFileModalIsVersion, setUploadFileModalIsVersion] = useState(false);

  // New Version Upload State
  const [showUploadVersionModal, setShowUploadVersionModal] = useState(false);
  const [newVerNumber, setNewVerNumber] = useState('');
  const [newVerChangelog, setNewVerChangelog] = useState('');
  const [newVerIsLatest, setNewVerIsLatest] = useState(false);
  const [newVerIsBackup, setNewVerIsBackup] = useState(false);
  const [newVerNotes, setNewVerNotes] = useState('');
  const [newVerFilename, setNewVerFilename] = useState('');

  // Global update modal
  const [showGlobalUpdateModal, setShowGlobalUpdateModal] = useState(false);
  const [globalTargetVersion, setGlobalTargetVersion] = useState('');
  const [globalAutoBackup, setGlobalAutoBackup] = useState(true);

  // Snapshot modal
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState('');

  // Confirmation modal dialog (replaces window.confirm to prevent iframe freezes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    action: () => Promise<void> | void;
  } | null>(null);

  // Maintenance & Settings form state
  const [settingsMaintMode, setSettingsMaintMode] = useState(false);
  const [settingsAntibanShield, setSettingsAntibanShield] = useState(true);
  const [settingsMaintMsg, setSettingsMaintMsg] = useState('');
  const [settingsMaxTotal, setSettingsMaxTotal] = useState(50);
  const [settingsMaxPerNum, setSettingsMaxPerNum] = useState(2);
  const [settingsAllowReg, setSettingsAllowReg] = useState(true);
  const [settingsDefaultVer, setSettingsDefaultVer] = useState('Wolfric 3.2.1');
  const [newPasscode, setNewPasscode] = useState('');

  // Check auth on mount
  useEffect(() => {
    if (ownerKey) {
      loadAllData(ownerKey);
    }
  }, [ownerKey]);

  const loadAllData = async (key: string) => {
    try {
      const [instRes, versRes, bksRes, logsRes, lidsRes, settingsRes] = await Promise.all([
        getOwnerInstances(key),
        getOwnerVersions(key),
        getOwnerBackups(key),
        getOwnerLogsAndMetrics(key),
        getOwnerLids(key).catch(() => ({ users: [], stats: undefined })),
        getOwnerSettings(key).catch(() => ({ settings: undefined })),
      ]);

      setInstances(instRes.instances);
      setVersions(versRes.versions);
      setBackups(bksRes.backups);
      setAuditLogs(logsRes.auditLogs);
      setMetrics(logsRes.metrics);
      if (lidsRes && (lidsRes as any).users) {
        setLidsUsers((lidsRes as any).users);
        setLidsStats((lidsRes as any).stats);
      }
      if (settingsRes && settingsRes.settings) {
        const s = settingsRes.settings;
        if (typeof s.maintenanceMode === 'boolean') setSettingsMaintMode(s.maintenanceMode);
        if (typeof s.antibanShield === 'boolean') setSettingsAntibanShield(s.antibanShield);
        if (s.maintenanceMessage) setSettingsMaintMsg(s.maintenanceMessage);
        if (s.maxInstancesTotal) setSettingsMaxTotal(s.maxInstancesTotal);
        if (s.maxInstancesPerNumber) setSettingsMaxPerNum(s.maxInstancesPerNumber);
        if (typeof s.allowNewRegistrations === 'boolean') setSettingsAllowReg(s.allowNewRegistrations);
        if (s.defaultVersion) setSettingsDefaultVer(s.defaultVersion);
      }
      setIsAuthenticated(true);
    } catch (err: any) {
      setIsAuthenticated(false);
      localStorage.removeItem('wolfric_owner_token');
    }
  };

  // Inactivity auto-lock: logs out after 15 minutes of user idle for maximum physical security
  useEffect(() => {
    if (!isAuthenticated) return;
    let idleTimer: any;
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleLogout();
        setLoginError('Sesión bloqueada automáticamente por inactividad de seguridad (15 min). Introduce la clave para continuar.');
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    playKeyClick();
    try {
      const res = await ownerLogin(passcodeInput);
      playAccessGranted();
      setOwnerKey(res.token);
      localStorage.setItem('wolfric_owner_token', res.token);
      if (res.emergencyLockdown) {
        setIsEmergencyLockdownActive(true);
      }
      setAttemptsRemaining(null);
      await loadAllData(res.token);
    } catch (err: any) {
      playAccessDenied();
      setLoginError(err.message || 'Clave de propietario inválida');
      if (err.message && err.message.includes('intento(s) restante(s)')) {
        const match = err.message.match(/(\d+)\s+intento/);
        if (match) setAttemptsRemaining(parseInt(match[1], 10));
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    playKeyClick();
    localStorage.removeItem('wolfric_owner_token');
    setOwnerKey('');
    setIsAuthenticated(false);
  };

  // Instance administrative action
  const handleInstanceAction = async (
    instId: string,
    action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'restart' | 'disconnect' | 'delete',
    reason?: string
  ) => {
    setLoadingAction(`${action}-${instId}`);
    try {
      await ownerInstanceAction(ownerKey, instId, action, reason);
      setNotice({ type: 'success', text: `Acción "${action}" ejecutada correctamente.` });
      notify({
        title: 'Acción Ejecutada',
        message: `Instancia modificada: "${action}" aplicada con éxito.`,
        type: action === 'ban' || action === 'delete' ? 'warning' : 'success',
      });
      await loadAllData(ownerKey);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error al ejecutar acción' });
      notify({
        title: 'Error en Operación',
        message: err.message || 'Error al ejecutar la acción de administración.',
        type: 'error',
      });
    } finally {
      setLoadingAction(null);
      setBanModalTarget(null);
    }
  };

  // Assign version
  const handleAssignVersion = async () => {
    if (!versionModalTarget || !selectedVersionForInst) return;
    setLoadingAction('assign-version');
    try {
      await assignInstanceVersion(ownerKey, versionModalTarget.id, selectedVersionForInst, autoBackupBeforeAssign);
      setNotice({
        type: 'success',
        text: `Versión ${selectedVersionForInst} asignada a ${versionModalTarget.name}. ${
          autoBackupBeforeAssign ? '(Backup preventivo creado)' : ''
        }`,
      });
      setVersionModalTarget(null);
      await loadAllData(ownerKey);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error al asignar versión' });
    } finally {
      setLoadingAction(null);
    }
  };

  // Upload new version or backup
  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVerNumber) return;
    setLoadingAction('upload-ver');
    try {
      await uploadWolfricVersion(ownerKey, {
        version: newVerNumber,
        changelog: newVerChangelog.split('\n').filter((l) => l.trim().length > 0),
        isLatest: newVerIsLatest,
        isBackup: newVerIsBackup,
        notes: newVerNotes,
        filename: newVerFilename || undefined,
        fileSize: newVerIsBackup ? '12.4 MB' : '5.2 MB',
      });
      setNotice({
        type: 'success',
        text: `Versión / Archivo "${newVerNumber}" guardado y organizado con éxito en la nube de Wolfric.`,
      });
      setShowUploadVersionModal(false);
      setNewVerNumber('');
      setNewVerChangelog('');
      setNewVerNotes('');
      setNewVerFilename('');
      await loadAllData(ownerKey);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error al subir versión' });
    } finally {
      setLoadingAction(null);
    }
  };

  // Deploy global update
  const handleDeployGlobalUpdate = async () => {
    if (!globalTargetVersion) return;
    setLoadingAction('global-update');
    try {
      const res = await deployGlobalUpdate(ownerKey, globalTargetVersion, globalAutoBackup);
      setNotice({
        type: 'success',
        text: `¡Actualización global completada! ${res.updatedCount} SubBots ahora ejecutan ${globalTargetVersion}.`,
      });
      setShowGlobalUpdateModal(false);
      await loadAllData(ownerKey);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error en actualización global' });
    } finally {
      setLoadingAction(null);
    }
  };

  // Create Snapshot
  const handleCreateSnapshot = async () => {
    setLoadingAction('create-snapshot');
    try {
      await createSystemSnapshot(ownerKey, { notes: snapshotNotes });
      setNotice({ type: 'success', text: 'Snapshot completo de la plataforma creado y almacenado en la nube.' });
      setShowSnapshotModal(false);
      setSnapshotNotes('');
      await loadAllData(ownerKey);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error al crear snapshot' });
    } finally {
      setLoadingAction(null);
    }
  };

  // Restore Snapshot
  const handleRestoreBackup = async (bkId: string, filename: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Restaurar Copia de Seguridad',
      message: `¿Estás seguro de que deseas restaurar el backup "${filename}"? Se sincronizarán las instancias y configuraciones del snapshot.`,
      confirmText: 'Restaurar Backup',
      isDanger: false,
      action: async () => {
        setLoadingAction(`restore-${bkId}`);
        try {
          const res = await restoreSystemBackup(ownerKey, bkId);
          setNotice({ type: 'success', text: res.message });
          await loadAllData(ownerKey);
        } catch (err: any) {
          setNotice({ type: 'error', text: err.message || 'Error al restaurar backup' });
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction('save-settings');
    try {
      await updateOwnerSettings(ownerKey, {
        maintenanceMode: settingsMaintMode,
        antibanShield: settingsAntibanShield,
        maintenanceMessage: settingsMaintMsg,
        maxInstancesTotal: settingsMaxTotal,
        maxInstancesPerNumber: settingsMaxPerNum,
        allowNewRegistrations: settingsAllowReg,
        defaultVersion: settingsDefaultVer,
        newOwnerPasscode: newPasscode || undefined,
      });
      setNotice({ type: 'success', text: 'Ajustes y límites del sistema actualizados con éxito.' });
      if (newPasscode) {
        setOwnerKey(newPasscode);
        localStorage.setItem('wolfric_owner_token', newPasscode);
        setNewPasscode('');
      }
      await loadAllData(ownerKey);
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error al guardar ajustes' });
    } finally {
      setLoadingAction(null);
    }
  };

  // Filter instances
  const filteredInstances = instances.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.ownerPhone.includes(searchQuery) ||
      inst.customAlias.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'online') return inst.status === 'online';
    if (statusFilter === 'offline') return inst.status === 'offline';
    if (statusFilter === 'banned') return inst.isBanned;
    if (statusFilter === 'suspended') return inst.isSuspended;
    return true;
  });

  // ---------------------------------------------------------------------------
  // LOGIN SCREEN (Owner Master Key Gate - Cyber Sentinel Shield v4.0)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl bento-card text-slate-100 relative overflow-hidden"
        >
          {/* Subtle Top Accent Beam */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="absolute top-4 left-4 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]"
            >
              <span>← Volver</span>
            </button>
          )}

          {/* Shield Badge Icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-5 mx-auto shadow-lg shadow-emerald-950/50">
            <ShieldCheck className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-2 shadow-sm">
              <Lock className="w-3 h-3 text-emerald-400" /> Acceso Administrativo Root
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight font-display">Panel Central de Control</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
              Consola de administración con protección perimetral, control de instancias y respaldo criptográfico.
            </p>
          </div>

          {/* Security Alert if failed attempts */}
          {attemptsRemaining !== null && attemptsRemaining < 5 && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2.5 animate-pulse shadow-md">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Atención: Restan <strong className="font-mono text-amber-200 font-bold">{attemptsRemaining} intento(s)</strong> antes de activar el bloqueo de seguridad.
              </span>
            </div>
          )}

          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 shadow-md"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.owner_input_label}</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">AES-GCM / SHA-256</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder={t.owner_input_placeholder}
                  required
                  autoFocus
                  className="w-full bg-[#08090d] border border-white/[0.1] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 shadow-inner transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                    playKeyClick();
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-emerald-300 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? 'OCULTAR' : 'VER'}
                </button>
              </div>

              {/* Animated Vault Safe Lock & Entropy Meter */}
              <div className="mt-3">
                <VaultLockMeter
                  value={passcodeInput}
                  isUnlocked={isAuthenticated}
                  label="Bóveda de Cifrado Root"
                />
              </div>
            </div>

            {/* Defense telemetry indicators */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Defensa Anti-Fuerza Bruta:
                </span>
                <span className="text-emerald-400 font-bold">ACTIVA</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                <span>Lockout progresivo:</span>
                <span>3m / 15m / Auto-lock</span>
              </div>
            </div>

            <SendFlightButton
              type="submit"
              disabled={loggingIn || !passcodeInput.trim()}
              loading={loggingIn}
              variant="violet"
              className="w-full py-3.5 text-slate-950 font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 shadow-lg shadow-emerald-950/50 hover:brightness-110 active:scale-95 transition-all"
              icon={<Unlock className="w-4 h-4 text-slate-950" />}
            >
              Autenticar y Desbloquear Bóveda
            </SendFlightButton>
          </form>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED OWNER DASHBOARD (BENTO GRID DESIGN)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Header Bento Card */}
      <div className="bento-card p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">Panel Central del Propietario</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-amber-300 border border-amber-500/30 font-mono">
                WOLFRIC ROOT
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Control centralizado de SubBots, versiones, actualizaciones globales y copias de seguridad
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Equipo de Administración: Propietario (Tú) + Supervisor de Seguridad
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>← Volver a la web</span>
            </button>
          )}

          <button
            onClick={() => loadAllData(ownerKey)}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.1] shadow-sm"
            title="Refrescar datos de la plataforma"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Actualizar Datos</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Global Notice message */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-lg ${
            notice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* Platform Global Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bento-card p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total SubBots</span>
          <span className="text-2xl font-black text-white font-mono tabular-nums">{instances.length}</span>
          <span className="text-[10px] text-emerald-400 block mt-1 font-medium">Registrados</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">En Línea</span>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {instances.filter((i) => i.status === 'online' && !i.isBanned && !i.isSuspended).length}
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-1 font-medium">Operando activos</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Baneados / Pausa</span>
          <span className="text-2xl font-black text-rose-400 font-mono tabular-nums">
            {instances.filter((i) => i.isBanned || i.isSuspended).length}
          </span>
          <span className="text-[10px] text-rose-400/80 block mt-1 font-medium">Restringidos</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Versiones Wolfric</span>
          <span className="text-2xl font-black text-cyan-400 font-mono tabular-nums">{versions.length}</span>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium">Disponibles</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Backups Nube</span>
          <span className="text-2xl font-black text-amber-300 font-mono tabular-nums">{backups.length}</span>
          <span className="text-[10px] text-amber-400/80 block mt-1 font-medium">Guardados</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Carga Servidor</span>
          <span className="text-2xl font-black text-white font-mono tabular-nums">{metrics?.memoryRssMb || 92} MB</span>
          <span className="text-[10px] text-emerald-400 block mt-1 font-medium font-mono">CPU ~{metrics?.cpuUsagePct || 14}%</span>
        </div>
      </div>

      {/* Owner Main Navigation Bento Tabs */}
      <div className="bento-card p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('instances');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'instances'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Smartphone className={`w-3.5 h-3.5 ${activeSection === 'instances' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>SubBots ({instances.length})</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('lids');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'lids'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Base de Datos ({lidsUsers.length})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            Privado
          </span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('rpg_overdrive');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'rpg_overdrive'
              ? 'bg-white/[0.12] text-white border border-purple-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>⚔️ Overdrive &amp; RPG</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('missions');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'missions'
              ? 'bg-white/[0.12] text-white border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span>📜 Misiones</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('co_admin');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'co_admin'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>🛡️ Co-Admin &amp; Sesiones</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Activo
          </span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('security');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'security'
              ? 'bg-white/[0.12] text-white border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Blindaje 2FA</span>
          {isEmergencyLockdownActive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse font-bold">
              LOCKDOWN
            </span>
          )}
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('versions');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'versions'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Versiones ({versions.length})</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('backups');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'backups'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Backups ({backups.length})</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('logs');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'logs'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Auditoría</span>
        </button>

        <button
          onClick={() => {
            playKeyClick();
            setActiveSection('settings');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Ajustes</span>
        </button>
      </div>

      {/* SECTION 1: INSTANCES MANAGEMENT (BENTO GRID) */}
      {activeSection === 'instances' && (
        <div className="space-y-6">
          {/* Filters and search bar Bento Card */}
          <div className="bento-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por teléfono o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white/[0.12] text-white border border-emerald-400/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                Todos ({instances.length})
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'online'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                Online ({instances.filter((i) => i.status === 'online').length})
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'offline'
                    ? 'bg-white/[0.15] text-white border border-white/[0.2]'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                Offline ({instances.filter((i) => i.status === 'offline').length})
              </button>
              <button
                onClick={() => setStatusFilter('banned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'banned'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white'
                }`}
              >
                Baneados ({instances.filter((i) => i.isBanned).length})
              </button>
            </div>
          </div>

          {/* Instances Table Bento Card */}
          <div className="bento-card rounded-2xl overflow-hidden">
            {filteredInstances.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No se encontraron instancias que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.02] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="py-3.5 px-4">SubBot / Dueño</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4">Versión Wolfric</th>
                      <th className="py-3.5 px-4">Uptime / Actividad</th>
                      <th className="py-3.5 px-4">Sesión Cifrada</th>
                      <th className="py-3.5 px-4 text-right">Acciones Propietario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredInstances.map((inst) => {
                      const isOnline = inst.status === 'online' && !inst.isBanned && !inst.isSuspended;
                      return (
                        <tr key={inst.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400">
                                <Smartphone className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{inst.customAlias || inst.name}</span>
                                  {inst.isBanned && (
                                    <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-500/30 rounded text-[9px]">
                                      BANEADO
                                    </span>
                                  )}
                                  {inst.isSuspended && (
                                    <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/30 rounded text-[9px]">
                                      SUSPENDIDO
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-slate-400 text-[11px]">{inst.ownerPhone}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isOnline
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : inst.isBanned
                                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`}
                              />
                              {inst.isBanned ? 'Baneado' : inst.status}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <button
                              onClick={() => {
                                setVersionModalTarget(inst);
                                setSelectedVersionForInst(inst.version);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-cyan-300 font-mono font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Cambiar versión asignada a esta instancia"
                            >
                              <span>{inst.version}</span>
                              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                            </button>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-mono text-slate-200 block text-xs">
                              {Math.floor(inst.uptimeSeconds / 3600)}h {Math.floor((inst.uptimeSeconds % 3600) / 60)}m
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {inst.stats.messagesProcessed} msgs • {inst.stats.activeGroups} grupos
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span
                              className="font-mono text-[10px] text-slate-400 truncate block max-w-[120px]"
                              title={inst.sessionHash}
                            >
                              {inst.sessionHash}
                            </span>
                            <span className="text-[9px] text-emerald-400 font-mono">Aislado en RAM</span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Restart */}
                              <button
                                onClick={() => handleInstanceAction(inst.id, 'restart')}
                                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                                title="Reiniciar SubBot remotamente"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Disconnect */}
                              <button
                                onClick={() => handleInstanceAction(inst.id, 'disconnect')}
                                className="p-2 rounded-xl bg-white/[0.04] hover:bg-amber-950/40 border border-white/[0.08] hover:border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                                title="Desactivar SubBot"
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Suspend / Unsuspend */}
                              {inst.isSuspended ? (
                                <button
                                  onClick={() => handleInstanceAction(inst.id, 'unsuspend')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-500/25 transition-colors"
                                  title="Reactivar instancia suspendida"
                                >
                                  Reactivar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleInstanceAction(inst.id, 'suspend')}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold cursor-pointer hover:bg-amber-500/25 transition-colors"
                                  title="Suspender instancia"
                                >
                                  Suspender
                                </button>
                              )}

                              {/* Ban / Unban */}
                              {inst.isBanned ? (
                                <button
                                  onClick={() => handleInstanceAction(inst.id, 'unban')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-500/25 transition-colors"
                                  title="Desbanear usuario"
                                >
                                  Desbanear
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanModalTarget(inst)}
                                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-950/50 border border-white/[0.08] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  title="Banear usuario"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Eliminar Instancia Permanentemente',
                                    message: `¿Estás seguro de ELIMINAR permanentemente la instancia de "${inst.name}" (${inst.ownerPhone})? Se cerrará el socket y se borrarán los datos de sesión.`,
                                    confirmText: 'Eliminar Instancia',
                                    isDanger: true,
                                    action: () => handleInstanceAction(inst.id, 'delete'),
                                  });
                                }}
                                className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-950/60 border border-white/[0.08] hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Eliminar instancia por completo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: VERSIONS MANAGEMENT (BENTO GRID) */}
      {activeSection === 'versions' && (
        <div className="space-y-6">
          <div className="bento-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Repositorio de Versiones de Wolfric</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Administra las versiones activas, sube nuevos archivos y aplica actualizaciones masivas o por instancia.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowGlobalUpdateModal(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Actualización Global</span>
              </button>

              <button
                onClick={() => {
                  setUploadFileModalIsVersion(true);
                  setShowUploadFileModal(true);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subir Archivo (.zip / .tar.gz)</span>
              </button>
            </div>
          </div>

          {/* Versions Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="bento-card p-5 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{ver.version}</h3>
                        {ver.isLatest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                            OFICIAL LATEST
                          </span>
                        )}
                        {ver.isBackup && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-500/30">
                            BACKUP ANTIGUO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Lanzamiento: {ver.releaseDate} • Tamaño: {ver.fileSize} • Autor: {ver.author}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-extrabold text-cyan-400 font-mono">
                        {instances.filter((i) => i.version === ver.version).length}
                      </span>
                      <span className="text-[10px] text-slate-500 block">SubBots activos</span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 font-medium">{ver.notes}</p>

                  <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1.5 font-mono">
                      Novedades & Cambios (Changelog):
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                      {ver.changelog.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[10px] truncate max-w-[200px] text-slate-400">Hash: {ver.hash}</span>

                  <button
                    onClick={() => {
                      setGlobalTargetVersion(ver.version);
                      setShowGlobalUpdateModal(true);
                    }}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    Desplegar a todos &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SYSTEM BACKUPS (BENTO GRID) */}
      {activeSection === 'backups' && (
        <div className="space-y-6">
          <div className="bento-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Backups Almacenados en la Nube</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Archivos empaquetados y snapshots de Wolfric organizados por versión y fecha.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setUploadFileModalIsVersion(false);
                  setShowUploadFileModal(true);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Backup (.zip / .json)</span>
              </button>

              <button
                onClick={() => setShowSnapshotModal(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Crear Snapshot Completo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backups.map((bk) => (
              <div key={bk.id} className="bento-card p-5 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-white block truncate max-w-[160px]">
                        {bk.filename}
                      </strong>
                      <span className="text-[10px] text-cyan-400 font-mono">{bk.version}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] text-slate-300 rounded font-mono">
                    {Math.round(bk.sizeKb / 1024)} MB
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{bk.notes}</p>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(bk.date).toLocaleDateString('es-ES')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreBackup(bk.id, bk.filename)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: LIDS & USER PROGRESS DATABASE */}
      {activeSection === 'lids' && (
        <LidsManagerSection
          ownerKey={ownerKey}
          users={lidsUsers}
          stats={lidsStats}
          onRefresh={() => loadAllData(ownerKey)}
          onShowNotice={setNotice}
          onGoToAiEditor={() => setActiveSection('co_admin')}
        />
      )}

      {/* SECTION: CO-ADMIN SUPERVISOR & SESSIONS */}
      {activeSection === 'co_admin' && (
        <CoAdminSupervisorSection
          ownerKey={ownerKey}
          instances={instances}
          cloudUsersCount={lidsUsers.length}
          onRefreshData={() => loadAllData(ownerKey)}
          onShowNotice={setNotice}
        />
      )}

      {/* SECTION 4: AUDIT LOGS (BENTO GRID) */}
      {activeSection === 'logs' && (
        <div className="bento-card p-6 sm:p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Registro de Auditoría &amp; Eventos del Sistema</h2>
            <span className="text-xs text-slate-400 font-mono">{auditLogs.length} eventos registrados</span>
          </div>

          <div className="bg-[#090c14] border border-white/[0.08] rounded-2xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2.5">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
                <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleString('es-ES')}]</span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase shrink-0 ${
                    log.status === 'ok'
                      ? 'bg-emerald-950 text-emerald-300'
                      : log.status === 'alert'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-rose-950 text-rose-300'
                  }`}
                >
                  {log.action}
                </span>
                <span className="text-slate-300">{log.target || 'Sistema'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: SETTINGS & MAINTENANCE (BENTO GRID) */}
      {activeSection === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bento-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h2 className="text-base font-bold text-white">Límites y Mantenimiento de la Plataforma</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Controla la disponibilidad del servicio y los permisos globales para usuarios.
            </p>
          </div>

          {/* Maintenance Mode Toggle */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <strong className="text-sm text-white block">Modo Mantenimiento</strong>
              <span className="text-xs text-slate-400">
                Pausa la vinculación de nuevos SubBots y muestra un mensaje informativo a los usuarios.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settingsMaintMode}
              onChange={(e) => setSettingsMaintMode(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Antiban Humanizado Shield Card */}
          <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-white block">Escudo Antiban Humanizado</strong>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 font-mono">
                    {settingsAntibanShield ? 'Protección Activa' : 'Desactivado'}
                  </span>
                </div>
                <span className="text-xs text-slate-300 mt-0.5 block leading-relaxed">
                  Simula comportamiento humano real antes de responder: estado "escribiendo...", delays de calentamiento progresivo y pausas de seguridad.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settingsAntibanShield}
              onChange={(e) => setSettingsAntibanShield(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mensaje de Mantenimiento Público
            </label>
            <input
              type="text"
              value={settingsMaintMsg}
              onChange={(e) => setSettingsMaintMsg(e.target.value)}
              placeholder="La plataforma Wolfric SubBot está en mantenimiento..."
              className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Limits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Capacidad Máxima de SubBots en la Red
              </label>
              <input
                type="number"
                min={5}
                max={500}
                value={settingsMaxTotal}
                onChange={(e) => setSettingsMaxTotal(parseInt(e.target.value) || 50)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Máximo de SubBots por Número de Teléfono
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={settingsMaxPerNum}
                onChange={(e) => setSettingsMaxPerNum(parseInt(e.target.value) || 2)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Versión Predeterminada para Nuevas Instancias
              </label>
              <select
                value={settingsDefaultVer}
                onChange={(e) => setSettingsDefaultVer(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.version} className="bg-[#0b0e17] text-white">
                    {v.version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allow New Registrations */}
          <label className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between cursor-pointer transition-colors">
            <div>
              <strong className="text-sm text-white block">Permitir Registro de Nuevos SubBots</strong>
              <span className="text-xs text-slate-400">Si se desmarca, ningún usuario podrá crear nuevas instancias.</span>
            </div>
            <input
              type="checkbox"
              checked={settingsAllowReg}
              onChange={(e) => setSettingsAllowReg(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          {/* Change Master Passcode */}
          <div className="pt-4 border-t border-white/[0.08]">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cambiar Clave Maestra del Propietario (Opcional)
            </label>
            <input
              type="password"
              placeholder="Escribe una nueva clave (mínimo 6 caracteres)..."
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              className="w-full max-w-md glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loadingAction !== null}
              className="px-6 py-3 rounded-xl font-extrabold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <span>Guardar Ajustes de Plataforma</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 8: CYBER SENTINEL SECURITY SHIELD & IP DEFENSE */}
      {activeSection === 'security' && (
        <SecurityShieldSection
          ownerKey={ownerKey}
          onLockdownChange={(active) => {
            setIsEmergencyLockdownActive(active);
          }}
        />
      )}

      {/* SECTION 9: RPG OVERDRIVE & ECONOMY */}
      {activeSection === 'rpg_overdrive' && (
        <RpgOverdriveSection ownerKey={ownerKey} />
      )}

      {/* SECTION 10: CUSTOM MISSIONS MANAGER */}
      {activeSection === 'missions' && (
        <MissionsManagerSection ownerKey={ownerKey} />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODALS (BENTO GLASS ARCHITECTURE) */}
      {/* --------------------------------------------------------------------- */}

      {/* 1. Modal: Assign version to specific instance */}
      {versionModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bento-modal rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white font-display">Asignar Versión de Wolfric</h3>
              </div>
              <button
                onClick={() => setVersionModalTarget(null)}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Instancia: <strong className="text-cyan-400">{versionModalTarget.name}</strong> ({versionModalTarget.ownerPhone})
            </p>

            <div className="space-y-2.5 mb-5 max-h-60 overflow-y-auto pr-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Seleccionar Versión:</label>
              {versions.map((ver) => (
                <label
                  key={ver.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedVersionForInst === ver.version
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/[0.12]'
                  }`}
                >
                  <div>
                    <strong className="text-xs block font-bold text-white">{ver.version}</strong>
                    <span className="text-[10px] text-slate-400">{ver.fileSize} • {ver.releaseDate}</span>
                  </div>
                  <input
                    type="radio"
                    name="version_pick"
                    checked={selectedVersionForInst === ver.version}
                    onChange={() => setSelectedVersionForInst(ver.version)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            {/* Auto backup checkbox */}
            <label className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between cursor-pointer mb-5 hover:border-white/[0.12] transition-colors">
              <div>
                <strong className="text-xs text-slate-200 block">Crear Backup Preventivo</strong>
                <span className="text-[10px] text-slate-400">Guarda la configuración previa antes de actualizar</span>
              </div>
              <input
                type="checkbox"
                checked={autoBackupBeforeAssign}
                onChange={(e) => setAutoBackupBeforeAssign(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setVersionModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignVersion}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Aplicar Versión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Ban User */}
      {banModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bento-modal rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl relative border-rose-500/30">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Banear Usuario e Instancia</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Estás a punto de suspender y revocar la instancia del número{' '}
              <strong className="text-rose-300 font-mono">{banModalTarget.ownerPhone}</strong> ({banModalTarget.name}).
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Motivo del Baneo (Visible en logs y al usuario)
              </label>
              <textarea
                rows={2}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBanModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleInstanceAction(banModalTarget.id, 'ban', banReason)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
              >
                Confirmar Baneo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Upload New Version or Older Backup */}
      {showUploadVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bento-modal rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-display">Subir Archivos / Versión de Wolfric</h3>
              </div>
              <button
                onClick={() => setShowUploadVersionModal(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Número de Versión o Nombre del Backup
                </label>
                <input
                  type="text"
                  placeholder="Ej. Wolfric 3.3.0 o Backup Antiguo Wolfric v2.7"
                  value={newVerNumber}
                  onChange={(e) => setNewVerNumber(e.target.value)}
                  required
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre del archivo empaquetado
                </label>
                <input
                  type="text"
                  placeholder="Ej. wolfric-core-v3.3.0.tar.gz o backup-antiguo.zip"
                  value={newVerFilename}
                  onChange={(e) => setNewVerFilename(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Notas de Versión / Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej. Compilación optimizada con nuevas librerías Baileys"
                  value={newVerNotes}
                  onChange={(e) => setNewVerNotes(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Historial de Cambios (Changelog - una línea por cambio)
                </label>
                <textarea
                  rows={3}
                  placeholder="Nueva función de stickers HD&#10;Parche de estabilidad en reconexión&#10;Reducción de consumo de memoria"
                  value={newVerChangelog}
                  onChange={(e) => setNewVerChangelog(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between cursor-pointer transition-colors">
                  <span className="text-xs text-slate-200">¿Es la Oficial (Latest)?</span>
                  <input
                    type="checkbox"
                    checked={newVerIsLatest}
                    onChange={(e) => setNewVerIsLatest(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between cursor-pointer transition-colors">
                  <span className="text-xs text-slate-200">¿Es un Backup Antiguo?</span>
                  <input
                    type="checkbox"
                    checked={newVerIsBackup}
                    onChange={(e) => setNewVerIsBackup(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadVersionModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Guardar en la Nube
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Global Update */}
      {showGlobalUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bento-modal rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Play className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-display">Actualización Global de SubBots</h3>
              </div>
              <button
                onClick={() => setShowGlobalUpdateModal(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Actualiza masivamente todas las instancias activas a una versión específica de Wolfric.
            </p>

            <div className="space-y-2.5 mb-5 max-h-60 overflow-y-auto pr-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Seleccionar Versión Destino:</label>
              {versions.map((ver) => (
                <label
                  key={ver.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    globalTargetVersion === ver.version
                      ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:border-white/[0.12]'
                  }`}
                >
                  <div>
                    <strong className="text-xs block font-bold text-white">{ver.version}</strong>
                    <span className="text-[10px] text-slate-400">{ver.fileSize} • {ver.releaseDate}</span>
                  </div>
                  <input
                    type="radio"
                    name="global_version_pick"
                    checked={globalTargetVersion === ver.version}
                    onChange={() => setGlobalTargetVersion(ver.version)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <label className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between cursor-pointer mb-5 transition-colors">
              <div>
                <strong className="text-xs text-slate-200 block">Crear Backup Preventivo Masivo</strong>
                <span className="text-[10px] text-slate-400">
                  Genera una copia de seguridad automática en cada SubBot antes de actualizar
                </span>
              </div>
              <input
                type="checkbox"
                checked={globalAutoBackup}
                onChange={(e) => setGlobalAutoBackup(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGlobalUpdateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeployGlobalUpdate}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Ejecutar Actualización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Create Manual Platform Snapshot */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bento-modal rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-display">Crear Snapshot Completo</h3>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Empaqueta el estado actual de todas las instancias, configuraciones y versiones registradas en la nube.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notas del Snapshot
              </label>
              <input
                type="text"
                placeholder="Ej. Respaldo previo a migración de nodo"
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSnapshot}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Generar Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Real File Uploader Modal (.zip / .json / versions / backups) */}
      <BackupUploaderModal
        isOpen={showUploadFileModal}
        onClose={() => setShowUploadFileModal(false)}
        defaultIsVersion={uploadFileModalIsVersion}
        title={
          uploadFileModalIsVersion
            ? 'Subir Paquete de Actualización / Versión de Wolfric (.zip / .tar.gz)'
            : 'Subir Archivo de Copia de Seguridad de Usuarios (.zip / .json)'
        }
        onSuccess={(res) => {
          setNotice({
            type: 'success',
            text: `¡Archivo procesado! Se han sincronizado ${res.usersImportedCount} usuarios y LIDs.`,
          });
          loadAllData(ownerKey);
        }}
        onUpload={(payload) => uploadOwnerBackupFile(ownerKey, payload)}
      />

      {/* 7. Bento Confirmation Modal (Safe In-App Replacement for window.confirm) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bento-modal rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl relative border-white/[0.12]">
            <div className="flex items-center gap-3 mb-3 border-b border-white/[0.08] pb-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  confirmModal.isDanger
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                {confirmModal.isDanger ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-bold text-white font-display">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {confirmModal.message}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const act = confirmModal.action;
                  setConfirmModal(null);
                  await act();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-95'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-emerald-500/20 hover:brightness-110 active:scale-95'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

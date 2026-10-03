import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Download,
  Ban,
  Radio,
  UserX,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { SecurityStatusReport, SecurityIncident } from '../types.js';
import {
  getSecurityStatus,
  toggleEmergencyLockdown,
  changeSecurityPin,
  unblockIpAddress,
  terminateAllAdminSessions,
  verifySecurityPin,
} from '../api.js';
import {
  playKeyClick,
  playAccessGranted,
  playAccessDenied,
  playLockdownAlert,
} from '../utils/audioFeedback.js';

interface SecurityShieldSectionProps {
  ownerKey: string;
  onLockdownChange?: (active: boolean) => void;
}

export function SecurityShieldSection({ ownerKey, onLockdownChange }: SecurityShieldSectionProps) {
  const [report, setReport] = useState<SecurityStatusReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [showLockdownModal, setShowLockdownModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  // Form states
  const [pinInput, setPinInput] = useState('');
  const [lockdownReason, setLockdownReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showPinText, setShowPinText] = useState(false);

  // Filter for incidents
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'critical' | 'failed_login'>('all');

  const fetchStatus = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getSecurityStatus(ownerKey);
      setReport(res.security);
      if (onLockdownChange) {
        onLockdownChange(res.security.emergencyLockdown);
      }
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al obtener telemetría de seguridad');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(() => fetchStatus(true), 15000);
    return () => clearInterval(timer);
  }, [ownerKey]);

  // Handler for Lockdown Toggle
  const handleToggleLockdown = async () => {
    if (!report) return;
    setIsSubmitting(true);
    playKeyClick();
    try {
      const targetState = !report.emergencyLockdown;
      const res = await toggleEmergencyLockdown(ownerKey, targetState, pinInput, lockdownReason);
      if (targetState) {
        playLockdownAlert();
      } else {
        playAccessGranted();
      }
      setSuccessMsg(res.message);
      setShowLockdownModal(false);
      setPinInput('');
      setLockdownReason('');
      fetchStatus(true);
    } catch (err: any) {
      playAccessDenied();
      setErrorMsg(err.message || 'Error al ejecutar Protocolo Escudo Alfa');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for PIN Change
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmNewPin) {
      playAccessDenied();
      setErrorMsg('El nuevo PIN y su confirmación no coinciden.');
      return;
    }
    if (newPin.length < 4 || newPin.length > 8) {
      setErrorMsg('El nuevo PIN debe contener entre 4 y 8 dígitos.');
      return;
    }

    setIsSubmitting(true);
    playKeyClick();
    try {
      const res = await changeSecurityPin(ownerKey, currentPin, newPin);
      playAccessGranted();
      setSuccessMsg(res.message);
      setShowChangePinModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      fetchStatus(true);
    } catch (err: any) {
      playAccessDenied();
      setErrorMsg(err.message || 'Error al actualizar el PIN maestro');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler to Unblock IP
  const handleUnblockIp = async (ip: string) => {
    const pin = prompt(`Introduce tu PIN de Seguridad Maestro para desbloquear la IP ${ip}:`);
    if (!pin) return;

    playKeyClick();
    try {
      const res = await unblockIpAddress(ownerKey, ip, pin);
      playAccessGranted();
      setSuccessMsg(res.message);
      fetchStatus(true);
    } catch (err: any) {
      playAccessDenied();
      setErrorMsg(err.message || 'Error al desbloquear IP');
    }
  };

  // Handler to Kill Remote Sessions
  const handleKillSessions = async () => {
    if (!confirm('¿Estás seguro de cerrar todas las sesiones remotas excepto la actual?')) return;
    playKeyClick();
    try {
      const res = await terminateAllAdminSessions(ownerKey);
      playAccessGranted();
      setSuccessMsg(res.message);
      fetchStatus(true);
    } catch (err: any) {
      playAccessDenied();
      setErrorMsg(err.message || 'Error al revocar sesiones');
    }
  };

  // Export Audit File
  const handleExportAudit = () => {
    playKeyClick();
    window.open(`/api/owner/security/export-audit?token=${encodeURIComponent(ownerKey)}`, '_blank');
  };

  if (loading && !report) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400 font-mono">Inicializando Sentinel Shield y telemetría de defensa...</p>
      </div>
    );
  }

  const isLockdown = report?.emergencyLockdown;
  const filteredIncidents = (report?.incidents || []).filter((inc) => {
    if (incidentFilter === 'critical') return inc.severity === 'critical' || inc.severity === 'high';
    if (incidentFilter === 'failed_login') return inc.type === 'failed_login' || inc.type === 'lockout';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      <AnimatePresence>
        {isLockdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-950/60 border-2 border-red-500/60 flex items-start sm:items-center justify-between gap-4 shadow-lg shadow-red-950/40"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/20 text-red-400 rounded-lg animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-red-200 tracking-wide">
                    🚨 PROTOCOLO ESCUDO ALFA ACTIVO (LOCKDOWN DE EMERGENCIA)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/30 text-red-300 font-bold">
                    AISLAMIENTO TOTAL
                  </span>
                </div>
                <p className="text-xs text-red-300/90 mt-0.5">
                  Todas las inscripciones, emparejamientos y registros de SubBots están congelados para proteger la integridad del sistema.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowLockdownModal(true);
                playKeyClick();
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex-shrink-0"
            >
              Desactivar Escudo
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200 font-bold ml-2">
              ✕
            </button>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 font-bold ml-2">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Cyber Defense Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Shield Health Status */}
        <div className="bento-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                Índice de Blindaje Sentinel
              </span>
              <div
                className={`w-3 h-3 rounded-full ${
                  isLockdown
                    ? 'bg-rose-500 animate-ping'
                    : report?.securityScore && report.securityScore >= 90
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : 'bg-amber-400'
                }`}
              />
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-4xl font-black font-mono tracking-tight text-white tabular-nums">
                {report?.securityScore || 96}%
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isLockdown
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isLockdown ? 'MODO COMBATE' : 'MÁXIMA DEFENSA'}
              </span>
            </div>

            <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isLockdown ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                }`}
                style={{ width: `${report?.securityScore || 96}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Anti-Bruteforce 100%
            </span>
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              AES-GCM 256-bit
            </span>
          </div>
        </div>

        {/* Card 2: Emergency Lockdown Protocol (Escudo Alfa) */}
        <div
          className={`bento-card p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between ${
            isLockdown
              ? 'border-rose-500/50 shadow-rose-950/30'
              : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                Protocolo Escudo Alfa
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isLockdown
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/40'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                }`}
              >
                {isLockdown ? 'ACTIVADO' : 'STANDBY'}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              En caso de ataque masivo o sospecha de intrusión, congela el registro de SubBots y bloquea la creación de instancias en segundos.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => {
                setShowLockdownModal(true);
                playKeyClick();
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                isLockdown
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 hover:brightness-110'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 text-white hover:brightness-110'
              }`}
            >
              {isLockdown ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Desactivar y Reanudar Bots</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Activar Escudo Alfa de Emergencia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 3: 2FA Master Security PIN */}
        <div className="bento-card p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                PIN Maestro de Seguridad (2FA)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                PROTEGIDO
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Exigido para acciones críticas como cambios de clave root, restauración de backups o desbloqueo perimetral de IPs.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              PIN Configurado
            </span>
            <button
              onClick={() => {
                setShowChangePinModal(true);
                playKeyClick();
              }}
              className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 hover:text-cyan-300 text-xs font-semibold rounded-xl border border-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cambiar PIN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bento Grid: Active Sessions & Blocked IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Sessions Bento Card */}
        <div className="bento-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide font-display">
                Sesiones Administrativas Cifradas ({report?.activeSessions?.length || 1})
              </h3>
            </div>
            <button
              onClick={handleKillSessions}
              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Cerrar todas las sesiones remotas de inmediato"
            >
              <UserX className="w-3 h-3" />
              <span>Revocar Sesiones</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(report?.activeSessions || []).map((sess, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                  sess.isCurrent
                    ? 'bg-cyan-950/20 border-cyan-400/40'
                    : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200 font-bold">{sess.tokenPrefix}</span>
                    {sess.isCurrent && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded font-semibold">
                        ESTA SESIÓN
                      </span>
                    )}
                    {sess.pinVerified && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                        PIN ELEVADO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                    <span>IP: <span className="text-slate-300">{sess.ip}</span></span>
                    <span>Activa: {new Date(sess.lastActive).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={sess.userAgent}>
                    {sess.userAgent.includes('Mozilla') ? 'Navegador Web' : sess.userAgent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perimeter Defense: Blocked IPs Bento Card */}
        <div className="bento-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-wide font-display">
                Defensa Perimetral &amp; IPs Bloqueadas ({report?.blacklistedIps?.length || 0})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-lock tras 10 fallos
            </span>
          </div>

          {(!report?.blacklistedIps || report.blacklistedIps.length === 0) ? (
            <div className="p-6 text-center rounded-2xl bg-white/[0.01] border border-white/[0.06]">
              <ShieldCheck className="w-8 h-8 text-emerald-400/70 mx-auto mb-2" />
              <p className="text-xs text-white font-medium">Perímetro Seguro</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                No hay direcciones IP bloqueadas actualmente. Cualquier intento de fuerza bruta será aislado automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {report.blacklistedIps.map((ip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-mono text-rose-200 font-semibold">{ip}</span>
                    <span className="text-[10px] text-rose-400 font-mono">Bloqueo Permanente</span>
                  </div>
                  <button
                    onClick={() => handleUnblockIp(ip)}
                    className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 text-[11px] rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Security Incidents & Intrusion Detection (IDS) Bento Card */}
      <div className="bento-card p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide font-display">
              Monitor de Intrusión &amp; Eventos Forenses en Tiempo Real
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-white/[0.04] p-0.5 border border-white/[0.08] text-xs">
              <button
                onClick={() => setIncidentFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  incidentFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({report?.incidents?.length || 0})
              </button>
              <button
                onClick={() => setIncidentFilter('critical')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  incidentFilter === 'critical' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Críticos
              </button>
              <button
                onClick={() => setIncidentFilter('failed_login')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  incidentFilter === 'failed_login' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Intentos Fallidos
              </button>
            </div>

            <button
              onClick={handleExportAudit}
              className="px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold rounded-xl border border-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Descargar registro forense completo en JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Exportar Auditoría</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto pr-1">
          {filteredIncidents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">
              Sin incidentes registrados con el filtro seleccionado.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const severityColor =
                inc.severity === 'critical'
                  ? 'text-rose-300 bg-rose-950/60 border-rose-500/40'
                  : inc.severity === 'high'
                  ? 'text-orange-300 bg-orange-950/60 border-orange-500/40'
                  : inc.severity === 'medium'
                  ? 'text-amber-300 bg-amber-950/60 border-amber-500/40'
                  : 'text-slate-300 bg-white/[0.04] border-white/[0.08]';

              return (
                <div key={inc.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold border ${severityColor}`}>
                        {inc.severity}
                      </span>
                      <span className="font-semibold text-slate-100">{inc.details}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                      <span>IP: <span className="text-slate-300">{inc.ip}</span></span>
                      <span>Origen: {inc.type}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap flex-shrink-0">
                    {new Date(inc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL 1: Emergency Lockdown Confirmation */}
      <AnimatePresence>
        {showLockdownModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 sm:p-7 rounded-3xl bento-card shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />

              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${isLockdown ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {isLockdown ? <Unlock className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {isLockdown ? 'Desactivar Protocolo Escudo Alfa' : 'Activar Protocolo Escudo Alfa'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLockdown
                      ? 'Restaura el registro y emparejamiento de SubBots en la plataforma.'
                      : 'Congela inmediatamente todas las operaciones externas por seguridad.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    PIN Maestro de Seguridad (2FA) *
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Introduce tu PIN maestro"
                    maxLength={8}
                    className="w-full px-4 py-2.5 bg-[#090c14] border border-white/[0.1] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    PIN por defecto: <span className="font-mono text-cyan-400">191919</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Motivo de la acción (Opcional)
                  </label>
                  <input
                    type="text"
                    value={lockdownReason}
                    onChange={(e) => setLockdownReason(e.target.value)}
                    placeholder="Ej. Sospecha de ataque o mantenimiento crítico"
                    className="w-full px-4 py-2.5 bg-[#090c14] border border-white/[0.1] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowLockdownModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer rounded-xl bg-white/[0.04]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!pinInput || isSubmitting}
                  onClick={handleToggleLockdown}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    isLockdown
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110'
                      : 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:brightness-110'
                  }`}
                >
                  {isSubmitting ? 'Procesando...' : isLockdown ? 'Confirmar Desactivación' : 'Confirmar Bloqueo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Change 2FA Master PIN */}
      <AnimatePresence>
        {showChangePinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 sm:p-7 rounded-3xl bento-card shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Actualizar PIN Maestro (2FA)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Establece un código numérico privado de 4 a 8 dígitos.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    PIN Maestro Actual
                  </label>
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="PIN actual (por defecto: 191919)"
                    className="w-full px-4 py-2.5 bg-[#090c14] border border-white/[0.1] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Nuevo PIN Maestro (4-8 dígitos)
                  </label>
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Ej. 849201"
                    maxLength={8}
                    className="w-full px-4 py-2.5 bg-[#090c14] border border-white/[0.1] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Confirmar Nuevo PIN
                  </label>
                  <input
                    type={showPinText ? 'text' : 'password'}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="Repite el nuevo PIN"
                    maxLength={8}
                    className="w-full px-4 py-2.5 bg-[#090c14] border border-white/[0.1] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPinText(!showPinText)}
                    className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer font-mono text-[11px]"
                  >
                    {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPinText ? 'Ocultar dígitos' : 'Mostrar dígitos'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer rounded-xl bg-white/[0.04]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !currentPin || !newPin || !confirmNewPin}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50 hover:brightness-110 active:scale-95"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Nuevo PIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

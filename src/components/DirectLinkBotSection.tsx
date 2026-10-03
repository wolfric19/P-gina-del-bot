import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Power,
  RotateCcw,
  QrCode,
  KeyRound,
  ShieldCheck,
  LogOut,
  Terminal,
  Sliders,
  Settings,
  MessageSquare,
  Activity,
  Wifi,
  Eye,
  EyeOff,
  Save,
  CheckCheck,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Clock,
  Radio,
  Lock,
  ArrowLeft,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  registerSubBot,
  triggerPairSubBot,
  getMySubBot,
  triggerSubBotAction,
  loginSubBot,
  updateSubBotConfig,
} from '../api.js';
import type { SubBotInstance, BotConfig } from '../types.js';
import { playKeyClick, playAccessGranted, playSharePop, playAccessDenied } from '../utils/audioFeedback.js';
import { useNotifications } from './NotificationSystem.js';
import { WhatsAppConnectionPulse } from './WhatsAppConnectionPulse.js';

export const COMMON_COUNTRIES = [
  { code: '+56', country: 'Chile', flag: '🇨🇱', placeholder: '9 8765 4321' },
  { code: '+51', country: 'Perú', flag: '🇵🇪', placeholder: '987 654 321' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', placeholder: '9 11 1234 5678' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', placeholder: '300 123 4567' },
  { code: '+52', country: 'México', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { code: '+34', country: 'España', flag: '🇪🇸', placeholder: '612 345 678' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪', placeholder: '412 123 4567' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷', placeholder: '11 91234 5678' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨', placeholder: '99 123 4567' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹', placeholder: '5123 4567' },
  { code: '+1', country: 'USA / Canadá', flag: '🇺🇸', placeholder: '202 555 0123' },
];

/**
 * Intelligent phone number parsing:
 * Detects if the user typed an international code (e.g. +56... or 569...)
 * and keeps country selector & clean digits synchronized.
 */
export function parseAndSanitizePhone(raw: string, fallbackCountryCode: string): {
  fullPhone: string;
  detectedCountryCode: string;
  localDigits: string;
} {
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) {
    return { fullPhone: '', detectedCountryCode: fallbackCountryCode, localDigits: '' };
  }

  // Check known country prefixes
  const knownPrefixes = ['56', '51', '54', '57', '52', '34', '58', '55', '593', '502', '1'];
  for (const prefix of knownPrefixes) {
    if (digitsOnly.startsWith(prefix) && digitsOnly.length >= prefix.length + 7) {
      return {
        fullPhone: `+${digitsOnly}`,
        detectedCountryCode: `+${prefix}`,
        localDigits: digitsOnly.slice(prefix.length),
      };
    }
  }

  const fallbackPrefix = fallbackCountryCode.replace(/\D/g, '');
  if (digitsOnly.startsWith(fallbackPrefix)) {
    return {
      fullPhone: `+${digitsOnly}`,
      detectedCountryCode: fallbackCountryCode,
      localDigits: digitsOnly.slice(fallbackPrefix.length),
    };
  }

  return {
    fullPhone: `+${fallbackPrefix}${digitsOnly}`,
    detectedCountryCode: fallbackCountryCode,
    localDigits: digitsOnly,
  };
}

interface DirectLinkBotSectionProps {
  currentInstance: SubBotInstance | null;
  userToken: string;
  onSubBotLinked: (instance: SubBotInstance, token: string, userPin: string) => void;
  onLogout: () => void;
  onNavigateToCommands?: () => void;
}

export function DirectLinkBotSection({
  currentInstance,
  userToken,
  onSubBotLinked,
  onLogout,
  onNavigateToCommands,
}: DirectLinkBotSectionProps) {
  const { notify } = useNotifications();

  // Mode: register new bot vs login to existing
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');

  // Registration inputs (Defaulting to Chile +56)
  const [countryCode, setCountryCode] = useState('+56');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pairingMethod, setPairingMethod] = useState<'code' | 'qr'>('code');

  // Login inputs
  const [loginCountryCode, setLoginCountryCode] = useState('+56');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Flow states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active pairing data
  const [pairingActive, setPairingActive] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkingPairing, setCheckingPairing] = useState(false);

  // Active connected SubBot instance (if any)
  const [instance, setInstance] = useState<SubBotInstance | null>(currentInstance);
  const [token, setToken] = useState<string>(userToken);

  // Bot management configuration state
  const [configTab, setConfigTab] = useState<'behavior' | 'messages' | 'security' | 'console'>('behavior');
  const [savingConfig, setSavingConfig] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    autoRead: false,
    antiLink: true,
    antiSpam: true,
    stickerMaker: true,
    reactions: true,
    autoBio: true,
    welcomeMessage: true,
    welcomeText: '¡Bienvenido al grupo! Usa .menu para explorar todos los comandos de Wolfric.',
    botBio: '⚡ Wolfric SubBot Oficial Multi-Device • 24/7 Online',
    commandPrefix: '.',
    mode: 'public',
  });
  const [botAlias, setBotAlias] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Synchronize incoming props
  useEffect(() => {
    setInstance(currentInstance);
    setToken(userToken);
    if (currentInstance?.config) {
      setBotConfig(currentInstance.config);
      setBotAlias(currentInstance.customAlias || currentInstance.name);
    }
    if (currentInstance?.status === 'pairing') {
      setPairingActive(true);
      if (currentInstance.pairingCode) setActiveCode(currentInstance.pairingCode);
      if (currentInstance.qrData) setActiveQr(currentInstance.qrData);
    }
  }, [currentInstance, userToken]);

  // Derived states
  const isOnline = Boolean(instance && instance.status === 'online');
  const isPairing = pairingActive || Boolean(instance && instance.status === 'pairing');
  const isUnlinked = !isOnline && !isPairing;

  // Real-time phone parsing for preview
  const parsedPhone = parseAndSanitizePhone(phoneNumber, countryCode);
  const currentCountryObj = COMMON_COUNTRIES.find((c) => c.code === countryCode) || COMMON_COUNTRIES[0];

  // Polling for pairing status while waiting
  useEffect(() => {
    if (!isPairing || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await getMySubBot(token);
        setInstance(res.instance);
        if (res.instance.pairingCode && !activeCode) {
          setActiveCode(res.instance.pairingCode);
        }
        if (res.instance.qrData && !activeQr) {
          setActiveQr(res.instance.qrData);
        }
        if (res.instance.status === 'online') {
          setPairingActive(false);
          setActiveCode(null);
          setActiveQr(null);
          setSuccessMsg('¡SubBot vinculado y conectado exitosamente!');
          notify({
            title: 'SubBot Conectado',
            message: 'Tu bot de WhatsApp ya está en línea y operando en segundo plano.',
            type: 'bot_event',
          });
          playAccessGranted();
        }
      } catch {
        // Continue polling silently
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPairing, token, activeCode, activeQr, notify]);

  // Handle phone input change with auto country detection
  const handlePhoneInputChange = (val: string) => {
    setPhoneNumber(val);
    const parsed = parseAndSanitizePhone(val, countryCode);
    if (parsed.detectedCountryCode !== countryCode) {
      setCountryCode(parsed.detectedCountryCode);
    }
  };

  // Action: Register & Link
  const handleRegisterAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    playKeyClick();

    const parsed = parseAndSanitizePhone(phoneNumber, countryCode);
    if (!parsed.fullPhone || parsed.fullPhone.length < 10) {
      setErrorMsg('Por favor introduce un número de teléfono válido con código de país.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('La contraseña de seguridad debe tener al menos 4 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const regRes = await registerSubBot({
        phone: parsed.fullPhone,
        password,
        pairingMethod,
      });

      setToken(regRes.token);
      setInstance(regRes.instance);
      onSubBotLinked(regRes.instance, regRes.token, password);

      setPairingActive(true);
      if (regRes.instance.pairingCode) setActiveCode(regRes.instance.pairingCode);
      if (regRes.instance.qrData) setActiveQr(regRes.instance.qrData);

      playAccessGranted();
      notify({
        title: 'Código Generado',
        message: 'Introduce este código en WhatsApp > Dispositivos Vinculados.',
        type: 'info',
      });
    } catch (err: any) {
      playAccessDenied();
      setErrorMsg(err.message || 'Error al iniciar la vinculación.');
    } finally {
      setLoading(false);
    }
  };

  // Action: Login to existing bot
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    playKeyClick();

    const parsed = parseAndSanitizePhone(loginPhone, loginCountryCode);
    if (!parsed.fullPhone) {
      setErrorMsg('Introduce el número de WhatsApp registrado.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginSubBot({
        phone: parsed.fullPhone,
        password: loginPassword,
      });
      setToken(res.token);
      setInstance(res.instance);
      if (res.instance.config) {
        setBotConfig(res.instance.config);
        setBotAlias(res.instance.customAlias || res.instance.name);
      }
      onSubBotLinked(res.instance, res.token, loginPassword);
      playAccessGranted();
      setSuccessMsg('Sesión iniciada correctamente en tu SubBot.');
      notify({
        title: 'Sesión Iniciada',
        message: `Bienvenido de nuevo a tu panel de control (${res.instance.name}).`,
        type: 'success',
      });
    } catch (err: any) {
      playAccessDenied();
      setErrorMsg(err.message || 'Credenciales inválidas o bot no encontrado.');
    } finally {
      setLoading(false);
    }
  };

  // Action: Manual check of pairing status
  const handleCheckPairingStatus = async () => {
    if (!token) return;
    setCheckingPairing(true);
    playKeyClick();
    try {
      const res = await getMySubBot(token);
      setInstance(res.instance);
      if (res.instance.status === 'online') {
        setPairingActive(false);
        setActiveCode(null);
        setActiveQr(null);
        playAccessGranted();
        notify({
          title: '¡SubBot Conectado!',
          message: 'Tu WhatsApp ha sido emparejado y está activo.',
          type: 'success',
        });
      } else {
        if (res.instance.pairingCode) setActiveCode(res.instance.pairingCode);
        notify({
          title: 'Esperando vinculación',
          message: 'Abre WhatsApp > Dispositivos vinculados e introduce el código que ves en pantalla.',
          type: 'info',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al verificar estado.');
    } finally {
      setCheckingPairing(false);
    }
  };

  // Action: Cancel pairing & change number
  const handleCancelPairing = () => {
    playKeyClick();
    setPairingActive(false);
    setActiveCode(null);
    setActiveQr(null);
    setInstance(null);
    setErrorMsg(null);
    onLogout();
    notify({
      title: 'Vinculación Reiniciada',
      message: 'Puedes introducir un nuevo número o corregir el anterior.',
      type: 'info',
    });
  };

  // Action: Copy Pairing Code
  const handleCopyCode = () => {
    const codeToCopy = activeCode || instance?.pairingCode;
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    playSharePop(1);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Bot Lifecycle Action
  const handleBotAction = async (action: 'restart' | 'disconnect' | 'reconnect' | 'repair' | 'delete') => {
    if (!token) return;
    setActionLoading(action);
    setErrorMsg(null);
    playKeyClick();

    try {
      if (action === 'repair') {
        const res = await triggerSubBotAction(token, 'repair');
        setInstance(res.instance);
        if (res.instance.pairingCode) setActiveCode(res.instance.pairingCode);
        setPairingActive(true);
        notify({
          title: 'Nuevo Código de Emparejamiento',
          message: 'Introduce el nuevo código en WhatsApp > Dispositivos vinculados.',
          type: 'info',
        });
      } else if (action === 'delete') {
        await triggerSubBotAction(token, 'delete');
        onLogout();
        setInstance(null);
        setPairingActive(false);
        notify({
          title: 'SubBot Desvinculado',
          message: 'La instancia fue eliminada y la sesión cerrada de forma segura.',
          type: 'info',
        });
      } else {
        const res = await triggerSubBotAction(token, action);
        setInstance(res.instance);
        notify({
          title: 'Acción Ejecutada',
          message: `El bot ejecutó la acción '${action}' correctamente.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al ejecutar la acción.');
    } finally {
      setActionLoading(null);
    }
  };

  // Save Bot Configuration
  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingConfig(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    playKeyClick();

    try {
      const payload: any = {
        config: botConfig,
        customAlias: botAlias.trim() || undefined,
      };

      if (newPasswordInput.trim()) {
        payload.newPassword = newPasswordInput.trim();
      }

      const res = await updateSubBotConfig(token, payload);
      setInstance(res.instance);
      setBotConfig(res.instance.config);
      setNewPasswordInput('');
      setSuccessMsg('Configuración guardada y sincronizada correctamente.');
      notify({
        title: 'Configuración Actualizada',
        message: 'Los parámetros y permisos de tu SubBot han sido aplicados.',
        type: 'success',
      });
      playAccessGranted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la configuración.');
    } finally {
      setSavingConfig(false);
    }
  };

  const displayCode = activeCode || instance?.pairingCode;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Alert Messages */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/[0.05]"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/[0.05]"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: EMPAREJAMIENTO ACTIVO (CÓDIGO DE WHATSAPP O QR)                   */}
      {/* ========================================================================= */}
      {isPairing && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (5 Cols): Instructions & Step Guide */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-400 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vinculación Oficial Baileys</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                  Vincula tu WhatsApp en 3 pasos
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                  Introduce el código que se muestra a la derecha directamente en tu aplicación oficial de WhatsApp.
                </p>
              </div>

              {/* Number assigned banner */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-slate-400">Número destino:</span>
                <span className="text-white font-mono font-bold tracking-wide">
                  {instance?.ownerPhone || parsedPhone.fullPhone}
                </span>
                <button
                  type="button"
                  onClick={handleCancelPairing}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer font-semibold"
                >
                  Cambiar
                </button>
              </div>

              {/* 3 Step List */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Abre <strong>WhatsApp</strong> en tu teléfono móvil.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Toca el menú de tres puntos (⋮) o Ajustes &gt; <strong>Dispositivos vinculados</strong> &gt; <strong>Vincular un dispositivo</strong>.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    Selecciona <strong>&quot;Vincular con el número de teléfono&quot;</strong> e introduce el código que tienes al lado.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
                <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sesión en memoria RAM con protección anti-ban. 100% segura.</span>
              </div>
            </div>

            {/* Right Column (7 Cols): Code Presentation Card */}
            <div className="lg:col-span-7 bento-card p-6 sm:p-8 rounded-3xl flex flex-col justify-between items-center text-center space-y-6">
              <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Esperando Confirmación en WhatsApp
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCancelPairing}
                  className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancelar / Usar otro</span>
                </button>
              </div>

              {/* Clean WhatsApp Connection Pulse (No alien bicho) */}
              <WhatsAppConnectionPulse
                status="pairing"
                phone={instance?.ownerPhone || parsedPhone.fullPhone}
                size="md"
              />

              {/* Code Presentation */}
              {pairingMethod === 'code' || displayCode ? (
                <div className="w-full space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300 block font-mono">
                    Código Oficial para WhatsApp
                  </span>

                  {displayCode ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-4 sm:p-5 rounded-2xl bg-black/60 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                      <div className="font-mono text-3xl sm:text-4xl font-black tracking-[0.25em] text-white px-2 select-all">
                        {displayCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg whitespace-nowrap"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-slate-950 font-black" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 py-6 text-slate-300 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Generando código oficial desde servidores de WhatsApp...</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1 text-xs text-amber-300 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Introduce este código en WhatsApp &gt; Dispositivos vinculados</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  {activeQr ? (
                    <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-400">
                      <img src={activeQr} alt="Código QR WhatsApp" className="w-56 h-56 rounded-lg" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-6 text-slate-300 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Generando código QR oficial de WhatsApp...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCheckPairingStatus}
                  disabled={checkingPairing}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingPairing ? 'animate-spin' : ''}`} />
                  <span>{checkingPairing ? 'Verificando...' : 'Ya ingresé el código (Verificar)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBotAction('repair')}
                  disabled={Boolean(actionLoading)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/[0.04] text-xs text-slate-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'repair' ? 'animate-spin' : ''}`} />
                  <span>¿Expiró? Generar nuevo código</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: HERO UNIFICADO + FORMULARIO DE VINCULACIÓN DIRECTA (UNLINKED)    */}
      {/* ========================================================================= */}
      {isUnlinked && (
        <div id="bot-link-form" className="space-y-12 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (6 Cols): Clear Value Proposition & Authority */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Unboxed Kicker */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span>Plataforma Oficial Baileys Multi-Device</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-400 font-mono">v6.7 Cloud Core</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-[1.08] text-balance">
                El SubBot de WhatsApp{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  más rápido, privado
                </span>{' '}
                y estable.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
                Vincula tu cuenta en 15 segundos sin descargas ni Termux.
                Sesión aislada en memoria RAM volátil, respuestas directas en menos de 20ms y panel de gestión autónomo 24/7.
              </p>

              {/* 3 Core Benefits with Clean Icons */}
              <div className="space-y-3 pt-1 text-left max-w-lg mx-auto lg:mx-0">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Sin Termux ni consumo de batería:</strong> Todo opera en la nube de alta disponibilidad sin ralentizar tu teléfono.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">100% Anti-Ban en RAM:</strong> Simula una sesión oficial de WhatsApp Web con pausas humanas automáticas.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">+80 Comandos listos:</strong> Stickers (.s), bienvenida automática, avisos (.tagall) y moderación de grupos.
                  </div>
                </div>
              </div>

              {/* Shortcut to Commands */}
              {onNavigateToCommands && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      playKeyClick();
                      onNavigateToCommands();
                    }}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
                  >
                    <Terminal className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>Explorar catálogo completo de comandos (.menu)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Proof Metrics */}
              <div className="pt-4 border-t border-white/[0.08] grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">99.98%</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">Uptime Socket</div>
                </div>
                <div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">&lt; 18ms</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">Latencia Mensaje</div>
                </div>
                <div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-cyan-400 tabular-nums">100%</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">Anti-Ban en RAM</div>
                </div>
              </div>
            </div>

            {/* Right Column (6 Cols): The Interactive Linking & Registration Card */}
            <div className="lg:col-span-6 w-full">
              <div className="bento-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
                {/* Card Title & Mode Switcher */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                        {authMode === 'register' ? 'Vincular Bot de WhatsApp' : 'Acceder a tu SubBot'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {authMode === 'register'
                          ? 'Genera tu código de emparejamiento oficial en un clic.'
                          : 'Ingresa con tu número y clave registrados.'}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Mode Switcher Segmented Control */}
                  <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        playKeyClick();
                        setAuthMode('register');
                        setErrorMsg(null);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                        authMode === 'register'
                          ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Vincular Nuevo Bot
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playKeyClick();
                        setAuthMode('login');
                        setErrorMsg(null);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                        authMode === 'login'
                          ? 'bg-white/[0.12] text-white border border-emerald-400/40 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                </div>

                {authMode === 'register' ? (
                  <form onSubmit={handleRegisterAndLink} className="space-y-5">
                    {/* WhatsApp Phone Number with Country Flag Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Número de WhatsApp
                        </label>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {currentCountryObj.country} ({currentCountryObj.code})
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-38 px-3 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 cursor-pointer transition-all"
                        >
                          {COMMON_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-[#0b0e17] text-white">
                              {c.flag} {c.code} ({c.country})
                            </option>
                          ))}
                        </select>

                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => handlePhoneInputChange(e.target.value)}
                          placeholder={`Ej: ${currentCountryObj.placeholder}`}
                          required
                          className="flex-1 px-4 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-600 transition-all"
                        />
                      </div>

                      {/* Live Formatted Phone Preview */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono">
                        <span className="text-slate-400 text-[11px]">Destino para WhatsApp:</span>
                        <span className="text-emerald-400 font-bold tracking-wide">
                          {parsedPhone.fullPhone ? `${parsedPhone.fullPhone} (${currentCountryObj.flag})` : 'Escribe tu número'}
                        </span>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                          Contraseña de tu Bot
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">la que prefieras</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 4 caracteres (para entrar al panel)"
                          required
                          minLength={4}
                          className="w-full px-4 py-3 pr-11 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-600 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                          title={showPassword ? 'Ocultar' : 'Ver'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Pairing Method Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Método de Emparejamiento
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPairingMethod('code')}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            pairingMethod === 'code'
                              ? 'bg-emerald-500/10 border-emerald-400/60 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold">Código 8 Dígitos</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Recomendado y rápido</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPairingMethod('qr')}
                          className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                            pairingMethod === 'qr'
                              ? 'bg-emerald-500/10 border-emerald-400/60 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                          }`}
                        >
                          <QrCode className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold">Código QR</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Escanear con cámara</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Primary Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-slate-950" />
                      )}
                      <span>
                        {loading
                          ? 'Generando Conexión Segura...'
                          : pairingMethod === 'code'
                          ? 'Generar Código de 8 Dígitos'
                          : 'Generar Código QR'}
                      </span>
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Sesión oficial aislada en memoria RAM • 100% Anti-Ban</span>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-5">
                    {/* WhatsApp Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Número de WhatsApp Registrado
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={loginCountryCode}
                          onChange={(e) => setLoginCountryCode(e.target.value)}
                          className="w-38 px-3 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 cursor-pointer transition-all"
                        >
                          {COMMON_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-[#0b0e17] text-white">
                              {c.flag} {c.code} ({c.country})
                            </option>
                          ))}
                        </select>

                        <input
                          type="tel"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="Ej: 987654321"
                          required
                          className="flex-1 px-4 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Contraseña de Seguridad
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Introduce tu contraseña"
                          required
                          className="w-full px-4 py-3 pr-11 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-600 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                      ) : (
                        <KeyRound className="w-5 h-5 text-slate-950" />
                      )}
                      <span>{loading ? 'Accediendo...' : 'Iniciar Sesión en el Bot'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: PANEL DE CONTROL Y CONFIGURACIÓN DEL SUBBOT (LINKED & ONLINE)    */}
      {/* ========================================================================= */}
      {isOnline && instance && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Bento Header Card: Bot Status & Quick Controls */}
          <div className="bento-card p-6 sm:p-8 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-6 mb-6">
              <div className="flex items-center gap-4">
                <WhatsAppConnectionPulse
                  status="online"
                  phone={instance.ownerPhone}
                  size="sm"
                />

                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                      {instance.customAlias || instance.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      EN LÍNEA
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>Número: <strong className="text-white font-mono">{instance.ownerPhone}</strong></span>
                    <span>•</span>
                    <span>Versión: <strong className="text-emerald-400">{instance.version}</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBotAction('restart')}
                  disabled={Boolean(actionLoading)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
                  <span>Reiniciar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBotAction('disconnect')}
                  disabled={Boolean(actionLoading)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-950/40 border border-white/[0.1] hover:border-rose-500/30 text-xs font-semibold text-slate-200 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-rose-400" />
                  <span>Desconectar</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  title="Cerrar sesión en este navegador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Mensajes</span>
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums">
                  {instance.stats?.messagesProcessed ?? 0}
                </div>
                <span className="text-[10px] text-slate-500">Procesados hoy</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Comandos</span>
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-cyan-400 tabular-nums">
                  {instance.stats?.commandsExecuted ?? 0}
                </div>
                <span className="text-[10px] text-slate-500">Ejecutados</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Grupos Activos</span>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-white tabular-nums">
                  {instance.stats?.activeGroups ?? 1}
                </div>
                <span className="text-[10px] text-slate-500">Conectados</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Latencia Socket</span>
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                  &lt; 18ms
                </div>
                <span className="text-[10px] text-slate-500">Tiempo de respuesta</span>
              </div>
            </div>
          </div>

          {/* Configuration Tabs & Panel */}
          <div className="bento-card rounded-3xl overflow-hidden">
            <div className="flex items-center border-b border-white/[0.08] px-4 pt-3 overflow-x-auto scrollbar-none gap-2">
              <button
                type="button"
                onClick={() => setConfigTab('behavior')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  configTab === 'behavior'
                    ? 'bg-white/[0.08] text-white border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Comportamiento</span>
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('messages')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  configTab === 'messages'
                    ? 'bg-white/[0.08] text-white border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mensajes y Textos</span>
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('security')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  configTab === 'security'
                    ? 'bg-white/[0.08] text-white border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Seguridad y Clave</span>
              </button>

              <button
                type="button"
                onClick={() => setConfigTab('console')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  configTab === 'console'
                    ? 'bg-white/[0.08] text-white border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Consola de Logs</span>
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {configTab === 'behavior' && (
                <form onSubmit={handleSaveConfiguration} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <div className="text-xs font-bold text-white">Auto-Lectura de Mensajes</div>
                        <div className="text-[11px] text-slate-400">Marcar como leídos los chats entrantes</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={botConfig.autoRead}
                        onChange={(e) => setBotConfig({ ...botConfig, autoRead: e.target.checked })}
                        className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <div className="text-xs font-bold text-white">Protección Anti-Link</div>
                        <div className="text-[11px] text-slate-400">Eliminar enlaces de spam en grupos</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={botConfig.antiLink}
                        onChange={(e) => setBotConfig({ ...botConfig, antiLink: e.target.checked })}
                        className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <div className="text-xs font-bold text-white">Creador de Stickers (.s)</div>
                        <div className="text-[11px] text-slate-400">Convertir imágenes/videos en stickers</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={botConfig.stickerMaker}
                        onChange={(e) => setBotConfig({ ...botConfig, stickerMaker: e.target.checked })}
                        className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <div className="text-xs font-bold text-white">Protección Anti-Spam</div>
                        <div className="text-[11px] text-slate-400">Silenciar usuarios que saturen comandos</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={botConfig.antiSpam}
                        onChange={(e) => setBotConfig({ ...botConfig, antiSpam: e.target.checked })}
                        className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingConfig ? 'Guardando...' : 'Guardar Comportamiento'}</span>
                    </button>
                  </div>
                </form>
              )}

              {configTab === 'messages' && (
                <form onSubmit={handleSaveConfiguration} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Nombre o Alias del Bot
                    </label>
                    <input
                      type="text"
                      value={botAlias}
                      onChange={(e) => setBotAlias(e.target.value)}
                      placeholder="Ej: Wolfric SubBot Oficial"
                      className="w-full px-4 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Mensaje de Bienvenida en Grupos
                    </label>
                    <textarea
                      rows={3}
                      value={botConfig.welcomeText || ''}
                      onChange={(e) => setBotConfig({ ...botConfig, welcomeText: e.target.value })}
                      placeholder="Mensaje al unirse nuevos miembros..."
                      className="w-full px-4 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingConfig ? 'Guardando...' : 'Guardar Mensajes'}</span>
                    </button>
                  </div>
                </form>
              )}

              {configTab === 'security' && (
                <form onSubmit={handleSaveConfiguration} className="space-y-6">
                  <div className="space-y-1.5 max-w-md">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Cambiar Contraseña de Acceso
                    </label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Nueva contraseña (deja en blanco para no cambiar)"
                      className="w-full px-4 py-3 rounded-xl bg-[#090c14] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleBotAction('delete')}
                      className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar y Desvincular SubBot</span>
                    </button>

                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingConfig ? 'Guardando...' : 'Actualizar Contraseña'}</span>
                    </button>
                  </div>
                </form>
              )}

              {configTab === 'console' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Logs del proceso Baileys en tiempo real:</span>
                    <span className="font-mono text-emerald-400 text-[11px]">Memoria RAM Segura</span>
                  </div>
                  <div className="h-64 rounded-2xl bg-black/80 border border-white/[0.08] p-4 font-mono text-xs overflow-y-auto space-y-1.5 custom-scrollbar">
                    {instance.logs && instance.logs.length > 0 ? (
                      instance.logs.map((log: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-slate-500 shrink-0 text-[10px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--'}
                          </span>
                          <span
                            className={
                              log.level === 'error'
                                ? 'text-rose-400'
                                : log.level === 'warn'
                                ? 'text-amber-400'
                                : log.level === 'success'
                                ? 'text-emerald-400'
                                : 'text-slate-300'
                            }
                          >
                            {log.message}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 py-10 text-center">
                        No hay logs registrados todavía.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

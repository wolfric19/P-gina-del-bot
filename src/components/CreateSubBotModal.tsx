import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Shield,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { registerSubBot, triggerPairSubBot, getMySubBot, triggerSubBotAction } from '../api.js';
import type { SubBotInstance } from '../types.js';
import { useTranslation } from '../i18n/LanguageContext.js';

interface CreateSubBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubBotCreated: (instance: SubBotInstance, token: string, userPin: string) => void;
}

const COMMON_COUNTRY_CODES = [
  { code: '+52', country: 'México 🇲🇽' },
  { code: '+55', country: 'Brasil 🇧🇷' },
  { code: '+34', country: 'España 🇪🇸' },
  { code: '+54', country: 'Argentina 🇦🇷' },
  { code: '+57', country: 'Colombia 🇨🇴' },
  { code: '+51', country: 'Perú 🇵🇪' },
  { code: '+56', country: 'Chile 🇨🇱' },
  { code: '+58', country: 'Venezuela 🇻🇪' },
  { code: '+593', country: 'Ecuador 🇪🇨' },
  { code: '+502', country: 'Guatemala 🇬🇹' },
  { code: '+1', country: 'EE.UU. / Canadá 🇺🇸/🇨🇦' },
  { code: '+351', country: 'Portugal 🇵🇹' },
];

function getSanitizedPhoneWithCountry(phoneRaw: string, cc: string): string {
  let clean = phoneRaw.trim().replace(/[^0-9]/g, '');
  const ccDigits = cc.replace(/[^0-9]/g, '');
  if (!clean) return '';

  if (clean.startsWith(ccDigits)) {
    const doubleCc = ccDigits + ccDigits;
    if (clean.startsWith(doubleCc)) {
      clean = clean.slice(ccDigits.length);
    }
    return `+${clean}`;
  }

  const knownPrefixes = ['55', '52', '34', '54', '57', '51', '56', '58', '593', '502', '351', '1'];
  for (const p of knownPrefixes) {
    if (clean.startsWith(p + p)) {
      clean = clean.slice(p.length);
      return `+${clean}`;
    }
  }

  return `+${ccDigits}${clean}`;
}

function checkDuplicateCountryCode(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, '');
  const knownPrefixes = ['55', '52', '34', '54', '57', '51', '56', '58', '593', '502', '351', '1'];
  for (const p of knownPrefixes) {
    if (digits.startsWith(p + p)) {
      const fixed = digits.slice(p.length);
      if (fixed.length >= 9) {
        return `+${fixed}`;
      }
    }
  }
  return null;
}

export function CreateSubBotModal({ isOpen, onClose, onSubBotCreated }: CreateSubBotModalProps) {
  const { lang, t } = useTranslation();
  const [step, setStep] = useState<'form' | 'pairing'>('form');
  const [countryCode, setCountryCode] = useState(() => (lang === 'pt' ? '+55' : lang === 'es' ? '+52' : '+1'));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [pairingMethod, setPairingMethod] = useState<'code' | 'qr'>('code');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result from registration
  const [createdInstance, setCreatedInstance] = useState<SubBotInstance | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [userPin, setUserPin] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [verifyingPair, setVerifyingPair] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'qr'>('code');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState('');

  // Auto-polling for WhatsApp connection confirmation and code recovery
  useEffect(() => {
    if (step !== 'pairing' || !createdToken || pairingSuccess) return;

    // Fast initial check if code is missing
    if (createdInstance && !createdInstance.pairingCode && pairingMethod === 'code') {
      const fastTimer = setTimeout(async () => {
        try {
          const res = await triggerSubBotAction(createdToken, 'repair');
          if (res.instance?.pairingCode) {
            setCreatedInstance(res.instance);
          }
          if (res.error) {
            setError(res.error);
          }
        } catch {
          // ignore
        }
      }, 1500);
      return () => clearTimeout(fastTimer);
    }

    const interval = setInterval(async () => {
      try {
        const res = await getMySubBot(createdToken);
        if (res.instance.status === 'online') {
          clearInterval(interval);
          setPairingSuccess(true);
          setTimeout(() => {
            onSubBotCreated(res.instance, createdToken, userPin || '');
            onClose();
          }, 1500);
        } else if (res.instance.pairingCode && res.instance.pairingCode !== createdInstance?.pairingCode) {
          setCreatedInstance(res.instance);
        } else if (res.instance.qrData && res.instance.qrData !== createdInstance?.qrData) {
          setCreatedInstance(res.instance);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, createdToken, userPin, pairingSuccess, createdInstance, pairingMethod, onSubBotCreated, onClose]);

  if (!isOpen) return null;

  const fullPhone = getSanitizedPhoneWithCountry(phoneNumber, countryCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = fullPhone.replace(/[^0-9]/g, '');
    if (clean.length < 9) {
      setError(
        lang === 'pt'
          ? 'Por favor, digite um número de telefone completo com DDD.'
          : lang === 'en'
          ? 'Please enter a complete phone number with country and area code.'
          : 'Por favor ingresa un número de teléfono completo con código de país.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await registerSubBot({
        phone: fullPhone,
        customAlias: customAlias.trim() || undefined,
        pairingMethod,
      });

      setCreatedInstance(res.instance);
      setCreatedToken(res.token);
      setUserPin(res.userPin);
      setActiveTab(pairingMethod);
      setStep('pairing');
      if (res.instance.ownerPhone) {
        setEditPhoneValue(res.instance.ownerPhone);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar instancia');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhone = async (newPhone: string) => {
    if (!createdToken) return;
    const cleanDigits = newPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 9) {
      setError('Por favor ingresa un número de teléfono válido con código de país.');
      return;
    }
    setRegeneratingCode(true);
    setError(null);
    try {
      const res = await triggerSubBotAction(createdToken, 'change-phone', { phone: `+${cleanDigits}` });
      setCreatedInstance(res.instance);
      setIsEditingPhone(false);
      if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar número de teléfono');
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleToggleMexicanFormat = async () => {
    if (!createdInstance || !createdToken) return;
    const currentDigits = createdInstance.ownerPhone.replace(/[^0-9]/g, '');
    let toggledDigits = '';
    if (currentDigits.startsWith('521')) {
      toggledDigits = '52' + currentDigits.slice(3);
    } else if (currentDigits.startsWith('52')) {
      toggledDigits = '521' + currentDigits.slice(2);
    } else {
      toggledDigits = currentDigits;
    }

    await handleChangePhone(`+${toggledDigits}`);
  };

  const handleCopyCode = () => {
    if (createdInstance?.pairingCode) {
      // Copy without spaces or with dash
      const clean = createdInstance.pairingCode.replace(/[^A-Za-z0-9]/g, '');
      navigator.clipboard.writeText(clean);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRequestNewCode = async () => {
    if (!createdToken) return;
    setRegeneratingCode(true);
    setError(null);
    try {
      const res = await triggerSubBotAction(createdToken, 'repair');
      setCreatedInstance(res.instance);
      if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Error solicitando nuevo código');
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleConfirmPairing = async () => {
    if (!createdToken) return;
    setVerifyingPair(true);
    try {
      const res = await triggerPairSubBot(createdToken);
      onSubBotCreated(res.instance, createdToken, userPin || '');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error verificando vinculación');
    } finally {
      setVerifyingPair(false);
    }
  };

  // Split code into 4 and 4 characters for WhatsApp 8-slot display
  const rawCleanCode = (createdInstance?.pairingCode || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const slotPart1 = (rawCleanCode.slice(0, 4) || '----').padEnd(4, '-').split('');
  const slotPart2 = (rawCleanCode.slice(4, 8) || '----').padEnd(4, '-').split('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{t.create_modal_title}</h2>
              <p className="text-xs text-slate-400">
                {step === 'form' ? t.create_modal_step1 : t.create_modal_step2}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Phone & Country Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.create_country_label} & {t.create_phone_label}
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {COMMON_COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.country} ({c.code})
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  required
                  placeholder={t.create_phone_placeholder}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {phoneNumber.trim() && (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Formato oficial para WhatsApp: <span className="text-cyan-300 font-mono font-semibold">{fullPhone}</span>
                </p>
              )}
            </div>

            {/* Custom Alias */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.create_alias_label}
              </label>
              <input
                type="text"
                placeholder={t.create_alias_placeholder}
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Pairing Method Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {t.create_method_label}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    pairingMethod === 'code'
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                      : 'bg-slate-850 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <span>{t.create_method_code}</span>
                    </div>
                    <input
                      type="radio"
                      name="pairing"
                      checked={pairingMethod === 'code'}
                      onChange={() => setPairingMethod('code')}
                      className="accent-cyan-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {t.create_method_code_desc}
                  </p>
                </label>

                <label
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    pairingMethod === 'qr'
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                      : 'bg-slate-850 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <QrCode className="w-4 h-4 text-indigo-400" />
                      <span>{t.create_method_qr}</span>
                    </div>
                    <input
                      type="radio"
                      name="pairing"
                      checked={pairingMethod === 'qr'}
                      onChange={() => setPairingMethod('qr')}
                      className="accent-cyan-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {t.create_method_qr_desc}
                  </p>
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.create_submitting}</span>
                  </>
                ) : (
                  <>
                    <span>{t.create_submit_btn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: WhatsApp Pairing Display */}
        {step === 'pairing' && createdInstance && (
          <div className="mt-6 space-y-5 text-center">
            {pairingSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-center space-y-2 animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">¡Dispositivo Vinculado a WhatsApp con Éxito!</h3>
                <p className="text-xs text-emerald-300">Tu SubBot Wolfric ya está activo. Abriendo tu panel de control...</p>
              </div>
            ) : (
              <>
                {/* Pairing Mode Tabs */}
                <div className="flex items-center justify-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'code'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Código 8 dígitos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'qr'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear QR</span>
                  </button>
                </div>

                {activeTab === 'code' ? (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-300 max-w-md mx-auto">
                      {t.create_pairing_desc_code}
                    </div>

                    {/* Duplicate Country Code Warning & Quick Fix */}
                    {checkDuplicateCountryCode(createdInstance.ownerPhone) && (
                      <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-left space-y-2 max-w-md mx-auto">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Código de país duplicado detectado ({createdInstance.ownerPhone.slice(0, 5)}...)</span>
                        </div>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">
                          El número guardado tiene el código de país repetido (<strong className="font-mono text-white">{createdInstance.ownerPhone}</strong>). WhatsApp no responderá a números con código repetido.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleChangePhone(checkDuplicateCountryCode(createdInstance.ownerPhone)!)}
                          disabled={regeneratingCode}
                          className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Corregir a {checkDuplicateCountryCode(createdInstance.ownerPhone)} y generar código</span>
                        </button>
                      </div>
                    )}

                    {/* WhatsApp 8-Slot Display */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 max-w-md mx-auto shadow-xl">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Código Oficial WhatsApp
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          Multi-Device
                        </span>
                      </div>

                      {createdInstance.pairingCode ? (
                        <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
                          <div className="flex gap-1.5 sm:gap-2">
                            {slotPart1.map((ch, idx) => (
                              <div
                                key={`p1-${idx}`}
                                className="w-9 h-12 sm:w-11 sm:h-14 rounded-xl bg-slate-900 border-2 border-cyan-400/80 flex items-center justify-center text-xl sm:text-2xl font-black font-mono text-cyan-200 shadow-md shadow-cyan-500/20"
                              >
                                {ch}
                              </div>
                            ))}
                          </div>
                          <span className="text-xl font-bold text-slate-500 select-none">—</span>
                          <div className="flex gap-1.5 sm:gap-2">
                            {slotPart2.map((ch, idx) => (
                              <div
                                key={`p2-${idx}`}
                                className="w-9 h-12 sm:w-11 sm:h-14 rounded-xl bg-slate-900 border-2 border-cyan-400/80 flex items-center justify-center text-xl sm:text-2xl font-black font-mono text-cyan-200 shadow-md shadow-cyan-500/20"
                              >
                                {ch}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-5 flex flex-col items-center justify-center gap-2.5">
                          <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                          <span className="text-xs text-slate-300 font-medium">
                            {regeneratingCode ? 'Solicitando código oficial a WhatsApp...' : 'Esperando respuesta de servidores de WhatsApp...'}
                          </span>
                          {error && (
                            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] max-w-sm">
                              {error}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleRequestNewCode}
                            disabled={regeneratingCode}
                            className="mt-1 px-4 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
                          >
                            Reintentar generación
                          </button>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          disabled={!createdInstance.pairingCode}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? t.create_copied : t.create_copy_code}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRequestNewCode}
                          disabled={regeneratingCode}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${regeneratingCode ? 'animate-spin' : ''}`} />
                          <span>Obtener nuevo código</span>
                        </button>
                      </div>
                    </div>

                    {/* Troubleshooting / Number Format Helper & Inline Phone Editor */}
                    <div className="text-[11px] p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 text-center max-w-md mx-auto space-y-2.5">
                      <div className="flex items-center justify-center gap-2 flex-wrap text-slate-300">
                        <span>Número registrado:</span>
                        <strong className="text-cyan-300 font-mono text-xs">{createdInstance.ownerPhone}</strong>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhoneValue(createdInstance.ownerPhone);
                            setIsEditingPhone(!isEditingPhone);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer ml-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>{isEditingPhone ? 'Cancelar' : 'Cambiar número'}</span>
                        </button>
                      </div>

                      {isEditingPhone && (
                        <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-700 text-left space-y-1.5">
                          <label className="text-[10px] text-slate-400 block">Número completo con código de país:</label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={editPhoneValue}
                              onChange={(e) => setEditPhoneValue(e.target.value)}
                              placeholder="+52... o +55..."
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleChangePhone(editPhoneValue)}
                              disabled={regeneratingCode}
                              className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-md text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {regeneratingCode ? 'Guardando...' : 'Guardar y vincular'}
                            </button>
                          </div>
                        </div>
                      )}

                      {createdInstance.ownerPhone.startsWith('+52') && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={handleToggleMexicanFormat}
                            disabled={regeneratingCode}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${regeneratingCode ? 'animate-spin' : ''}`} />
                            <span>
                              {createdInstance.ownerPhone.startsWith('+521')
                                ? '¿WhatsApp no vincula? Probar sin el 1 (+52...)'
                                : '¿WhatsApp no vincula? Probar con el 1 (+52 1...)'}
                            </span>
                          </button>
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('qr')}
                          className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                        >
                          ¿Problemas con el código? Toca aquí para vincular escaneando Código QR
                        </button>
                      </div>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="text-left p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs text-slate-300 max-w-md mx-auto">
                      <div className="font-semibold text-white text-xs flex items-center gap-1.5 text-cyan-400 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Cómo vincular en tu WhatsApp:</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Abre WhatsApp en tu teléfono celular.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Toca <strong>Ajustes</strong> (o ⋮ en Android) &gt; <strong>Dispositivos vinculados</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Toca el botón verde <strong>Vincular un dispositivo</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>En la parte inferior, toca <strong>"Vincular con el número de teléfono"</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                        <span>Ingresa los 8 caracteres que ves arriba en los recuadros.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-300 max-w-md mx-auto">
                      Abre WhatsApp en tu teléfono, ve a <strong>Dispositivos vinculados &gt; Vincular un dispositivo</strong> y apunta tu cámara hacia este código:
                    </div>

                    {/* Visual QR Code Display */}
                    <div className="p-4 rounded-2xl bg-white text-slate-950 w-64 h-64 mx-auto flex flex-col items-center justify-center shadow-xl border-4 border-cyan-500/30">
                      {createdInstance.qrData ? (
                        <img
                          src={createdInstance.qrData}
                          alt="WhatsApp Multi-Device QR"
                          className="w-52 h-52 object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
                          <span className="text-[11px] font-semibold text-slate-700">
                            Generando QR con WhatsApp...
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleRequestNewCode}
                        disabled={regeneratingCode}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingCode ? 'animate-spin' : ''}`} />
                        <span>Actualizar código QR</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Real-time Listener Pulse */}
                <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 py-2 px-3 rounded-xl max-w-md mx-auto">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-medium">Esperando vinculación... Se detectará automáticamente.</span>
                </div>

                {/* Security PIN Box */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left flex items-start gap-2.5 max-w-md mx-auto">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{t.create_pin_warning} </span>
                    <strong className="font-mono text-white text-sm bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                      {userPin}
                    </strong>
                  </div>
                </div>

                {/* Confirmation CTA */}
                <div className="pt-2 max-w-md mx-auto">
                  <button
                    onClick={handleConfirmPairing}
                    disabled={verifyingPair}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingPair ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.create_verifying}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.create_confirm_pairing_btn}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { ShieldCheck, Smartphone, Zap, CheckCircle2, AlertCircle, Lock, RefreshCw, Cpu, Layers } from 'lucide-react';

export function AntiBanGuideSection() {
  return (
    <div className="space-y-6">
      {/* Top Banner Bento Card */}
      <div className="bento-card p-6 sm:p-8 rounded-3xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              Tecnología Anti-Ban &amp; Guía de Uso Seguro
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Motor Baileys Multi-Device v6.7 Oficial</span>
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          Wolfric implementa el motor oficial <strong>Baileys Multi-Device v6.7</strong>. Tu teléfono actúa como una sesión legítima de WhatsApp Web, garantizando máxima estabilidad y cero riesgo de suspensión.
        </p>
      </div>

      {/* 3 Step Linking Guide Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bento-card p-6 rounded-2xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black font-mono text-sm shadow-inner">
            1
          </div>
          <h3 className="text-sm font-bold text-white font-display">Solicita tu Código</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ingresa tu número con código de país (+56, +51, +54, +57, +52, +34, etc.) y la contraseña que tú quieras para tu bot.
          </p>
        </div>

        <div className="bento-card p-6 rounded-2xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black font-mono text-sm shadow-inner">
            2
          </div>
          <h3 className="text-sm font-bold text-white font-display">Abre WhatsApp</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ve a Ajustes o los 3 puntos ⋮ &gt; <strong>Dispositivos vinculados</strong> &gt; <strong>Vincular un dispositivo</strong> &gt; Vincular con número de teléfono.
          </p>
        </div>

        <div className="bento-card p-6 rounded-2xl space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black font-mono text-sm shadow-inner">
            3
          </div>
          <h3 className="text-sm font-bold text-white font-display">¡Listo y Operativo!</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pega el código de 8 dígitos. La sesión se vincula al instante y tu bot empezará a responder en todos tus grupos.
          </p>
        </div>
      </div>

      {/* Security Pillars Bento Card */}
      <div className="bento-card p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4">
          <Lock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
            Pilares de Protección Criptográfica Wolfric
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-colors">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Emulación de Navegador Nativo</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                El bot se identifica ante los servidores como Chrome Desktop oficial, sin alterar paquetes de protocolo ni firmas de cliente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-colors">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Control Inteligente de Rate Limiting</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cola de mensajes con micro-retrasos humanos (150ms-400ms) para evitar picos de spam o disparos del filtro heurístico de WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-colors">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Cifrado de Extremo a Extremo</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tus llaves de sesión y credenciales se guardan protegidas con hash criptográfico en memoria RAM y nunca se comparten con terceros.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-colors">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Reconexión Automática sin Pérdida</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Si tu celular se queda sin batería temporalmente, el SubBot espera la reconexión sin forzar el re-escaneo de código.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { DirectLinkBotSection } from './components/DirectLinkBotSection.js';
import { OfficialCommandsSection } from './components/OfficialCommandsSection.js';
import { AntiBanGuideSection } from './components/AntiBanGuideSection.js';
import { MemeEasterEggsSection } from './components/MemeEasterEggsSection.js';
import { OwnerDashboard } from './components/OwnerDashboard.js';
import { WolfricLogo } from './components/WolfricLogo.js';
import { AnimatedBackground } from './components/AnimatedBackground.js';
import { getPlatformStatus, getMySubBot, ownerLogin } from './api.js';
import type { SubBotInstance } from './types.js';
import { Lock, Eye, EyeOff, ShieldCheck, X, RefreshCw, KeyRound } from 'lucide-react';
import { playKeyClick, playAccessGranted, playAccessDenied } from './utils/audioFeedback.js';
import { useNotifications } from './components/NotificationSystem.js';

export default function App() {
  const { notify } = useNotifications();
  const [currentTab, setCurrentTab] = useState<'link' | 'commands' | 'antiban' | 'memes' | 'owner'>('link');

  // User session state
  const [userToken, setUserToken] = useState<string>(() => localStorage.getItem('wolfric_user_token') || '');
  const [myInstance, setMyInstance] = useState<SubBotInstance | null>(null);

  // Hidden Admin Login Modal State ("botón oculto abajo q no se va si no q tocas ahí")
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Platform public status
  const [platformStatus, setPlatformStatus] = useState<any>(null);

  // Fetch platform status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getPlatformStatus();
        setPlatformStatus(res);
      } catch {
        // ignore
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user instance if token exists
  useEffect(() => {
    if (!userToken) {
      setMyInstance(null);
      return;
    }

    const loadUserInstance = async () => {
      try {
        const res = await getMySubBot(userToken);
        setMyInstance(res.instance);
      } catch {
        // Token invalid or expired
        localStorage.removeItem('wolfric_user_token');
        setUserToken('');
        setMyInstance(null);
      }
    };

    loadUserInstance();
  }, [userToken]);

  const handleSubBotLinked = (instance: SubBotInstance, token: string, userPin: string) => {
    localStorage.setItem('wolfric_user_token', token);
    setUserToken(token);
    setMyInstance(instance);
  };

  const handleUserLogout = () => {
    localStorage.removeItem('wolfric_user_token');
    setUserToken('');
    setMyInstance(null);
  };

  // Hidden admin login handler ("pipunpan entras")
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    setAdminLoggingIn(true);
    setAdminError(null);
    playKeyClick();

    try {
      const res = await ownerLogin(adminPassword.trim());
      localStorage.setItem('wolfric_owner_token', res.token);
      playAccessGranted();
      setShowAdminModal(false);
      setAdminPassword('');
      setCurrentTab('owner'); // pipunpan entras!
      notify({
        title: 'Panel Propietario Desbloqueado',
        message: 'Acceso seguro concedido al panel central de administración Wolfric.',
        type: 'bot_event',
      });
    } catch (err: any) {
      playAccessDenied();
      setAdminError(err.message || 'Contraseña de administrador incorrecta.');
      notify({
        title: 'Acceso Denegado',
        message: 'Contraseña de administración inválida.',
        type: 'error',
      });
    } finally {
      setAdminLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080c] text-slate-100 font-sans relative selection:bg-emerald-500/30 selection:text-white">
      {/* Formal Epic Dark Architectural Background */}
      <AnimatedBackground />

      {/* Global Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => setCurrentTab(tab)}
        hasActiveUserSession={Boolean(myInstance)}
        onLogout={handleUserLogout}
        isMaintenance={platformStatus?.maintenance}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {/* VISTA 1: VINCULACIÓN Y CONFIGURACIÓN DEL BOT */}
        {currentTab === 'link' && (
          <div className="animate-in fade-in duration-200">
            <DirectLinkBotSection
              currentInstance={myInstance}
              userToken={userToken}
              onSubBotLinked={handleSubBotLinked}
              onLogout={handleUserLogout}
              onNavigateToCommands={() => {
                setCurrentTab('commands');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* VISTA 2: CATÁLOGO OFICIAL DE COMANDOS */}
        {currentTab === 'commands' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
            <OfficialCommandsSection />
          </div>
        )}

        {/* VISTA 3: GUÍA DE PROTECCIÓN ANTI-BAN */}
        {currentTab === 'antiban' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
            <AntiBanGuideSection />
          </div>
        )}

        {/* VISTA 4: MEMES, SOUNDBOARD Y EASTER EGGS */}
        {currentTab === 'memes' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
            <MemeEasterEggsSection />
          </div>
        )}

        {/* VISTA 5: PANEL DE ADMINISTRADOR OCULTO (PROTEGIDO) */}
        {currentTab === 'owner' && (
          <OwnerDashboard onBack={() => setCurrentTab('link')} />
        )}
      </main>

      {/* MODAL DE ACCESO ADMINISTRATIVO OCULTO */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bento-modal rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminError(null);
                setAdminPassword('');
              }}
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer absolute top-5 right-5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Acceso Propietario</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa la clave maestra para acceder a la consola central.
              </p>
            </div>

            {adminError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Clave maestra"
                    required
                    autoFocus
                    className="w-full glass-input px-4 py-3 pr-11 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoggingIn}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {adminLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-950" />
                )}
                <span>{adminLoggingIn ? 'Verificando...' : 'Ingresar a Consola'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Footer (Formal, Epic & Modern with Hidden Admin Trigger and Names Only) */}
      <footer className="border-t border-[#181c26] bg-[#090b10] py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WolfricLogo size="sm" showSubtitle={false} />
            <span className="text-[11px] text-slate-400">
              Plataforma Oficial Multi-Device • Baileys Engine
            </span>
          </div>

          {/* Creators Names Only as explicitly requested:
              "los tops quitalo y los créditos también solo deja los nombres abajo en la web" */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Creadores:</span>
            <span className="font-semibold text-slate-200">wolfric_19</span>
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-slate-200">The L</span>
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-slate-200">zerrDMC_</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Wolfric. Todos los derechos reservados.</span>

            {/* Hidden Admin Access Trigger ("lo de ADMINs ponlo un botón oculto abajo q no se va si no q tocas ahí y te sale para poner la contraseña y pipunpan entras") */}
            <button
              id="hidden-admin-trigger"
              onClick={() => setShowAdminModal(true)}
              title="Consola de Seguridad"
              className="p-1 rounded text-slate-700 hover:text-slate-400 hover:bg-[#141822] transition-colors cursor-pointer opacity-70 hover:opacity-100"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

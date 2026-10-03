import React, { useState } from 'react';
import { WolfricLogo } from './WolfricLogo.js';
import {
  Smartphone,
  LogOut,
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useNotifications, NotificationCenterModal } from './NotificationSystem.js';
import { isAudioEnabled, setAudioEnabled, playSharePop, playKeyClick } from '../utils/audioFeedback.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: 'link' | 'commands' | 'antiban' | 'memes' | 'owner') => void;
  hasActiveUserSession: boolean;
  onLogout?: () => void;
  isMaintenance?: boolean;
}

export function Navbar({
  currentTab,
  setCurrentTab,
  hasActiveUserSession,
  onLogout,
  isMaintenance = false,
}: NavbarProps) {
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [audioEnabled, setAudioState] = useState(isAudioEnabled());

  const handleToggleSound = () => {
    const next = !audioEnabled;
    setAudioState(next);
    setAudioEnabled(next);
    if (next) playSharePop(3);
  };

  const navItems = [
    {
      id: 'link' as const,
      label: hasActiveUserSession ? 'Mi SubBot' : 'Vincular Bot',
      icon: Smartphone,
    },
    {
      id: 'commands' as const,
      label: 'Catálogo de Comandos',
      icon: Terminal,
    },
    {
      id: 'antiban' as const,
      label: 'Guía Anti-Ban',
      icon: ShieldCheck,
    },
    {
      id: 'memes' as const,
      label: 'Zona Especial',
      icon: Sparkles,
    },
  ];

  const handleNavClick = (tabId: 'link' | 'commands' | 'antiban' | 'memes') => {
    playKeyClick();
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07080c]/90 backdrop-blur-xl transition-all">
      {isMaintenance && (
        <div className="w-full bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Plataforma en Mantenimiento Programado</span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Logo */}
        <div
          onClick={() => handleNavClick('link')}
          className="cursor-pointer transition-opacity hover:opacity-90 flex items-center shrink-0"
        >
          <WolfricLogo size="md" />
        </div>

        {/* Zone 2: Desktop Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white/[0.12] text-white shadow-sm border border-emerald-400/40 text-emerald-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & Mobile Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-white/[0.04] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                : 'bg-white/[0.02] border-white/[0.08] text-slate-500 hover:text-slate-300'
            }`}
            title={audioEnabled ? 'Silenciar audio' : 'Activar audio'}
            aria-label="Alternar audio"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifModal(true)}
            className="relative p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Centro de notificaciones"
            aria-label="Notificaciones"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-bold text-slate-950 shadow-[0_0_8px_#34d399]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Active Session Status / Logout or Primary Link CTA */}
          {hasActiveUserSession ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleNavClick('link')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Panel Activo</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('link')}
              className="hidden sm:flex px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs tracking-tight hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Vincular Ahora</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#07080c]/98 px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.1] text-white border border-emerald-400/40 text-emerald-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}

          {!hasActiveUserSession && (
            <div className="pt-2">
              <button
                onClick={() => handleNavClick('link')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Vincular WhatsApp Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {showNotifModal && <NotificationCenterModal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} />}
    </header>
  );
}


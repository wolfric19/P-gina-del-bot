import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { playAccessGranted, playAccessDenied, playKeyClick, isAudioEnabled, setAudioEnabled } from '../utils/audioFeedback.js';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'bot_event';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read?: boolean;
  autoClose?: boolean;
  isToastDismissed?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  browserPermission: NotificationPermission;
  requestBrowserPermission: () => Promise<boolean>;
  notify: (opts: {
    title: string;
    message: string;
    type?: NotificationType;
    autoClose?: boolean;
    duration?: number;
    actionLabel?: string;
    onAction?: () => void;
  }) => string;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('wolfric_notifications_history');
      return saved ? JSON.parse(saved).slice(0, 30) : [];
    } catch {
      return [];
    }
  });

  const [sound, setSound] = useState<boolean>(() => isAudioEnabled());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Persist notifications history
  useEffect(() => {
    try {
      localStorage.setItem('wolfric_notifications_history', JSON.stringify(notifications.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [notifications]);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setAudioEnabled(next);
    if (next) playKeyClick();
  };

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      return perm === 'granted';
    } catch {
      return false;
    }
  };

  const notify = useCallback(
    ({
      title,
      message,
      type = 'info',
      autoClose = true,
      duration = 5500,
      actionLabel,
      onAction,
    }: {
      title: string;
      message: string;
      type?: NotificationType;
      autoClose?: boolean;
      duration?: number;
      actionLabel?: string;
      onAction?: () => void;
    }) => {
      const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newNotif: AppNotification = {
        id,
        title,
        message,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        read: false,
        autoClose,
        actionLabel,
        onAction,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Sound feedback
      if (sound) {
        if (type === 'success' || type === 'bot_event') {
          playAccessGranted();
        } else if (type === 'error') {
          playAccessDenied();
        } else {
          playKeyClick();
        }
      }

      // Native browser notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      }

      // Auto dismissal from toast container
      if (autoClose) {
        setTimeout(() => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, autoClose: false, isToastDismissed: true } : n))
          );
        }, duration);
      }

      return id;
    },
    [sound]
  );

  const dismissToast = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isToastDismissed: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled: sound,
        toggleSound,
        browserPermission,
        requestBrowserPermission,
        notify,
        removeNotification,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
      <ToastContainer notifications={notifications} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}

// Fixed Toast overlay in top-right corner
function ToastContainer({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}) {
  // Only display the 4 most recent active toasts that are not dismissed
  const activeToasts = notifications.filter((n) => !n.isToastDismissed).slice(0, 4);

  if (activeToasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificaciones del sistema"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform-gpu ${
            toast.type === 'success'
              ? 'bg-[#0d1614]/95 border-emerald-500/40 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.15)]'
              : toast.type === 'error'
              ? 'bg-[#180e12]/95 border-rose-500/40 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.15)]'
              : toast.type === 'warning'
              ? 'bg-[#18130c]/95 border-amber-500/40 text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.15)]'
              : toast.type === 'bot_event'
              ? 'bg-[#0b171c]/95 border-cyan-400/50 text-cyan-100 shadow-[0_10px_30px_rgba(6,182,212,0.18)]'
              : 'bg-[#0b0e17]/95 border-white/[0.1] text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
          }`}
        >
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'bot_event' && <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h4 className="text-xs font-bold tracking-tight text-white truncate font-display">{toast.title}</h4>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">{toast.timestamp}</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug break-words">{toast.message}</p>

            {toast.actionLabel && toast.onAction && (
              <button
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="mt-2 text-[11px] font-bold text-emerald-400 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{toast.actionLabel}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </aside>
  );
}

// Notification Center Dropdown / Drawer Modal for Navbar
export function NotificationCenterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    removeNotification,
    soundEnabled,
    toggleSound,
    browserPermission,
    requestBrowserPermission,
    notify,
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/70 backdrop-blur-sm pt-20 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bento-modal p-6 shadow-2xl relative flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 id="notification-center-title" className="text-sm font-bold text-white font-display">
                Centro de Notificaciones
              </h3>
              <p className="text-[10px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:border-emerald-400/40 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Permission Banner (if not granted) */}
        {browserPermission !== 'granted' && (
          <div className="mb-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 text-[11px]">¿Recibir avisos en tu teléfono/navegador?</span>
            <button
              onClick={async () => {
                const granted = await requestBrowserPermission();
                if (granted) {
                  notify({
                    title: '¡Notificaciones activadas!',
                    message: 'Recibirás avisos en tiempo real cuando tu SubBot se vincule o reciba mensajes.',
                    type: 'success',
                  });
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-[11px] cursor-pointer shrink-0 transition-all hover:brightness-110"
            >
              Activar
            </button>
          </div>
        )}

        {/* Actions bar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between py-1 mb-2 text-[11px] text-slate-400">
            <button
              onClick={markAllAsRead}
              className="hover:text-emerald-400 cursor-pointer transition-colors"
            >
              Marcar todo como leído
            </button>
            <button
              onClick={clearAll}
              className="hover:text-rose-400 cursor-pointer transition-colors"
            >
              Borrar historial
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p>No tienes notificaciones en este momento.</p>
              <p className="text-[10px] text-slate-600 mt-1">Los eventos de tu bot y del sistema aparecerán aquí.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all text-xs relative group ${
                  item.read
                    ? 'bg-white/[0.01] border-white/[0.05] text-slate-400'
                    : 'bg-white/[0.04] border-white/[0.1] text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.type === 'success'
                          ? 'bg-emerald-400'
                          : item.type === 'error'
                          ? 'bg-rose-400'
                          : item.type === 'warning'
                          ? 'bg-amber-400'
                          : item.type === 'bot_event'
                          ? 'bg-[#c5a059]'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                </div>
                <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">{item.message}</p>
                <button
                  onClick={() => removeNotification(item.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white transition-opacity cursor-pointer"
                  title="Eliminar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

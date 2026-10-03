import React, { useState } from 'react';
import {
  Users,
  Search,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Coins,
  Gem,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  Copy,
  Check,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { LidUserProfile, BackupUploadResult } from '../types.js';
import { BackupUploaderModal } from './BackupUploaderModal.js';
import { uploadOwnerBackupFile, createOwnerLidUser, deleteOwnerLidUser } from '../api.js';

interface LidsManagerSectionProps {
  ownerKey: string;
  users: LidUserProfile[];
  stats?: {
    totalUsers: number;
    registeredUsers: number;
    totalCoins: number;
    totalBank: number;
    activeLids: number;
  };
  onRefresh: () => void;
  onShowNotice: (notice: { type: 'success' | 'error'; text: string }) => void;
  onGoToAiEditor?: () => void;
}

export function LidsManagerSection({
  ownerKey,
  users,
  stats,
  onRefresh,
  onShowNotice,
  onGoToAiEditor,
}: LidsManagerSectionProps) {
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<LidUserProfile | null>(null);
  const [copiedLid, setCopiedLid] = useState<string | null>(null);

  // Form states for manual user creation / editing
  const [formPhone, setFormPhone] = useState('');
  const [formName, setFormName] = useState('');
  const [formLid, setFormLid] = useState('');
  const [formLevel, setFormLevel] = useState(1);
  const [formExp, setFormExp] = useState(100);
  const [formCoins, setFormCoins] = useState(1000);
  const [formBank, setFormBank] = useState(5000);
  const [formDiamonds, setFormDiamonds] = useState(5);
  const [formRole, setFormRole] = useState('Guerrero Wolfric');
  const [formRegistered, setFormRegistered] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // Copy LID helper
  const handleCopyLid = (lid: string) => {
    navigator.clipboard.writeText(lid);
    setCopiedLid(lid);
    setTimeout(() => setCopiedLid(null), 2000);
  };

  // Open Edit Modal
  const handleEdit = (u: LidUserProfile) => {
    setEditingUser(u);
    setFormPhone(u.phone);
    setFormName(u.name);
    setFormLid(u.lid);
    setFormLevel(u.level);
    setFormExp(u.exp);
    setFormCoins(u.coins);
    setFormBank(u.bank);
    setFormDiamonds(u.diamonds);
    setFormRole(u.role);
    setFormRegistered(u.registered);
    setShowUserModal(true);
  };

  // Open New User Modal
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setFormPhone('');
    setFormName('');
    setFormLid('');
    setFormLevel(1);
    setFormExp(100);
    setFormCoins(1000);
    setFormBank(5000);
    setFormDiamonds(5);
    setFormRole('Aventurero Wolfric');
    setFormRegistered(true);
    setShowUserModal(true);
  };

  // Save manual user
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await createOwnerLidUser(ownerKey, {
        id: editingUser?.id,
        phone: formPhone,
        name: formName || `Usuario +${formPhone}`,
        lid: formLid || `${formPhone}@lid`,
        level: Number(formLevel),
        exp: Number(formExp),
        coins: Number(formCoins),
        bank: Number(formBank),
        diamonds: Number(formDiamonds),
        role: formRole,
        registered: formRegistered,
      });

      onShowNotice({
        type: 'success',
        text: editingUser ? 'Usuario y progreso LID actualizados.' : 'Nuevo usuario con LID registrado en la nube.',
      });
      setShowUserModal(false);
      onRefresh();
    } catch (err: any) {
      onShowNotice({ type: 'error', text: err.message || 'Error al guardar usuario' });
    } finally {
      setSavingUser(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (u: LidUserProfile) => {
    try {
      await deleteOwnerLidUser(ownerKey, u.id);
      onShowNotice({ type: 'success', text: `Usuario ${u.name} eliminado del registro.` });
      onRefresh();
    } catch (err: any) {
      onShowNotice({ type: 'error', text: err.message || 'Error al eliminar usuario' });
    }
  };

  // Export database safely without window.open
  const handleExport = () => {
    const a = document.createElement('a');
    a.href = `/api/owner/lids/export?passcode=${encodeURIComponent(ownerKey)}`;
    a.setAttribute('download', 'wolfric-lids-database.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.lid.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <h3 className="text-lg font-bold text-white tracking-tight font-display">
              Base de Datos de LIDs &amp; Progreso Cloud
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              Synced
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Sube copias de seguridad (.zip / database.json) para que los usuarios conserven sus niveles, monedas, gemas y LIDs sin pérdida de datos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onGoToAiEditor && (
            <button
              onClick={onGoToAiEditor}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Mantenimiento Co-Admin</span>
            </button>
          )}

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Subir Backup</span>
          </button>

          <button
            onClick={handleOpenNewUser}
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Registrar LID</span>
          </button>

          <button
            onClick={handleExport}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Descargar base de datos completa en JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner Bento Card */}
      <div className="bento-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white">Privacidad de Usuarios Resguardada:</strong> Los LIDs (`@lid`), números telefónicos y balances son datos privados resguardados en este apartado exclusivo para administradores autenticados.
          </span>
        </div>
        {onGoToAiEditor && (
          <button
            onClick={onGoToAiEditor}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 cursor-pointer self-end sm:self-auto transition-colors"
          >
            <span>Mantenimiento y Control de Base de Datos</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bento-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">LIDs en la Nube</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono tabular-nums">{stats?.activeLids ?? users.length}</span>
          <span className="text-[10px] text-cyan-400 block mt-1 font-medium">Reconocidos automáticamente</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">Usuarios Registrados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
            {stats?.registeredUsers ?? users.filter((u) => u.registered).length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium">Con progreso activo</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">Monedas en Circulación</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-300 font-mono tabular-nums">
            {(stats?.totalCoins ?? users.reduce((acc, u) => acc + (u.coins || 0), 0)).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium">Economía del Bot</span>
        </div>

        <div className="bento-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">Banco Central Cloud</span>
            <Gem className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-2xl font-black text-teal-300 font-mono tabular-nums">
            {(stats?.totalBank ?? users.reduce((acc, u) => acc + (u.bank || 0), 0)).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 font-medium">Fondos acumulados</span>
        </div>
      </div>

      {/* Search and Table Bento Card */}
      <div className="bento-card p-5 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, número de WhatsApp, LID o rango..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-500 transition-all font-mono"
            />
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Mostrando <strong className="text-white">{filteredUsers.length}</strong> de {users.length} usuarios
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
            <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">No hay usuarios que coincidan con la búsqueda</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
              Sube un archivo de backup (.zip o database.json) para cargar masivamente los progresos de tus usuarios de WhatsApp.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
            >
              Subir Archivo de Backup Ahora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white/[0.02]">
                  <th className="py-3 px-3">Usuario & Teléfono</th>
                  <th className="py-3 px-3">WhatsApp LID</th>
                  <th className="py-3 px-3 text-center">Nivel & Rango</th>
                  <th className="py-3 px-3 text-right">Monedas / Banco</th>
                  <th className="py-3 px-3">Origen</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">+{u.phone || 'Sin número'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 max-w-xs truncate">
                        <span className="truncate">{u.lid}</span>
                        <button
                          onClick={() => handleCopyLid(u.lid)}
                          className="text-slate-400 hover:text-white shrink-0 ml-1 cursor-pointer"
                          title="Copiar LID"
                        >
                          {copiedLid === u.lid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[11px] font-bold text-amber-300 mb-0.5 font-mono">
                        ⭐ Nivel {u.level}
                      </span>
                      <div className="text-[10px] text-slate-400">{u.role}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-emerald-400 tabular-nums">{u.coins.toLocaleString()} 🪙</div>
                      <div className="text-[10px] text-slate-400 tabular-nums">Banco: {u.bank.toLocaleString()}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block max-w-[140px] truncate text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-400 font-mono">
                        {u.sourceBackup || 'Nube'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Editar usuario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Backup Modal */}
      <BackupUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(res) => {
          onShowNotice({
            type: 'success',
            text: `¡Backup procesado! ${res.usersImportedCount} usuarios y LIDs sincronizados en la nube.`,
          });
          onRefresh();
        }}
        onUpload={(payload) => uploadOwnerBackupFile(ownerKey, payload)}
        title="Subir Archivo de Copia de Seguridad de Usuarios (.zip / .json)"
      />

      {/* Manual User Add / Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bento-card rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white font-display">
                {editingUser ? 'Editar Progreso de Usuario' : 'Registrar Nuevo Usuario / LID'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre o PushName</label>
                <input
                  type="text"
                  placeholder="Ej. Wolfric"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej. 5569981026602"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp LID</label>
                  <input
                    type="text"
                    placeholder="Ej. 109876543210@lid"
                    value={formLid}
                    onChange={(e) => setFormLid(e.target.value)}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 placeholder:text-slate-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nivel RPG</label>
                  <input
                    type="number"
                    min={1}
                    value={formLevel}
                    onChange={(e) => setFormLevel(Number(e.target.value))}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">EXP</label>
                  <input
                    type="number"
                    min={0}
                    value={formExp}
                    onChange={(e) => setFormExp(Number(e.target.value))}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monedas</label>
                  <input
                    type="number"
                    min={0}
                    value={formCoins}
                    onChange={(e) => setFormCoins(Number(e.target.value))}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Banco</label>
                  <input
                    type="number"
                    min={0}
                    value={formBank}
                    onChange={(e) => setFormBank(Number(e.target.value))}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Diamantes</label>
                  <input
                    type="number"
                    min={0}
                    value={formDiamonds}
                    onChange={(e) => setFormDiamonds(Number(e.target.value))}
                    className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rango / Título</label>
                <input
                  type="text"
                  placeholder="Ej. Guerrero Wolfric"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full bg-[#090c14] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  {savingUser ? 'Guardando...' : 'Guardar en la Nube'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

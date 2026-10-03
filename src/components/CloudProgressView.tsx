import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Search,
  Coins,
  Lock,
  ShieldCheck,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Gem,
  Award,
  Layers,
  ArrowRight,
  Check,
  Copy,
} from 'lucide-react';
import { uploadOwnerBackupFile } from '../api.js';

interface CloudProgressStats {
  totalUsers: number;
  registeredUsers: number;
  totalCoins: number;
  totalBank: number;
  activeLids: number;
}

export function CloudProgressView({
  onGoToAdmin,
}: {
  onGoToAdmin: () => void;
}) {
  const [stats, setStats] = useState<CloudProgressStats>({
    totalUsers: 0,
    registeredUsers: 0,
    totalCoins: 0,
    totalBank: 0,
    activeLids: 0,
  });
  const [sampleUsers, setSampleUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adminPasscode, setAdminPasscode] = useState(() => localStorage.getItem('wolfric_owner_token') || '');
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/progress/public-stats');
      const data = await res.json();
      if (data.status === 'ok') {
        setStats(data.stats);
        setSampleUsers(data.sampleUsers || []);
      }
    } catch {
      // silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/progress/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setSearchResult(data.user);
      } else {
        setSearchError(data.error || 'No se encontró progreso para este ID.');
      }
    } catch {
      setSearchError('Error al consultar el servidor.');
    } finally {
      setSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const lower = f.name.toLowerCase();
      if (!lower.endsWith('.json') && !lower.endsWith('.zip') && !lower.endsWith('.tar.gz')) {
        setUploadFeedback({
          type: 'error',
          text: 'Formato no soportado. Sube un archivo .json o .zip con la base de datos de usuarios.',
        });
        return;
      }
      setSelectedFile(f);
      setUploadFeedback(null);
    }
  };

  const handleUploadBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadFeedback({ type: 'error', text: 'Selecciona un archivo de progreso (.json o .zip).' });
      return;
    }
    if (!adminPasscode.trim()) {
      setUploadFeedback({
        type: 'error',
        text: 'Introduce la Clave de Administrador para autorizar la subida a la nube.',
      });
      return;
    }

    setUploading(true);
    setUploadFeedback(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const fileBase64 = await base64Promise;

      const result = await uploadOwnerBackupFile(adminPasscode.trim(), {
        filename: selectedFile.name,
        fileBase64,
        notes: 'Progreso de la gente subido a la nube de Wolfric.',
      });

      // Save token for future uploads
      localStorage.setItem('wolfric_owner_token', adminPasscode.trim());

      setUploadFeedback({
        type: 'success',
        text: `¡Progreso sincronizado con éxito! Se cargaron ${result.usersImportedCount} usuarios/LIDs en la nube.`,
      });
      setSelectedFile(null);
      fetchStats();
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        text: err.message || 'Error al autorizar la subida. Verifica la clave de administrador.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header section */}
      <div className="border-b border-slate-800 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Base de Datos Persistente</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Progreso de Usuarios en la Nube
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Guarda, restaura y protege las monedas, bancos, diamantes y LIDs de todos los miembros para que nunca se pierda su progreso.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={onGoToAdmin}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Panel Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards - Clean Slate / Emerald */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Usuarios en Nube</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalUsers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.registeredUsers} registrados oficiales
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Monedas Globales</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {stats.totalCoins.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Monedas protegidas
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>Fondos en Banco</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalBank.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Bancos asegurados
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-medium">
            <span>LIDs Únicos</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats.activeLids.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Identificadores activos
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Upload Section & Search / Check Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Progress File to Cloud (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl bg-slate-800/90 border border-slate-700">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Subir Progreso / Base de Datos a la Nube</span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Sube el archivo de base de datos de tu bot (<code className="text-slate-300">.json</code> o <code className="text-slate-300">.zip</code>). El sistema procesará automáticamente monedas, banco, LIDs y niveles de cada usuario.
            </p>

            {uploadFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-start gap-2 ${
                  uploadFeedback.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                }`}
              >
                {uploadFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{uploadFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleUploadBackup} className="space-y-4">
              {/* File input box */}
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-colors bg-slate-900/50">
                <input
                  type="file"
                  id="backup-file-input"
                  accept=".json,.zip,.tar.gz"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="backup-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-8 h-8 text-slate-400" />
                  {selectedFile ? (
                    <div>
                      <span className="text-sm font-semibold text-emerald-400 block">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({(selectedFile.size / 1024).toFixed(1)} KB) - Haz clic para cambiar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-semibold text-slate-200 block">
                        Selecciona tu archivo de base de datos (.json o .zip)
                      </span>
                      <span className="text-xs text-slate-400">
                        Compatible con JSON de usuarios, database.json o backups comprimidos
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Admin Protection Field */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/80">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clave de Administrador (Protección de la Nube)</span>
                </label>
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Introduce la clave de administrador..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Solo los administradores autorizados pueden subir o actualizar el progreso global en la nube.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Sincronizando con la nube...' : 'Subir Progreso a la Nube'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cloud Export Notice */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">¿Necesitas una copia local?</h4>
                <p className="text-[11px] text-slate-400">
                  Descarga la base de datos completa de usuarios en formato JSON desde el Panel de Administrador.
                </p>
              </div>
            </div>
            <button
              onClick={onGoToAdmin}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium shrink-0 transition-colors"
            >
              Exportar
            </button>
          </div>
        </div>

        {/* Right Column: Search User Progress by LID or Phone (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl bg-slate-800/90 border border-slate-700">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Consultar Progreso de Usuario</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Busca cualquier usuario por su LID o número de WhatsApp para verificar su saldo y nivel guardado.
            </p>

            <form onSubmit={handleSearch} className="space-y-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: lid-5959... o +5569..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {searching ? '...' : 'Buscar'}
                </button>
              </div>
            </form>

            {searchError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{searchResult.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{searchResult.phone}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {searchResult.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">LID de WhatsApp</span>
                    <span className="font-mono text-emerald-400 text-[11px] truncate block">
                      {searchResult.lid}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Nivel / EXP</span>
                    <span className="font-bold text-white">
                      Nivel {searchResult.level} ({searchResult.exp} exp)
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Monedas en Mano</span>
                    <span className="font-bold text-amber-300">
                      🪙 {searchResult.coins.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Saldo en Banco</span>
                    <span className="font-bold text-white">
                      🏦 {searchResult.bank.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>💎 Diamantes: <b>{searchResult.diamonds}</b></span>
                  <span>{searchResult.registered ? '✅ Registrado Oficial' : '⏳ No registrado'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sample recent users registered */}
          <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center justify-between">
              <span>Últimos Perfiles Sincronizados</span>
              <span className="text-[10px] text-slate-400 font-normal">{stats.totalUsers} en total</span>
            </h4>
            {sampleUsers.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Aún no hay usuarios en la nube. Sube tu primer archivo de base de datos a la izquierda.
              </p>
            ) : (
              <div className="space-y-2">
                {sampleUsers.slice(0, 5).map((u, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-200 block truncate">{u.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {u.lid ? `${u.lid.slice(0, 14)}...` : u.phone}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-amber-300 block">
                        🪙 {u.coins.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Nv. {u.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

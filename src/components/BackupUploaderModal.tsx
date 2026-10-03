import React, { useState, useRef } from 'react';
import {
  Upload,
  FileArchive,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Users,
  Database,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { BackupUploadResult } from '../types.js';

interface BackupUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BackupUploadResult) => void;
  onUpload: (payload: {
    filename: string;
    fileBase64: string;
    isVersion?: boolean;
    versionTitle?: string;
    notes?: string;
    isLatest?: boolean;
  }) => Promise<BackupUploadResult>;
  title?: string;
  defaultIsVersion?: boolean;
}

export function BackupUploaderModal({
  isOpen,
  onClose,
  onSuccess,
  onUpload,
  title = 'Subir Archivo de Backup o Actualización a la Nube',
  defaultIsVersion = false,
}: BackupUploaderModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVersion, setIsVersion] = useState(defaultIsVersion);
  const [versionTitle, setVersionTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isLatest, setIsLatest] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackupUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setError(null);
    setResult(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.zip') && !lower.endsWith('.json') && !lower.endsWith('.tar.gz') && !lower.endsWith('.wzb')) {
      setError('Por favor selecciona un archivo comprimido (.zip, .tar.gz) o base de datos (.json).');
      return;
    }
    setSelectedFile(file);

    // Smart guessing of version title
    if (!versionTitle) {
      if (lower.includes('3.') || lower.includes('v3') || lower.includes('core')) {
        setIsVersion(true);
        const match = file.name.match(/v?[0-9]+\.[0-9]+(\.[0-9]+)?/i);
        if (match) {
          setVersionTitle(`Wolfric ${match[0].replace(/^v/i, '')}`);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Debes seleccionar o arrastrar un archivo.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Read file to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(selectedFile);
      const fileBase64 = await base64Promise;

      const res = await onUpload({
        filename: selectedFile.name,
        fileBase64,
        isVersion,
        versionTitle: isVersion ? versionTitle || selectedFile.name : undefined,
        notes: notes || undefined,
        isLatest,
      });

      setResult(res);
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Error al subir y procesar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bento-modal rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">{title}</h3>
              <p className="text-xs text-slate-400">
                Soporta archivos .zip, .json, database.json con usuarios y LIDs registrados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {result ? (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>¡Copia de seguridad procesada y guardada en la nube!</span>
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">{result.message}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                  <span className="text-[10px] text-emerald-400/80 block uppercase font-mono">Usuarios Importados</span>
                  <span className="text-lg font-black text-white font-mono">{result.usersImportedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08]">
                  <span className="text-[10px] text-emerald-400/80 block uppercase font-mono">LIDs Reconocidos</span>
                  <span className="text-lg font-black text-emerald-300 font-mono">{result.lidsRecognizedCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-emerald-400/80 block uppercase font-mono">Peso Guardado</span>
                  <span className="text-lg font-black text-white font-mono">{result.fileSize}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setResult(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Subir Otro Archivo
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : selectedFile
                  ? 'border-emerald-400/50 bg-emerald-500/[0.05]'
                  : 'border-white/[0.12] hover:border-emerald-400/40 bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.json,.tar.gz,.wzb"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    {selectedFile.name.endsWith('.zip') ? (
                      <FileArchive className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{selectedFile.name}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                      {formatBytes(selectedFile.size)} • Listo para procesar
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 underline">Haz clic para cambiar archivo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1 border border-emerald-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Arrastra tu archivo <strong className="text-emerald-300">.zip</strong> o{' '}
                    <strong className="text-emerald-300">database.json</strong> aquí
                  </span>
                  <span className="text-[11px] text-slate-500">o haz clic para explorar en tu dispositivo</span>
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label
                onClick={() => setIsVersion(false)}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  !isVersion
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <span className="text-xs font-bold block text-white">Backup de Progreso LID</span>
                  <span className="text-[10px] text-slate-400 block">Restaura usuarios, niveles y monedas</span>
                </div>
              </label>

              <label
                onClick={() => setIsVersion(true)}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  isVersion
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]'
                }`}
              >
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="text-left">
                  <span className="text-xs font-bold block text-white">Actualización de Wolfric</span>
                  <span className="text-[10px] text-slate-400 block">Nueva versión de código ejecutable</span>
                </div>
              </label>
            </div>

            {/* Version title if isVersion */}
            {isVersion && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre o Etiqueta de la Versión
                </label>
                <input
                  type="text"
                  placeholder="Ej. Wolfric 3.3.0 Oficial"
                  value={versionTitle}
                  onChange={(e) => setVersionTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notas / Descripción (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Backup de usuarios de WhatsApp antes de migración a la nube"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Submit buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 border border-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Subiendo a la nube...</span>
                  </>
                ) : (
                  <>
                    <span>Guardar y Procesar en la Nube</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Sparkles,
  FileCode,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Database,
  ArrowRight,
  ShieldAlert,
  Wand2,
  Code2,
  FileCheck,
} from 'lucide-react';
import { improveFileWithAi, applyAiToDatabase } from '../api.js';
import type { AiImproveResult } from '../api.js';

interface AiFileEditorSectionProps {
  ownerKey: string;
  cloudUsersCount: number;
  onDatabaseUpdated?: () => void;
  onShowNotice: (notice: { type: 'success' | 'error'; text: string }) => void;
}

export function AiFileEditorSection({
  ownerKey,
  cloudUsersCount,
  onDatabaseUpdated,
  onShowNotice,
}: AiFileEditorSectionProps) {
  const [filename, setFilename] = useState('wolfric-database.json');
  const [content, setContent] = useState('');
  const [taskType, setTaskType] = useState<'clean_duplicates' | 'balance_economy' | 'fix_syntax' | 'rpg_upgrade' | 'custom'>('clean_duplicates');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<AiImproveResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('clean_duplicates');

  // Load current cloud database into editor
  const handleLoadCurrentDatabase = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owner/lids/export', {
        headers: { 'x-owner-key': ownerKey },
      });
      if (!res.ok) throw new Error('No se pudo exportar la base de datos actual');
      const text = await res.text();
      setContent(text);
      setFilename(`wolfric-db-actual-${new Date().toISOString().split('T')[0]}.json`);
      setResult(null);
      onShowNotice({
        type: 'success',
        text: `Base de datos actual cargada en el editor (${cloudUsersCount} usuarios).`,
      });
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error cargando la base de datos actual.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setResult(null);
      onShowNotice({
        type: 'success',
        text: `Archivo "${file.name}" cargado en el editor (${(file.size / 1024).toFixed(1)} KB).`,
      });
    };
    reader.readAsText(file);
  };

  // Run AI improvement
  const handleRunAi = async () => {
    if (!content.trim()) {
      onShowNotice({
        type: 'error',
        text: 'Carga o pega primero el contenido del archivo a mejorar.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await improveFileWithAi(ownerKey, {
        filename,
        content,
        taskType,
        customPrompt: taskType === 'custom' ? customPrompt : undefined,
      });

      setResult(res.result);
      onShowNotice({
        type: 'success',
        text: '¡Archivo procesado y mejorado con éxito por la IA!',
      });
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error al procesar el archivo con la IA.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply improved content directly to the Cloud database
  const handleApplyToCloud = async () => {
    if (!result?.improvedContent) return;

    setApplying(true);
    try {
      const res = await applyAiToDatabase(ownerKey, result.improvedContent);
      onShowNotice({
        type: 'success',
        text: res.message || '¡Cambios aplicados con éxito a la base de datos!',
      });
      if (onDatabaseUpdated) {
        onDatabaseUpdated();
      }
    } catch (err: any) {
      onShowNotice({
        type: 'error',
        text: err.message || 'Error aplicando cambios a la nube.',
      });
    } finally {
      setApplying(false);
    }
  };

  // Download improved file
  const handleDownload = () => {
    const textToDownload = result ? result.improvedContent : content;
    if (!textToDownload) return;

    const blob = new Blob([textToDownload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result ? `mejorado-${filename}` : filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy code to clipboard
  const handleCopy = () => {
    const text = result ? result.improvedContent : content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                <span>IA Editor &amp; Optimizador de Base de Datos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  Gemini Flash
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Usa inteligencia artificial para limpiar duplicados de LIDs, balancear la economía RPG, reparar sintaxis JSON rota y mejorar los datos sin comprometer la privacidad.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleLoadCurrentDatabase}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cargar DB Actual ({cloudUsersCount})</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:brightness-110 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20">
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span>Subir Archivo</span>
              <input
                type="file"
                accept=".json,.js,.ts,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Task presets selector */}
        <div className="pt-4 border-t border-white/[0.08]">
          <label className="block text-xs font-semibold text-slate-300 mb-2.5">
            Selecciona la optimización que deseas aplicar:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                id: 'clean_duplicates',
                title: 'Limpiar LIDs Duplicados',
                desc: 'Consolida registros repetidos y normaliza identificadores.',
                icon: FileCheck,
              },
              {
                id: 'balance_economy',
                title: 'Balancear Economía',
                desc: 'Topes de monedas y banco, corrección de números corruptos.',
                icon: Database,
              },
              {
                id: 'fix_syntax',
                title: 'Reparar Sintaxis JSON',
                desc: 'Corrige comas, llaves rotas y formato ilegible.',
                icon: Code2,
              },
              {
                id: 'rpg_upgrade',
                title: 'Mejorar Roles & Niveles',
                desc: 'Asigna rangos Wolfric (Novato, Élite, Leyenda) por nivel.',
                icon: Wand2,
              },
              {
                id: 'custom',
                title: 'Instrucción Libre / Prompt',
                desc: 'Escribe tu propia orden personalizada para la IA.',
                icon: Sparkles,
              },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = taskType === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setTaskType(p.id as any);
                    setSelectedPreset(p.id);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400/60 text-white shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-100">{p.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Custom prompt input if 'custom' is selected */}
          {taskType === 'custom' && (
            <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/[0.08]">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ¿Qué deseas que la IA haga con este archivo?
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ej: Aumentar 100 diamantes a todos los usuarios registrados, eliminar usuarios sin teléfono..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#090c14] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Editor & Result Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input / Original content Bento Card */}
        <div className="bento-card p-6 rounded-3xl flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Archivo Original: <span className="font-mono text-emerald-400">{filename}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {content ? `${(Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1)} KB` : 'Vacío'}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Pega aquí el contenido JSON o presiona "Cargar DB Actual" o "Subir Archivo"...
Ejemplo:
[
  {
    "lid": "123456789@lid",
    "phone": "551199999999",
    "coins": 5000,
    "level": 3
  }
]`}
            className="flex-1 w-full p-3.5 rounded-2xl bg-[#090c14] border border-white/[0.08] text-slate-200 font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-emerald-400/50"
            spellCheck={false}
          />

          <div className="pt-3.5 mt-2 flex items-center justify-between border-t border-white/[0.08]">
            <button
              onClick={() => {
                setContent('');
                setResult(null);
              }}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer bg-white/[0.02] border border-white/[0.06]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>

            <button
              onClick={handleRunAi}
              disabled={loading || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer hover:brightness-110 active:scale-95"
            >
              <Sparkles className={`w-3.5 h-3.5 text-slate-950 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Procesando con IA...' : 'Mejorar con IA'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Improved Result Bento Card */}
        <div className="bento-card p-6 rounded-3xl flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                Resultado de la IA {result ? `(${result.taskApplied})` : ''}
              </span>
            </div>
            {result && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  result.isValidJson ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {result.isValidJson ? 'JSON Válido' : 'Texto Plano'}
                </span>
                <span className="text-slate-400 font-mono">
                  {(result.improvedSize / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>

          {result ? (
            <div className="flex-1 flex flex-col space-y-3 min-h-0">
              {/* Summary note box */}
              <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/30 text-xs">
                <span className="font-bold text-emerald-400 block mb-1">
                  Resumen de mejoras realizadas:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Improved code textarea */}
              <textarea
                readOnly
                value={result.improvedContent}
                className="flex-1 w-full p-3.5 rounded-2xl bg-[#090c14] border border-white/[0.08] text-slate-200 font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
              <Sparkles className="w-8 h-8 text-slate-600 mb-3" />
              <span className="text-xs font-semibold text-slate-300">
                Aún no has generado mejoras
              </span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                Selecciona una optimización en la parte superior y haz clic en &quot;Mejorar con IA&quot; para ver el resultado aquí.
              </p>
            </div>
          )}

          {/* Action buttons at bottom */}
          <div className="pt-3.5 mt-2 flex items-center justify-between border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!result}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                title="Copiar código al portapapeles"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!result}
                className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>Descargar</span>
              </button>
            </div>

            {/* Direct Apply to Cloud Button */}
            <button
              onClick={handleApplyToCloud}
              disabled={applying || !result || !result.isValidJson}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 cursor-pointer hover:brightness-110 active:scale-95"
            >
              <Database className="w-3.5 h-3.5 text-slate-950" />
              <span>{applying ? 'Guardando en la Nube...' : 'Aplicar a la Nube'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

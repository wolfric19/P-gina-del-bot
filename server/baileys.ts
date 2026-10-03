import { fork, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';

// Map of active SubBot child processes by instance ID
export const activeProcesses = new Map<string, ChildProcess>();

// Backward compatibility export
export const activeSockets = new Map<string, any>();

// SESSIONS DIRECTORY
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const BOT_REPO_DIR = path.join(process.cwd(), 'bot-repo');
const BOT_SCRIPT = path.join(BOT_REPO_DIR, 'index.js');
const ECONOMIA_FILE = path.join(BOT_REPO_DIR, 'economia.json');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export interface SessionInitResult {
  pairingCode?: string;
  qrData?: string;
  success: boolean;
  error?: string;
}

/**
 * Format raw WhatsApp phone number into clean digits and detect/fix duplicated country codes
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');

  // Detect mistakenly concatenated cross-prefixes, e.g. 55569981026602 or 51569981026602
  if (clean.startsWith('5556') && clean.length >= 12) {
    clean = clean.slice(2); // remove redundant 55 prefix, preserve +56 (Chile)
  } else if (clean.startsWith('5156') && clean.length >= 12) {
    clean = clean.slice(2); // remove redundant 51 prefix, preserve +56 (Chile)
  }

  const knownPrefixes = ['56', '54', '52', '51', '57', '58', '593', '502', '34', '55', '351', '1'];
  for (const cc of knownPrefixes) {
    const doubleCc = cc + cc;
    if (clean.startsWith(doubleCc)) {
      const deduplicated = clean.slice(cc.length);
      if (deduplicated.length >= 9) {
        clean = deduplicated;
        break;
      }
    }
  }

  return clean;
}

/**
 * Format 8-char code as XXXX-XXXX for display
 */
export function formatPairingCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return code;
}

/**
 * Strip ANSI color codes from string
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '').trim();
}

/**
 * Creates and initializes a real Baileys WhatsApp Multi-Device session running the official Wolfric Bot
 */
export async function startSubBotSession(
  instanceId: string,
  rawPhone: string,
  method: 'code' | 'qr',
  callbacks: {
    onStatusChange: (status: 'online' | 'offline' | 'pairing' | 'reconnecting', message?: string) => void;
    onQrUpdate: (qrData: string) => void;
    onLog: (level: 'info' | 'warn' | 'error' | 'success', message: string) => void;
    onMessageCount: () => void;
    getConfig: () => any;
  },
  extraEnv: Record<string, string | undefined> = {}
): Promise<SessionInitResult> {
  const instanceSessionDir = path.join(SESSIONS_DIR, instanceId);
  if (!fs.existsSync(instanceSessionDir)) {
    fs.mkdirSync(instanceSessionDir, { recursive: true });
  } else {
    // If there is an unfinished or invalid session without registered credentials, clean it
    try {
      const credsPath = path.join(instanceSessionDir, 'creds.json');
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (!creds || !creds.registered) {
          fs.rmSync(instanceSessionDir, { recursive: true, force: true });
          fs.mkdirSync(instanceSessionDir, { recursive: true });
        }
      }
    } catch {
      // ignore
    }
  }

  // Stop any existing process for this instance
  stopSubBotSession(instanceId);

  const cleanPhone = sanitizeWhatsAppPhone(rawPhone);

  callbacks.onLog('info', `🐺 Iniciando motor oficial Wolfric Protocol para instancia ${instanceId}...`);
  callbacks.onStatusChange('pairing', 'Iniciando conexión con WhatsApp...');

  let emittedQr = '';
  let generatedPairingCode = '';
  let resolvedInit = false;

  return new Promise<SessionInitResult>((resolve) => {
    try {
      const child = fork(BOT_SCRIPT, [], {
        cwd: BOT_REPO_DIR,
        env: {
          ...process.env,
          WOLFRIC_SESSION_DIR: instanceSessionDir,
          WOLFRIC_LINK_METHOD: method,
          WOLFRIC_PHONE: cleanPhone,
          WOLFRIC_INSTANCE_ID: instanceId,
          WOLFRIC_ECONOMIA_FILE: ECONOMIA_FILE,
          PANEL_DISABLED: 'true',
          PANEL_PORT: '0',
          ...(extraEnv.GEMINI_API_KEY ? { GEMINI_API_KEY: extraEnv.GEMINI_API_KEY } : {}),
          ...(extraEnv.GIPHY_API_KEY ? { GIPHY_API_KEY: extraEnv.GIPHY_API_KEY } : {}),
        },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      activeProcesses.set(instanceId, child);

      // Timeout fallback to return response if WhatsApp takes longer to answer
      const initTimeout = setTimeout(() => {
        if (!resolvedInit) {
          resolvedInit = true;
          if (method === 'code' && generatedPairingCode) {
            resolve({ pairingCode: generatedPairingCode, success: true });
          } else if (method === 'qr' && emittedQr) {
            resolve({ qrData: emittedQr, success: true });
          } else {
            resolve({
              pairingCode: generatedPairingCode,
              qrData: emittedQr,
              success: true,
            });
          }
        }
      }, 15000);

      // IPC Message Handler from Wolfric Bot process
      child.on('message', async (data: any) => {
        if (!data || typeof data !== 'object') return;

        if (data.type === 'pairingCode' && data.code) {
          generatedPairingCode = formatPairingCode(data.code);
          callbacks.onLog('success', `Código oficial de vinculación generado: ${generatedPairingCode}`);
          if (!resolvedInit) {
            resolvedInit = true;
            clearTimeout(initTimeout);
            resolve({
              pairingCode: generatedPairingCode,
              qrData: emittedQr,
              success: true,
            });
          }
        }

        if (data.type === 'qr' && data.qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(data.qr, {
              margin: 2,
              color: { dark: '#06b6d4', light: '#0b0f19' },
            });
            emittedQr = qrDataUrl;
            callbacks.onQrUpdate(qrDataUrl);
            callbacks.onLog('info', 'Nuevo código QR generado para escaneo desde WhatsApp.');
            if (!resolvedInit && method === 'qr') {
              resolvedInit = true;
              clearTimeout(initTimeout);
              resolve({
                qrData: qrDataUrl,
                success: true,
              });
            }
          } catch (err: any) {
            callbacks.onLog('error', `Error generando imagen QR: ${err.message}`);
          }
        }

        if (data.type === 'status') {
          if (data.status === 'online') {
            callbacks.onStatusChange('online', '¡Conexión establecida con éxito con WhatsApp Multi-Device!');
            callbacks.onLog('success', '🐺 SubBot Wolfric conectado y en línea 24/7 en WhatsApp.');
            if (!resolvedInit) {
              resolvedInit = true;
              clearTimeout(initTimeout);
              resolve({ success: true, pairingCode: generatedPairingCode, qrData: emittedQr });
            }
          } else if (data.status === 'reconnecting') {
            callbacks.onStatusChange('reconnecting', 'Reconectando con servidores de WhatsApp...');
          } else if (data.status === 'offline') {
            callbacks.onStatusChange('offline', 'Sesión desvinculada desde WhatsApp. Pulsa "Volver a Vincular".');
            callbacks.onLog('warn', 'El dispositivo fue desvinculado desde WhatsApp.');
          }
        }

        if (data.type === 'message') {
          callbacks.onMessageCount();
        }

        if (data.type === 'error') {
          callbacks.onLog('error', `Error en Wolfric Bot: ${data.error}`);
        }
      });

      // Handle standard output logs
      child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n');
        for (const rawLine of lines) {
          const line = stripAnsi(rawLine);
          if (!line) continue;

          // Check if line contains a pairing code in terminal format
          const codeMatch = line.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
          if (codeMatch && !generatedPairingCode) {
            generatedPairingCode = codeMatch[1];
            callbacks.onLog('success', `Código de vinculación detectado: ${generatedPairingCode}`);
            if (!resolvedInit && method === 'code') {
              resolvedInit = true;
              clearTimeout(initTimeout);
              resolve({ pairingCode: generatedPairingCode, qrData: emittedQr, success: true });
            }
          }

          if (line.includes('¡Conectado con éxito!')) {
            callbacks.onStatusChange('online', '¡Conexión establecida con éxito con WhatsApp Multi-Device!');
            callbacks.onLog('success', '🐺 SubBot Wolfric conectado y en línea 24/7 en WhatsApp.');
          } else if (line.includes('ERROR') || line.includes('Error')) {
            callbacks.onLog('error', line);
          } else if (line.includes('SUCCESS')) {
            callbacks.onLog('success', line);
          } else if (line.includes('WARN')) {
            callbacks.onLog('warn', line);
          } else if (line.includes('WOLFRIC') || line.includes('Baileys')) {
            callbacks.onLog('info', line);
          }
        }
      });

      child.stderr?.on('data', (chunk) => {
        const errText = stripAnsi(chunk.toString());
        if (errText && !errText.includes('ExperimentalWarning')) {
          callbacks.onLog('warn', errText);
        }
      });

      child.on('error', (err) => {
        callbacks.onLog('error', `Error en proceso de Wolfric Bot: ${err.message}`);
        if (!resolvedInit) {
          resolvedInit = true;
          clearTimeout(initTimeout);
          resolve({ success: false, error: err.message });
        }
      });

      child.on('exit', (code, signal) => {
        activeProcesses.delete(instanceId);
        callbacks.onLog('warn', `Proceso Wolfric finalizado (código: ${code ?? signal})`);
        callbacks.onStatusChange('offline', 'SubBot detenido.');
      });
    } catch (err: any) {
      callbacks.onLog('error', `Error inicializando proceso Wolfric: ${err.message}`);
      if (!resolvedInit) {
        resolvedInit = true;
        resolve({ success: false, error: err.message });
      }
    }
  });
}

/**
 * Close and disconnect a session
 */
export function stopSubBotSession(instanceId: string) {
  if (activeProcesses.has(instanceId)) {
    try {
      const proc = activeProcesses.get(instanceId);
      proc?.kill('SIGTERM');
    } catch {
      // ignore
    }
    activeProcesses.delete(instanceId);
  }
}

/**
 * Remove session data from disk
 */
export function deleteSubBotData(instanceId: string) {
  stopSubBotSession(instanceId);
  const dir = path.join(SESSIONS_DIR, instanceId);
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

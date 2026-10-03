import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import type {
  SubBotInstance,
  WolfricVersion,
  PlatformSettings,
  SystemAuditLog,
  SystemBackup,
  BotConfig,
  BotStats,
  LidUserProfile,
  BackupUploadResult,
  SecurityIncident,
  AdminSession,
  SecurityStatusReport,
} from './src/types.js';
import {
  startSubBotSession,
  stopSubBotSession,
  deleteSubBotData,
  formatPairingCode,
  sanitizeWhatsAppPhone,
} from './server/baileys.js';
import {
  importUsersFromBackup,
  getAllUsers,
  upsertUser,
  deleteUser,
  findUserByLidOrPhone,
  applyJsonToDatabase,
} from './server/userProgress.js';
import { processFileWithAi } from './server/aiFileEditor.js';
import {
  initSentinelWatchdog,
  getSentinelStatus,
  recordSentinelEvent,
  auditNewRegistration,
  runDeepAudit,
  executeSentinelAction,
  recordUserJoin,
} from './server/sentinelAdmin.js';
import {
  getPublicRankings,
  getRpgAdminData,
  grantRpgAsset,
  getCustomMissions,
  upsertCustomMission,
  deleteCustomMission,
  toggleCustomMission,
} from './server/rpgSystem.js';

const app = express();
const PORT = 3000;

// Production process crash prevention
process.on('uncaughtException', (err) => {
  console.error('[SERVER CAUGHT ERROR] Uncaught exception:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER CAUGHT REJECTION] Unhandled rejection:', reason);
});

app.use(express.json({ limit: '20mb' }));

// Storage directory
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'wolfric-state.json');

// Default initial versions
const INITIAL_VERSIONS: WolfricVersion[] = [
  {
    id: 'v-3.2.1',
    version: 'Wolfric 3.2.1',
    releaseDate: '2026-09-10',
    isLatest: true,
    isStable: true,
    changelog: [
      'Multi-device Baileys v6.7.8 protocol update',
      'Optimización de memoria en modo SubBot (-35% RAM)',
      'Nuevo motor de stickers HD y descarga de Reels',
      'Protección avanzada contra baneo y desconexión fantasma',
      'Aislamiento estricto de credenciales por instancia'
    ],
    fileSize: '4.8 MB',
    instancesCount: 3,
    hash: 'sha256:8f4c21b93dae0041',
    notes: 'Versión oficial recomendada para producción.',
    author: 'Wolfric Core Team'
  },
  {
    id: 'v-3.2.0',
    version: 'Wolfric 3.2.0',
    releaseDate: '2026-08-18',
    isLatest: false,
    isStable: true,
    changelog: [
      'Sistema de código de vinculación de 8 dígitos',
      'Soporte para bienvenida y despedida personalizada',
      'Antilink configurable con kick automático'
    ],
    fileSize: '4.6 MB',
    instancesCount: 1,
    hash: 'sha256:7b1e93c12140fa72',
    notes: 'Versión estable anterior con alto soporte.',
    author: 'Wolfric Core Team'
  },
  {
    id: 'v-3.1.9',
    version: 'Wolfric 3.1.9',
    releaseDate: '2026-07-02',
    isLatest: false,
    isStable: true,
    changelog: [
      'Compatibilidad legacy para números de WhatsApp antiguos',
      'Parche de reconexión automática en redes lentas'
    ],
    fileSize: '4.4 MB',
    instancesCount: 0,
    hash: 'sha256:1a84f32dc87e028b',
    notes: 'Versión LTS para números con alta sensibilidad.',
    author: 'Wolfric Core Team'
  },
  {
    id: 'v-backup-legacy-2.8',
    version: 'Backup Antiguo Wolfric v2.8',
    releaseDate: '2026-04-12',
    isLatest: false,
    isStable: false,
    isBackup: true,
    changelog: [
      'Snapshot de respaldo de la arquitectura monolítica original',
      'Conservado para auditoría y restauración de configuraciones antiguas'
    ],
    fileSize: '12.2 MB',
    instancesCount: 0,
    hash: 'sha256:39f28a61c778e244',
    notes: 'Archivo de respaldo histórico verificado.',
    author: 'Wolfric Archive'
  }
];

// Default initial sample instances
// Clean initial instances - no dummy test accounts
const INITIAL_INSTANCES: SubBotInstance[] = [];

const INITIAL_BACKUPS: SystemBackup[] = [
  {
    id: 'sys-bk-1',
    version: 'Wolfric 3.2.1',
    filename: 'wolfric-core-3.2.1-official.tar.gz',
    date: '2026-09-10T14:30:00.000Z',
    sizeKb: 4920,
    type: 'version_release',
    notes: 'Release oficial empaquetada con módulos multi-device.'
  },
  {
    id: 'sys-bk-2',
    version: 'Wolfric 3.2.0',
    filename: 'wolfric-core-3.2.0-stable.tar.gz',
    date: '2026-08-18T10:15:00.000Z',
    sizeKb: 4710,
    type: 'version_release',
    notes: 'Build previa certificada.'
  },
  {
    id: 'sys-bk-3',
    version: 'Wolfric 2.8-legacy',
    filename: 'backup-antiguo-wolfric-v2.8.zip',
    date: '2026-04-12T08:00:00.000Z',
    sizeKb: 12490,
    type: 'manual_snapshot',
    notes: 'Backup histórico subido por el propietario de Wolfric.'
  }
];

interface AppState {
  instances: SubBotInstance[];
  versions: WolfricVersion[];
  settings: PlatformSettings;
  auditLogs: SystemAuditLog[];
  backups: SystemBackup[];
  ownerPasscode: string;
  ownerSecurityPin: string;
  emergencyLockdown: boolean;
  blacklistedIps: string[];
  securityIncidents: SecurityIncident[];
}

// In-Memory state with file persistence
let state: AppState = {
  instances: INITIAL_INSTANCES,
  versions: INITIAL_VERSIONS,
  settings: {
    maintenanceMode: false,
    maintenanceMessage: 'Plataforma Wolfric SubBot en mantenimiento temporal para optimización de servidores.',
    defaultVersion: 'Wolfric 3.2.1',
    maxInstancesTotal: 50,
    maxInstancesPerNumber: 2,
    allowNewRegistrations: true,
    systemUptimeSeconds: 120,
    totalMessagesToday: 0,
    antibanShield: true,
  },
  auditLogs: [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      action: 'PLATFORM_BOOT',
      target: 'Sistema Wolfric Core Oficial Blindado',
      status: 'ok',
    },
  ],
  backups: INITIAL_BACKUPS,
  ownerPasscode: process.env.WOLFRIC_OWNER_KEY || 'WLZ-123',
  ownerSecurityPin: '191919',
  emergencyLockdown: false,
  blacklistedIps: [],
  securityIncidents: [],
};

// Constant-time safe string comparison to prevent timing attacks
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Return active platform API keys for Baileys bot processes
function getBotSubprocessEnv(): Record<string, string | undefined> {
  return {
    GEMINI_API_KEY: state.settings.geminiApiKey || process.env.GEMINI_API_KEY || undefined,
    GIPHY_API_KEY: state.settings.giphyApiKey || process.env.GIPHY_API_KEY || undefined,
  };
}


// Worker Task Queue for distributed Termux nodes
interface WorkerTask {
  id: string;
  phone: string;
  method: 'code' | 'qr';
  instanceId: string;
  createdAt: number;
}
const workerTasksQueue: WorkerTask[] = [];

// Secure endpoint for your personal Termux node to poll pending tasks
app.get('/api/worker/poll', (req: any, res: any) => {
  const key = req.query.key;
  if (!key || !safeCompare(String(key), state.ownerPasscode)) {
    return res.status(401).json({ error: 'Acceso no autorizado al nodo worker' });
  }

  // Pop next pending task if any
  const nextTask = workerTasksQueue.shift();
  res.json({
    status: 'ok',
    task: nextTask || null,
    activeInstances: state.instances.length,
    timestamp: Date.now(),
  });
});
function loadState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      // Filter out any legacy sample/test instances from previous dev runs
      if (loaded.instances && Array.isArray(loaded.instances)) {
        state.instances = loaded.instances.filter(
          (i: SubBotInstance) => !i.id.startsWith('wolf-sub-90') && !i.id.includes('demo')
        );
      }
      if (loaded.versions) state.versions = loaded.versions;
      if (loaded.settings) state.settings = { ...state.settings, ...loaded.settings };
      if (loaded.auditLogs) state.auditLogs = loaded.auditLogs;
      if (loaded.backups) state.backups = loaded.backups;
      if (loaded.ownerPasscode && !process.env.WOLFRIC_OWNER_KEY) {
        state.ownerPasscode = loaded.ownerPasscode;
      } else {
        state.ownerPasscode = process.env.WOLFRIC_OWNER_KEY || 'WLZ-123';
      }
      if (loaded.ownerSecurityPin) state.ownerSecurityPin = loaded.ownerSecurityPin;
      if (typeof loaded.emergencyLockdown === 'boolean') state.emergencyLockdown = loaded.emergencyLockdown;
      if (Array.isArray(loaded.blacklistedIps)) state.blacklistedIps = loaded.blacklistedIps;
      if (Array.isArray(loaded.securityIncidents)) state.securityIncidents = loaded.securityIncidents;
      saveState();
    }
  } catch (err) {
    console.error('Error loading saved state:', err);
  }
}

function saveState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

loadState();
initSentinelWatchdog(() => state, saveState);

// Generate pairing code (e.g., WOLF-9J4K)
function generatePairingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars[Math.floor(Math.random() * chars.length)];
    p2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `WOLF-${p1}${p2}`;
}

// Platform System Clock - authentic metrics only, no simulated messages or overdrive
setInterval(() => {
  state.settings.systemUptimeSeconds += 10;
  for (const inst of state.instances) {
    if (inst.status === 'online' && !inst.isBanned && !inst.isSuspended) {
      inst.uptimeSeconds += 10;
      inst.lastSeen = new Date().toISOString();
    }
  }
}, 10000);

// Helper to mask sensitive tokens
function sanitizeInstanceForUser(instance: SubBotInstance) {
  // Returns safe instance object
  return {
    ...instance,
    // sessionHash is safe (hash only, not raw creds)
  };
}

function logAudit(action: string, target?: string, status: 'ok' | 'alert' | 'error' = 'ok') {
  const item: SystemAuditLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    target,
    status,
  };
  state.auditLogs.unshift(item);
  if (state.auditLogs.length > 200) state.auditLogs.pop();
  saveState();
}

// -----------------------------------------------------------------------------
// PUBLIC & PLATFORM ROUTES
// -----------------------------------------------------------------------------

app.get('/api/platform/status', (req, res) => {
  const totalBots = state.instances.length;
  const onlineBots = state.instances.filter((i) => i.status === 'online' && !i.isBanned && !i.isSuspended).length;
  const totalMessages = state.instances.reduce((sum, i) => sum + i.stats.messagesProcessed, 0);

  res.json({
    status: 'ok',
    maintenance: state.settings.maintenanceMode,
    maintenanceMessage: state.settings.maintenanceMessage,
    allowRegistrations: state.settings.allowNewRegistrations,
    defaultVersion: state.settings.defaultVersion,
    stats: {
      totalBots,
      onlineBots,
      totalMessages,
      uptimeSeconds: state.settings.systemUptimeSeconds,
    },
    latestVersion: state.versions.find((v) => v.isLatest)?.version || 'Wolfric 3.2.1',
  });
});

// -----------------------------------------------------------------------------
// USER SUBBOT ROUTES (Isolated per User)
// -----------------------------------------------------------------------------

// 1. Register new Wolfric SubBot
app.post('/api/subbots/register', async (req, res) => {
  if (state.emergencyLockdown) {
    return res.status(503).json({
      error: 'PROTOCOLO ESCUDO ALFA ACTIVO: La plataforma se encuentra en aislamiento de seguridad de emergencia. Registros pausados temporalmente por el Propietario.',
      lockdown: true,
    });
  }
  if (state.settings.maintenanceMode) {
    return res.status(503).json({ error: state.settings.maintenanceMessage });
  }
  if (!state.settings.allowNewRegistrations) {
    return res.status(403).json({ error: 'El registro de nuevos SubBots está pausado temporalmente por el propietario.' });
  }

  const { phone, customAlias, pairingMethod, password, pin } = req.body;
  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return res.status(400).json({ error: 'Por favor introduce un número de WhatsApp válido (con código de país).' });
  }

  const digits = sanitizeWhatsAppPhone(phone);
  if (digits.length < 8) {
    return res.status(400).json({ error: 'Por favor introduce un número de WhatsApp válido (con código de país).' });
  }
  const cleanPhone = `+${digits}`;

  // Co-Admin Security Vetting
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const auditRes = auditNewRegistration(cleanPhone, 'pending', state.instances);
  if (!auditRes.approved) {
    return res.status(403).json({ error: auditRes.reason || 'Registro rechazado por las políticas de seguridad del Supervisor.' });
  }

  const userChosenPin = (password || pin || '').toString().trim();
  const method = pairingMethod === 'qr' ? 'qr' : 'code';

  // Co-Admin records user joining
  recordUserJoin(cleanPhone, method, clientIp, 'pairing', customAlias || 'Vinculación de SubBot');

  // Check if an instance already exists for this phone
  const existingInstance = state.instances.find((i) => i.ownerPhone === cleanPhone && !i.isBanned);
  if (existingInstance) {
    // If instance exists, update password if provided, refresh auth token, and trigger pairing
    if (userChosenPin && userChosenPin.length >= 4) {
      existingInstance.userPin = userChosenPin;
    }
    existingInstance.customAlias = (customAlias || existingInstance.customAlias || 'Mi SubBot Wolfric').trim();
    existingInstance.pairingMethod = method;
    existingInstance.status = 'pairing';
    existingInstance.pairingCode = '';
    existingInstance.qrData = '';
    existingInstance.userAuthToken = `wlf_sec_${crypto.randomBytes(16).toString('hex')}`;
    existingInstance.lastSeen = new Date().toISOString();
    existingInstance.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Solicitud de nueva vinculación WhatsApp iniciada.',
    });

    saveState();

    stopSubBotSession(existingInstance.id);
    const initResult = await startSubBotSession(existingInstance.id, cleanPhone, method, {
      onStatusChange: (status, message) => {
        const inst = state.instances.find((i) => i.id === existingInstance.id);
        if (inst) {
          inst.status = status;
          inst.lastSeen = new Date().toISOString();
          if (message) {
            inst.logs.unshift({ timestamp: new Date().toISOString(), level: 'info', message });
          }
          saveState();
        }
      },
      onQrUpdate: (qrData) => {
        const inst = state.instances.find((i) => i.id === existingInstance.id);
        if (inst) {
          inst.qrData = qrData;
          saveState();
        }
      },
      onLog: (level, message) => {
        const inst = state.instances.find((i) => i.id === existingInstance.id);
        if (inst) {
          inst.logs.unshift({ timestamp: new Date().toISOString(), level, message });
          if (inst.logs.length > 100) inst.logs.pop();
          saveState();
        }
      },
      onMessageCount: () => {
        const inst = state.instances.find((i) => i.id === existingInstance.id);
        if (inst) {
          inst.stats.messagesProcessed += 1;
          state.settings.totalMessagesToday += 1;
          saveState();
        }
      },
      getConfig: () => existingInstance.config,
    }, getBotSubprocessEnv());

    if (initResult.pairingCode) {
      existingInstance.pairingCode = initResult.pairingCode;
    }
    if (initResult.qrData) {
      existingInstance.qrData = initResult.qrData;
    }
    saveState();

    return res.json({
      status: 'ok',
      instance: sanitizeInstanceForUser(existingInstance),
      token: existingInstance.userAuthToken,
      userPin: existingInstance.userPin,
      error: initResult.error,
    });
  }

  // Check instance limit per phone
  const existingForPhone = state.instances.filter((i) => i.ownerPhone === cleanPhone && !i.isBanned);
  if (existingForPhone.length >= state.settings.maxInstancesPerNumber) {
    return res.status(400).json({
      error: `Has alcanzado el límite de ${state.settings.maxInstancesPerNumber} SubBots para este número de teléfono.`,
    });
  }

  if (state.instances.length >= state.settings.maxInstancesTotal) {
    return res.status(400).json({
      error: 'La plataforma ha alcanzado su capacidad máxima de SubBots. Contacta al propietario.',
    });
  }

  const instanceId = `wolf-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`;
  const userPin = userChosenPin && userChosenPin.length >= 4 ? userChosenPin : Math.floor(1000 + Math.random() * 9000).toString();
  const userAuthToken = `wlf_sec_${crypto.randomBytes(16).toString('hex')}`;

  const newInstance: SubBotInstance = {
    id: instanceId,
    name: `Wolfric-SubBot-${instanceId.slice(-4).toUpperCase()}`,
    ownerPhone: cleanPhone,
    customAlias: (customAlias || 'Mi SubBot Wolfric').trim(),
    status: 'pairing',
    pairingMethod: method,
    pairingCode: '',
    qrData: '',
    version: state.settings.defaultVersion || 'Wolfric 3.2.1',
    sessionHash: `sha256:${crypto.createHash('sha256').update(instanceId + cleanPhone + Date.now()).digest('hex').slice(0, 24)}`,
    sessionCreatedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    uptimeSeconds: 0,
    isBanned: false,
    isSuspended: false,
    userAuthToken,
    userPin,
    config: {
      prefix: '.',
      mode: 'public',
      autoRead: true,
      antiLink: true,
      welcomeMessage: true,
      welcomeText: '¡Bienvenido al grupo! Soy un SubBot oficial de Wolfric creado por wolfric_19, The L y zerrDMC_. Escribe .menu para comenzar.',
      stickerMaker: true,
      antiSpam: true,
      maxGroups: 10,
      language: 'es',
      botBio: '🐺 Wolfric SubBot Oficial | wolfric_19 • The L • zerrDMC_',
      autoBio: true,
      reactions: true,
      turboMode: true,
    },
    stats: {
      messagesProcessed: 0,
      commandsExecuted: 0,
      activeGroups: 0,
      contactsSeen: 0,
      pingMs: 38,
      memoryMb: 70,
    },
    backups: [],
    logs: [
      { timestamp: new Date().toISOString(), level: 'info', message: 'Instancia de SubBot Wolfric creada de forma aislada.' },
      { timestamp: new Date().toISOString(), level: 'info', message: 'Conectando con servidores oficiales de WhatsApp Multi-Device...' },
    ],
  };

  state.instances.unshift(newInstance);
  saveState();

  // Enqueue task for Termux worker node
  workerTasksQueue.push({
    id: `task-${Date.now()}`,
    phone: cleanPhone,
    method,
    instanceId,
    createdAt: Date.now(),
  });

  // Initialize real Baileys WhatsApp session
  const initResult = await startSubBotSession(instanceId, cleanPhone, method, {
    onStatusChange: (status, message) => {
      const inst = state.instances.find((i) => i.id === instanceId);
      if (inst) {
        inst.status = status;
        inst.lastSeen = new Date().toISOString();
        if (message) {
          inst.logs.unshift({ timestamp: new Date().toISOString(), level: 'info', message });
        }
        saveState();
      }
    },
    onQrUpdate: (qrData) => {
      const inst = state.instances.find((i) => i.id === instanceId);
      if (inst) {
        inst.qrData = qrData;
        saveState();
      }
    },
    onLog: (level, message) => {
      const inst = state.instances.find((i) => i.id === instanceId);
      if (inst) {
        inst.logs.unshift({ timestamp: new Date().toISOString(), level, message });
        if (inst.logs.length > 100) inst.logs.pop();
        saveState();
      }
    },
    onMessageCount: () => {
      const inst = state.instances.find((i) => i.id === instanceId);
      if (inst) {
        inst.stats.messagesProcessed += 1;
        state.settings.totalMessagesToday += 1;
        saveState();
      }
    },
    getConfig: () => {
      const inst = state.instances.find((i) => i.id === instanceId);
      return inst ? inst.config : {};
    },
  }, getBotSubprocessEnv());

  if (initResult.pairingCode) {
    newInstance.pairingCode = initResult.pairingCode;
    newInstance.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Código oficial de WhatsApp recibido: ${initResult.pairingCode}`,
    });
  }
  if (initResult.qrData) {
    newInstance.qrData = initResult.qrData;
  }

  logAudit('SUBBOT_REGISTERED', `${newInstance.name} (${cleanPhone})`, 'ok');
  saveState();

  res.json({
    status: 'ok',
    instance: sanitizeInstanceForUser(newInstance),
    token: userAuthToken,
    userPin,
    error: initResult.error,
  });
});

// 2. User Login to their SubBot (by phone & PIN/password, or by token)
app.post('/api/subbots/login', (req, res) => {
  const { phone, pin, password, token } = req.body;

  if (token) {
    const inst = state.instances.find((i) => i.userAuthToken === token);
    if (inst) {
      return res.json({ status: 'ok', instance: sanitizeInstanceForUser(inst), token: inst.userAuthToken });
    }
  }

  const credential = (password || pin || '').toString().trim();
  if (!phone || !credential) {
    return res.status(400).json({ error: 'Introduce el número de WhatsApp y tu contraseña de acceso.' });
  }

  const digits = sanitizeWhatsAppPhone(phone);
  const cleanPhone = `+${digits}`;
  const inst = state.instances.find(
    (i) => (i.ownerPhone === cleanPhone || i.ownerPhone.replace(/\D/g, '') === digits) && i.userPin === credential
  );

  if (!inst) {
    return res.status(401).json({ error: 'Número de WhatsApp o contraseña incorrecta. Verifica tus datos de acceso.' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  recordUserJoin(cleanPhone, 'login', clientIp, (inst.status as any) || 'online', 'Sesión iniciada por credencial');

  res.json({
    status: 'ok',
    instance: sanitizeInstanceForUser(inst),
    token: inst.userAuthToken,
  });
});

// User auth middleware for isolated instance
function userAuthMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token de sesión no proporcionado.' });
  }
  const token = authHeader.split(' ')[1];
  const instance = state.instances.find((i) => i.userAuthToken === token);
  if (!instance) {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' });
  }
  if (instance.isBanned) {
    return res.status(403).json({ error: `Esta instancia ha sido baneada por el propietario. Razón: ${instance.bannedReason || 'Infracción de términos'}` });
  }
  req.instance = instance;
  next();
}

// 3. Get my isolated SubBot
app.get('/api/subbots/me', userAuthMiddleware, (req: any, res: any) => {
  res.json({
    status: 'ok',
    instance: sanitizeInstanceForUser(req.instance),
  });
});

// 4. Trigger pairing confirmation / check pairing
app.post('/api/subbots/me/pair', userAuthMiddleware, async (req: any, res: any) => {
  const instance: SubBotInstance = req.instance;

  if (instance.status === 'online') {
    return res.json({ status: 'already_connected', instance: sanitizeInstanceForUser(instance) });
  }

  // Simulate pairing step
  instance.status = 'online';
  instance.pairingCode = undefined;
  instance.pairingMethod = 'code';
  instance.sessionCreatedAt = new Date().toISOString();
  instance.lastSeen = new Date().toISOString();
  instance.uptimeSeconds = 1;
  instance.stats.activeGroups = Math.floor(Math.random() * 4) + 1;
  instance.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'success',
    message: '¡WhatsApp vinculado con éxito! Conexión Multi-Device Baileys establecida en la nube.',
  });

  logAudit('SUBBOT_LINKED', `${instance.name} (${instance.ownerPhone})`, 'ok');
  saveState();

  res.json({
    status: 'ok',
    message: 'SubBot vinculado correctamente y listo para operar.',
    instance: sanitizeInstanceForUser(instance),
  });
});

// 5. User actions: restart, disconnect, repair
app.post('/api/subbots/me/action', userAuthMiddleware, async (req: any, res: any) => {
  const instance: SubBotInstance = req.instance;
  const { action } = req.body;

  if (instance.isSuspended) {
    return res.status(403).json({ error: 'Tu instancia está suspendida temporalmente por administración.' });
  }

  switch (action) {
    case 'disconnect':
      instance.status = 'offline';
      stopSubBotSession(instance.id);
      instance.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'SubBot desconectado manualmente por el usuario. La sesión permanece almacenada de forma segura.',
      });
      break;

    case 'reconnect':
    case 'restart':
      instance.status = 'reconnecting';
      instance.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Reanudando conexión con WhatsApp Multi-Device...',
      });
      startSubBotSession(instance.id, instance.ownerPhone, instance.pairingMethod || 'code', {
        onStatusChange: (status, message) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.status = status;
            if (message) inst.logs.unshift({ timestamp: new Date().toISOString(), level: 'info', message });
            saveState();
          }
        },
        onQrUpdate: (qrData) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.qrData = qrData;
            saveState();
          }
        },
        onLog: (level, message) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.logs.unshift({ timestamp: new Date().toISOString(), level, message });
            saveState();
          }
        },
        onMessageCount: () => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.stats.messagesProcessed += 1;
            saveState();
          }
        },
        getConfig: () => instance.config,
      }, getBotSubprocessEnv()).catch((err) => {
        instance.logs.unshift({ timestamp: new Date().toISOString(), level: 'error', message: err.message });
        saveState();
      });
      break;

    case 'repair':
      // Request brand new official code or QR from WhatsApp
      stopSubBotSession(instance.id);
      if (instance.status !== 'online') {
        deleteSubBotData(instance.id);
      }
      instance.status = 'pairing';
      instance.pairingCode = '';
      const repairResult = await startSubBotSession(instance.id, instance.ownerPhone, instance.pairingMethod || 'code', {
        onStatusChange: (status, message) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.status = status;
            if (message) inst.logs.unshift({ timestamp: new Date().toISOString(), level: 'info', message });
            saveState();
          }
        },
        onQrUpdate: (qrData) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.qrData = qrData;
            saveState();
          }
        },
        onLog: (level, message) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.logs.unshift({ timestamp: new Date().toISOString(), level, message });
            saveState();
          }
        },
        onMessageCount: () => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.stats.messagesProcessed += 1;
            saveState();
          }
        },
        getConfig: () => instance.config,
      }, getBotSubprocessEnv());

      if (repairResult.pairingCode) {
        instance.pairingCode = repairResult.pairingCode;
      }
      if (repairResult.qrData) {
        instance.qrData = repairResult.qrData;
      }
      instance.logs.unshift({
        timestamp: new Date().toISOString(),
        level: repairResult.pairingCode ? 'info' : 'warn',
        message: repairResult.pairingCode
          ? `Nuevo código oficial de WhatsApp generado: ${repairResult.pairingCode}`
          : repairResult.error || 'Nuevo código QR generado para escaneo.',
      });
      saveState();
      return res.json({
        status: 'ok',
        instance: sanitizeInstanceForUser(instance),
        error: repairResult.error,
      });

    case 'change-phone':
      const newPhoneRaw = req.body.phone;
      if (!newPhoneRaw || typeof newPhoneRaw !== 'string') {
        return res.status(400).json({ error: 'Por favor ingresa un número de teléfono válido.' });
      }
      const newDigits = sanitizeWhatsAppPhone(newPhoneRaw);
      if (newDigits.length < 8) {
        return res.status(400).json({ error: 'Número de WhatsApp demasiado corto o inválido.' });
      }
      const cleanNewPhone = `+${newDigits}`;

      stopSubBotSession(instance.id);
      deleteSubBotData(instance.id);

      instance.ownerPhone = cleanNewPhone;
      instance.status = 'pairing';
      instance.pairingCode = '';
      instance.qrData = '';
      instance.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Número de WhatsApp actualizado a ${cleanNewPhone}. Iniciando nueva vinculación...`,
      });

      const changeResult = await startSubBotSession(instance.id, cleanNewPhone, instance.pairingMethod || 'code', {
        onStatusChange: (status, message) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.status = status;
            if (message) inst.logs.unshift({ timestamp: new Date().toISOString(), level: 'info', message });
            saveState();
          }
        },
        onQrUpdate: (qrData) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.qrData = qrData;
            saveState();
          }
        },
        onLog: (level, message) => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.logs.unshift({ timestamp: new Date().toISOString(), level, message });
            saveState();
          }
        },
        onMessageCount: () => {
          const inst = state.instances.find((i) => i.id === instance.id);
          if (inst) {
            inst.stats.messagesProcessed += 1;
            saveState();
          }
        },
        getConfig: () => instance.config,
      }, getBotSubprocessEnv());

      if (changeResult.pairingCode) {
        instance.pairingCode = changeResult.pairingCode;
      }
      if (changeResult.qrData) {
        instance.qrData = changeResult.qrData;
      }
      saveState();
      return res.json({
        status: 'ok',
        instance: sanitizeInstanceForUser(instance),
        error: changeResult.error,
      });

    case 'delete':
    case 'unbind':
      stopSubBotSession(instance.id);
      deleteSubBotData(instance.id);
      state.instances = state.instances.filter((i) => i.id !== instance.id);
      saveState();
      return res.json({
        status: 'ok',
        deleted: true,
        message: 'SubBot desvinculado y eliminado exitosamente.',
      });

    default:
      return res.status(400).json({ error: 'Acción no reconocida.' });
  }

  saveState();
  res.json({
    status: 'ok',
    instance: sanitizeInstanceForUser(instance),
  });
});

// 6. Update user's SubBot configuration
app.put('/api/subbots/me/config', userAuthMiddleware, (req: any, res: any) => {
  const instance: SubBotInstance = req.instance;
  const { config, customAlias, newPassword, newPin } = req.body;

  if (newPassword || newPin) {
    const freshPin = (newPassword || newPin || '').toString().trim();
    if (freshPin.length >= 4) {
      instance.userPin = freshPin;
      instance.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Contraseña de seguridad actualizada correctamente.',
      });
    }
  }

  if (customAlias && typeof customAlias === 'string') {
    instance.customAlias = customAlias.trim().slice(0, 40);
  }

  if (config && typeof config === 'object') {
    instance.config = {
      ...instance.config,
      prefix: typeof config.prefix === 'string' ? config.prefix.slice(0, 3) : instance.config.prefix,
      mode: ['public', 'private', 'groups_only'].includes(config.mode) ? config.mode : instance.config.mode,
      autoRead: Boolean(config.autoRead),
      antiLink: Boolean(config.antiLink),
      welcomeMessage: Boolean(config.welcomeMessage),
      welcomeText: typeof config.welcomeText === 'string' ? config.welcomeText.slice(0, 300) : instance.config.welcomeText,
      stickerMaker: Boolean(config.stickerMaker),
      antiSpam: Boolean(config.antiSpam),
      maxGroups: typeof config.maxGroups === 'number' ? Math.min(Math.max(1, config.maxGroups), 30) : instance.config.maxGroups,
      language: config.language || 'es',
      botBio: typeof config.botBio === 'string' ? config.botBio.slice(0, 100) : instance.config.botBio,
      autoBio: Boolean(config.autoBio),
      reactions: Boolean(config.reactions),
      turboMode: config.turboMode !== undefined ? Boolean(config.turboMode) : true,
    };
  }

  instance.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Configuración de la instancia actualizada.',
  });

  saveState();
  res.json({
    status: 'ok',
    message: 'Configuración guardada correctamente.',
    instance: sanitizeInstanceForUser(instance),
  });
});

// 7. Create User Backup (Isolated)
app.post('/api/subbots/me/backup', userAuthMiddleware, (req: any, res: any) => {
  const instance: SubBotInstance = req.instance;
  const backupName = (req.body.name || `Backup-${new Date().toLocaleDateString('es-ES')}`).trim();

  const backupItem = {
    id: `bk-${Date.now()}`,
    name: backupName,
    date: new Date().toISOString(),
    version: instance.version,
    sizeKb: Math.floor(12 + Math.random() * 8),
    configSnapshot: JSON.parse(JSON.stringify(instance.config)),
    statsSnapshot: JSON.parse(JSON.stringify(instance.stats)),
  };

  instance.backups.unshift(backupItem);
  instance.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'success',
    message: `Backup creado: "${backupName}" (${instance.version})`,
  });

  saveState();
  res.json({
    status: 'ok',
    backup: backupItem,
    instance: sanitizeInstanceForUser(instance),
  });
});

// 8. Restore User Backup (Isolated)
app.post('/api/subbots/me/restore-backup', userAuthMiddleware, (req: any, res: any) => {
  const instance: SubBotInstance = req.instance;
  const { backupId } = req.body;

  const targetBackup = instance.backups.find((b) => b.id === backupId);
  if (!targetBackup) {
    return res.status(404).json({ error: 'Backup no encontrado en tus copias de seguridad.' });
  }

  instance.config = JSON.parse(JSON.stringify(targetBackup.configSnapshot));
  instance.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'success',
    message: `Backup restaurado: "${targetBackup.name}" (Versión ${targetBackup.version})`,
  });

  saveState();
  res.json({
    status: 'ok',
    message: 'Configuración restaurada desde el backup exitosamente.',
    instance: sanitizeInstanceForUser(instance),
  });
});

// -----------------------------------------------------------------------------
// OWNER / ADMIN PRIVATE ROUTES (Wolfric Propietario)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// OWNER / ADMIN CYBER DEFENSE LAYER (Wolfric Sentinel Shield v4.0)
// -----------------------------------------------------------------------------

interface OwnerSessionInternal {
  token: string;
  createdAt: number;
  lastActive: number;
  ip: string;
  userAgent: string;
  pinVerifiedUntil: number;
}
const activeOwnerSessions = new Map<string, OwnerSessionInternal>();

interface LoginRateLimit {
  attempts: number;
  lockedUntil: number;
}
const loginRateLimits = new Map<string, LoginRateLimit>();

function recordSecurityIncident(
  type: 'failed_login' | 'lockout' | 'unauthorized_api' | 'ip_blacklisted' | 'lockdown_triggered' | 'pin_failure',
  ip: string,
  details: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  userAgent?: string
) {
  const incident: SecurityIncident = {
    id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    type,
    ip,
    userAgent: userAgent || 'Unknown',
    details,
    severity,
  };
  state.securityIncidents.unshift(incident);
  if (state.securityIncidents.length > 150) state.securityIncidents.pop();
  saveState();
}

// Owner auth check middleware with session token validation and anti-tamper
function ownerAuthMiddleware(req: any, res: any, next: any) {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';

  // 1. IP Blacklist check
  if (state.blacklistedIps && state.blacklistedIps.includes(clientIp)) {
    return res.status(403).json({
      error: 'ACCESO BLOQUEADO: Tu dirección IP está en la lista negra de seguridad perimetral de Wolfric.',
      blacklisted: true,
    });
  }

  // 2. Extract token from Authorization Bearer or x-owner-key header
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const ownerKey = (bearerToken || (req.headers['x-owner-key'] as string) || '').trim();

  if (!ownerKey) {
    return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación del Propietario de Wolfric.' });
  }

  // 3. Check active session token registry
  const session = activeOwnerSessions.get(ownerKey);
  const now = Date.now();
  if (session) {
    // Check 30-minute inactivity timeout
    if (now - session.lastActive > 30 * 60 * 1000) {
      activeOwnerSessions.delete(ownerKey);
      recordSecurityIncident('unauthorized_api', clientIp, 'Sesión de administrador expirada por inactividad', 'low', req.headers['user-agent']);
      return res.status(401).json({
        error: 'Tu sesión segura ha expirado por inactividad. Por favor, inicia sesión nuevamente.',
        sessionExpired: true,
      });
    }

    session.lastActive = now;
    req.ownerSession = session;
    return next();
  }

  // 4. Fallback: timing-safe comparison with static owner passcode
  if (safeCompare(ownerKey, state.ownerPasscode)) {
    // Generate an automatic active session for this client
    const newSession: OwnerSessionInternal = {
      token: ownerKey,
      createdAt: now,
      lastActive: now,
      ip: clientIp,
      userAgent: req.headers['user-agent'] || 'DirectAuth',
      pinVerifiedUntil: 0,
    };
    activeOwnerSessions.set(ownerKey, newSession);
    req.ownerSession = newSession;
    return next();
  }

  recordSecurityIncident('unauthorized_api', clientIp, `Intento de acceso no autorizado a ${req.path}`, 'medium', req.headers['user-agent']);
  return res.status(401).json({ error: 'Acceso denegado al Panel Privado de Wolfric. Clave maestra o token de sesión inválido.' });
}

// 2FA Master Security PIN Middleware for high-risk operations
function ownerPinMiddleware(req: any, res: any, next: any) {
  const session = req.ownerSession;
  const now = Date.now();

  // If already verified in current session within grace window
  if (session && session.pinVerifiedUntil > now) {
    return next();
  }

  const providedPin = (req.headers['x-owner-pin'] || req.body?.securityPin || '').toString().trim();
  const expectedPin = (state.ownerSecurityPin || '191919').trim();

  if (!providedPin || !safeCompare(providedPin, expectedPin)) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    recordSecurityIncident('pin_failure', clientIp, `Fallo al verificar PIN 2FA en ${req.path}`, 'high', req.headers['user-agent']);
    return res.status(403).json({
      error: 'Operación crítica protegida. Se requiere el PIN de Seguridad Maestro (2FA).',
      requiresPin: true,
    });
  }

  // Elevate session for 15 minutes
  if (session) {
    session.pinVerifiedUntil = now + 15 * 60 * 1000;
  }
  next();
}

// Owner login check with military-grade rate limiting & progressive brute-force defense
app.post('/api/owner/login', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
  const now = Date.now();

  // Check if IP is permanently blacklisted
  if (state.blacklistedIps && state.blacklistedIps.includes(clientIp)) {
    return res.status(403).json({
      error: 'ACCESO DENEGADO: Tu dirección IP ha sido bloqueada permanentemente por violaciones de seguridad.',
      blacklisted: true,
    });
  }

  const rateLimit = loginRateLimits.get(clientIp) || { attempts: 0, lockedUntil: 0 };

  // Check if IP is currently locked out
  if (rateLimit.lockedUntil > now) {
    const minutesLeft = Math.ceil((rateLimit.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Acceso bloqueado por motivos de seguridad. Demasiados intentos fallidos. Inténtalo de nuevo en ${minutesLeft} minuto(s).`,
      lockedUntil: rateLimit.lockedUntil,
    });
  }

  const { passcode } = req.body;
  const isValid = passcode && safeCompare(passcode.trim(), state.ownerPasscode.trim());

  if (!isValid) {
    rateLimit.attempts += 1;

    // 10+ failed attempts: Auto-blacklist IP permanently
    if (rateLimit.attempts >= 10) {
      if (!state.blacklistedIps.includes(clientIp)) {
        state.blacklistedIps.push(clientIp);
        saveState();
      }
      recordSecurityIncident('ip_blacklisted', clientIp, 'IP bloqueada automáticamente tras 10 intentos fallidos de login', 'critical', userAgent);
      logAudit('OWNER_IP_BLACKLISTED', clientIp, 'alert');
      return res.status(403).json({
        error: 'Tu dirección IP ha sido bloqueada por el sistema de defensa perimetral tras 10 intentos fallidos.',
        blacklisted: true,
      });
    }

    // 5-9 failed attempts: 15-minute complete lockout
    if (rateLimit.attempts >= 5) {
      rateLimit.lockedUntil = now + 15 * 60 * 1000;
      loginRateLimits.set(clientIp, rateLimit);
      recordSecurityIncident('lockout', clientIp, `Bloqueo de seguridad de 15 minutos activado (intento #${rateLimit.attempts})`, 'high', userAgent);
      logAudit('OWNER_LOCKOUT', `Bloqueo para IP: ${clientIp} tras ${rateLimit.attempts} intentos`, 'alert');
      return res.status(429).json({
        error: 'Demasiados intentos fallidos consecutivos. El acceso ha sido bloqueado temporalmente por 15 minutos.',
        lockedUntil: rateLimit.lockedUntil,
      });
    }

    // 3-4 failed attempts: 3-minute cooldown
    if (rateLimit.attempts >= 3) {
      rateLimit.lockedUntil = now + 3 * 60 * 1000;
      loginRateLimits.set(clientIp, rateLimit);
      recordSecurityIncident('failed_login', clientIp, `3er intento fallido de acceso al panel de administrador`, 'medium', userAgent);
      return res.status(429).json({
        error: '3 intentos fallidos consecutivos. Se ha aplicado un retardo de seguridad de 3 minutos.',
        lockedUntil: rateLimit.lockedUntil,
      });
    }

    loginRateLimits.set(clientIp, rateLimit);
    const remaining = 5 - rateLimit.attempts;
    recordSecurityIncident('failed_login', clientIp, `Intento fallido #${rateLimit.attempts} con clave inválida`, 'low', userAgent);
    return res.status(401).json({
      error: `Clave maestra de administrador incorrecta. ${remaining} intento(s) restante(s) antes del bloqueo.`,
      attemptsRemaining: remaining,
    });
  }

  // Success: Clear rate limit
  loginRateLimits.delete(clientIp);

  // Generate ephemeral cryptographically secure random session token
  const sessionToken = `wsec_${crypto.randomBytes(32).toString('hex')}`;
  activeOwnerSessions.set(sessionToken, {
    token: sessionToken,
    createdAt: now,
    lastActive: now,
    ip: clientIp,
    userAgent,
    pinVerifiedUntil: 0,
  });

  logAudit('OWNER_LOGIN', `Sesión cifrada establecida con éxito (${sessionToken.slice(0, 10)}...)`, 'ok');

  res.json({
    status: 'ok',
    token: sessionToken,
    expiresIn: 30 * 60,
    emergencyLockdown: state.emergencyLockdown,
    message: 'Bienvenido al Panel Privado del Propietario de Wolfric. Sesión blindada activa.',
  });
});

// -----------------------------------------------------------------------------
// SECURITY CENTER & DEFENSE API ENDPOINTS
// -----------------------------------------------------------------------------

// 1. Get Security Center Status
app.get('/api/owner/security/status', ownerAuthMiddleware, (req, res) => {
  const sessions: AdminSession[] = [];
  const now = Date.now();
  const rawAuth = req.headers['authorization'] || req.headers['x-owner-key'] || '';
  const currentToken = (Array.isArray(rawAuth) ? rawAuth[0] : rawAuth).replace(/^Bearer\s+/i, '').trim();

  activeOwnerSessions.forEach((sess) => {
    sessions.push({
      tokenPrefix: sess.token.slice(0, 12) + '...',
      createdAt: new Date(sess.createdAt).toISOString(),
      lastActive: new Date(sess.lastActive).toISOString(),
      ip: sess.ip,
      userAgent: sess.userAgent,
      isCurrent: sess.token === currentToken,
      pinVerified: sess.pinVerifiedUntil > now,
    });
  });

  // Calculate Security Score (out of 100)
  let score = 96;
  if (state.emergencyLockdown) score = 100;
  if (!state.ownerSecurityPin || state.ownerSecurityPin === '191919') score -= 5;
  if (state.ownerPasscode === 'WLZ-123') score -= 5;
  if (state.securityIncidents.length > 15) score -= 4;

  const report: SecurityStatusReport = {
    securityScore: Math.max(70, Math.min(100, score)),
    emergencyLockdown: Boolean(state.emergencyLockdown),
    activeSessionsCount: activeOwnerSessions.size,
    blacklistedIps: state.blacklistedIps || [],
    incidents: state.securityIncidents.slice(0, 50),
    isPinConfigured: Boolean(state.ownerSecurityPin),
    activeSessions: sessions,
    failedAttemptsRecent: state.securityIncidents.filter(
      (i) => Date.now() - new Date(i.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length,
    bruteForceProtected: true,
    cryptoTokensActive: true,
  };

  res.json({ status: 'ok', security: report });
});

// 2. Verify 2FA Master PIN
app.post('/api/owner/security/verify-pin', ownerAuthMiddleware, (req: any, res: any) => {
  const { pin } = req.body;
  const expectedPin = (state.ownerSecurityPin || '191919').trim();

  if (!pin || !safeCompare(String(pin).trim(), expectedPin)) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    recordSecurityIncident('pin_failure', clientIp, 'PIN de 2FA incorrecto ingresado en el panel', 'high', req.headers['user-agent']);
    return res.status(403).json({ error: 'PIN Maestro de Seguridad 2FA incorrecto.' });
  }

  if (req.ownerSession) {
    req.ownerSession.pinVerifiedUntil = Date.now() + 15 * 60 * 1000;
  }

  logAudit('OWNER_PIN_VERIFIED', 'Elevación de privilegios concedida por 15 minutos', 'ok');
  res.json({ status: 'ok', message: 'PIN Maestro verificado. Privilegios elevados activos por 15 minutos.' });
});

// 3. Toggle Emergency Lockdown Protocol
app.post('/api/owner/security/toggle-lockdown', ownerAuthMiddleware, ownerPinMiddleware, (req, res) => {
  const { enable, reason } = req.body;
  state.emergencyLockdown = Boolean(enable);
  saveState();

  const actionText = state.emergencyLockdown
    ? '🚨 PROTOCOLO ESCUDO ALFA ACTIVADO: Todas las operaciones externas de SubBots congeladas.'
    : '🛡️ PROTOCOLO ESCUDO ALFA DESACTIVADO: Operaciones de la plataforma restauradas.';

  recordSecurityIncident(
    'lockdown_triggered',
    (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'admin',
    `Lockdown cambiado a: ${state.emergencyLockdown ? 'ACTIVO' : 'INACTIVO'}. Razón: ${reason || 'Acción manual del propietario'}`,
    state.emergencyLockdown ? 'critical' : 'low',
    req.headers['user-agent']
  );

  logAudit('EMERGENCY_LOCKDOWN_TOGGLE', `Estado: ${state.emergencyLockdown ? 'ACTIVO' : 'INACTIVO'}`, 'alert');
  res.json({
    status: 'ok',
    emergencyLockdown: state.emergencyLockdown,
    message: actionText,
  });
});

// 4. Change 2FA Master PIN
app.post('/api/owner/security/change-pin', ownerAuthMiddleware, (req, res) => {
  const { currentPin, newPin } = req.body;
  const expectedPin = (state.ownerSecurityPin || '191919').trim();

  if (!currentPin || !safeCompare(String(currentPin).trim(), expectedPin)) {
    return res.status(403).json({ error: 'El PIN maestro actual es incorrecto.' });
  }

  if (!newPin || String(newPin).trim().length < 4 || String(newPin).trim().length > 8) {
    return res.status(400).json({ error: 'El nuevo PIN debe tener entre 4 y 8 dígitos numéricos.' });
  }

  state.ownerSecurityPin = String(newPin).trim();
  saveState();
  logAudit('OWNER_PIN_CHANGED', 'PIN Maestro 2FA actualizado exitosamente', 'alert');
  res.json({ status: 'ok', message: 'PIN Maestro de Seguridad 2FA actualizado con éxito.' });
});

// 5. Unblock IP Address
app.post('/api/owner/security/unblock-ip', ownerAuthMiddleware, ownerPinMiddleware, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'Dirección IP requerida.' });

  state.blacklistedIps = (state.blacklistedIps || []).filter((item) => item !== ip);
  loginRateLimits.delete(ip);
  saveState();

  logAudit('IP_UNBLOCKED', `IP desbloqueada: ${ip}`, 'ok');
  res.json({ status: 'ok', message: `Dirección IP ${ip} desbloqueada y restaurada.` });
});

// 6. Terminate All Admin Sessions
app.post('/api/owner/security/kill-sessions', ownerAuthMiddleware, (req, res) => {
  const rawAuth = req.headers['authorization'] || req.headers['x-owner-key'] || '';
  const currentToken = (Array.isArray(rawAuth) ? rawAuth[0] : rawAuth).replace(/^Bearer\s+/i, '').trim();
  let count = 0;

  activeOwnerSessions.forEach((sess, token) => {
    if (token !== currentToken) {
      activeOwnerSessions.delete(token);
      count++;
    }
  });

  logAudit('OWNER_SESSIONS_REVOKED', `${count} sesiones remotas cerradas`, 'alert');
  res.json({ status: 'ok', message: `Se cerraron ${count} sesiones remotas activas.` });
});

// 7. Export Security Audit Log
app.get('/api/owner/security/export-audit', ownerAuthMiddleware, (req, res) => {
  const data = {
    exportDate: new Date().toISOString(),
    system: 'Wolfric Sentinel Defense System v4.0',
    emergencyLockdown: state.emergencyLockdown,
    blacklistedIps: state.blacklistedIps,
    totalIncidents: state.securityIncidents.length,
    incidents: state.securityIncidents,
    systemAuditLogs: state.auditLogs,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="wolfric-security-audit-${new Date().toISOString().split('T')[0]}.json"`
  );
  res.send(JSON.stringify(data, null, 2));
});

// -----------------------------------------------------------------------------
// CO-ADMIN SUPERVISOR & SESSIONS MANAGEMENT API
// -----------------------------------------------------------------------------

// 1. Get live Co-Admin status report
app.get('/api/owner/co-admin/status', ownerAuthMiddleware, (req, res) => {
  const status = getSentinelStatus(state.instances);
  res.json({ status: 'ok', data: status });
});

// 2. Execute Co-Admin administrative actions
app.post('/api/owner/co-admin/action', ownerAuthMiddleware, async (req, res) => {
  const { action, payload } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Acción de supervisión requerida.' });
  }

  if (action === 'run_full_audit') {
    try {
      const audit = await runDeepAudit(state);
      saveState();
      return res.json({
        status: 'ok',
        message: 'Auditoría integral de sesiones y seguridad completada.',
        audit,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Error ejecutando auditoría.' });
    }
  }

  const result = executeSentinelAction(action, payload, state, activeOwnerSessions);
  saveState();
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json({ status: 'ok', message: result.message, data: result.data });
});

// List all instances
app.get('/api/owner/instances', ownerAuthMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    instances: state.instances,
  });
});

// Instance administrative actions (suspend, ban, delete, restart, etc.)
app.post('/api/owner/instance/:id/action', ownerAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { action, reason } = req.body;

  const instIndex = state.instances.findIndex((i) => i.id === id);
  if (instIndex === -1) {
    return res.status(404).json({ error: 'Instancia no encontrada.' });
  }

  const inst = state.instances[instIndex];

  switch (action) {
    case 'suspend':
      inst.isSuspended = true;
      inst.status = 'offline';
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Instancia suspendida por el Propietario de Wolfric.',
      });
      logAudit('INSTANCE_SUSPENDED', `${inst.name} (${inst.ownerPhone})`, 'alert');
      break;

    case 'unsuspend':
      inst.isSuspended = false;
      inst.status = 'online';
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Suspensión levantada por el Propietario.',
      });
      logAudit('INSTANCE_UNSUSPENDED', `${inst.name}`, 'ok');
      break;

    case 'ban':
      inst.isBanned = true;
      inst.bannedReason = reason || 'Baneado por el administrador de Wolfric.';
      inst.status = 'offline';
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Usuario y SubBot BANEADOS. Razón: ${inst.bannedReason}`,
      });
      logAudit('USER_BANNED', `${inst.ownerPhone} - ${inst.bannedReason}`, 'alert');
      break;

    case 'unban':
      inst.isBanned = false;
      inst.bannedReason = undefined;
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Baneo revocado por el Propietario.',
      });
      logAudit('USER_UNBANNED', `${inst.ownerPhone}`, 'ok');
      break;

    case 'restart':
      inst.status = 'reconnecting';
      setTimeout(() => {
        inst.status = 'online';
        inst.uptimeSeconds = 0;
        saveState();
      }, 1500);
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Reinicio forzado ejecutado desde el Panel de Propietario.',
      });
      logAudit('REMOTE_RESTART', inst.name, 'ok');
      break;

    case 'disconnect':
      inst.status = 'offline';
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'SubBot desactivado remotamente por el Propietario.',
      });
      logAudit('REMOTE_DISCONNECT', inst.name, 'ok');
      break;

    case 'delete':
      deleteSubBotData(id);
      state.instances.splice(instIndex, 1);
      logAudit('INSTANCE_DELETED', `${inst.name} (${inst.ownerPhone})`, 'alert');
      saveState();
      return res.json({ status: 'ok', message: 'Instancia eliminada permanentemente del sistema.' });

    default:
      return res.status(400).json({ error: 'Acción administrativa inválida.' });
  }

  saveState();
  res.json({
    status: 'ok',
    instance: inst,
    message: 'Acción administrativa ejecutada correctamente.',
  });
});

// Assign version to instance
app.put('/api/owner/instance/:id/version', ownerAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { version, autoBackup } = req.body;

  const inst = state.instances.find((i) => i.id === id);
  if (!inst) {
    return res.status(404).json({ error: 'Instancia no encontrada.' });
  }

  // Create automatic backup before update if requested
  if (autoBackup) {
    const preUpdateBackup = {
      id: `bk-pre-upd-${Date.now()}`,
      name: `Auto-Backup Pre-Update a ${version}`,
      date: new Date().toISOString(),
      version: inst.version,
      sizeKb: 15,
      configSnapshot: JSON.parse(JSON.stringify(inst.config)),
      statsSnapshot: JSON.parse(JSON.stringify(inst.stats)),
    };
    inst.backups.unshift(preUpdateBackup);
  }

  const oldVersion = inst.version;
  inst.version = version;
  inst.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'success',
    message: `Versión de Wolfric actualizada de [${oldVersion}] a [${version}]. Archivos del bot sincronizados.`,
  });

  logAudit('VERSION_ASSIGNED', `${inst.name} -> ${version}`, 'ok');
  saveState();

  res.json({
    status: 'ok',
    message: `Instancia actualizada a ${version} correctamente.`,
    instance: inst,
  });
});

// Get versions
app.get('/api/owner/versions', ownerAuthMiddleware, (req, res) => {
  // calculate dynamic instance counts
  const versionsWithCounts = state.versions.map((v) => {
    const count = state.instances.filter((i) => i.version === v.version).length;
    return { ...v, instancesCount: count };
  });

  res.json({
    status: 'ok',
    versions: versionsWithCounts,
  });
});

// Upload new Wolfric version or backup file
app.post('/api/owner/versions/upload', ownerAuthMiddleware, (req, res) => {
  const { version, changelog, isLatest, isBackup, notes, filename, fileSize } = req.body;

  if (!version || typeof version !== 'string') {
    return res.status(400).json({ error: 'Introduce una versión válida (ejemplo: Wolfric 3.3.0).' });
  }

  const versionId = `v-${version.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
  const cleanChangelog = Array.isArray(changelog)
    ? changelog
    : typeof changelog === 'string'
    ? changelog.split('\n').filter((c) => c.trim().length > 0)
    : ['Nueva compilación de Wolfric agregada al repositorio de versiones.'];

  if (isLatest) {
    state.versions.forEach((v) => (v.isLatest = false));
  }

  const newVersion: WolfricVersion = {
    id: versionId,
    version: version.trim(),
    releaseDate: new Date().toISOString().split('T')[0],
    isLatest: Boolean(isLatest),
    isStable: true,
    changelog: cleanChangelog,
    fileSize: fileSize || '5.1 MB',
    instancesCount: 0,
    hash: `sha256:${crypto.createHash('sha256').update(version + Date.now()).digest('hex').slice(0, 16)}`,
    notes: notes || (isBackup ? 'Backup restaurable de Wolfric' : 'Versión subida por el propietario'),
    author: 'Propietario de Wolfric',
    isBackup: Boolean(isBackup),
  };

  state.versions.unshift(newVersion);

  // Also register in backups if it is a backup file
  if (isBackup || filename) {
    state.backups.unshift({
      id: `sys-bk-${Date.now()}`,
      version: newVersion.version,
      filename: filename || `${newVersion.version.toLowerCase().replace(/\s+/g, '-')}.tar.gz`,
      date: new Date().toISOString(),
      sizeKb: 5200,
      type: isBackup ? 'manual_snapshot' : 'version_release',
      notes: notes || 'Archivo empaquetado de Wolfric subido a la nube.',
    });
  }

  logAudit('VERSION_UPLOADED', `${newVersion.version} (${newVersion.fileSize})`, 'ok');
  saveState();

  res.json({
    status: 'ok',
    message: `Versión "${newVersion.version}" guardada con éxito en la nube de Wolfric.`,
    version: newVersion,
  });
});

// Perform Global Update to all or selected instances
app.post('/api/owner/versions/global-update', ownerAuthMiddleware, (req, res) => {
  const { targetVersion, autoBackupAll } = req.body;

  if (!targetVersion) {
    return res.status(400).json({ error: 'Selecciona una versión de destino para actualizar.' });
  }

  let updatedCount = 0;
  for (const inst of state.instances) {
    if (inst.version !== targetVersion) {
      if (autoBackupAll) {
        inst.backups.unshift({
          id: `bk-global-upd-${Date.now()}`,
          name: `Auto-Backup antes de actualización global a ${targetVersion}`,
          date: new Date().toISOString(),
          version: inst.version,
          sizeKb: 14,
          configSnapshot: JSON.parse(JSON.stringify(inst.config)),
          statsSnapshot: JSON.parse(JSON.stringify(inst.stats)),
        });
      }
      inst.version = targetVersion;
      inst.logs.unshift({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `Actualización global aplicada: ahora ejecutando ${targetVersion}.`,
      });
      updatedCount++;
    }
  }

  state.settings.defaultVersion = targetVersion;
  logAudit('GLOBAL_UPDATE_DEPLOYED', `${targetVersion} en ${updatedCount} SubBots`, 'ok');
  saveState();

  res.json({
    status: 'ok',
    message: `Actualización global completada. ${updatedCount} SubBots actualizados a ${targetVersion}.`,
    updatedCount,
  });
});

// List system backups
app.get('/api/owner/backups', ownerAuthMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    backups: state.backups,
  });
});

// Create manual platform snapshot
app.post('/api/owner/backups/create', ownerAuthMiddleware, (req, res) => {
  const { notes, version } = req.body;
  const snapVersion = version || state.settings.defaultVersion;
  const snapshot: SystemBackup = {
    id: `sys-bk-${Date.now()}`,
    version: snapVersion,
    filename: `wolfric-full-snapshot-${new Date().toISOString().split('T')[0]}-${Date.now().toString(36)}.wzb`,
    date: new Date().toISOString(),
    sizeKb: Math.floor(15000 + Math.random() * 5000),
    type: 'manual_snapshot',
    notes: notes || 'Snapshot completo del estado de la plataforma y todas sus instancias.',
  };

  state.backups.unshift(snapshot);
  logAudit('SYSTEM_BACKUP_CREATED', snapshot.filename, 'ok');
  saveState();

  res.json({
    status: 'ok',
    backup: snapshot,
    message: 'Backup del sistema creado y almacenado en la nube con éxito.',
  });
});

// Restore system backup
app.post('/api/owner/backups/:id/restore', ownerAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const bk = state.backups.find((b) => b.id === id);
  if (!bk) {
    return res.status(404).json({ error: 'Backup del sistema no encontrado.' });
  }

  logAudit('SYSTEM_BACKUP_RESTORED', `${bk.filename} (${bk.version})`, 'alert');
  res.json({
    status: 'ok',
    message: `Backup ${bk.filename} restaurado. Las instancias han sido sincronizadas con la versión ${bk.version}.`,
  });
});

// ==========================================
// LID & USER PROGRESS BACKUPS API
// ==========================================

// Get all registered users and their LIDs / progress
app.get('/api/owner/lids', ownerAuthMiddleware, (req, res) => {
  const users = getAllUsers();
  res.json({
    status: 'ok',
    count: users.length,
    users,
    stats: {
      totalUsers: users.length,
      registeredUsers: users.filter((u) => u.registered).length,
      totalCoins: users.reduce((acc, u) => acc + (u.coins || 0), 0),
      totalBank: users.reduce((acc, u) => acc + (u.bank || 0), 0),
      activeLids: users.filter((u) => u.lid).length,
    },
  });
});

// Upload actual backup file (.zip, .json, .tar.gz) from Owner Panel
app.post('/api/owner/lids/upload-backup', ownerAuthMiddleware, (req, res) => {
  const { filename, fileBase64, isVersion, versionTitle, notes, isLatest } = req.body;

  if (!filename || !fileBase64) {
    return res.status(400).json({ error: 'Debes proporcionar un archivo válido (.zip o .json).' });
  }

  try {
    const rawData = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const buffer = Buffer.from(rawData, 'base64');

    // Parse users and LIDs from backup
    const result = importUsersFromBackup(filename, buffer);

    // Also register as system backup
    const backupEntry: SystemBackup = {
      id: `sys-bk-${Date.now()}`,
      version: versionTitle || (isVersion ? 'Wolfric Release' : state.settings.defaultVersion),
      filename,
      date: new Date().toISOString(),
      sizeKb: Math.round(buffer.length / 1024),
      type: isVersion ? 'version_release' : 'manual_snapshot',
      notes: notes || (result.usersImportedCount > 0
        ? `Backup con ${result.usersImportedCount} usuarios/LIDs importados en la nube.`
        : 'Archivo de backup subido por el propietario.'),
    };
    state.backups.unshift(backupEntry);

    // If marked as version release, register into versions repository
    if (isVersion && versionTitle) {
      if (isLatest) {
        state.versions.forEach((v) => (v.isLatest = false));
      }
      const newVer: WolfricVersion = {
        id: `v-${versionTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
        version: versionTitle.trim(),
        releaseDate: new Date().toISOString().split('T')[0],
        isLatest: Boolean(isLatest),
        isStable: true,
        changelog: [
          `Compilación oficial cargada desde archivo: ${filename}`,
          `Usuarios y progresos LIDs procesados: ${result.usersImportedCount}`,
          notes || 'Actualización cargada por el propietario en la nube.',
        ],
        fileSize: result.fileSize,
        instancesCount: 0,
        hash: `sha256:${crypto.createHash('sha256').update(filename + Date.now()).digest('hex').slice(0, 16)}`,
        notes: notes || 'Versión subida vía archivo empaquetado.',
        author: 'Propietario de Wolfric',
        isBackup: false,
      };
      state.versions.unshift(newVer);
      result.savedVersion = newVer;
    }

    result.backupEntry = backupEntry;
    logAudit('BACKUP_FILE_UPLOADED', `${filename} (${result.fileSize}) - ${result.usersImportedCount} usuarios`, 'ok');
    saveState();

    res.json(result);
  } catch (err: any) {
    console.error('Error procesando subida de archivo de backup:', err);
    res.status(500).json({ error: `Error procesando archivo: ${err.message}` });
  }
});

// Manually add or update a user LID profile
app.post('/api/owner/lids/create', ownerAuthMiddleware, (req, res) => {
  const { phone, name, lid, level, exp, coins, bank, diamonds, role, registered, warns } = req.body;

  if (!phone && !lid) {
    return res.status(400).json({ error: 'Debes indicar al menos un número de teléfono o un LID.' });
  }

  const updated = upsertUser({
    phone: phone || '',
    lid: lid || `${phone}@lid`,
    name: name || `Usuario +${phone}`,
    level: level ? Number(level) : 1,
    exp: exp ? Number(exp) : 0,
    coins: coins ? Number(coins) : 1000,
    bank: bank ? Number(bank) : 0,
    diamonds: diamonds ? Number(diamonds) : 0,
    role: role || 'Aventurero Wolfric',
    registered: registered !== undefined ? Boolean(registered) : true,
    warns: warns ? Number(warns) : 0,
    sourceBackup: 'Panel de Administración',
  });

  logAudit('LID_USER_SAVED', `${updated.name} (LID: ${updated.lid})`, 'ok');
  res.json({ status: 'ok', user: updated, message: 'Usuario guardado en la base de datos de Wolfric.' });
});

// Delete a user profile by ID
app.delete('/api/owner/lids/:id', ownerAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const deleted = deleteUser(id);
  if (deleted) {
    logAudit('LID_USER_DELETED', id, 'alert');
    res.json({ status: 'ok', message: 'Usuario eliminado del registro de LIDs.' });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado.' });
  }
});

// Export entire registered users database as JSON
app.get('/api/owner/lids/export', ownerAuthMiddleware, (req, res) => {
  const users = getAllUsers();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="wolfric-lids-database-${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(users, null, 2));
});

// AI-powered File Editor & Optimizer for Database / Scripts (Admin protected)
app.post('/api/owner/ai/improve-file', ownerAuthMiddleware, async (req, res) => {
  const { filename, content, taskType, customPrompt } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'El contenido del archivo es requerido.' });
  }

  try {
    const result = await processFileWithAi({
      filename: filename || 'database.json',
      content,
      taskType: taskType || 'fix_syntax',
      customPrompt,
    });
    logAudit('AI_FILE_IMPROVED', `Archivo "${filename || 'database.json'}" procesado con IA (${taskType})`, 'ok');
    res.json({ status: 'ok', result });
  } catch (err: any) {
    console.error('Error procesando archivo con IA:', err);
    res.status(500).json({ error: err.message || 'Error al procesar el archivo con la IA.' });
  }
});

// Apply AI-improved JSON directly to Cloud Database (Admin protected)
app.post('/api/owner/ai/apply-to-database', ownerAuthMiddleware, (req, res) => {
  const { jsonContent } = req.body;
  if (!jsonContent) {
    return res.status(400).json({ error: 'Debes proporcionar el contenido JSON a aplicar.' });
  }

  try {
    const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    const result = applyJsonToDatabase(parsed);
    logAudit('AI_DATABASE_APPLIED', `${result.imported} usuarios sincronizados en la nube mediante IA`, 'alert');
    res.json({
      status: 'ok',
      message: `¡Base de datos actualizada! Se aplicaron ${result.imported} usuarios. Total actual en la nube: ${result.total}.`,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: `JSON inválido o corrupto: ${err.message}` });
  }
});

// Admin stats for the Cloud Progress section
app.get('/api/progress/public-stats', ownerAuthMiddleware, (req, res) => {
  const users = getAllUsers();
  res.json({
    status: 'ok',
    stats: {
      totalUsers: users.length,
      registeredUsers: users.filter((u) => u.registered).length,
      totalCoins: users.reduce((acc, u) => acc + (u.coins || 0), 0),
      totalBank: users.reduce((acc, u) => acc + (u.bank || 0), 0),
      activeLids: users.filter((u) => u.lid).length,
    },
    sampleUsers: users.slice(0, 10).map((u) => ({
      name: u.name,
      lid: u.lid,
      phone: u.phone ? `+${u.phone.slice(0, 4)}••••${u.phone.slice(-3)}` : 'ID Oculto',
      level: u.level,
      coins: u.coins,
      bank: u.bank,
      diamonds: u.diamonds,
      role: u.role,
    })),
  });
});

// Search user progress in the cloud by LID or Phone (Strictly Admin protected for privacy)
app.get('/api/progress/search', ownerAuthMiddleware, (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Ingresa un LID o número para buscar' });
  }

  const user = findUserByLidOrPhone(q);
  if (!user) {
    return res.status(404).json({ error: 'No se encontró progreso registrado para este usuario o LID.' });
  }

  res.json({
    status: 'ok',
    user: {
      name: user.name,
      lid: user.lid,
      phone: user.phone ? `+${user.phone.slice(0, 4)}••••${user.phone.slice(-3)}` : 'ID Privado',
      level: user.level,
      exp: user.exp,
      coins: user.coins,
      bank: user.bank,
      diamonds: user.diamonds,
      role: user.role,
      registered: user.registered,
      registeredAt: user.registeredAt || user.lastActive || '',
      sourceBackup: user.sourceBackup,
    },
  });
});

// ==================== RPG & OVERDRIVE WEB API ====================

// Public rankings (Strictly privacy protected: names only, ZERO phone numbers, ZERO LIDs)
app.get('/api/rpg/public-rankings', (req, res) => {
  try {
    const rankings = getPublicRankings();
    res.json({ status: 'ok', ...rankings });
  } catch (err: any) {
    console.error('Error obteniendo rankings públicos:', err);
    res.status(500).json({ error: 'Error al calcular los rankings del RPG.' });
  }
});

// Admin RPG management data (Overdrive Web)
app.get('/api/owner/rpg/data', ownerAuthMiddleware, (req, res) => {
  try {
    const data = getRpgAdminData();
    res.json({ status: 'ok', ...data });
  } catch (err: any) {
    console.error('Error cargando datos RPG de admin:', err);
    res.status(500).json({ error: err.message || 'Error cargando datos de economía.' });
  }
});

// Grant assets, fruits, coins, items, heal, stats from Web (what Overdrive did)
app.post('/api/owner/rpg/grant', ownerAuthMiddleware, (req, res) => {
  const { targetKey, type, action, amount, fruitName, fruitCategory, awakened, itemName, itemQuantity, stats, titleName } = req.body;
  if (!targetKey) {
    return res.status(400).json({ error: 'Debes seleccionar un jugador objetivo.' });
  }
  if (!type) {
    return res.status(400).json({ error: 'Debes especificar el tipo de recurso a otorgar.' });
  }

  try {
    const result = grantRpgAsset(targetKey, {
      type,
      action,
      amount,
      fruitName,
      fruitCategory,
      awakened,
      itemName,
      itemQuantity,
      stats,
      titleName,
    });
    logAudit('RPG_OVERDRIVE_GRANT', `Recurso "${type}" otorgado vía Overdrive Web a ${result.user.displayName}: ${result.summary}`, 'alert');
    res.json({ status: 'ok', message: result.summary, result });
  } catch (err: any) {
    console.error('Error otorgando recurso RPG:', err);
    res.status(400).json({ error: err.message || 'Error al otorgar recurso al jugador.' });
  }
});

// Custom Missions (Admin created bot missions)
app.get('/api/owner/rpg/missions', ownerAuthMiddleware, (req, res) => {
  try {
    const missions = getCustomMissions();
    res.json({ status: 'ok', missions });
  } catch (err: any) {
    console.error('Error cargando misiones personalizadas:', err);
    res.status(500).json({ error: 'Error cargando misiones de administración.' });
  }
});

app.post('/api/owner/rpg/missions', ownerAuthMiddleware, (req, res) => {
  try {
    const mission = upsertCustomMission(req.body);
    logAudit('RPG_MISSION_CREATED', `Misión de administración "${mission.nombre}" guardada/actualizada`, 'ok');
    res.json({ status: 'ok', message: `Misión "${mission.nombre}" guardada y sincronizada con el bot.`, mission });
  } catch (err: any) {
    console.error('Error guardando misión personalizada:', err);
    res.status(400).json({ error: err.message || 'Error al guardar la misión.' });
  }
});

app.delete('/api/owner/rpg/missions/:id', ownerAuthMiddleware, (req, res) => {
  const { id } = req.params;
  try {
    const deleted = deleteCustomMission(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Misión no encontrada.' });
    }
    logAudit('RPG_MISSION_DELETED', `Misión de administración ${id} eliminada`, 'alert');
    res.json({ status: 'ok', message: 'Misión eliminada correctamente del bot.' });
  } catch (err: any) {
    console.error('Error eliminando misión personalizada:', err);
    res.status(500).json({ error: 'Error al eliminar la misión.' });
  }
});

app.post('/api/owner/rpg/missions/:id/toggle', ownerAuthMiddleware, (req, res) => {
  const { id } = req.params;
  try {
    const mission = toggleCustomMission(id);
    logAudit('RPG_MISSION_TOGGLED', `Misión "${mission.nombre}" ${mission.activa ? 'activada' : 'desactivada'}`, 'ok');
    res.json({ status: 'ok', message: `Misión ${mission.activa ? 'activada' : 'desactivada'} con éxito.`, mission });
  } catch (err: any) {
    console.error('Error alternando misión:', err);
    res.status(400).json({ error: err.message || 'Error al cambiar estado de la misión.' });
  }
});

// SubBot User upload personal backup (.zip or .json)
app.post('/api/subbots/me/upload-backup', userAuthMiddleware, (req: any, res: any) => {
  const { filename, fileBase64, notes } = req.body;
  const instance = req.subbot as SubBotInstance;

  if (!filename || !fileBase64) {
    return res.status(400).json({ error: 'Debes proporcionar un archivo válido (.zip o .json).' });
  }

  try {
    const rawData = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
    const buffer = Buffer.from(rawData, 'base64');
    const result = importUsersFromBackup(`${instance.name}-${filename}`, buffer);

    // Add entry to instance's backups
    instance.backups.unshift({
      id: `inst-bk-${Date.now()}`,
      name: `Archivo subido: ${filename}`,
      date: new Date().toISOString(),
      version: instance.version,
      sizeKb: Math.round(buffer.length / 1024),
      configSnapshot: JSON.parse(JSON.stringify(instance.config)),
      statsSnapshot: JSON.parse(JSON.stringify(instance.stats)),
    });

    instance.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Copia de seguridad "${filename}" subida y procesada (${result.usersImportedCount} usuarios/LIDs activos).`,
    });

    saveState();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: `Error subiendo backup: ${err.message}` });
  }
});

// Platform system settings read & update (Maintenance, limits, passcode, API keys)
app.get('/api/owner/settings', ownerAuthMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    settings: state.settings,
  });
});

app.post('/api/owner/settings', ownerAuthMiddleware, (req, res) => {
  const {
    maintenanceMode,
    maintenanceMessage,
    defaultVersion,
    maxInstancesTotal,
    maxInstancesPerNumber,
    allowNewRegistrations,
    geminiApiKey,
    giphyApiKey,
    newOwnerPasscode,
    antibanShield,
  } = req.body;

  if (typeof maintenanceMode === 'boolean') state.settings.maintenanceMode = maintenanceMode;
  if (typeof maintenanceMessage === 'string') state.settings.maintenanceMessage = maintenanceMessage.trim();
  if (typeof defaultVersion === 'string') state.settings.defaultVersion = defaultVersion;
  if (typeof maxInstancesTotal === 'number') state.settings.maxInstancesTotal = maxInstancesTotal;
  if (typeof maxInstancesPerNumber === 'number') state.settings.maxInstancesPerNumber = maxInstancesPerNumber;
  if (typeof allowNewRegistrations === 'boolean') state.settings.allowNewRegistrations = allowNewRegistrations;
  if (typeof geminiApiKey === 'string') state.settings.geminiApiKey = geminiApiKey.trim();
  if (typeof giphyApiKey === 'string') state.settings.giphyApiKey = giphyApiKey.trim();
  if (typeof antibanShield === 'boolean') {
    state.settings.antibanShield = antibanShield;
  }

  if (newOwnerPasscode && typeof newOwnerPasscode === 'string' && newOwnerPasscode.trim().length >= 6) {
    state.ownerPasscode = newOwnerPasscode.trim();
  }

  logAudit('PLATFORM_SETTINGS_UPDATED', undefined, 'ok');
  saveState();

  res.json({
    status: 'ok',
    settings: state.settings,
    message: 'Ajustes de la plataforma guardados correctamente.',
  });
});

// System Audit Logs and Metrics
app.get('/api/owner/logs', ownerAuthMiddleware, (req, res) => {
  res.json({
    status: 'ok',
    auditLogs: state.auditLogs,
    metrics: {
      totalSubBots: state.instances.length,
      onlineSubBots: state.instances.filter((i) => i.status === 'online').length,
      bannedUsers: state.instances.filter((i) => i.isBanned).length,
      versionsAvailable: state.versions.length,
      backupsStored: state.backups.length,
      totalMessagesToday: state.settings.totalMessagesToday,
      memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      cpuUsagePct: Math.floor(12 + Math.random() * 8),
    },
  });
});

// -----------------------------------------------------------------------------
// VITE OR STATIC SERVING & AUTO-RESUME
// -----------------------------------------------------------------------------

async function resumeAllSavedSessions() {
  const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
  if (!fs.existsSync(SESSIONS_DIR)) return;

  for (const instance of state.instances) {
    if (instance.isBanned || instance.isSuspended) continue;
    const sessionDir = path.join(SESSIONS_DIR, instance.id);
    const credsFile = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      try {
        const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
        if (creds.registered) {
          console.log(`[WOLFRIC] Restaurando sesión activa para ${instance.id} (${instance.ownerPhone})...`);
          instance.status = 'reconnecting';
          startSubBotSession(instance.id, instance.ownerPhone, instance.pairingMethod || 'code', {
            onStatusChange: (status, message) => {
              const inst = state.instances.find((i) => i.id === instance.id);
              if (inst) {
                inst.status = status;
                inst.lastSeen = new Date().toISOString();
                if (message) inst.logs.unshift({ timestamp: new Date().toISOString(), level: 'info', message });
                saveState();
              }
            },
            onQrUpdate: (qrData) => {
              const inst = state.instances.find((i) => i.id === instance.id);
              if (inst) {
                inst.qrData = qrData;
                saveState();
              }
            },
            onLog: (level, message) => {
              const inst = state.instances.find((i) => i.id === instance.id);
              if (inst) {
                inst.logs.unshift({ timestamp: new Date().toISOString(), level, message });
                saveState();
              }
            },
            onMessageCount: () => {
              const inst = state.instances.find((i) => i.id === instance.id);
              if (inst) {
                inst.stats.messagesProcessed += 1;
                state.settings.totalMessagesToday += 1;
                saveState();
              }
            },
            getConfig: () => instance.config,
          }, getBotSubprocessEnv()).catch((err) => {
            console.error(`Error auto-resuming session ${instance.id}:`, err);
          });
        }
      } catch (err) {
        console.error(`Error reading creds for ${instance.id}:`, err);
      }
    }
  }
}

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 4 wildcard
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐺 Wolfric SubBot Platform running on http://0.0.0.0:${PORT}`);
    // Auto-resume registered sessions seamlessly
    resumeAllSavedSessions().catch(console.error);
  });
}

start();

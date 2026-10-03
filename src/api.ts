import type {
  SubBotInstance,
  WolfricVersion,
  PlatformSettings,
  SystemAuditLog,
  SystemBackup,
  SecurityStatusReport,
  SecurityIncident,
} from './types.js';

const API_BASE = '/api';

export async function getPlatformStatus(): Promise<{
  status: string;
  maintenance: boolean;
  maintenanceMessage: string;
  allowRegistrations: boolean;
  defaultVersion: string;
  stats: {
    totalBots: number;
    onlineBots: number;
    totalMessages: number;
    uptimeSeconds: number;
  };
  latestVersion: string;
}> {
  const res = await fetch(`${API_BASE}/platform/status`);
  if (!res.ok) throw new Error('Error al consultar estado de la plataforma');
  return res.json();
}

// User SubBot API
export async function registerSubBot(data: {
  phone: string;
  customAlias?: string;
  pairingMethod: 'code' | 'qr';
  password?: string;
  pin?: string;
}): Promise<{
  status: string;
  instance: SubBotInstance;
  token: string;
  userPin: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/subbots/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al crear SubBot');
  return json;
}

export async function loginSubBot(data: {
  phone?: string;
  pin?: string;
  password?: string;
  token?: string;
}): Promise<{
  status: string;
  instance: SubBotInstance;
  token: string;
}> {
  const res = await fetch(`${API_BASE}/subbots/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al iniciar sesión en el SubBot');
  return json;
}

export async function getMySubBot(token: string): Promise<{
  status: string;
  instance: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/subbots/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener datos del SubBot');
  return json;
}

export async function triggerPairSubBot(token: string): Promise<{
  status: string;
  message: string;
  instance: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/subbots/me/pair`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error en la vinculación');
  return json;
}

export async function triggerSubBotAction(
  token: string,
  action: 'restart' | 'disconnect' | 'reconnect' | 'repair' | 'change-phone' | 'delete' | 'unbind',
  payload?: { phone?: string }
): Promise<{
  status: string;
  instance: SubBotInstance;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/subbots/me/action`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al ejecutar acción');
  return json;
}

export async function updateSubBotConfig(
  token: string,
  payload: {
    config?: Partial<SubBotInstance['config']>;
    customAlias?: string;
    newPassword?: string;
    newPin?: string;
  }
): Promise<{
  status: string;
  message: string;
  instance: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/subbots/me/config`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al guardar configuración');
  return json;
}

export async function createUserBackup(
  token: string,
  name?: string
): Promise<{
  status: string;
  backup: any;
  instance: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/subbots/me/backup`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al crear backup');
  return json;
}

export async function restoreUserBackup(
  token: string,
  backupId: string
): Promise<{
  status: string;
  message: string;
  instance: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/subbots/me/restore-backup`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ backupId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al restaurar backup');
  return json;
}

// -----------------------------------------------------------------------------
// OWNER API
// -----------------------------------------------------------------------------

export async function ownerLogin(passcode: string): Promise<{
  status: string;
  token: string;
  expiresIn?: number;
  emergencyLockdown?: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Clave de propietario incorrecta');
  return json;
}

export async function getSecurityStatus(ownerKey: string): Promise<{
  status: string;
  security: SecurityStatusReport;
}> {
  const res = await fetch(`${API_BASE}/owner/security/status`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener estado de ciberseguridad');
  return json;
}

export async function verifySecurityPin(ownerKey: string, pin: string): Promise<{
  status: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/security/verify-pin`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'PIN de seguridad incorrecto');
  return json;
}

export async function toggleEmergencyLockdown(
  ownerKey: string,
  enable: boolean,
  pin?: string,
  reason?: string
): Promise<{
  status: string;
  emergencyLockdown: boolean;
  message: string;
}> {
  const headers: Record<string, string> = {
    'x-owner-key': ownerKey,
    'Content-Type': 'application/json',
  };
  if (pin) headers['x-owner-pin'] = pin;

  const res = await fetch(`${API_BASE}/owner/security/toggle-lockdown`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ enable, reason, securityPin: pin }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al cambiar protocolo de emergencia');
  return json;
}

export async function changeSecurityPin(
  ownerKey: string,
  currentPin: string,
  newPin: string
): Promise<{
  status: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/security/change-pin`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPin, newPin }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al actualizar PIN maestro');
  return json;
}

export async function unblockIpAddress(
  ownerKey: string,
  ip: string,
  pin?: string
): Promise<{
  status: string;
  message: string;
}> {
  const headers: Record<string, string> = {
    'x-owner-key': ownerKey,
    'Content-Type': 'application/json',
  };
  if (pin) headers['x-owner-pin'] = pin;

  const res = await fetch(`${API_BASE}/owner/security/unblock-ip`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ip, securityPin: pin }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al desbloquear IP');
  return json;
}

export async function terminateAllAdminSessions(ownerKey: string): Promise<{
  status: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/security/kill-sessions`, {
    method: 'POST',
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al revocar sesiones remotas');
  return json;
}


export async function getOwnerInstances(ownerKey: string): Promise<{
  status: string;
  instances: SubBotInstance[];
}> {
  const res = await fetch(`${API_BASE}/owner/instances`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener instancias');
  return json;
}

export async function ownerInstanceAction(
  ownerKey: string,
  instanceId: string,
  action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'restart' | 'disconnect' | 'delete',
  reason?: string
): Promise<{
  status: string;
  message: string;
  instance?: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/owner/instance/${instanceId}/action`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, reason }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al ejecutar acción administrativa');
  return json;
}

export async function assignInstanceVersion(
  ownerKey: string,
  instanceId: string,
  version: string,
  autoBackup: boolean
): Promise<{
  status: string;
  message: string;
  instance: SubBotInstance;
}> {
  const res = await fetch(`${API_BASE}/owner/instance/${instanceId}/version`, {
    method: 'PUT',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version, autoBackup }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al asignar versión');
  return json;
}

export async function getOwnerVersions(ownerKey: string): Promise<{
  status: string;
  versions: WolfricVersion[];
}> {
  const res = await fetch(`${API_BASE}/owner/versions`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener versiones');
  return json;
}

export async function uploadWolfricVersion(
  ownerKey: string,
  payload: {
    version: string;
    changelog: string[];
    isLatest?: boolean;
    isBackup?: boolean;
    notes?: string;
    filename?: string;
    fileSize?: string;
  }
): Promise<{
  status: string;
  message: string;
  version: WolfricVersion;
}> {
  const res = await fetch(`${API_BASE}/owner/versions/upload`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al subir versión');
  return json;
}

export async function deployGlobalUpdate(
  ownerKey: string,
  targetVersion: string,
  autoBackupAll: boolean
): Promise<{
  status: string;
  message: string;
  updatedCount: number;
}> {
  const res = await fetch(`${API_BASE}/owner/versions/global-update`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetVersion, autoBackupAll }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error en actualización global');
  return json;
}

export async function getOwnerBackups(ownerKey: string): Promise<{
  status: string;
  backups: SystemBackup[];
}> {
  const res = await fetch(`${API_BASE}/owner/backups`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener backups');
  return json;
}

export async function createSystemSnapshot(
  ownerKey: string,
  payload: { notes?: string; version?: string }
): Promise<{
  status: string;
  message: string;
  backup: SystemBackup;
}> {
  const res = await fetch(`${API_BASE}/owner/backups/create`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al crear snapshot');
  return json;
}

export async function restoreSystemBackup(
  ownerKey: string,
  backupId: string
): Promise<{
  status: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/backups/${backupId}/restore`, {
    method: 'POST',
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al restaurar backup');
  return json;
}

export async function getOwnerLogsAndMetrics(ownerKey: string): Promise<{
  status: string;
  auditLogs: SystemAuditLog[];
  metrics: {
    totalSubBots: number;
    onlineSubBots: number;
    bannedUsers: number;
    versionsAvailable: number;
    backupsStored: number;
    totalMessagesToday: number;
    memoryRssMb: number;
    cpuUsagePct: number;
  };
}> {
  const res = await fetch(`${API_BASE}/owner/logs`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener logs');
  return json;
}

export async function getOwnerSettings(ownerKey: string): Promise<{
  status: string;
  settings: PlatformSettings;
}> {
  const res = await fetch(`${API_BASE}/owner/settings`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener configuración');
  return json;
}

export async function updateOwnerSettings(
  ownerKey: string,
  payload: Partial<PlatformSettings> & { newOwnerPasscode?: string }
): Promise<{
  status: string;
  settings: PlatformSettings;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/settings`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al actualizar configuración');
  return json;
}

// -----------------------------------------------------------------------------
// LID & CLOUD PROGRESS BACKUPS API
// -----------------------------------------------------------------------------

export async function getOwnerLids(ownerKey: string): Promise<{
  status: string;
  count: number;
  users: import('./types.js').LidUserProfile[];
  stats: {
    totalUsers: number;
    registeredUsers: number;
    totalCoins: number;
    totalBank: number;
    activeLids: number;
  };
}> {
  const res = await fetch(`${API_BASE}/owner/lids`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener usuarios y LIDs');
  return json;
}

export async function uploadOwnerBackupFile(
  ownerKey: string,
  payload: {
    filename: string;
    fileBase64: string;
    isVersion?: boolean;
    versionTitle?: string;
    notes?: string;
    isLatest?: boolean;
  }
): Promise<import('./types.js').BackupUploadResult> {
  const res = await fetch(`${API_BASE}/owner/lids/upload-backup`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al subir archivo de backup');
  return json;
}

export async function createOwnerLidUser(
  ownerKey: string,
  user: Partial<import('./types.js').LidUserProfile>
): Promise<{
  status: string;
  user: import('./types.js').LidUserProfile;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/lids/create`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al guardar usuario en la base de datos');
  return json;
}

export async function deleteOwnerLidUser(
  ownerKey: string,
  id: string
): Promise<{
  status: string;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/owner/lids/${id}`, {
    method: 'DELETE',
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al eliminar usuario');
  return json;
}

export async function uploadSubbotBackupFile(
  token: string,
  payload: { filename: string; fileBase64: string; notes?: string }
): Promise<import('./types.js').BackupUploadResult> {
  const res = await fetch(`${API_BASE}/subbots/me/upload-backup`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al subir backup a la nube');
  return json;
}

// -----------------------------------------------------------------------------
// AI FILE EDITOR API (GEMINI POWERED)
// -----------------------------------------------------------------------------

export interface AiImproveResult {
  improvedContent: string;
  summary: string;
  taskApplied: string;
  originalSize: number;
  improvedSize: number;
  isValidJson: boolean;
}

export async function improveFileWithAi(
  ownerKey: string,
  payload: {
    filename: string;
    content: string;
    taskType: 'clean_duplicates' | 'balance_economy' | 'fix_syntax' | 'rpg_upgrade' | 'custom';
    customPrompt?: string;
  }
): Promise<{
  status: string;
  result: AiImproveResult;
}> {
  const res = await fetch(`${API_BASE}/owner/ai/improve-file`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al procesar archivo con la IA');
  return json;
}

export async function applyAiToDatabase(
  ownerKey: string,
  jsonContent: string
): Promise<{
  status: string;
  message: string;
  imported: number;
  total: number;
}> {
  const res = await fetch(`${API_BASE}/owner/ai/apply-to-database`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jsonContent }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al aplicar cambios a la base de datos');
  return json;
}

// ==================== RPG & OVERDRIVE WEB API CLIENT ====================

export async function getPublicRankings(): Promise<{
  status: string;
  bountyTop: { rank: number; name: string; bounty: number; level: number; fruit?: string }[];
  coinsTop: { rank: number; name: string; coins: number; level: number }[];
  prestigeTop: { rank: number; name: string; prestige: number; level: number }[];
  levelTop: { rank: number; name: string; level: number; exp: number }[];
  totalPlayers: number;
  updatedAt: string;
}> {
  const res = await fetch(`${API_BASE}/rpg/public-rankings`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener clasificaciones');
  return json;
}

export async function getOwnerRpgData(ownerKey: string): Promise<{
  status: string;
  players: Array<{
    rawKey: string;
    displayName: string;
    maskedId: string;
    coins: number;
    gems: number;
    bank: number;
    level: number;
    exp: number;
    bounty: number;
    hp: number;
    maxHp: number;
    energy: number;
    fruit: string | null;
    fruitAwakened: boolean;
    inventory: string[];
    stats: { str: number; def: number; agi: number; int: number };
    titles: string[];
    equippedTitle: string | null;
  }>;
  catalog: {
    fruits: Array<{ nombre: string; categoria: string; desc: string }>;
    items: Array<{ id: number; nombre: string; precio: number; tipo: string; desc: string }>;
    missionFields: Array<{ id: string; label: string; icono: string }>;
  };
}> {
  const res = await fetch(`${API_BASE}/owner/rpg/data`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error cargando datos de RPG');
  return json;
}

export async function grantOwnerRpgAsset(
  ownerKey: string,
  payload: {
    targetKey: string;
    type: 'coins' | 'gems' | 'bounty' | 'fruit' | 'item' | 'heal' | 'stats' | 'title';
    action?: 'add' | 'set' | 'remove';
    amount?: number;
    fruitName?: string;
    fruitCategory?: string;
    awakened?: boolean;
    itemName?: string;
    itemQuantity?: number;
    stats?: { str?: number; def?: number; agi?: number; int?: number; maxHp?: number };
    titleName?: string;
  }
): Promise<{ status: string; message: string; result: any }> {
  const res = await fetch(`${API_BASE}/owner/rpg/grant`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al otorgar recurso');
  return json;
}

export async function getOwnerCustomMissions(ownerKey: string): Promise<{
  status: string;
  missions: Array<{
    id: string;
    nombre: string;
    desc: string;
    campo: string;
    meta: number;
    recompensa: {
      coins?: number;
      gems?: number;
      exp?: number;
      bounty?: number;
      fruta?: string;
      item?: string;
    };
    activa: boolean;
    creadaPor?: string;
    fechaCreacion?: string;
  }>;
}> {
  const res = await fetch(`${API_BASE}/owner/rpg/missions`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error cargando misiones');
  return json;
}

export async function saveOwnerCustomMission(
  ownerKey: string,
  mission: any
): Promise<{ status: string; message: string; mission: any }> {
  const res = await fetch(`${API_BASE}/owner/rpg/missions`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mission),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al guardar la misión');
  return json;
}

export async function deleteOwnerCustomMission(
  ownerKey: string,
  id: string
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/owner/rpg/missions/${id}`, {
    method: 'DELETE',
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al eliminar misión');
  return json;
}

export async function toggleOwnerCustomMission(
  ownerKey: string,
  id: string
): Promise<{ status: string; message: string; mission: any }> {
  const res = await fetch(`${API_BASE}/owner/rpg/missions/${id}/toggle`, {
    method: 'POST',
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al cambiar estado de la misión');
  return json;
}

// -----------------------------------------------------------------------------
// CO-ADMIN SUPERVISOR & SESSIONS MANAGEMENT API
// -----------------------------------------------------------------------------

export async function getCoAdminStatus(ownerKey: string): Promise<{
  status: string;
  data: import('./types.js').SentinelAdminStatus;
}> {
  const res = await fetch(`${API_BASE}/owner/co-admin/status`, {
    headers: { 'x-owner-key': ownerKey },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error al obtener estado del Supervisor Co-Admin');
  return json;
}

export async function executeCoAdminAction(
  ownerKey: string,
  action: string,
  payload?: any
): Promise<{
  status: string;
  message: string;
  data?: any;
  audit?: any;
}> {
  const res = await fetch(`${API_BASE}/owner/co-admin/action`, {
    method: 'POST',
    headers: {
      'x-owner-key': ownerKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error ejecutando acción del Supervisor Co-Admin');
  return json;
}



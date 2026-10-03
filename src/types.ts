export type BotStatus = 'online' | 'offline' | 'reconnecting' | 'pairing';

export interface BotConfig {
  prefix: string;
  commandPrefix?: string;
  mode: 'public' | 'private' | 'groups_only';
  autoRead: boolean;
  antiLink: boolean;
  welcomeMessage: boolean;
  welcomeText: string;
  stickerMaker: boolean;
  antiSpam: boolean;
  maxGroups?: number;
  language?: string;
  botBio: string;
  autoBio: boolean;
  reactions: boolean;
  turboMode?: boolean;
}

export interface BotStats {
  messagesProcessed: number;
  commandsExecuted: number;
  activeGroups: number;
  contactsSeen: number;
  pingMs: number;
  memoryMb: number;
}

export interface InstanceBackup {
  id: string;
  name: string;
  date: string;
  version: string;
  sizeKb: number;
  configSnapshot: BotConfig;
  statsSnapshot: BotStats;
}

export interface InstanceLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface SubBotInstance {
  id: string;
  name: string;
  ownerPhone: string;
  customAlias: string;
  status: BotStatus;
  pairingMethod: 'code' | 'qr';
  pairingCode?: string;
  qrCode?: string;
  qrData?: string;
  version: string;
  sessionHash: string; // Secure token hash (no plaintext credential exposed)
  sessionCreatedAt: string;
  lastSeen: string;
  uptimeSeconds: number;
  isBanned: boolean;
  isSuspended: boolean;
  bannedReason?: string;
  userAuthToken: string;
  userPin: string;
  config: BotConfig;
  stats: BotStats;
  backups: InstanceBackup[];
  logs: InstanceLog[];
}

export interface WolfricVersion {
  id: string;
  version: string;
  releaseDate: string;
  isLatest: boolean;
  isStable: boolean;
  changelog: string[];
  fileSize: string;
  instancesCount: number;
  hash: string;
  notes: string;
  author: string;
  isBackup?: boolean;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  target?: string;
  status: 'ok' | 'alert' | 'error';
  ip?: string;
}

export interface SystemBackup {
  id: string;
  version: string;
  filename: string;
  date: string;
  sizeKb: number;
  type: 'version_release' | 'pre_update' | 'manual_snapshot';
  notes: string;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultVersion: string;
  maxInstancesTotal: number;
  maxInstancesPerNumber: number;
  allowNewRegistrations: boolean;
  systemUptimeSeconds: number;
  totalMessagesToday: number;
  geminiApiKey?: string;
  giphyApiKey?: string;
  antibanShield?: boolean;
}

export interface LidUserProfile {
  id: string;
  lid: string;
  jid?: string;
  phone: string;
  name: string;
  registered: boolean;
  registeredAt?: string;
  level: number;
  exp: number;
  coins: number;
  bank: number;
  diamonds: number;
  role: string;
  warns: number;
  banned: boolean;
  sourceBackup?: string;
  lastActive?: string;
  customData?: Record<string, any>;
}

export interface BackupUploadResult {
  status: 'ok' | 'error';
  message: string;
  filename: string;
  fileSize: string;
  detectedType: 'wolfric_zip_archive' | 'user_database_json' | 'session_creds' | 'raw_backup';
  usersImportedCount: number;
  lidsRecognizedCount: number;
  savedVersion?: WolfricVersion;
  backupEntry?: SystemBackup;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  type: 'failed_login' | 'lockout' | 'unauthorized_api' | 'ip_blacklisted' | 'lockdown_triggered' | 'pin_failure';
  ip: string;
  userAgent?: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SentinelSecurityEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'threat';
  category: 'session' | 'registration' | 'access' | 'system';
  message: string;
  target?: string;
  actionTaken?: string;
}

export interface RecentJoinEntry {
  id: string;
  phone: string;
  country: string;
  countryCode: string;
  method: 'code' | 'qr' | 'login';
  joinedAt: string;
  lastSeen: string;
  riskScore: 'safe' | 'observation' | 'quarantined';
  riskReason: string;
  status: 'online' | 'pairing' | 'offline' | 'quarantined';
  ip?: string;
  notes?: string;
}

export interface SentinelAdminStatus {
  enabled: boolean;
  mode: 'autonomous' | 'manual';
  securityScore: number;
  lastAudit: string;
  inspectedToday: number;
  actionsExecuted: number;
  activeSessionsSupervised: number;
  blockedThreats: number;
  systemHealth: {
    memoryStatus: 'optimal' | 'warning' | 'critical';
    socketsHealthy: number;
    socketsUnhealthy: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  recentEvents: SentinelSecurityEvent[];
  recentJoins: RecentJoinEntry[];
  latestAuditSummary?: string;
  recommendations: string[];
  supervisorProfile: {
    name: string;
    role: string;
    status: string;
    clearanceLevel: string;
    version: string;
  };
}

export interface AdminSession {
  tokenPrefix: string;
  createdAt: string;
  lastActive: string;
  ip: string;
  userAgent: string;
  isCurrent: boolean;
  pinVerified: boolean;
}

export interface SecurityStatusReport {
  securityScore: number;
  emergencyLockdown: boolean;
  activeSessionsCount: number;
  blacklistedIps: string[];
  incidents: SecurityIncident[];
  isPinConfigured: boolean;
  activeSessions: AdminSession[];
  failedAttemptsRecent: number;
  bruteForceProtected: boolean;
  cryptoTokensActive: boolean;
}

import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import type { LidUserProfile, BackupUploadResult } from '../src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const USERS_DB_FILE = path.join(DB_DIR, 'wolfric-users-db.json');
const BACKUPS_DIR = path.join(DB_DIR, 'backups');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// In-Memory store of LID registered users
let usersMap = new Map<string, LidUserProfile>();

// Helper to normalize phone / LID string
export function normalizeIdentifier(val: string): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '');
}

export function cleanPhoneDigits(val: string): string {
  if (!val) return '';
  return val.replace(/[^0-9]/g, '');
}

/**
 * Load users from disk
 */
export function loadUserDatabase(): void {
  try {
    if (fs.existsSync(USERS_DB_FILE)) {
      const raw = fs.readFileSync(USERS_DB_FILE, 'utf-8');
      const list: LidUserProfile[] = JSON.parse(raw);
      usersMap.clear();
      for (const u of list) {
        if (u.id) {
          usersMap.set(u.id, u);
        }
      }
      console.log(`[Wolfric UserDB] ${usersMap.size} usuarios y LIDs cargados desde disco.`);
    } else {
      // Initialize with default or empty
      usersMap.clear();
      saveUserDatabase();
    }
  } catch (err) {
    console.error('[Wolfric UserDB] Error cargando base de datos de usuarios:', err);
  }
}

/**
 * Persist users to disk
 */
export function saveUserDatabase(): void {
  try {
    const list = Array.from(usersMap.values());
    fs.writeFileSync(USERS_DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Wolfric UserDB] Error guardando base de datos de usuarios:', err);
  }
}

/**
 * Retrieve all registered users
 */
export function getAllUsers(): LidUserProfile[] {
  return Array.from(usersMap.values());
}

/**
 * Find user by LID, phone number, or JID
 */
export function findUserByLidOrPhone(identifier: string): LidUserProfile | undefined {
  if (!identifier) return undefined;
  const clean = normalizeIdentifier(identifier);
  const digits = cleanPhoneDigits(identifier);

  for (const u of usersMap.values()) {
    if (normalizeIdentifier(u.lid) === clean || normalizeIdentifier(u.id) === clean) {
      return u;
    }
    if (u.jid && normalizeIdentifier(u.jid) === clean) {
      return u;
    }
    if (digits && digits.length >= 8 && cleanPhoneDigits(u.phone) === digits) {
      return u;
    }
  }
  return undefined;
}

/**
 * Create or update a user profile
 */
export function upsertUser(profile: Partial<LidUserProfile> & { phone: string }): LidUserProfile {
  const phoneDigits = cleanPhoneDigits(profile.phone);
  const id = profile.id || `usr-${phoneDigits || Date.now().toString(36)}`;
  const existing = findUserByLidOrPhone(profile.lid || profile.phone) || usersMap.get(id);

  const merged: LidUserProfile = {
    id: existing?.id || id,
    lid: profile.lid || existing?.lid || `${phoneDigits}@lid`,
    jid: profile.jid || existing?.jid || `${phoneDigits}@s.whatsapp.net`,
    phone: phoneDigits || existing?.phone || '',
    name: profile.name || existing?.name || `Usuario +${phoneDigits}`,
    registered: profile.registered !== undefined ? profile.registered : existing ? existing.registered : true,
    registeredAt: profile.registeredAt || existing?.registeredAt || new Date().toISOString(),
    level: profile.level !== undefined ? profile.level : existing?.level ?? 1,
    exp: profile.exp !== undefined ? profile.exp : existing?.exp ?? 0,
    coins: profile.coins !== undefined ? profile.coins : existing?.coins ?? 1000,
    bank: profile.bank !== undefined ? profile.bank : existing?.bank ?? 5000,
    diamonds: profile.diamonds !== undefined ? profile.diamonds : existing?.diamonds ?? 5,
    role: profile.role || existing?.role || 'Aventurero Wolfric',
    warns: profile.warns !== undefined ? profile.warns : existing?.warns ?? 0,
    banned: profile.banned !== undefined ? profile.banned : existing?.banned ?? false,
    sourceBackup: profile.sourceBackup || existing?.sourceBackup || 'Nube Wolfric',
    lastActive: new Date().toISOString(),
    customData: profile.customData || existing?.customData || {},
  };

  usersMap.set(merged.id, merged);
  saveUserDatabase();
  return merged;
}

/**
 * Delete a user profile by ID
 */
export function deleteUser(id: string): boolean {
  const res = usersMap.delete(id);
  if (res) saveUserDatabase();
  return res;
}

/**
 * Parse raw user entry from typical bot database
 */
function parseRawBotUserEntry(key: string, data: any, sourceName: string): LidUserProfile | null {
  if (!data || typeof data !== 'object') return null;

  // Extract phone & JID
  const rawKey = key.trim();
  let phone = cleanPhoneDigits(rawKey);
  let jid = rawKey.includes('@') ? rawKey : `${phone}@s.whatsapp.net`;
  let lid = data.lid || (rawKey.endsWith('@lid') ? rawKey : `${phone}@lid`);

  if (!phone && data.phone) {
    phone = cleanPhoneDigits(String(data.phone));
  }
  if (!phone && data.number) {
    phone = cleanPhoneDigits(String(data.number));
  }

  // If we couldn't derive a phone or LID, skip invalid entry
  if (!phone && !lid) return null;

  const name = data.name || data.pushName || data.username || data.registeredName || `Usuario +${phone || 'Wolf'}`;
  const level = Number(data.level || data.nivel || 1);
  const exp = Number(data.exp || data.experiencia || 0);
  const coins = Number(data.coins || data.money || data.dinero || data.coin || data.limit || 0);
  const bank = Number(data.bank || data.banco || 0);
  const diamonds = Number(data.diamond || data.diamonds || data.diamantes || data.gems || 0);
  const role = data.role || data.rango || 'Guerrero Wolfric';
  const warns = Number(data.warn || data.warns || data.advertencias || 0);
  const banned = Boolean(data.banned || data.baneado || false);
  const registered = Boolean(data.registered || data.registrado || data.reg || true);

  return {
    id: `usr-${phone || lid.replace(/[^a-z0-9]/gi, '')}`,
    lid,
    jid,
    phone,
    name,
    registered,
    registeredAt: data.registeredAt || data.regTime ? new Date(data.registeredAt || data.regTime).toISOString() : new Date().toISOString(),
    level: isNaN(level) ? 1 : Math.max(1, level),
    exp: isNaN(exp) ? 0 : Math.max(0, exp),
    coins: isNaN(coins) ? 1000 : Math.max(0, coins),
    bank: isNaN(bank) ? 0 : Math.max(0, bank),
    diamonds: isNaN(diamonds) ? 0 : Math.max(0, diamonds),
    role,
    warns: isNaN(warns) ? 0 : Math.max(0, warns),
    banned,
    sourceBackup: sourceName,
    lastActive: new Date().toISOString(),
    customData: {
      originalKey: rawKey,
      ...data,
    },
  };
}

/**
 * Parse an uploaded backup file (.zip, .json, .tar.gz) and import users & progress into cloud
 */
export function importUsersFromBackup(
  filename: string,
  buffer: Buffer
): BackupUploadResult {
  let detectedType: BackupUploadResult['detectedType'] = 'raw_backup';
  let importedCount = 0;
  let lidsCount = 0;
  const lowerName = filename.toLowerCase();

  // Save the raw backup file to data/backups/
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const backupFilePath = path.join(BACKUPS_DIR, safeFilename);
  try {
    fs.writeFileSync(backupFilePath, buffer);
  } catch (err) {
    console.error('Error saving raw backup archive:', err);
  }

  // Case 1: .ZIP archive
  if (lowerName.endsWith('.zip')) {
    detectedType = 'wolfric_zip_archive';
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      console.log(`[Wolfric Backup] Analizando ZIP ${filename} con ${zipEntries.length} entradas...`);

      let foundDatabase = false;

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        const entryName = entry.entryName.toLowerCase();

        // Check if entry looks like user database JSON
        if (
          entryName.endsWith('database.json') ||
          entryName.endsWith('users.json') ||
          entryName.endsWith('rpg.json') ||
          entryName.endsWith('db.json') ||
          entryName.endsWith('users_data.json') ||
          entryName.endsWith('usuarios.json') ||
          entryName.endsWith('data.json')
        ) {
          try {
            const content = zip.readAsText(entry);
            const parsed = JSON.parse(content);
            const usersObject = parsed.users || parsed.data?.users || parsed.rpg?.users || parsed;

            if (typeof usersObject === 'object' && usersObject !== null) {
              for (const [key, val] of Object.entries(usersObject)) {
                const user = parseRawBotUserEntry(key, val, filename);
                if (user) {
                  usersMap.set(user.id, user);
                  importedCount++;
                  if (user.lid) lidsCount++;
                }
              }
              foundDatabase = true;
            }
          } catch (e: any) {
            console.warn(`Error parsing entry ${entry.entryName}:`, e.message);
          }
        }

        // Detect if it contains session creds
        if (entryName.endsWith('creds.json')) {
          detectedType = 'session_creds';
        }
      }

      // If no standard database was found, attempt scanning all .json files in zip
      if (!foundDatabase) {
        for (const entry of zipEntries) {
          if (entry.name.endsWith('.json') && !entry.name.includes('package')) {
            try {
              const content = zip.readAsText(entry);
              const parsed = JSON.parse(content);
              const candidates = parsed.users || parsed;
              if (typeof candidates === 'object' && candidates !== null) {
                for (const [key, val] of Object.entries(candidates)) {
                  const user = parseRawBotUserEntry(key, val, filename);
                  if (user) {
                    usersMap.set(user.id, user);
                    importedCount++;
                    if (user.lid) lidsCount++;
                  }
                }
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Wolfric Backup] Error extrayendo archivo ZIP:', err);
      return {
        status: 'error',
        message: `No se pudo leer el archivo ZIP: ${err.message}`,
        filename,
        fileSize: `${(buffer.length / 1024).toFixed(1)} KB`,
        detectedType,
        usersImportedCount: 0,
        lidsRecognizedCount: 0,
      };
    }
  }
  // Case 2: JSON file directly (e.g. database.json or users.json)
  else if (lowerName.endsWith('.json')) {
    detectedType = 'user_database_json';
    try {
      const content = buffer.toString('utf-8');
      const parsed = JSON.parse(content);
      const usersObject = parsed.users || parsed.data?.users || parsed.rpg?.users || parsed;

      if (Array.isArray(usersObject)) {
        for (const item of usersObject) {
          const key = item.lid || item.phone || item.jid || item.id || `usr-${Date.now()}`;
          const user = parseRawBotUserEntry(key, item, filename);
          if (user) {
            usersMap.set(user.id, user);
            importedCount++;
            if (user.lid) lidsCount++;
          }
        }
      } else if (typeof usersObject === 'object' && usersObject !== null) {
        for (const [key, val] of Object.entries(usersObject)) {
          const user = parseRawBotUserEntry(key, val, filename);
          if (user) {
            usersMap.set(user.id, user);
            importedCount++;
            if (user.lid) lidsCount++;
          }
        }
      }
    } catch (err: any) {
      console.error('[Wolfric Backup] Error parseando archivo JSON:', err);
      return {
        status: 'error',
        message: `El archivo JSON contiene errores de sintaxis: ${err.message}`,
        filename,
        fileSize: `${(buffer.length / 1024).toFixed(1)} KB`,
        detectedType,
        usersImportedCount: 0,
        lidsRecognizedCount: 0,
      };
    }
  }

  // Save changes to database on disk
  if (importedCount > 0) {
    saveUserDatabase();
  }

  const sizeFormatted =
    buffer.length > 1024 * 1024
      ? `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`
      : `${(buffer.length / 1024).toFixed(1)} KB`;

  return {
    status: 'ok',
    message:
      importedCount > 0
        ? `¡Copia de seguridad procesada! Se han extraído e importado ${importedCount} usuarios con sus LIDs y progresos activos en la nube.`
        : `Archivo guardado en la nube con éxito (${sizeFormatted}). No se detectaron usuarios en formato estándar, pero el archivo quedó registrado como backup de sistema.`,
    filename,
    fileSize: sizeFormatted,
    detectedType,
    usersImportedCount: importedCount,
    lidsRecognizedCount: lidsCount,
  };
}

/**
 * Directly bulk-update or overwrite users from parsed JSON (used by AI Editor)
 */
export function applyJsonToDatabase(data: any): { imported: number; total: number } {
  let imported = 0;
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object') {
        const phone = cleanPhoneDigits(item.phone || item.id || '');
        const id = item.id || `usr-${phone || Math.random().toString(36).slice(2, 8)}`;
        const user: LidUserProfile = {
          id,
          lid: item.lid || `${phone}@lid`,
          jid: item.jid || `${phone}@s.whatsapp.net`,
          phone: item.phone || phone,
          name: item.name || `Usuario ${phone || id}`,
          registered: item.registered !== false,
          registeredAt: item.registeredAt || new Date().toISOString(),
          level: Number(item.level) || 1,
          exp: Number(item.exp) || 0,
          coins: Number(item.coins) || 0,
          bank: Number(item.bank) || 0,
          diamonds: Number(item.diamonds) || 0,
          role: item.role || 'Aventurero Wolfric',
          warns: Number(item.warns) || 0,
          banned: Boolean(item.banned),
          lastActive: item.lastActive || new Date().toISOString(),
          sourceBackup: item.sourceBackup || 'IA Editor Wolfric',
        };
        usersMap.set(id, user);
        imported++;
      }
    }
  } else if (data && typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const user = parseRawBotUserEntry(key, val, 'IA Editor Wolfric');
      if (user) {
        usersMap.set(user.id, user);
        imported++;
      }
    }
  }

  if (imported > 0) {
    saveUserDatabase();
  }
  return { imported, total: usersMap.size };
}

// Initialize on module load
loadUserDatabase();


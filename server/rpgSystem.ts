import fs from 'fs';
import path from 'path';

// Rutas de archivos de economía y misiones
const ECONOMIA_FILE = path.join(process.cwd(), 'bot-repo', 'economia.json');
const MISIONES_DATA_FILE = path.join(process.cwd(), 'data', 'misiones_custom.json');
const MISIONES_BOT_FILE = path.join(process.cwd(), 'bot-repo', 'misiones_custom.json');

// Catálogo de Frutas del Diablo oficiales del bot
export const CATALOGO_FRUTAS = [
  // Comunes
  { nombre: 'Humo', categoria: 'comun', desc: 'Control de humo y reducción de agilidad rival' },
  { nombre: 'Bomba', categoria: 'comun', desc: 'Explosivos y daño reflejado en combate' },
  { nombre: 'Goma', categoria: 'comun', desc: 'Cuerpo elástico y reducción de defensa rival' },
  { nombre: 'Arena', categoria: 'comun', desc: 'Tormentas de arena y daño por deshidratación' },
  { nombre: 'Cristal', categoria: 'comun', desc: 'Estructuras punzantes y escudos cristalinos' },
  { nombre: 'Metal', categoria: 'comun', desc: 'Defensa sólida y ataques contundentes' },
  { nombre: 'Viento', categoria: 'comun', desc: 'Cortes aéreos veloces y evasión' },
  { nombre: 'Amigo', categoria: 'comun', desc: 'Habilidades de soporte e interacciones pacíficas' },
  { nombre: 'Papel', categoria: 'comun', desc: 'Láminas afiladas e indetectables' },
  { nombre: 'Madera', categoria: 'comun', desc: 'Enredos de raíces y bloqueo físico' },
  { nombre: 'Imán', categoria: 'comun', desc: 'Control metálico y manipulación de proyectiles' },
  { nombre: 'Vapor', categoria: 'comun', desc: 'Presión térmica y distracción visual' },

  // Raras
  { nombre: 'Hielo', categoria: 'rara', desc: 'Congelación absoluta y aturdimiento' },
  { nombre: 'Magma', categoria: 'rara', desc: 'Lava ardiente que perfora defensas' },
  { nombre: 'Veneno', categoria: 'rara', desc: 'Nubes tóxicas y descomposición progresiva' },
  { nombre: 'Luz', categoria: 'rara', desc: 'Ataques a velocidad relámpago que no fallan' },
  { nombre: 'Rayo', categoria: 'rara', desc: 'Descargas eléctricas de alto voltaje' },
  { nombre: 'Sombra', categoria: 'rara', desc: 'Sigilo entre sombras y absorción de energía' },
  { nombre: 'Coral', categoria: 'rara', desc: 'Espinas oceánicas regenerativas' },
  { nombre: 'Hueso', categoria: 'rara', desc: 'Blindaje osteológico y lanzas óseas' },
  { nombre: 'Tinta', categoria: 'rara', desc: 'Ceguera líquida y distorsión espacial' },
  { nombre: 'Cuarzo', categoria: 'rara', desc: 'Refracción de energía luminosa' },
  { nombre: 'Óxido', categoria: 'rara', desc: 'Desgaste acelerado del equipo enemigo' },
  { nombre: 'Deuda', categoria: 'rara', desc: 'Drena monedas y recursos del oponente' },
  { nombre: 'Espejismo', categoria: 'rara', desc: 'Ilusiones ópticas de alta precisión' },
  { nombre: 'Apuesta', categoria: 'rara', desc: 'Modificadores aleatorios con alto potencial crítico' },
  { nombre: 'Trueque', categoria: 'rara', desc: 'Intercambio de estados tácticos' },

  // Épicas
  { nombre: 'Gravedad', categoria: 'epica', desc: 'Aplastamiento de campo gravitatorio masivo' },
  { nombre: 'Terremoto', categoria: 'epica', desc: 'Vibraciones telúricas que rompen el terreno' },
  { nombre: 'Neón', categoria: 'epica', desc: 'Poder lumínico de alta frecuencia cibernética' },
  { nombre: 'Plasma', categoria: 'epica', desc: 'Materia ionizada con daño extremo' },
  { nombre: 'Sonido', categoria: 'epica', desc: 'Ondas de choque ultrasónicas devastadoras' },
  { nombre: 'Espejo', categoria: 'epica', desc: 'Reflejo total de técnicas y habilidades rivales' },
  { nombre: 'Nova', categoria: 'epica', desc: 'Explosión estelar de área expandida' },
  { nombre: 'Marea', categoria: 'epica', desc: 'Grandes corrientes de agua a presión' },
  { nombre: 'Eco', categoria: 'epica', desc: 'Repetición doble de ataques consecutivamente' },
  { nombre: 'Cadena', categoria: 'epica', desc: 'Restricción total de movimientos del rival' },
  { nombre: 'Balanza', categoria: 'epica', desc: 'Ecualización inmediata de vida en combate' },
  { nombre: 'Grieta', categoria: 'epica', desc: 'Fisuras dimensionales de ataque directo' },
  { nombre: 'Bucle', categoria: 'epica', desc: 'Reversión de turnos y anomalías temporales' },

  // Míticas
  { nombre: 'Oscuridad', categoria: 'mitica', desc: 'Agujero negro que neutraliza los poderes enemigos' },
  { nombre: 'Mammoth', categoria: 'mitica', desc: 'Zoan ancestral de fuerza y resistencia titánica' },
  { nombre: 'Kitsune', categoria: 'mitica', desc: 'Zorro espectral de fuego místico y engaño' },
  { nombre: 'Bigfoot', categoria: 'mitica', desc: 'Fuerza salvaje implacable de las nieves' },
  { nombre: 'Control', categoria: 'mitica', desc: 'Dominio absoluto de la sala espacial de combate' },
  { nombre: 'Dolor', categoria: 'mitica', desc: 'Convierte el daño recibido en poder ofensivo' },
  { nombre: 'Sangre', categoria: 'mitica', desc: 'Extracción vital y aumento de velocidad' },
  { nombre: 'Cometa', categoria: 'mitica', desc: 'Impacto orbital cinético masivo' },
  { nombre: 'Abismo', categoria: 'mitica', desc: 'Profundidades oscuras que devoran vida' },
  { nombre: 'Fantasma', categoria: 'mitica', desc: 'Intangibilidad total y susto paralizante' },
  { nombre: 'Simbiosis', categoria: 'mitica', desc: 'Fusión celular y regeneración hiperacelerada' },
  { nombre: 'Sacrificio', categoria: 'mitica', desc: 'Poder desmedido a cambio de vitalidad' },

  // Divinas
  { nombre: 'Tiempo', categoria: 'divina', desc: 'Manipulación del flujo temporal absoluto' },
  { nombre: 'Caos', categoria: 'divina', desc: 'Entropía pura que destruye defensas cósmicas' },
  { nombre: 'Infinito', categoria: 'divina', desc: 'Espacio impenetrable e ilimitado' },
  { nombre: 'Fénix', categoria: 'divina', desc: 'Llamas celestiales de regeneración infinita' },
  { nombre: 'Copia Copia', categoria: 'divina', desc: 'Duplica cualquier técnica o fruta existente' },
];

// Catálogo de Ítems Consumibles del bot
export const CATALOGO_ITEMS = [
  { id: 1, nombre: 'Poción Neón Pequeña', precio: 150, tipo: 'curar', desc: 'Cura 25 HP al instante.' },
  { id: 2, nombre: 'Poción Neón Grande', precio: 400, tipo: 'curar', desc: 'Cura 60 HP al instante.' },
  { id: 3, nombre: 'Batería de Iones', precio: 250, tipo: 'energia', desc: 'Restaura 40⚡ de energía.' },
  { id: 4, nombre: 'Inyector de Adrenalina', precio: 500, tipo: 'buff_critico', desc: 'Ataque crítico garantizado.' },
  { id: 5, nombre: 'Escudo de Datos', precio: 450, tipo: 'buff_escudo', desc: 'Bloquea el 50% del próximo golpe recibido.' },
  { id: 6, nombre: 'Ticket de Gacha', precio: 400, tipo: 'ticket_gacha', desc: 'Tirada de frutas del diablo en el bot.' },
  { id: 7, nombre: 'Píldora de Amnesia', precio: 1500, tipo: 'reset_stats', desc: 'Resetea puntos de STR/DEF/AGI/INT para redistribuir.' },
  { id: 8, nombre: 'Rastreador de Jefes', precio: 2500, tipo: 'boss_tracker', desc: '+15% de aparición de Boss durante 1 hora.' },
  { id: 9, nombre: 'Guardia de Seguridad', precio: 800, tipo: 'guardia', desc: 'Protege de los próximos 5 intentos de robo.' },
  { id: 10, nombre: 'Poción de Suerte', precio: 600, tipo: 'buff_crit_temp', desc: '+15% de crítico por 2 turnos.' },
  { id: 11, nombre: 'Brújula Certera', precio: 700, tipo: 'buff_exploracion', desc: 'Evita eventos negativos en exploraciones.' },
  { id: 12, nombre: 'Kit de Primeros Auxilios', precio: 900, tipo: 'curar_total', desc: 'Cura toda la vida (HP) al 100% al instante.' },
  { id: 13, nombre: 'Antídoto Universal', precio: 550, tipo: 'antidoto', desc: 'Limpia todos los estados negativos y venenos.' },
  { id: 14, nombre: 'Elixir de Fortuna', precio: 1000, tipo: 'buff_fortuna', desc: '+25% de monedas en las próximas 5 cacerías.' },
];

// Campos de seguimiento de misiones disponibles en el bot
export const CAMPOS_MISIONES = [
  { id: 'wins', label: 'Duelos PvP ganados (.pvp / .duel)', icono: '⚔️' },
  { id: 'monstruosCazados', label: 'Monstruos cazados en expediciones (.cazar)', icono: '🐲' },
  { id: 'ruletaJugada', label: 'Tiradas en ruleta / casino (.ruleta)', icono: '🎰' },
  { id: 'bossKills', label: 'Jefes mundiales derrotados (.boss)', icono: '👑' },
  { id: 'pescaExitosas', label: 'Capturas de pesca realizadas (.pescar)', icono: '🎣' },
  { id: 'dungeonCleared', label: 'Mazmorras y raids superadas (.dungeon)', icono: '🏰' },
  { id: 'tradesCompleted', label: 'Intercambios o ventas completadas (.trade)', icono: '🤝' },
  { id: 'lifetimeCoinsEarned', label: 'Monedas totales acumuladas', icono: '🪙' },
];

export interface CustomMission {
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
}

// Helper para obtener un nombre 100% seguro (sin teléfonos ni LIDs)
export function obtenerNombreSeguro(id: string, u: any): string {
  if (u?.frontier?.nombre && typeof u.frontier.nombre === 'string' && u.frontier.nombre.trim() && !u.frontier.nombre.includes('@') && !u.frontier.nombre.endsWith('lid')) {
    return u.frontier.nombre.trim();
  }
  if (u?.name && typeof u.name === 'string' && u.name.trim() && u.name !== 'Alguien' && !u.name.includes('@') && !u.name.endsWith('lid')) {
    return u.name.trim();
  }
  if (u?.nickname && typeof u.nickname === 'string' && u.nickname.trim() && !u.nickname.includes('@') && !u.nickname.endsWith('lid')) {
    return u.nickname.trim();
  }
  // Generar seudónimo de aventurero consistente a partir del identificador
  let hash = 0;
  const str = String(id || 'aventurero');
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return `Aventurero #${(Math.abs(hash) % 9000) + 1000}`;
}

// Cargar la base de datos de economía del bot
export function cargarEconomia(): Record<string, any> {
  try {
    if (fs.existsSync(ECONOMIA_FILE)) {
      const raw = fs.readFileSync(ECONOMIA_FILE, 'utf8');
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.error('Error cargando economia.json:', err);
  }
  return {};
}

// Guardar la base de datos de economía del bot
export function guardarEconomia(data: Record<string, any>): boolean {
  try {
    fs.writeFileSync(ECONOMIA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando economia.json:', err);
    return false;
  }
}

// Ranking público 100% protegido: NUNCA expone teléfonos ni LIDs
export function getPublicRankings() {
  const econ = cargarEconomia();
  const list = Object.entries(econ).map(([rawId, u]) => {
    const safeName = obtenerNombreSeguro(rawId, u);
    // Calcular prestigio de frontier
    const f = u.frontier || {};
    const mats: number = (Object.values(f.materiales || {}) as any[]).reduce((acc: number, n: any) => acc + (Number(n) || 0), 0);
    const misiones: number = Array.isArray(f.misionesCompletadas) ? f.misionesCompletadas.length : 0;
    const guardianes: number = Array.isArray(f.guardianesDerrotados) ? f.guardianesDerrotados.length : 0;
    const soberanos: number = Array.isArray(f.soberanosDerrotados) ? f.soberanosDerrotados.length : 0;
    const calculatedPrestige: number = (Number(u.level) || 1) * 10 + mats * 3 + misiones * 25 + guardianes * 50 + soberanos * 150;

    return {
      name: safeName,
      level: Number(u.level) || 1,
      coins: Number(u.coins) || 0,
      bounty: Number(u.bounty) || 0,
      exp: Number(u.exp) || 0,
      prestige: calculatedPrestige,
      fruit: u.fruit || u.fruitEquipada || null,
      fruitAwakened: Boolean(u.fruitAwakened || (u.frutasPoseidas || []).some((fp: any) => fp.nombre === u.fruit && fp.despertada)),
    };
  });

  // 1. Top Bounty
  const bountyTop = [...list]
    .sort((a, b) => b.bounty - a.bounty)
    .slice(0, 10)
    .map((p, idx) => ({ rank: idx + 1, name: p.name, bounty: p.bounty, level: p.level, fruit: p.fruit }));

  // 2. Top Monedas
  const coinsTop = [...list]
    .sort((a, b) => b.coins - a.coins)
    .slice(0, 10)
    .map((p, idx) => ({ rank: idx + 1, name: p.name, coins: p.coins, level: p.level }));

  // 3. Top Prestigio Frontier
  const prestigeTop = [...list]
    .sort((a, b) => b.prestige - a.prestige)
    .slice(0, 10)
    .map((p, idx) => ({ rank: idx + 1, name: p.name, prestige: p.prestige, level: p.level }));

  // 4. Top Nivel
  const levelTop = [...list]
    .sort((a, b) => (b.level === a.level ? b.exp - a.exp : b.level - a.level))
    .slice(0, 10)
    .map((p, idx) => ({ rank: idx + 1, name: p.name, level: p.level, exp: p.exp }));

  return {
    bountyTop,
    coinsTop,
    prestigeTop,
    levelTop,
    totalPlayers: list.length,
    updatedAt: new Date().toISOString(),
  };
}

// Datos de administración RPG para el Dashboard de Administradores
export function getRpgAdminData() {
  const econ = cargarEconomia();
  const players = Object.entries(econ).map(([rawKey, u]) => {
    const safeName = obtenerNombreSeguro(rawKey, u);
    return {
      rawKey,
      displayName: safeName,
      maskedId: rawKey.length > 8 ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}` : rawKey,
      coins: Number(u.coins) || 0,
      gems: Number(u.gems) || 0,
      bank: Number(u.bank) || 0,
      level: Number(u.level) || 1,
      exp: Number(u.exp) || 0,
      bounty: Number(u.bounty) || 0,
      hp: Number(u.hp ?? 100),
      maxHp: Number(u.maxHp ?? 100),
      energy: Number(u.energy ?? 100),
      fruit: u.fruit || u.fruitEquipada || null,
      fruitAwakened: Boolean(u.fruitAwakened || (u.frutasPoseidas || []).some((fp: any) => fp.nombre === u.fruit && fp.despertada)),
      inventory: Array.isArray(u.inventory) ? u.inventory : [],
      stats: {
        str: Number(u.stats?.str || u.str || 10),
        def: Number(u.stats?.def || u.def || 10),
        agi: Number(u.stats?.agi || u.agi || 10),
        int: Number(u.stats?.int || u.int || 10),
      },
      titles: Array.isArray(u.titles) ? u.titles : [],
      equippedTitle: u.equippedTitle || null,
    };
  });

  return {
    players,
    catalog: {
      fruits: CATALOGO_FRUTAS,
      items: CATALOGO_ITEMS,
      missionFields: CAMPOS_MISIONES,
    },
  };
}

// Otorgar recursos / frutas / objetos / monedas desde la web (lo que hacía Overdrive)
export function grantRpgAsset(rawKey: string, payload: {
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
}) {
  const econ = cargarEconomia();
  if (!econ[rawKey]) {
    throw new Error('Jugador no encontrado en la base de datos de economía.');
  }

  const u = econ[rawKey];
  let summary = '';

  switch (payload.type) {
    case 'coins': {
      const amt = Number(payload.amount) || 0;
      if (payload.action === 'set') {
        u.coins = Math.max(0, amt);
      } else {
        u.coins = Math.max(0, (Number(u.coins) || 0) + amt);
        if (amt > 0) u.lifetimeCoinsEarned = (Number(u.lifetimeCoinsEarned) || 0) + amt;
      }
      summary = `Monedas ajustadas a $${u.coins} (${amt > 0 ? `+${amt}` : amt})`;
      break;
    }

    case 'gems': {
      const amt = Number(payload.amount) || 0;
      if (payload.action === 'set') {
        u.gems = Math.max(0, amt);
      } else {
        u.gems = Math.max(0, (Number(u.gems) || 0) + amt);
      }
      summary = `Gemas ajustadas a ${u.gems}💎 (${amt > 0 ? `+${amt}` : amt})`;
      break;
    }

    case 'bounty': {
      const amt = Number(payload.amount) || 0;
      if (payload.action === 'set') {
        u.bounty = Math.max(0, amt);
      } else {
        u.bounty = Math.max(0, (Number(u.bounty) || 0) + amt);
      }
      summary = `Bounty ajustado a $${u.bounty} (${amt > 0 ? `+${amt}` : amt})`;
      break;
    }

    case 'fruit': {
      const fName = String(payload.fruitName || '').trim();
      if (!fName) throw new Error('Debes especificar el nombre de la fruta.');
      const cat = payload.fruitCategory || 'rara';
      const isAwakened = Boolean(payload.awakened);

      u.fruit = fName;
      u.fruitEquipada = fName;
      u.fruitAwakened = isAwakened;

      if (!Array.isArray(u.frutasPoseidas)) u.frutasPoseidas = [];
      const existing = u.frutasPoseidas.find((f: any) => f.nombre === fName);
      if (existing) {
        existing.despertada = isAwakened;
        existing.categoria = cat;
      } else {
        u.frutasPoseidas.push({ nombre: fName, categoria: cat, despertada: isAwakened });
      }

      if (!Array.isArray(u.frutasObtenidas)) u.frutasObtenidas = [];
      if (!u.frutasObtenidas.includes(fName)) u.frutasObtenidas.push(fName);

      summary = `Fruta asignada: 🍎 *${fName}* (${cat.toUpperCase()}) ${isAwakened ? '✨ ¡DESPERTADA!' : ''}`;
      break;
    }

    case 'item': {
      const iName = String(payload.itemName || '').trim();
      if (!iName) throw new Error('Debes especificar el nombre del objeto.');
      const qty = Math.max(1, Math.min(50, Number(payload.itemQuantity) || 1));

      if (!Array.isArray(u.inventory)) u.inventory = [];
      for (let i = 0; i < qty; i++) {
        u.inventory.push(iName);
      }
      summary = `Objeto agregado al inventario: 🎒 ${qty}x *${iName}*`;
      break;
    }

    case 'heal': {
      const maxHp = Number(u.maxHp || 100);
      u.hp = maxHp;
      u.energy = 100;
      u.poisoned = false;
      u.statusEffects = [];
      summary = `Vitalidad y energía restauradas al 100% (HP: ${maxHp}/${maxHp}, Energía: 100/100)`;
      break;
    }

    case 'stats': {
      if (!u.stats) u.stats = {};
      const s = payload.stats || {};
      if (s.str !== undefined) u.stats.str = Number(s.str);
      if (s.def !== undefined) u.stats.def = Number(s.def);
      if (s.agi !== undefined) u.stats.agi = Number(s.agi);
      if (s.int !== undefined) u.stats.int = Number(s.int);
      if (s.maxHp !== undefined) {
        u.maxHp = Number(s.maxHp);
        u.hp = Number(s.maxHp);
      }
      summary = `Estadísticas de combate actualizadas: STR ${u.stats.str}, DEF ${u.stats.def}, AGI ${u.stats.agi}, INT ${u.stats.int}`;
      break;
    }

    case 'title': {
      const tName = String(payload.titleName || '').trim();
      if (!tName) throw new Error('Debes especificar el título.');
      if (!Array.isArray(u.titles)) u.titles = [];
      if (!u.titles.includes(tName)) u.titles.push(tName);
      u.equippedTitle = tName;
      summary = `Título honorífico otorgado y equipado: 👑 *${tName}*`;
      break;
    }

    default:
      throw new Error(`Tipo de recurso desconocido: ${payload.type}`);
  }

  guardarEconomia(econ);
  return {
    status: 'ok',
    summary,
    user: {
      displayName: obtenerNombreSeguro(rawKey, u),
      coins: u.coins,
      gems: u.gems,
      bounty: u.bounty,
      hp: u.hp,
      maxHp: u.maxHp,
      fruit: u.fruit,
      fruitAwakened: u.fruitAwakened,
      inventory: u.inventory,
    },
  };
}

// Cargar misiones personalizadas de administración
export function getCustomMissions(): CustomMission[] {
  try {
    if (fs.existsSync(MISIONES_DATA_FILE)) {
      const raw = fs.readFileSync(MISIONES_DATA_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Error leyendo misiones_custom.json:', err);
  }
  return [];
}

// Guardar lista de misiones personalizadas y sincronizar con bot-repo
export function saveCustomMissionsList(missions: CustomMission[]): boolean {
  try {
    const jsonStr = JSON.stringify(missions, null, 2);
    // 1. Guardar en data/
    fs.writeFileSync(MISIONES_DATA_FILE, jsonStr, 'utf8');
    // 2. Sincronizar en bot-repo/
    try {
      fs.writeFileSync(MISIONES_BOT_FILE, jsonStr, 'utf8');
    } catch (_) {}
    return true;
  } catch (err) {
    console.error('Error guardando misiones:', err);
    return false;
  }
}

// Crear o actualizar una misión personalizada
export function upsertCustomMission(data: Partial<CustomMission>): CustomMission {
  if (!data.nombre || !data.nombre.trim()) throw new Error('El nombre de la misión es obligatorio.');
  if (!data.desc || !data.desc.trim()) throw new Error('La descripción de la misión es obligatoria.');
  if (!data.campo || !data.campo.trim()) throw new Error('El objetivo/acción de la misión es obligatorio.');
  const metaNum = Math.max(1, Number(data.meta) || 1);

  const list = getCustomMissions();
  const id = data.id || `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const existingIdx = list.findIndex((m) => m.id === id);

  const mission: CustomMission = {
    id,
    nombre: data.nombre.trim(),
    desc: data.desc.trim(),
    campo: data.campo.trim(),
    meta: metaNum,
    recompensa: {
      coins: Number(data.recompensa?.coins) || 0,
      gems: Number(data.recompensa?.gems) || 0,
      exp: Number(data.recompensa?.exp) || 0,
      bounty: Number(data.recompensa?.bounty) || 0,
      fruta: data.recompensa?.fruta ? String(data.recompensa.fruta).trim() : undefined,
      item: data.recompensa?.item ? String(data.recompensa.item).trim() : undefined,
    },
    activa: data.activa !== undefined ? Boolean(data.activa) : true,
    creadaPor: data.creadaPor || 'Administración Web',
    fechaCreacion: data.fechaCreacion || new Date().toISOString().split('T')[0],
  };

  if (existingIdx >= 0) {
    list[existingIdx] = mission;
  } else {
    list.unshift(mission);
  }

  saveCustomMissionsList(list);
  return mission;
}

// Eliminar una misión personalizada
export function deleteCustomMission(id: string): boolean {
  const list = getCustomMissions();
  const filtered = list.filter((m) => m.id !== id);
  if (filtered.length === list.length) return false;
  saveCustomMissionsList(filtered);
  return true;
}

// Alternar estado activo/inactivo de una misión personalizada
export function toggleCustomMission(id: string): CustomMission {
  const list = getCustomMissions();
  const target = list.find((m) => m.id === id);
  if (!target) throw new Error('Misión no encontrada.');
  target.activa = !target.activa;
  saveCustomMissionsList(list);
  return target;
}

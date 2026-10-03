import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export interface AiImproveFileRequest {
  filename: string;
  content: string;
  taskType: 'clean_duplicates' | 'balance_economy' | 'fix_syntax' | 'rpg_upgrade' | 'custom';
  customPrompt?: string;
}

export interface AiImproveFileResult {
  improvedContent: string;
  summary: string;
  taskApplied: string;
  originalSize: number;
  improvedSize: number;
  isValidJson: boolean;
}

export async function processFileWithAi(req: AiImproveFileRequest): Promise<AiImproveFileResult> {
  const { filename, content, taskType, customPrompt } = req;

  if (!content || !content.trim()) {
    throw new Error('El contenido del archivo está vacío.');
  }

  // Pre-check if content looks like JSON
  let isJson = false;
  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(content);
    isJson = true;
  } catch {
    isJson = false;
  }

  let taskInstructions = '';
  switch (taskType) {
    case 'clean_duplicates':
      taskInstructions = `
Tarea: LIMPIEZA DE DUPLICADOS Y NORMALIZACIÓN DE LIDs.
1. Si es un JSON de usuarios (array u objeto con claves de LIDs/teléfonos):
   - Detecta entradas repetidas por LID o número de teléfono.
   - Si hay duplicados, fusiona los datos conservando el nivel más alto y sumando las monedas/banco.
   - Normaliza los identificadores: asegúrate de que cada usuario tenga 'lid' o 'phone' bien formateado sin espacios raros.
2. Devuelve el JSON completamente limpio, formateado con 2 espacios.
`;
      break;

    case 'balance_economy':
      taskInstructions = `
Tarea: BALANCEO DE ECONOMÍA RPG Y SEGURIDAD FINANCIERA.
1. Revisa los saldos de 'coins' y 'bank':
   - Si algún usuario tiene monedas negativas o valores NaN/null, conviértelos a 0.
   - Si hay valores desorbitados (ej: más de 50,000,000 monedas por bugs o exploits), ajústalos a un tope razonable (ej. 5,000,000) o estabilízalos.
   - Asegúrate de que el campo 'diamonds' sea un número entero >= 0.
2. Devuelve el archivo completamente balanceado y formateado.
`;
      break;

    case 'fix_syntax':
      taskInstructions = `
Tarea: REPARACIÓN DE SINTAXIS Y CORRUPCIÓN.
1. Si el JSON o código tiene errores de sintaxis (comas faltantes o sobrantes, llaves sin cerrar, comillas rotas, caracteres de escape corruptos):
   - Arregla todos los errores de sintaxis para que sea 100% parseable y válido.
   - Asegúrate de no perder datos legítimos de usuarios.
2. Si ya es válido, organízalo y ordénalo de forma legible y limpia.
`;
      break;

    case 'rpg_upgrade':
      taskInstructions = `
Tarea: MEJORA DE ROLES Y RANGOS RPG DE WOLFRIC.
1. Para cada usuario en la base de datos:
   - Asigna o actualiza el campo 'role' según su nivel:
     * Nivel 1 - 4: 'Aventurero Novato 🗡️'
     * Nivel 5 - 9: 'Guerrero Wolfric ⚔️'
     * Nivel 10 - 19: 'Élite Wolfric 🛡️'
     * Nivel 20 - 49: 'Comandante Alfa 🐺'
     * Nivel 50+: 'Leyenda Inmortal 👑'
   - Si no tienen campos 'registered' o 'level', asígnales valores iniciales saludables ('registered': true, 'level': 1, 'exp': 100).
2. Devuelve la base de datos enriquecida.
`;
      break;

    case 'custom':
    default:
      taskInstructions = `
Instrucción personalizada del Administrador:
"${customPrompt || 'Optimiza y mejora la estructura del archivo'}"
`;
      break;
  }

  const systemInstruction = `Eres el Asistente Experto en Gestión de Datos y Bots de WhatsApp de Wolfric (creado por wolfric_19, The L, zerrDMC_).
Tu misión es analizar, editar, reparar o mejorar el archivo proporcionado respetando la privacidad de los usuarios y preservando intactos los LIDs y números de teléfono reales.

REGLAS OBLIGATORIAS:
1. Devuelve tu respuesta en el siguiente formato estructurado:
---RESUMEN---
[Explica aquí en español qué cambios, correcciones o mejoras realizaste en 2 a 4 oraciones claras y directas]
---FIN_RESUMEN---
---ARCHIVO---
[Coloca aquí el contenido exacto del archivo mejorado, sin rodearlo con bloques de código markdown como \`\`\`json si no es necesario, o directamente el código/JSON puro]
---FIN_ARCHIVO---

2. NUNCA borres los usuarios a menos que sean duplicados comprobados.
3. Si el archivo es JSON, el contenido dentro de ---ARCHIVO--- debe ser JSON estrictamente válido.
4. Mantén la privacidad de los datos.`;

  const prompt = `Archivo: "${filename}"
Tipo de Tarea: ${taskType}
${taskInstructions}

Contenido original del archivo:
${content.length > 80000 ? content.slice(0, 80000) + '\n...[Contenido truncado por longitud]' : content}
`;

  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const responseText = response.text || '';

    // Extract summary and file content
    let summary = 'Archivo analizado y procesado con éxito por la IA de Wolfric.';
    let improvedContent = content;

    const summaryMatch = responseText.match(/---RESUMEN---([\s\S]*?)---FIN_RESUMEN---/);
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    }

    const fileMatch = responseText.match(/---ARCHIVO---([\s\S]*?)---FIN_ARCHIVO---/);
    if (fileMatch && fileMatch[1]) {
      let extracted = fileMatch[1].trim();
      // Remove any leading/trailing markdown code blocks if the model wrapped it
      if (extracted.startsWith('```json')) {
        extracted = extracted.slice(7);
      } else if (extracted.startsWith('```')) {
        extracted = extracted.slice(3);
      }
      if (extracted.endsWith('```')) {
        extracted = extracted.slice(0, -3);
      }
      improvedContent = extracted.trim();
    } else {
      // If markers are missing, fallback to cleaning response text
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      improvedContent = cleaned.trim();
    }

    // Verify if improved content is valid JSON
    let validJson = false;
    try {
      JSON.parse(improvedContent);
      validJson = true;
    } catch {
      validJson = false;
    }

    return {
      improvedContent,
      summary,
      taskApplied: taskType,
      originalSize: Buffer.byteLength(content, 'utf-8'),
      improvedSize: Buffer.byteLength(improvedContent, 'utf-8'),
      isValidJson: validJson,
    };
  } catch (error: any) {
    // If Gemini fails or API key is not configured, provide a smart local fallback
    console.error('Error al procesar archivo con Gemini:', error);

    // Fallback: If task is clean_duplicates or fix_syntax or balance_economy and it's JSON
    if (isJson && parsedJson) {
      const fallbackResult = applyLocalOptimization(parsedJson, taskType);
      return {
        improvedContent: JSON.stringify(fallbackResult.data, null, 2),
        summary: `(Modo Local) ${fallbackResult.summary}. Nota: La IA no pudo conectarse (${error.message || 'Sin conexión'}), por lo que se aplicó optimización algorítmica local directa.`,
        taskApplied: taskType,
        originalSize: Buffer.byteLength(content, 'utf-8'),
        improvedSize: Buffer.byteLength(JSON.stringify(fallbackResult.data, null, 2), 'utf-8'),
        isValidJson: true,
      };
    }

    throw new Error(`Error en el servicio de IA: ${error.message || 'No se pudo procesar el archivo.'}`);
  }
}

function applyLocalOptimization(data: any, taskType: string): { data: any; summary: string } {
  if (Array.isArray(data)) {
    let cleaned = [...data];
    if (taskType === 'clean_duplicates') {
      const seen = new Set();
      cleaned = cleaned.filter((item) => {
        const key = item.lid || item.phone || item.id;
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { data: cleaned, summary: `Se eliminaron duplicados locales. Quedan ${cleaned.length} registros.` };
    }

    if (taskType === 'balance_economy') {
      cleaned = cleaned.map((item) => ({
        ...item,
        coins: Math.min(Math.max(0, Number(item.coins) || 0), 10000000),
        bank: Math.min(Math.max(0, Number(item.bank) || 0), 50000000),
        diamonds: Math.max(0, Number(item.diamonds) || 0),
      }));
      return { data: cleaned, summary: 'Economía local balanceada con topes seguros.' };
    }

    if (taskType === 'rpg_upgrade') {
      cleaned = cleaned.map((item) => {
        const lvl = Number(item.level) || 1;
        let role = 'Aventurero Novato 🗡️';
        if (lvl >= 50) role = 'Leyenda Inmortal 👑';
        else if (lvl >= 20) role = 'Comandante Alfa 🐺';
        else if (lvl >= 10) role = 'Élite Wolfric 🛡️';
        else if (lvl >= 5) role = 'Guerrero Wolfric ⚔️';
        return { ...item, role, registered: true };
      });
      return { data: cleaned, summary: 'Roles y niveles RPG actualizados según escala de poder.' };
    }
  }

  return { data, summary: 'Formato JSON verificado e indentado correctamente a 2 espacios.' };
}

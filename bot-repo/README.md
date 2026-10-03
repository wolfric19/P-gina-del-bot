```
╔═══════════════════════════════════════╗
      𝐖𝐎𝐋𝐅𝐑𝐈𝐂 · 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋  🐺
╚═══════════════════════════════════════╝
```

<p align="center"><i>Un bot de WhatsApp que convierte tu grupo en un mundo RPG.</i></p>

<p align="center">
📢 <b>Canal oficial:</b> https://whatsapp.com/channel/0029VbDSzOv8KMqcStjGog1T
</p>

---

## ❖ 𝑸𝑼𝑬́ 𝑬𝑺 𝑾𝑶𝑳𝑭𝑹𝑰𝑪

╭━━⪩ *𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐂𝐈𝐎́𝐍* ⪨━━
> ❏ • Bot de WhatsApp tipo **RPG/gacha**, construido sobre [Baileys](https://github.com/WhiskeySockets/Baileys).
> ❏ • Tu grupo se convierte en un mundo con personajes, economía, gremios, duelos, mazmorras cooperativas, gacha de frutas al estilo One Piece, guerra de gremios y mucho más.
> ❏ • Todo jugable escribiendo comandos en el chat, sin salir de WhatsApp.
╰━━─「◈」─━━━━━━━━

---

## ✦ 𝑳𝑶 𝑸𝑼𝑬 𝑰𝑵𝑪𝑳𝑼𝒀𝑬

╭━━⪩ *𝗠𝗨𝗡𝗗𝗢* ⪨━━
> ❏ • Personajes, stats, economía, trabajo, entrenamiento, inventario
> ❏ • Frutas y estilos de combate (gacha tipo One Piece), con ultimates
> ❏ • Duelos PvP 1v1 y 2v2 por turnos
> ❏ • Caza de monstruos, mazmorras cooperativas, bosses de mundo
> ❏ • Gremios y **guerra de gremios** (24h, marcador en vivo)
> ❏ • Racha diaria con hitos y títulos especiales
> ❏ • Mercado entre jugadores, tienda, impuestos
> ❏ • Logros, títulos y rankings
╰━━─「⚔」─━━━━━━━━

╭━━⪩ *𝗘𝗫𝗧𝗥𝗔𝗦* ⪨━━
> ❏ • IA integrada (Google Gemini): chat libre, resúmenes, traducción, descripción de imágenes
> ❏ • Gifs y comandos de interacción entre jugadores
> ❏ • Panel web de administración
> ❏ • Multilenguaje: 🇪🇸 Español · 🇧🇷 Português · 🇺🇸 English
> ❏ • Moderación: anti-raid, anti-peleas con IA, bienvenida/despedida
╰━━─「✧」─━━━━━━━━

---

## ⌁ 𝑹𝑬𝑸𝑼𝑰𝑺𝑰𝑻𝑶𝑺

- Node.js 18 o superior
- Un número de WhatsApp para vincular (recomendado: uno dedicado)
- *(Opcional)* API key gratis de **Google Gemini** — funciones de IA
- *(Opcional)* API key gratis de **GIPHY** — gifs

---

## ⚙ 𝑷𝑹𝑰𝑴𝑬𝑹𝑨 𝑽𝑬𝒁 (𝑻𝑬𝑹𝑴𝑼𝑿 𝑫𝑬𝑺𝑫𝑬 𝑪𝑬𝑹𝑶)

Si acabás de instalar Termux, copiá **bloque por bloque**. No uses Play Store: instalá Termux desde **F-Droid**.

### 1. Actualizar Termux

```bash
pkg update -y && pkg upgrade -y
```

Si pregunta `[Y/n]`, escribí `y` y Enter.

### 2. Permitir archivos del celular

```bash
termux-setup-storage
```

Aceptá el permiso. Sirve si más adelante copiás un zip desde Descargas.

### 3. Programas que Wolfric necesita

```bash
pkg install -y git nodejs-lts python ffmpeg
pip install -U yt-dlp
```

- `git` — baja el repo  
- `nodejs-lts` — corre el bot  
- `python` + `yt-dlp` — descargas (.play, .tiktok, etc.)  
- `ffmpeg` — stickers, audio, .hd  

Comprobá:

```bash
node -v
git --version
yt-dlp --version
ffmpeg -version
```

`node` tiene que ser **18** o más.

### 4. Bajar Wolfric

```bash
cd ~
git clone https://github.com/wolfric19/Wolfric.bot-Whatsapp.git
cd Wolfric.bot-Whatsapp
```

### 5. Instalar librerías de Node

```bash
npm install
```

La primera vez tarda. Si falla por memoria, cerrá otras apps y repetí `npm install`.

### 6. Dueño del bot (después del primer arranque)

1. Arrancá el bot (paso 8).  
2. Escribile por WhatsApp: `.whoami`  
3. En la consola de Termux aparece tu **LID**.  
4. Paro el bot con `Ctrl + C`.  
5. Abrí el archivo:

```bash
nano index.js
```

Buscá `OWNERS` (en nano: `Ctrl + W`, escribí `OWNERS`, Enter). Dejá tu LID:

```js
const OWNERS = [
    'TU_LID_AQUI@lid',
]
```

Guardar: `Ctrl + O`, Enter. Salir: `Ctrl + X`.

### 7. APIs (opcional)

Sin esto el RPG igual corre. Faltan IA y algunos gifs.

```bash
nano ~/.bashrc
```

Al final pegá (con TUS claves):

```bash
export GEMINI_API_KEY=tu_key_de_gemini
export GIPHY_API_KEY=tu_key_de_giphy
```

- Gemini: https://aistudio.google.com/app/apikey  
- GIPHY: https://developers.giphy.com → Create an App → API  

```bash
source ~/.bashrc
```

### 8. Encender

```bash
cd ~/Wolfric.bot-Whatsapp
node index.js
```

Elegí vincular por **código** (más fácil en el celu):

1. WhatsApp → Dispositivos vinculados → Vincular con número  
2. Escribí el código de 8 dígitos que muestra Termux  
3. Esperá `conectado`

### 9. Primeros comandos en WhatsApp

```
.menu
.idioma
.register
.daily
.balance
.whoami
```

El prefijo por defecto es `.` (también suelen andar `!` `#` `/`).

### 10. Apagar / volver a prender

Apagar: en Termux `Ctrl + C`.  
Prender otra vez:

```bash
cd ~/Wolfric.bot-Whatsapp
node index.js
```

No borres la carpeta `sesion/`. Ahí está el vínculo.

### 11. Actualizar el código (sin perder la partida)

```bash
cd ~/Wolfric.bot-Whatsapp
# pará el bot antes (Ctrl+C)
git pull
npm install
node index.js
```

Si usás el bot **privado** (con tu `economia.json`), no hagas `git pull` encima: copiá solo `index.js` / `package.json` / `panel-web.js` y no toques `sesion/` ni los JSON de partida.

---

## 🎮 𝑪𝑶́𝑴𝑶 𝑱𝑼𝑮𝑨𝑹

╭━━⪩ *𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦 𝗕𝗔́𝗦𝗜𝗖𝗢𝗦* ⪨━━
> ❏ • `.register` — crea tu personaje (una sola vez)
> ❏ • `.menu` — todas las categorías de comandos
> ❏ • `.daily` — recompensa diaria (con racha)
> ❏ • `.balance` — ver tus monedas
> ❏ • `.cazar` — cazar un monstruo cuando aparece
> ❏ • `.duel @user` — retar a otro jugador
> ❏ • `.guild` — crear o unirte a un gremio
> ❏ • `.guerra` — guerra de gremios
> ❏ • `.idioma` — elegir español, português o english
╰━━─「▸」─━━━━━━━━

Para etiquetar a alguien, mencionalo con `@` en el mismo mensaje. El prefijo (`.`) es configurable por el owner con `.setprefix`.

---

## 🌐 𝑷𝑨𝑵𝑬𝑳 𝑾𝑬𝑩

El bot levanta un panel de administración local (por defecto en `http://127.0.0.1:3000`), con estadísticas, auditoría y control remoto. La clave de acceso se genera sola al arrancar.

Para exponerlo en otra interfaz: `PANEL_BIND=0.0.0.0 PANEL_PORT=3000 node index.js`.

---

## 🔧 𝑨𝑪𝑻𝑼𝑨𝑳𝑰𝒁𝑨𝑪𝑰𝑶́𝑵 3.1.1

Parche de limpieza y bugs sobre 3.1.0 (sin reset de progreso):

- Código muerto removido y dependencia `jimp` que no se usaba
- Comandos válidos que después decían "no existe" (`.rank`, easter eggs, etc.)
- Alias `.flee` → huir; tutorial guarda la ruta en `.guia` / `.habilidades`
- `.whoami` ahora muestra el **LID** (`@lid`) para `OWNERS`
- Guardado atómico de `economia.json`
- Panel web bound a `127.0.0.1` por defecto
- Hito de racha de 1000 días corregido a $100.000

Para actualizar una instancia que ya corre: paramí el bot, reemplazá `index.js`, `panel-web.js` y `package.json`. **No toques** `sesion/`, `economia.json` ni `gremios.json`.

### Qué va al repo (solo código)

```
index.js
panel-web.js
package.json
bot_config.json
menu.jpg
README.md
LEEME.txt
LICENSE.txt
CHANGELOG.md
.gitignore
```

Lo demás lo crea el bot al arrancar (`sesion/`, `economia.json`, `gremios.json`, `backups/`, `panel_key.txt`, configs de grupo) y **no se sube**.

---

## 📜 𝑳𝑰𝑪𝑬𝑵𝑪𝑰𝑨

Podés clonarlo y correr tu propia instancia, pero **no** redistribuirlo, revenderlo, ni publicarlo como propio. Ver [LICENSE.txt](./LICENSE.txt) para el detalle completo.

---

## 📬 𝑪𝑶𝑵𝑻𝑨𝑪𝑻𝑶

```
╭━━⪩ 𝗪𝗢𝗟𝗙𝗥𝗜𝗖 𝗣𝗥𝗢𝗧𝗢𝗖𝗢𝗟 ⪨━━
> 📢 Canal: https://whatsapp.com/channel/0029VbDSzOv8KMqcStjGog1T
> ✉️ Email: salva7dorito@gmail.com
╰━━─「🐺」─━━━━━━━━
```

<p align="center">🐺 <b>𝐖𝐎𝐋𝐅𝐑𝐈𝐂 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋</b> — © Todos los derechos reservados</p>

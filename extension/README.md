# dama-agile-planner — Extensión de navegador

Extensión de dama-agile-planner para **Chromium** (Chrome/Edge/Brave) y **Firefox**.
Un solo código base ([WXT](https://wxt.dev) + React + TypeScript).

## Funcionalidades

- **Timer**: muestra y controla (pausar/reanudar/parar) el timer de dama-agile-planner,
  sincronizado en tiempo real por WebSocket (socket.io `/ws`). Badge en el icono con el
  tiempo transcurrido.
- **Notificaciones del sistema**: por **Web Push (VAPID)** en Chromium y por
  **polling de respaldo** (fiable en Firefox y siempre que el push no esté disponible).
  Al hacer clic abren la tarea/proyecto correspondiente en la web.
- **Notas ancladas**: CRUD de notas personales sincronizadas con el backend
  (`/api/notes`), ancladas primero.
- **Login** con la cuenta de dama-agile-planner (JWT + 2FA). El servidor es configurable
  (self-hosted).

## Requisitos del backend (dev y producción)

Necesita un servidor dama-agile-planner con:
- Rutas `/api/notes` y `/api/push` (incluidas en este repo).
- VAPID configurado en el servidor (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` /
  `VAPID_SUBJECT`). Genera el par con `npx web-push generate-vapid-keys`.
  Sin VAPID, el push se desactiva y la extensión usa polling.

---

## Puesta en producción — checklist

La extensión se compila **una vez por despliegue**: la URL del servidor va grabada
dentro del paquete, no se pide al usuario. Sigue estos 4 pasos en orden.

### 1. Configura `extension/.env` para este build

`extension/.env` no viene en el repo (está en `.gitignore`). Antes de compilar:

```bash
cd extension
cp .env.example .env
```

Edita `.env` y rellena las tres variables que trae la plantilla:

```
WXT_SERVER_URL=https://tu-dominio
WEB_EXT_API_KEY=tu_api_key
WEB_EXT_API_SECRET=tu_api_secret
```

- **`WXT_SERVER_URL`** (obligatoria): la URL real del servidor dama-agile-planner al que va
  a hablar este build. Se graba dentro del paquete, no se pide al usuario. Verifica
  que se aplicó mirando el `manifest.json` generado en el paso 2: debe traer
  `host_permissions` (Chrome) con el dominio correcto. Si sale vacío o apunta a
  `localhost`, este paso no se hizo bien.
- **`WEB_EXT_API_KEY`** / **`WEB_EXT_API_SECRET`** (solo necesarias para firmar
  Firefox, en el paso 2): API key/secret de tu cuenta de
  [addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/developers/addon/api/key/).
  Sin ellas el build de Chromium funciona igual; solo falla la firma de Firefox. Ver
  el paso 2 para cómo se usan y los problemas típicos al configurarlas.

> **No dejes espacios alrededor del `=` ni al final de la línea.** Estas tres
> variables se cargan en shell (`. ./.env`), no con un parser de dotenv tolerante:
> `WEB_EXT_API_SECRET= valor` o `WEB_EXT_API_SECRET=valor  ` (con espacios) rompen el
> valor en dos y la variable queda vacía o corrupta.

### 2. Compila y empaqueta

> **Gestor de paquetes: `npm`, no `pnpm`.** El `package.json` de `extension/` es un
> proyecto independiente del de la raíz (no es un workspace), así que necesita su
> propio `install`.

```bash
cd extension
npm install

# Chromium
npm run build            # -> .output/chrome-mv3
npm run zip               # -> .output/dama-agile-planner-extension-<version>-chrome.zip

# Firefox
npm run build:firefox     # -> .output/firefox-mv2
npm run sign:firefox      # firma en AMO -> .output/*.xpi (el nombre exacto lo decide web-ext)
```

Firefox exige que **toda** extensión esté firmada, incluso para autoalojarla — no hay
forma de saltarse este paso en producción.

`npm run sign:firefox` necesita `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`, configuradas
en el paso 1. El script `sign:firefox` de `package.json` carga `extension/.env`
automáticamente antes de invocar `web-ext` (`web-ext` en sí es una CLI aparte de
WXT/Vite y no lee `.env` por su cuenta — por eso el script lo hace por él). Si
prefieres no guardarlas en el archivo, puedes exportarlas como variables de entorno
de tu shell en su lugar:

```bash
export WEB_EXT_API_KEY=tu_api_key
export WEB_EXT_API_SECRET=tu_api_secret
npm run sign:firefox
```

> **Comprueba que la firma funcionó antes de seguir.** Sin `WEB_EXT_API_KEY` /
> `WEB_EXT_API_SECRET` reales (o si son inválidas), `npm run sign:firefox` falla con
> `WebExtError: Upload failed: Unauthorized` / `"Unknown JWT iss (issuer)"` y **no
> genera ningún `.xpi`**. Si sigues al paso 3 sin darte cuenta, el `cp .output/*.xpi
> ...` también falla (`cp: cannot stat '.output/*.xpi': No such file or directory`) y
> `uploads/extension/dama-agile-planner-firefox.xpi` nunca se crea o se queda con una
> versión antigua — el resultado es que el enlace de Firefox del Centro de Ayuda da
> 404 .

> **AMO no deja reutilizar un número de versión.** Si ya has firmado antes una
> versión (aunque sea de prueba, en otra máquina o por otra persona), volver a
> ejecutar `npm run sign:firefox` con el mismo `version` de `extension/package.json`
> falla con `WebExtError: Submission failed (2): Conflict` /
> `"Version X.Y.Z already exists"` — tampoco genera `.xpi`, así que el `cp` del
> paso 3 vuelve a fallar por el mismo motivo que arriba. Sube la `version` en
> `extension/package.json` antes de volver a compilar y firmar.

#### Solución de problemas al firmar Firefox

Referencia rápida de lo que nos hemos ido encontrando al firmar (`npm run
sign:firefox`), de más a menos habitual:

| Síntoma | Causa | Solución |
|---|---|---|
| `npm error Missing script: "build:firefox"` (o `sign:firefox`) | No estás dentro de `extension/` — el `package.json` de la raíz no tiene esos scripts. | `cd extension` antes de correr el comando. Comprueba con `pwd` si dudas. |
| `WebExtError: Upload failed: Unauthorized` / `"Unknown JWT iss (issuer)"` | `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET` no están puestas (vacías) o son inválidas. | Ponlas en `extension/.env` o expórtalas en el shell (ver arriba). |
| `WebExtError: Upload failed: Unauthorized` / `"Error decoding signature"` | El valor de `WEB_EXT_API_SECRET` en `.env` tiene un espacio después del `=` o espacios sobrantes al final — se corta al cargar el archivo en shell. | Revisa que la línea sea exactamente `WEB_EXT_API_SECRET=valor`, sin espacios ni comillas alrededor. |
| `WebExtError: Submission failed (2): Conflict` / `"Version X.Y.Z already exists"` | El número de `version` de `extension/package.json` ya se firmó antes en AMO (aunque fuera una prueba). AMO no deja reutilizarlo, y da igual qué API key uses. | Sube el `version` en `extension/package.json`, vuelve a compilar (`npm run build:firefox`) y firma otra vez. |
| No hay ningún `.output/*.xpi` tras `sign:firefox` | Consecuencia de cualquiera de los fallos anteriores — si `sign:firefox` no termina con "Signed xpi downloaded: ...", no se genera `.xpi`. | Revisa el error real más arriba en la salida del comando antes de seguir al paso 3. |
| El enlace de Firefox del Centro de Ayuda da 404 tras "hacer todos los pasos" | El `.xpi` nunca llegó a `uploads/extension/dama-agile-planner-firefox.xpi` porque `sign:firefox` falló silenciosamente en algún punto anterior (cualquiera de los de arriba) y el `cp` del paso 3 no tenía nada que copiar. | Verifica con `ls .output/*.xpi` antes del paso 3; si no existe, soluciona la firma primero. |

### 3. Publica los paquetes (para que los enlaces de descarga funcionen)

El Centro de Ayuda y la página de Bienvenida de la app enlazan a rutas fijas servidas
por el propio backend de dama-agile-planner (`express.static` ya monta `/uploads`, no hace
falta tocar el servidor). Copia ahí los artefactos del paso 2, **con estos nombres
exactos**:

```bash
mkdir -p ../uploads/extension
cp .output/dama-agile-planner-extension-*-chrome.zip ../uploads/extension/dama-agile-planner-chromium.zip
cp .output/*.xpi                                ../uploads/extension/dama-agile-planner-firefox.xpi
```

- `uploads/extension/dama-agile-planner-chromium.zip`
- `uploads/extension/dama-agile-planner-firefox.xpi`

`uploads/` es una carpeta de datos runtime (gitignored): esto hay que repetirlo en
**cada despliegue** en el que cambie la versión de la extensión, no se hace solo.
Sin este paso, los botones de descarga del Centro de Ayuda dan 404.

> **Importante para el PR de deploy**: el pipeline de staging
> (`.forgejo/workflows/deploy-staging.yml`) no ejecuta nada de esto por su cuenta —
> solo corre en el servidor los comandos que el PR incluye entre
> `<!-- DEPLOY_START -->` y `<!-- DEPLOY_END -->` (ver
> `.forgejo/pull_request_template.md`). La plantilla por defecto solo trae
> `git pull` / `npm ci` / `npx prisma migrate deploy` / `npx prisma generate` /
> `npm run build`, que compilan la app pero **no tocan `extension/` en absoluto**.
> Si tu PR cambia algo dentro de `extension/`, añade explícitamente los pasos 1-3 de
> arriba al bloque de deploy del PR:
>
> ```bash
> cd extension
> npm install
> npm run build
> npm run zip
> npm run build:firefox
> npm run sign:firefox
> mkdir -p ../uploads/extension
> cp .output/dama-agile-planner-extension-*-chrome.zip ../uploads/extension/dama-agile-planner-chromium.zip
> cp .output/*.xpi                                ../uploads/extension/dama-agile-planner-firefox.xpi
> cd ..
> ```
>
> `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET` deben existir ya como variables de entorno
> en la máquina de staging para que `npm run sign:firefox` funcione sin intervención
> manual. `npm` ya está instalado ahí porque lo usa el build de la raíz — no hace
> falta ninguna dependencia de sistema adicional, precisamente porque ya no se usa
> `pnpm`. Sin este bloque en el PR, el código de la extensión queda mergeado en
> `staging` pero nunca se compila ni se publica ahí.

### 4. Distribuye a los usuarios finales

La distribución es el enlace del Centro de Ayuda del paso 3 (Centro de Ayuda →
Extensión de navegador) — no hay tienda pública ni instalación forzada por política.
Cada usuario descarga su paquete y lo carga manualmente:

- **Chrome/Edge/Opera**: descarga y descomprime el `.zip` del enlace → `chrome://extensions`
  → activa "Modo desarrollador" → "Cargar descomprimida" → selecciona la carpeta
  descomprimida. Chrome avisará de que la extensión "podría ser peligrosa" al no venir
  de la Chrome Web Store; es el comportamiento esperado, no un error.
- **Firefox**: descarga el `.xpi` firmado del enlace y arrástralo a una ventana de
  Firefox (o ábrelo con doble clic). Al estar firmado por AMO, Firefox lo instala sin
  avisos adicionales.

Estos son exactamente los pasos que ya están redactados en el propio Centro de Ayuda
(`client/lib/translations.ts` → `helpCenter.sections.browserExtension`), así que si
cambias este flujo actualiza también esas traducciones.

> Si más adelante hace falta instalación silenciosa/forzada en Chromium (política de
> empresa: empaquetar un `.crx` + `ExtensionInstallForcelist` + un `update.xml` propio),
> o auto-update en Firefox (`updates.json` referenciado en
> `browser_specific_settings.gecko.update_url`), el build del paso 2 sirve de partida —
> pero eso no es lo que hay montado hoy; el `.zip`/`.xpi` de ahí son para carga manual.

> El `gecko.id` (`dama-agile-planner-app@3llideas.tech`) debe mantenerse **estable** entre
> versiones para que la firma y el auto-update funcionen.

---

## Desarrollo

```bash
cd extension
npm install

# Chromium (abre un perfil de Chrome con la extensión cargada + HMR)
npm run dev

# Firefox
npm run dev:firefox
```

Sin `WXT_SERVER_URL` puesto en `extension/.env` (ver paso 1 arriba), la extensión
carga con un aviso de "Extensión mal configurada" en vez del login — para desarrollo
local, apunta a tu servidor de dev (p. ej. `http://localhost:8080`, o el puerto que
use tu `npm run dev` si difiere).

Carga manual (sin `dev`):
- **Chrome**: `chrome://extensions` → activa "Modo desarrollador" → "Cargar
  descomprimida" → selecciona `.output/chrome-mv3`.
- **Firefox**: `about:debugging#/runtime/this-firefox` → "Cargar complemento
  temporal…" → selecciona `.output/firefox-mv2/manifest.json`.

## Estructura

```
extension/
  wxt.config.ts            # manifest + overrides por navegador (Chrome MV3 / Firefox MV2)
  entrypoints/
    background.ts          # worker: socket, badge, push, alarms, mensajes
    popup/                 # UI React (Login + tabs Timer/Notas/Avisos/Ajustes)
  lib/                     # storage, api-client, messaging, timer-connection, push, badge, deep-link
  types/                   # tipos de la API
  public/icon/             # iconos 16/32/48/96/128
```

Los tipos compartidos con el servidor se importan vía el alias `@shared`
(`../shared`), p. ej. `ActiveTimerState`.

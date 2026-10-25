# REGLAS OFICIALES DE DESARROLLO - DAMA-CRM

## 1. Identidad Visual & Logotipos Obligatorios
- **UBICACIÓN INMUTABLE DE LOGOS**: Todos los logotipos del proyecto están en `client/public/assets/logos/`.
- **ARCHIVOS OFICIALES QUE NUNCA DEBEN BORRARSE NI CAMBIARSE**:
  - `dama-symbol-dark.png` (Símbolo en fondo oscuro / modo claro)
  - `dama-symbol-white.png` (Símbolo en fondo blanco / modo oscuro)
  - `dama-symbol-color.png` (Símbolo a color)
  - `dama-logo-dark.png` (Logo completo oscuro)
  - `dama-logo-white.png` (Logo completo blanco)
  - `dama-logo-color.png` (Logo completo a color)
  - `dama-logo-black.png` (Logo monocromo negro)
  - `dama-logo-vertical-dark.png` (Logo vertical oscuro)
  - `dama-logo-vertical-white.png` (Logo vertical blanco)
  - `sample-company-logo.svg`
- **PROHIBICIÓN ESTRICTA**: NUNCA borrar, renombrar, reemplazar ni regenerar estos logotipos. Toda la plataforma y extensiones deben consumir estrictamente estos assets.

## 2. Paleta de Modo Claro
- El modo claro debe usar una **escala de grises suave y agradable** (Slate/Zinc: `#F1F5F9` / `bg-slate-100/90`), evitando pantallas o fondos blancos cegadores (`#FFFFFF` absoluto en todo el fondo).
- Las tarjetas, modales y paneles deben contrastar con bordes sutiles `border-slate-200` y sombras suaves.

## 3. Posicionamiento de Modales y Popups
- **TODOS LOS MODALES Y POPUPS** (Selector de idioma, Onboarding Tour, Fichaje de jornada / ClockWidget Harvest, Perfil de usuario, NotificationCenter, etc.) deben posicionarse **SIEMPRE EN EL CENTRO EXACTO DE LA PANTALLA** (`fixed inset-0 flex items-center justify-center p-4 m-auto`).
- Queda prohibido posicionar modales o popups pegados a la parte superior de la pantalla (`top-0`, `items-start`, banners invasivos superiores).

## 4. Prohibición de Jerga "God Mode", "Master Tenant" o SuperAdmin Intrusivo en la UI
- **Cero referencias a God Mode o Master Tenant**: Queda terminantemente prohibido incluir textos, insignias, botones, banners o modales visibles para el usuario que hagan referencia a "God Mode", "Master Tenant", "Salir a Master" o "God Admin".
- Todo el vocabulario del producto debe ser limpio, corporativo y profesional: "Empresa Principal", "Administrador", "Organización", "Panel de Configuración".

## 5. Fichaje de Jornada y Timer Harvest con Persistencia Absoluta en Servidor
- El timer de fichaje y seguimiento de tareas (`ClockWidget.tsx`, `time-tracking.controller.ts`) debe funcionar bajo el paradigma de **Harvest**:
  - El cálculo de segundos transcurridos se basa estrictamente en marcas temporales UTC persistidas en PostgreSQL (`clockIn`, `lastResumedAt`, `accumulatedSeconds`).
  - **Inmunidad ante desconexión**: Si el usuario cierra el navegador, recarga la pestaña, suspende el sistema o apaga el ordenador, el timer NO se resetea ni pierde tiempo: al reconectar o volver a abrir, el tiempo transcurrido en el servidor se sincroniza de forma matemática exacta.
  - Soporte completo de: selección de Proyecto, selección de Tarea, conmutador de Facturable (Billable), notas de actividad, pausa/reanudación y cambio inmediato de tarea (stop anterior + start siguiente con registro automático de WorkLog).

## 6. Migraciones de Base de Datos 100% Idempotentes
- Toda sentencia DDL en migraciones SQL (`server/prisma/migrations/` y `prisma/migrations/`) debe ser estrictamente idempotente:
  - Usar siempre `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
  - Las claves foráneas y restricciones únicas deben envolverse siempre en bloques seguros `DO $$ BEGIN IF NOT EXISTS (...) THEN ... END IF; END $$;`.
  - Queda prohibido aplicar migraciones frágiles que fallen si una tabla o columna ya existe.

## 7. Extensiones de Navegador Oficiales (Chrome & Firefox)
- El proyecto mantiene de forma activa y sincronizada las extensiones de navegador en `extension/`:
  - **Google Chrome**: Manifest V3 (`npm run build`).
  - **Mozilla Firefox**: Manifest V2/V3 Gecko (`npm run build:firefox`).
  - Ambas extensiones deben conectarse al backend de DAMA-CRM mediante REST (`/api/auth/login`, `/api/employees/time-tracking/*`) y WebSocket, manteniendo el badge numérico actualizado con el timer Harvest en segundo plano.

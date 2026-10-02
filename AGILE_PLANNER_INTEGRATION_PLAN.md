# PLAN MAESTRO DE INTEGRACIÓN EXHAUSTIVO - AGILE PLANNER EN DAMA-CRM

## 1. Resumen Ejecutivo y Objetivo

El presente documento define la hoja de ruta integral, la arquitectura de datos, la gestión de dependencias de Node.js, las reglas de desarrollo y el sistema de diseño exclusivo de **DAMA-CRM** para consolidar de forma completa e ininterrumpida las capacidades avanzadas de gestión ágil de proyectos dentro de **DAMA-CRM**.

---

## 2. Regla de Oro, Identidad Visual y Prohibición de Estilos Externos

> [!CAUTION]
> **PROHIBICIÓN ESTRICTA DE NOMENCLATURA Y ESTILOS EXTERNOS**:
> 1. Queda completamente prohibido el uso de los términos `soter`, `soterplanner`, `soter_planner` o derivados en archivos, variables, comentarios de código, endpoints o interfaz de usuario.
> 2. **PROHIBIDO COPIAR O USAR LOS ESTILOS DE SOTERPLANNER**: Se deben construir estilos 100% nuevos desde cero basados en el sistema de diseño oficial de **DAMA-CRM**.

### Sistema de Diseño Oficial DAMA-CRM (AGENTS.md):
- **Assets Inmutables**: Los logotipos en `client/public/assets/logos/` (`dama-symbol-dark.png`, `dama-symbol-white.png`, `dama-logo-dark.png`, `dama-logo-color.png`, etc.) NUNCA se alteran, renombra ni reemplazan.
- **Paleta de Modo Claro DAMA**: Fondo suave Slate/Zinc (`bg-slate-100/90` / `#F1F5F9`), evitando blancos cegadores absolutos (`#FFFFFF`).
- **Paleta de Modo Oscuro DAMA**: Fondo profundo Slate u Obsidiana (`bg-slate-900` / `bg-slate-950`).
- **Tarjetas y Contenedores**: Bordes nítidos `border-slate-200/80` (modo claro) / `border-slate-800` (modo oscuro) con sombras suaves `shadow-sm` o `shadow-md`.
- **Posicionamiento Obligatorio de Modales**: Todos los modales y ventanas emergentes deben posicionarse **SIEMPRE EN EL CENTRO EXACTO DE LA PANTALLA**:
  ```tsx
  fixed inset-0 flex items-center justify-center p-4 m-auto z-50
  ```
  *(Queda prohibido colocar modales pegados a `top-0` o `items-start`)*.

---

## 3. Módulos y Dependencias de Node.js (`package.json`)

### 3.1 Server (`server/package.json`)
Añadidos y auditados los siguientes módulos esenciales para el funcionamiento de tiempo real, push y seguridad:

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "nodemailer": "^10.0.11",
    "pdfkit": "^0.15.0",
    "web-push": "^3.6.7",
    "ws": "^8.21.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.17.6",
    "@types/nodemailer": "^6.4.16",
    "@types/pdfkit": "^0.13.7",
    "@types/web-push": "^3.6.3",
    "@types/ws": "^8.18.1",
    "prisma": "^5.22.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.6.3"
  }
}
```

### 3.2 Client (`client/package.json`)
Dependencias cliente optimizadas con React 18, Vite y componentes visuales Tailwind:

```json
{
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "sonner": "^2.0.8",
    "tailwind-merge": "^2.5.5"
  }
}
```

---

## 4. Arquitectura de Base de Datos y Mapeo Prisma

Soporte dual PostgreSQL (`server/prisma/schema.prisma`) y SQLite (`server/prisma/schema.sqlite.prisma`):

| Modelo Prisma DAMA-CRM | Propósito y Relaciones Principales | Mapeo Multi-Tenant |
| :--- | :--- | :--- |
| `Board` | Tableros Kanban/Scrum principales | `tenantId` indexado |
| `BoardMember` | Roles de usuario en tableros (`lead`, `member`, `viewer`) | Heredado de `Board` |
| `BoardColumn` | Columnas con límites WIP, roles autorizados y bloqueos | Heredado de `Board` |
| `BoardSprint` | Iteraciones y Sprints con fechas límite | Heredado de `Board` |
| `BoardTask` | Tareas Agile con historias de usuario, puntos y prioridad | Indexado con `boardId` |
| `TaskLink` | Enlaces simétricos entre tareas de un proyecto | Prevención de duplicados |
| `BoardTaskAssignee` | Asignación múltiple de desarrolladores por tarea | Relación N:M |
| `BoardTaskWatcher` | Seguidores que reciben alertas en tiempo real | Relación N:M |
| `BoardTaskActivity` | Traza de auditoría e historial de cambios por tarea | Relación con User |
| `BoardTaskAttachment` | Archivos adjuntos en tareas y comentarios | Relación con Task/Comment |
| `BoardTaskComment` | Comentarios Markdown con archivos adjuntos | Relación con User/Task |
| `BoardTaskPullRequest` | Pull Requests vinculados (GitHub / Forgejo) | Relación con Task |
| `BoardTaskBranch` | Ramas Git vinculadas (GitHub / Forgejo) | Relación con Task |
| `GithubAccount` / `GithubRepository` | Integración profunda con repositorios de GitHub | Cifrado de Tokens |
| `ForgejoAccount` / `ForgejoRepository` | Integración profunda con repositorios Forgejo | Cifrado de Tokens |
| `PlannerReminder` | Recordatorios periódicos, aplazamiento (snooze) y avisos | Filtrado por `assignedToId` |
| `UserNote` | Notas personales fijables (Pinnable Notes) | Filtrado por `userId` |
| `PushSubscription` | Suscripciones Web Push (VAPID) para extensión/navegador | Relación con User |
| `TaskTemplate` | Plantillas reutilizables de descripción de tareas | Ámbitos General y Personal |
| `ChangelogRelease` / `Entry` | Gestión de Releases y Notas de Versión | Relación con Creador |
| `HarvestReportConfig` | Configuración de reportes semanales de Harvest | Configuración global |
| `ProjectBudgetAlertConfig` / `Status` | Alertas automáticas de presupuesto al 90% y 100% | Indexado por `boardId` |
| `FuelRate` / `ExpenseReceipt` / `Reminder` | Gestión e historial de kilometraje y tickets de gastos | Auditoría y estado de pago |

---

## 5. Configuración de Variables de Entorno (`.env` y `.env.example`)

```env
# ------------------------------------------------------------------------------
# 8. Agile Project & Task Planner Configuration (Companion & Push Services)
# ------------------------------------------------------------------------------
ENCRYPTION_KEY=397fb57d4a1b5c829e0a3d4f5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f
TOTP_ENCRYPTION_KEY=7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:soporte@tudominio.com
HARVEST_ACCOUNT_ID=
HARVEST_ACCESS_TOKEN=
WXT_SERVER_URL=http://localhost:4000
WEB_EXT_API_KEY=dama_agile_extension_secret_key
WEB_EXT_API_SECRET=dama_agile_extension_secret_val
```

---

## 6. Módulos y Enrutamiento Backend (`server/src/modules/planner/`)

Controladores y rutas Express integrados en [`server/src/server.ts`](file:///C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/server/src/server.ts):
- [`planner.controller.ts`](file:///C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/server/src/modules/planner/planner.controller.ts)
- [`planner.routes.ts`](file:///C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/server/src/modules/planner/planner.routes.ts)

### Endpoints Principales API:

```text
GET    /api/planner/boards              - Obtener tableros del tenant activo
POST   /api/planner/boards              - Crear nuevo tablero Agile
GET    /api/planner/boards/:id          - Detalle del tablero con columnas y tareas
PUT    /api/planner/boards/:id          - Actualizar configuración del tablero
DELETE /api/planner/boards/:id          - Eliminar tablero

POST   /api/planner/columns             - Añadir columna al tablero
PUT    /api/planner/columns/:id         - Editar posición/límites WIP/roles de columna
DELETE /api/planner/columns/:id         - Eliminar columna

POST   /api/planner/tasks               - Crear tarea en columna o backlog
PUT    /api/planner/tasks/:id           - Mover tarea / editar detalles / verificación
DELETE /api/planner/tasks/:id           - Eliminar tarea

GET    /api/planner/reminders           - Mis recordatorios programados
POST   /api/planner/reminders           - Crear recordatorio con aviso
GET    /api/planner/notes               - Mis notas rápidas fijables
POST   /api/planner/notes               - Crear/editar nota rápida
GET    /api/planner/templates           - Plantillas de tareas disponibles
GET    /api/planner/changelog           - Listado de versiones y releases
```

---

## 7. Componentes de Interfaz de Usuario Creados desde Cero para DAMA

### 7.1 Componentes Principales:
1. **Tablero Kanban / Agile**: [`client/src/pages/PlannerBoard.tsx`](file:///C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/pages/PlannerBoard.tsx)
   - Diseñado con tarjetas contrastadas `bg-slate-200/60 dark:bg-slate-800/60`, bordes `border-slate-300 dark:border-slate-700` y tipografía obsidian.
   - Modales emergentes para crear/editar tareas posicionados en el centro exacto (`fixed inset-0 flex items-center justify-center p-4 m-auto`).
2. **Personalizador de Menú**: [`client/src/components/settings/SidebarCustomizer.tsx`](file:///C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/components/settings/SidebarCustomizer.tsx)
   - Permite a cada usuario habilitar/deshabilitar y reordenar módulos en el menú lateral.

---

## 8. Protocolo de Ejecución y Verificación

Siga estos pasos secuenciales para ejecutar o auditar la integración:

1. **Instalación de Dependencias**:
   ```bash
   npm install
   ```
2. **Sincronización de Base de Datos**:
   ```bash
   npx prisma migrate dev --name enhance_agile_planner
   npx prisma generate
   ```
3. **Ejecución de Suite de Pruebas (123 Passing)**:
   ```bash
   npm test
   ```
4. **Verificación de Compilación para Producción**:
   ```bash
   npm run build
   ```

---

## 9. Registro de Ajustes del Usuario y Estado de Compilación

- **Integración End-to-End de Funcionalidades de Agile Planner**: Completada e integrada en el ecosistema de DAMA-CRM (Backend Express, Prisma Schema PostgreSQL & SQLite, Frontend React/Vite y extensión de navegador WXT).
- **Purga de Nomenclaturas y Assets Externos**: Depuradas todas las ocurrencias de términos y logos externos, utilizando exclusivamente los logotipos oficiales inmutables (`dama-logo-color.png`, `dama-symbol-dark.png`, etc.) y el sistema de diseño oficial (`bg-slate-100/90`, modales centrados `fixed inset-0 flex items-center justify-center p-4 m-auto`).
- **Eliminación del apartado / Tour de Welcome**: Solicitado por el usuario. Se eliminaron los disparadores y modales de bienvenida (`OnboardingTourModal` y botón en `Navbar.tsx`).
- **Estado de Pruebas Unitarias**: 123/123 pruebas unitarias e integrativas superadas con éxito (`0` fallos).
- **Estado de Compilación**: `npm run build` verificado con éxito (TypeScript servidor OK + bundle Vite cliente OK).

---

*Documento actualizado oficialmente para el proyecto DAMA-CRM.*

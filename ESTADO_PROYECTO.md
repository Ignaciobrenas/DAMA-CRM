# 📋 Estado Completo del Proyecto DAMA-CRM

> **Fecha de Actualización:** Febrero 2026  
> **Versión:** 1.0.0 (Producción / Self-Hosted)  
> **Licencia:** MIT  
> **Autor:** Ignacio (`ignaciobrenas@gmail.com`)

---

## 🏗️ 1. Arquitectura del Sistema

```mermaid
flowchart TD
    subgraph Client [Capa Frontend SPA & PWA]
        ReactApp["React 18 + Vite + Tailwind CSS"]
        PWA["PWA Service Worker + Manifest"]
        Mobile["Capacitor Android Wrapper"]
        BrandCtx["BrandingContext (Logo & Colores)"]
        WSClient["WebSocket Client (Auto-reconnect)"]
    end

    subgraph Gateway [Infraestructura & Proxy]
        Traefik["Traefik v3.1 Reverse Proxy"]
        Nginx["Nginx Alpine (Cliente SPA)"]
    end

    subgraph Backend [Core API & Servicios]
        Express["Express Server (Port 3000)"]
        WSServer["WebSocket Server (/ws)"]
        Swagger["Swagger OpenAPI UI (/api/docs)"]
        PDFKit["Motor Vectorial de Facturas PDF"]
        WorkflowRunner["Motor Background de Automatizaciones"]
        UnoPIMSync["Receptor Webhooks UnoPIM"]
        MetaHook["Receptor Webhooks WhatsApp Meta API"]
    end

    subgraph Database [Persistencia & Caché]
        PG["PostgreSQL 15 Alpine"]
        Prisma["Prisma ORM (Esquema Relacional)"]
        Redis["Redis 7 Alpine"]
    end

    ReactApp --> Traefik
    Traefik --> Nginx
    Traefik --> Express
    WSClient <--> WSServer
    Express --> Prisma
    Prisma --> PG
    Express --> Redis
```

---

## 📦 2. Modelos de Datos Implementados (`core/prisma/schema.prisma`)

1. **`User`**: Identidad de usuarios, email único, hash de contraseñas con bcrypt, flags de 2FA y estado activo.
2. **`Role`**: Roles dinámicos del sistema (`ADMIN`, `SALES`, `PROJECT_MANAGER`, `CLIENT`).
3. **`Permission`**: Permisos granulares de acceso por recurso y acción (`deals:read`, `invoices:write`, wildcard `*`).
4. **`TwoFactorToken`**: Tokens OTP temporales de 6 dígitos con caducidad para inicio de sesión seguro.
5. **`AuditLog`**: Registro forense inmutable de auditoría (quién, qué acción, IP, timestamp, payload anterior y nuevo).
6. **`Company`**: Empresas clientes con datos fiscales (NIF/CIF), ingresos anuales, plantilla y notas.
7. **`Contact`**: Contactos individuales vinculados a empresas, flags de leads, teléfonos, emails y cargos.
8. **`DealStage`**: Fases personalizables del embudo de ventas comercial (`Lead`, `Cualificación`, `Propuesta`, `Negociación`, `Cerrada Ganada`, `Cerrada Perdida`).
9. **`Deal`**: Oportunidades comerciales con valor económico, divisa, fecha prevista de cierre, probabilidad y estado.
10. **`Project`**: Proyectos vinculados a ventas cerradas o creados de forma independiente, con presupuesto y fechas.
11. **`Sprint`**: Sprints de desarrollo o entrega ágil con fechas de inicio/fin y objetivos.
12. **`Task`**: Tareas con estado (`TODO`, `IN_PROGRESS`, `DONE`), prioridad, estimación en horas y puntos de historia (Story Points).
13. **`Product`**: Catálogo de productos y servicios con precio base, código SKU y stock sincronizado.
14. **`Quote`**: Presupuestos formales a clientes con fecha de validez y cálculo de subtotales.
15. **`Invoice`**: Facturas emitidas con numeración correlativa (`FAC-2026-xxx`), fecha de vencimiento y estado de pago.
16. **`InvoiceItem`**: Líneas de factura con descripción, unidades, precio unitario y tipo de IVA (21%).
17. **`Workflow` & `WorkflowLog`**: Definición de reglas automáticas de negocio y su historial de ejecuciones.
18. **`OmniMessage`**: Mensajería omnicanal unificada (WhatsApp Meta API y Correo Electrónico).
19. **`Activity`**: Registro interactivo de interacciones comerciales (**Llamadas, Reuniones, Notas, Tareas**) con duración y estado de completitud.
20. **`CustomField` & `CustomFieldValue`**: Motor dinámico de campos personalizados de cualquier tipo (`TEXT`, `NUMBER`, `DATE`, `SELECT`, `BOOLEAN`) para cualquier entidad sin alterar el esquema SQL físico.

---

## 🌐 3. Endpoints de la API Backend

Todos los endpoints están protegidos por middleware JWT y control dinámico RBAC:

* **Autenticación & Seguridad:**
  - `POST /api/auth/login` (Inicio de sesión con validación de contraseña y detección de 2FA)
  - `POST /api/auth/verify-2fa` (Validación de código OTP de 6 dígitos)
  - `PATCH /api/auth/2fa/toggle` (Activación/Desactivación de 2FA)
  - `GET /api/auth/me` (Datos del usuario autenticado)
* **Ventas & Pipeline:**
  - `GET /api/deals/pipeline` (Métricas de embudo y listado ordenado por fases)
  - `POST /api/deals` (Creación de oportunidades)
  - `PATCH /api/deals/:id` (Mutación optimizada para Drag & Drop en Kanban con broadcast WebSocket)
  - `DELETE /api/deals/:id` (Eliminación)
* **Gestión Ágil de Proyectos:**
  - `GET /api/projects` (Listado de proyectos y cálculo de progreso)
  - `POST /api/projects` (Nuevo proyecto)
  - `POST /api/projects/sprints` (Nuevo sprint)
  - `POST /api/projects/tasks` (Nueva tarea)
  - `PATCH /api/projects/tasks/:id` (Actualización de estado o asignación de tarea)
* **Directorio CRM:**
  - `GET /api/contacts` / `POST /api/contacts` / `GET /api/contacts/:id`
  - `GET /api/companies` / `POST /api/companies` / `GET /api/companies/:id`
* **Timeline de Actividades:**
  - `GET /api/activities?contactId=xxx&dealId=xxx` (Listado cronológico)
  - `POST /api/activities` (Creación de llamada, reunión, nota o tarea)
  - `PATCH /api/activities/:id` (Marcar completada o pendiente)
* **Campos Personalizados (Metadata Engine):**
  - `GET /api/custom-fields?entity=CONTACT|DEAL` (Definiciones de campos)
  - `POST /api/custom-fields` (Crear nuevo campo)
  - `GET /api/custom-fields/entity/:entityId` (Valores actuales)
  - `POST /api/custom-fields/entity/:entityId` (Guardado masivo de valores)
* **Facturación & PDF:**
  - `GET /api/invoices` / `POST /api/invoices`
  - `GET /api/invoices/:id/pdf` (Descarga directa de PDF vectorial generado al vuelo con PDFKit)
* **Inventario & UnoPIM:**
  - `POST /api/inventory/webhooks/unopim` (Webhook de sincronización en vivo)
  - `POST /api/inventory/sync-now` (Ejecución forzada de reconciliación)
* **Omnicanal & WhatsApp:**
  - `GET /api/omnichannel/webhooks/whatsapp` (Handshake de validación Meta)
  - `POST /api/omnichannel/webhooks/whatsapp` (Recepción de mensajes y broadcast WS)
  - `POST /api/omnichannel/messages` (Envío de mensajes con broadcast WS)
* **Business Intelligence & Informes:**
  - `GET /api/reports/kpis` (Métricas de ventas, conversión y velocidad)
  - `GET /api/reports/export/deals` (Exportación directa a CSV estructurado)
* **Buscador Global:**
  - `GET /api/search?q=texto` (Búsqueda unificada en contactos, empresas, ventas, proyectos y facturas)
* **Gestión de Usuarios, Roles & Auditoría:**
  - `GET /api/users` / `POST /api/users` (Alta de usuario corporativo con validación Zod)
  - `GET /api/users/roles` (Listado de roles y matriz de permisos RBAC)
  - `PUT /api/users/roles/:roleId/permissions` (Actualización de matriz de permisos)
  - `GET /api/users/audit-logs` (Trazabilidad forense inmutable de eventos de seguridad y actividad del sistema)
* **Documentación & Salud:**
  - `GET /api/health` (Healthcheck para Traefik y Docker)
  - `GET /api/docs` (Swagger UI interactivo OpenAPI 3.0)
  - `GET /api/docs/json` (Especificación JSON OpenAPI)

---

## 🎨 4. Interfaz de Usuario y Vistas Frontend

* **Diseño Global con Bordes Redondeados:**
  - Estilo redondeado configurado en `client/src/index.css` e inyectado con variables dinámicas (`--custom-radius`).
  - Tarjetas, botones, inputs, diálogos, selectores y tablas con bordes redondeados modernos.
* **Sistema de Personalización de Marca (White-label Branding):**
  - Configuración en la vista de Ajustes (`Settings.tsx`).
  - Sube tu logo corporativo (URL o archivo de imagen local) o usa el isotipo por defecto.
  - Elige el nombre de la empresa y el color primario corporativo (HEX o paleta predefinida).
  - Selecciona la curvatura de bordes (8px, 14px, 20px, 28px).
  - Vista previa en tiempo real y persistencia en `localStorage`.
* **Tiempo Real con WebSockets (`wsClient`):**
  - Conexión persistente y reconexión automática en segundo plano.
  - Actualizaciones en vivo del pipeline Kanban al mover o crear oportunidades.
  - Actualizaciones en vivo del chat omnicanal de WhatsApp.
  - Notificaciones en vivo con contador pulsante en el Navbar.
* **Manejo de Errores Amigable:**
  - En `client/src/services/api.ts`, los errores técnicos o de base de datos se traducen a mensajes sencillos y seguros para el usuario final.
* **10 Idiomas con Soporte RTL:**
  - Español, Inglés, Francés, Alemán, Portugués, Italiano, Chino, Japonés, Ruso y Árabe (con layout dinámico `dir="rtl"`).
* **Paleta de Comandos Global (`Cmd+K` / `Ctrl+K`):**
  - Navegación instantánea por teclado y búsqueda de entidades.
* **Modo Oscuro / Claro:**
  - Detección automática del sistema operativo y alternancia manual persistente.

---

## 🛡️ 5. Seguridad y Gobernanza

* **Protección de Ramas en Git & Entorno Staging:**
  - Rama `staging` como destino principal de integración y despliegue continuo.
  - Flujo de trabajo basado estrictamente en ramas de funcionalidad (`feature/*`, `fix/*`, `chore/*`) que se fusionan en `staging` con `--no-ff`.
  - Empujes directos a `main` y `master` **bloqueados localmente** mediante hook [`.githooks/pre-push`](.githooks/pre-push) y **remotamente** mediante workflow [.github/workflows/block-main-push.yml](.github/workflows/block-main-push.yml).
  - Workflows de CI ([`lint-and-typecheck.yml`](.github/workflows/lint-and-typecheck.yml), [`audit-security.yml`](.github/workflows/audit-security.yml), [`docker-build-check.yml`](.github/workflows/docker-build-check.yml)) integrados para validar cada commit y pull request hacia `staging`.
* **Auditoría de Seguridad y Calidad:**
  - [.github/workflows/audit-security.yml](.github/workflows/audit-security.yml) (`npm audit`, escaneo de secretos).
  - [.github/workflows/lint-and-typecheck.yml](.github/workflows/lint-and-typecheck.yml) (Verificación de TypeScript, build y tests).
  - [.github/workflows/docker-build-check.yml](.github/workflows/docker-build-check.yml) (Comprobación de construcción de contenedores).
* **Copias de Seguridad Automatizadas:**
  - Scripts [scripts/backup-db.sh](scripts/backup-db.sh) y [scripts/backup-db.ps1](scripts/backup-db.ps1) para volcados gzip de PostgreSQL.
  - Script [scripts/restore-db.sh](scripts/restore-db.sh) para recuperación ante desastres.

---

## 📱 6. PWA y Documentación

* **PWA:**
  - [client/public/manifest.json](client/public/manifest.json)
  - [client/public/sw.js](client/public/sw.js)
  - [client/public/favicon.svg](client/public/favicon.svg)
* **Capacitor Android:**
  - [client/capacitor.config.ts](client/capacitor.config.ts)
* **Portal de Documentación Docusaurus:**
  - Ubicado en `docs/` con guías de despliegue a coste cero, arquitectura y API.
* **Instaladores en Un Clic:**
  - [install.sh](install.sh) (Linux/macOS) y [install.ps1](install.ps1) (Windows PowerShell).

---

## 🧪 7. Suite de Tests Automatizados (`core/tests/`)

* **28 tests implementados con el test runner nativo de Node.js:**
  - `core/tests/unit.test.ts` (23 tests): Hashes bcrypt, firma y verificación JWT, matriz de roles RBAC, redondeos fiscales de facturas e IVA, validación de tipos de campos dinámicos, validación estricta de contraseñas (8+ caracteres, mayúscula, minúscula, número, símbolo), validador RFC de emails, validador de teléfonos y esquemas de entidades con campos obligatorios.
  - `core/tests/integration.test.ts` (5 tests): Parser de webhooks de inventario UnoPIM, handshake y normalización de Meta WhatsApp Cloud, evaluador de disparadores de workflows.
  - Ejecutables con: `npm test` o `npm run test` desde la raíz.

---

## 🗄️ 8. Migraciones Prisma y Repositorio de Assets

* **Migraciones SQL Prisma (`core/prisma/migrations/`):**
  - Migración inicial completa `20260226160000_init_dama_crm/migration.sql` con la totalidad de tablas relacionales, índices, claves foráneas y tipos enum.
* **Directorio de Assets y Logos Corporativos:**
  - `assets/logos/`: Repositorio de recursos maestros (logos SVG/PNG, iconos monocromáticos y variantes de fondo claro/oscuro).
  - `client/public/assets/logos/`: Servidos estáticamente para la SPA y selección de marca blanca.
  - `client/public/assets/branding/`: Guías de estilo, paletas de color y placeholders.

---

## ⚙️ 9. Configuración de Variables de Entorno (`.env`)

* **Archivos `.env` Operativos:**
  - [`.env`](.env) en la raíz para Docker Compose, Vite dev server y scripts globales.
  - [`core/.env`](core/.env) para backend Express, Prisma CLI y tests directos.
  - [`.env.example`](.env.example) como plantilla de referencia exhaustiva.
* **Resolución Multi-Directorio:**
  - `core/src/config/index.ts` con carga jerárquica que soporta ejecución desde raíz o subcarpeta `core`.
* **Soporte Proxy WebSocket en Vite:**
  - `client/vite.config.ts` proxifica tanto `/api` como `/ws` hacia el backend en el puerto 4000.

---

## 👑 10. Cuenta Super Administrador

* **Usuario Principal del Sistema:**
  - **Correo:** `ignaciobrenas@gmail.com`
  - **Contraseña:** `1` (hasheada con bcrypt factor 10)
  - **Rol:** `ADMIN` con permisos universales comodín (`*`) en todos los recursos del CRM.
  - **Acceso Rápido:** Botón demo directo de 1-click integrado en [`client/src/pages/Login.tsx`](client/src/pages/Login.tsx).

---

## 🛡️ 11. Motor Universal de Validación y Seguridad de Campos

* **Validaciones Declarativas con Zod ([`core/src/utils/validators.ts`](core/src/utils/validators.ts)):**
  - **Contraseña Fuerte:** Mínimo 8 caracteres, al menos 1 mayúscula (A-Z), 1 minúscula (a-z), 1 dígito numérico (0-9) y 1 símbolo especial (!@#$%...).
  - **Formato de Email:** Validación RFC 5322 con saneamiento a minúsculas y eliminación de espacios en blanco.
  - **Formato Telefónico:** Regex flexible para telefonía nacional e internacional (+34, prefijos, extensiones).
  - **Campos Obligatorios:** Verificación estricta en rutas de usuarios, contactos, empresas, ventas y facturas mediante middleware Express ([`core/src/middlewares/validate.middleware.ts`](core/src/middlewares/validate.middleware.ts)).
* **Experiencia de Usuario en Frontend ([`client/src/utils/validators.ts`](client/src/utils/validators.ts)):**
  - Modal interactivo de "Nuevo Usuario" en Ajustes con medidor reactivo de fuerza de contraseña y checklist de requisitos en tiempo real.
  - Indicadores visuales de campos obligatorios (`*`) y validaciones preventivas en formularios de creación de contactos y empresas.

---

## 💫 12. Motor de Animaciones Fluidas, Notificaciones Toast y Micro-interacciones

* **Librería de Animación Declarativa (`framer-motion`):**
  - **Transición de Páginas Suave:** Transiciones de montaje/desmontaje con `<AnimatePresence mode="wait">` y curvatura spring en [`client/src/App.tsx`](client/src/App.tsx).
  - **Indicador Deslizante de Menú Lateral:** `layoutId="activeSidebarIndicator"` en [`client/src/components/layout/Sidebar.tsx`](client/src/components/layout/Sidebar.tsx) para un efecto *pill sliding* continuo al cambiar de ruta.
  - **Componente Reutilizable `AnimatedIcon` ([`client/src/components/ui/AnimatedIcon.tsx`](client/src/components/ui/AnimatedIcon.tsx)):** Micro-animaciones parametrizables (`hover-scale`, `pulse`, `shake`, `bounce`, `spin`, `float`).
  - **Contadores Numéricos Fluidos `AnimatedCounter` ([`client/src/components/ui/AnimatedCounter.tsx`](client/src/components/ui/AnimatedCounter.tsx)):** Animación de interpolación cubic-bezier para cifras clave (KPIs de ingresos, ventas ganadas, tareas abiertas).
  - **Tarjetas Kanban del Pipeline con Elevación y Arrastre Suave ([`client/src/pages/Pipeline.tsx`](client/src/pages/Pipeline.tsx)):** Animaciones `layout`, escalado al arrastrar y feedback háptico/visual.
  - **Modales con Entrada/Salida Elástica:** Entrada mediante spring (`scale: 0.95` a `1`, `y: 12` a `0`) y salida desvanecida con backdrop blur.
  - **Indicador de Sincronización en Vivo:** Radar animado (`animate-ping`) en [`client/src/components/layout/Navbar.tsx`](client/src/components/layout/Navbar.tsx) con campanilla reactiva (`shake` cuando existen alertas no leídas).
* **Sistema Global de Notificaciones Flotantes `ToastContext` ([`client/src/context/ToastContext.tsx`](client/src/context/ToastContext.tsx)):**
  - Hook universal `useToast()` con métodos de alta ergonomía (`toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`).
  - Toasts apilables con barra de progreso temporizada, iconos temáticos y descarte suave interactivo.
* **Trazabilidad y Registro de Auditoría Visual ([`client/src/pages/Settings.tsx`](client/src/pages/Settings.tsx)):**
  - Panel interactivo con histórico inmutable de eventos de seguridad (inicios de sesión, 2FA, creaciones y modificaciones) sincronizado con `/api/users/audit-logs`.

---

## 🗄️ 13. Base de Datos Local Zero-Docker (Dual Prisma & SQLite)

* **Desarrollo sin Contenedores:**
  - Esquema dual [`core/prisma/schema.sqlite.prisma`](core/prisma/schema.sqlite.prisma) con persistencia en archivo `dev.db` sin requerir PostgreSQL ni Docker activos.
  - Sincronización y repoblación con un solo comando: `npm run db:setup`.
  - Consultas globales de búsqueda y modelos unificados para compatibilidad 100% cruzada (SQLite y PostgreSQL).

---

## 📊 14. Motor de Gráficos Interactivos y Visualización BI

* **Suite Vectorial Ligera SVG (`client/src/components/ui/Charts.tsx`):**
  - **`BarChart` con Tooltips Reactivos:** Gráfico de barras animado con interpolación de altura (`spring`), hover focus, eje X inteligente y formateo de divisas.
  - **`DonutChart` con Métricas Centrales:** Diagrama circular SVG con trazo perimetral dinámico (`strokeDasharray`), cálculo porcentual y desglose de etiquetas.
  - **Integración en Dashboard ([`client/src/pages/Dashboard.tsx`](client/src/pages/Dashboard.tsx)):** Selector de vista Gráfico vs Desglose en la distribución del embudo comercial por etapas.
  - **Integración en Informes ([`client/src/pages/Reports.tsx`](client/src/pages/Reports.tsx)):** Visualización en vivo de la tasa de cierre (Win Rate), estado de oportunidades comerciales y distribución de tareas en sprints ágiles.

---

## ⚡ 15. Constructor Visual de Automatizaciones y Timeline

* **Creador de Reglas en Caliente ([`client/src/pages/Workflows.tsx`](client/src/pages/Workflows.tsx)):**
  - Modal interactivo para definir disparadores (*Triggers*: `deal.won`, `deal.stage_changed`, `contact.created`, `invoice.paid`, `product.stock_low`) y acciones (*Actions*: `create_project`, `send_email`, `create_task`, `notify_webhook`).
  - Activación/desactivación instantánea y prueba en segundo plano con auditoría.
* **Interoperabilidad Total en Timeline de Actividades ([`RecordDrawer.tsx`](client/src/components/crm/RecordDrawer.tsx)):**
  - Soporte bidireccional de títulos, fechas, estados de completado (`isCompleted`/`outcome`) y campos personalizados.



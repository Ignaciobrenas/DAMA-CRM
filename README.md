<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/assets/logos/dama-logo-white.png">
  <source media="(prefers-color-scheme: light)" srcset="client/public/assets/logos/dama-logo-dark.png">
  <img alt="DAMA-CRM Logo" src="client/public/assets/logos/dama-logo-dark.png" width="400">
</picture>

<br><br>

<p align="center">
  <strong>CRM & ERP Modular de Alto Rendimiento para PYMES y Empresas</strong><br>
  <em>100% Self-Hosted · Zero Licencias Recurrentes · Multi-Tenant Real · 11 Idiomas · Multiplataforma</em>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL 15+](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis 7+](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![React 18+](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-116%20Passed-10B981)](server/tests)
[![i18n](https://img.shields.io/badge/i18n-11%20Languages%20100%25-blueviolet)](client/src/i18n)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## 📸 Vista Previa — Dashboard Principal

<div align="center">
  <img src="client/public/assets/docs/screenshot-dashboard.png" alt="Dashboard Principal DAMA-CRM" width="960">
</div>

---

## 📋 Tabla de Contenidos

- [🌟 Ecosistema de Módulos](#-ecosistema-de-módulos)
- [📸 Capturas de Pantalla](#-capturas-de-pantalla)
- [🛠️ Arquitectura Técnica](#️-arquitectura-técnica)
- [🚀 Despliegue Rápido](#-despliegue-rápido-con-docker)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [🧪 Tests Automatizados](#-batería-de-pruebas-automatizadas)
- [🌐 Multi-Idioma](#-soporte-multi-idioma-11-idiomas)
- [📄 Licencia](#-licencia)

---

## 🌟 Ecosistema de Módulos

DAMA-CRM es una plataforma **modular** donde cada empresa activa solo lo que necesita desde `Configuración > Módulos`. Todos los datos se almacenan en PostgreSQL con migraciones Prisma y aislamiento real por tenant.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DAMA-CRM  ·  Ecosystem Map                             │
├──────────────────────────────┬──────────────────────────┬───────────────────────────┤
│ 👑  God Mode SuperAdmin      │ 📅  Calendario & Alertas  │ 📑  Facturación ISO 19005 │
│ 🏢  Multi-Tenant SaaS        │ 👥  Portal del Empleado   │ ✍️   Firma Digital         │
│ ⚙️   Gestor de Módulos        │ ⏱️   Mi Tiempo & Fichajes │ 📊  Margen P&L / AEAT 303 │
├──────────────────────────────┼──────────────────────────┼───────────────────────────┤
│ 🎯  Ventas & Pipeline Kanban │ 🎫  Mesa de Ayuda (SLA)  │ 💬  WhatsApp Omnicanal IA │
│ 📋  Proyectos Ágiles / Scrum │ 📦  Catálogo & Inventario │ 🔌  ERP Connectors        │
│ 🏷️   Lead Capture & Widgets   │ 🚚  Logística & Couriers │ 🤖  Workflows & Zapier    │
├──────────────────────────────┼──────────────────────────┼───────────────────────────┤
│ 🔔  WebSocket Real-Time      │ 🔒  2FA OTP & RBAC        │ 🎨  White-Label & Branding│
│ 🌍  11 Idiomas 100% paridad  │ 📱  Mobile-First PWA      │ 🖥️   Electron Desktop      │
└──────────────────────────────┴──────────────────────────┴───────────────────────────┘
```

---

## 📸 Capturas de Pantalla

### 🔐 Acceso & Login Multi-Tenant

<div align="center">
  <img src="client/public/assets/docs/screenshot-login.png" alt="Login DAMA-CRM" width="960">
</div>

> El login detecta automáticamente el subdominio (`empresa.dama.com`) e inyecta el contexto de tenant con badge visual.

---

### 🎯 CRM — Contactos & Clientes

<div align="center">
  <img src="client/public/assets/docs/screenshot-contacts.png" alt="Contactos DAMA-CRM" width="960">
</div>

**Gestión completa de contactos y clientes:**
- Búsqueda en tiempo real con filtros por segmento, etiqueta y empresa vinculada
- Importación masiva desde Excel/CSV con mapeo inteligente de columnas
- Exportación a CSV con selección múltiple y eliminación en bulk
- Campos personalizados por entidad (texto, número, select, fecha, booleano)
- Historial completo: deals, facturas, tickets y comunicaciones
- Portal de cliente público por token seguro

---

### 💰 Facturación Avanzada ISO 19005-1

<div align="center">
  <img src="client/public/assets/docs/screenshot-invoicing.png" alt="Facturación DAMA-CRM" width="960">
</div>

**Suite de facturación profesional y legal:**
- **Facturas, Presupuestos y Proformas** con numeración automática correlativa
- **Facturas Rectificativas (Abonos)** con motivos R1–R5 reglamentarios
- **IRPF Profesional:** retenciones del 0%, 7%, 15% y 19%
- **IVA flexible:** 0%, 4%, 10%, 21% por línea de concepto
- **Descuentos:** por línea individual y descuento global sobre base imponible
- **PDF/A-3b (ISO 19005-1)** listo para presentación fiscal y Hacienda
- **Firma digital pública** en `/quote/sign/:token` — el cliente firma desde su móvil sin registro
- **Plazos de vencimiento:** Inmediato, 15, 30, 60 días y fin de mes
- **Facturas Recurrentes y Suscripciones** con frecuencia diaria/semanal/mensual/anual
- **Contratos** con numeración y gestión de vigencia
- **Informe de Antigüedad de Deuda (Aging Report)** por cliente
- **Modelo 303 AEAT** — exportación de IVA trimestral

---

### 📅 Calendario con Sincronización Google & Apple

<div align="center">
  <img src="client/public/assets/docs/screenshot-calendar.png" alt="Calendario DAMA-CRM" width="960">
</div>

**Gestión de agenda completa:**
- Vistas mensual, semanal, diaria y lista de agenda cronológica
- Calendarios separados: personal privado vs. calendario global corporativo
- **Sincronización Apple Calendar** vía enlace `webcal://` e importación `.ics`
- **Sincronización Google Calendar** con integración bidireccional de citas
- **Alertas y Recordatorios flotantes** configurables (15 min, 1 h, 1 día antes)
- Drag & Drop de eventos con redimensionado de duración
- Vinculación de eventos con clientes, proyectos y deals

---

### 🎯 Pipeline de Ventas Kanban

<div align="center">
  <img src="client/public/assets/docs/screenshot-pipeline.png" alt="Pipeline Ventas DAMA-CRM" width="960">
</div>

**Embudo visual de ventas configurable:**
- Etapas personalizables: Lead → Contacto → Propuesta → Negociación → Ganado/Perdido
- **Previsión ponderada de ingresos** según probabilidad por etapa
- Arrastrar y soltar deals entre etapas con actualización en tiempo real via WebSocket
- Trazabilidad completa: contacto, empresa, presupuesto, proyecto vinculados
- Campos personalizados por oportunidad (Custom Fields)
- Estadísticas de conversión por comercial y período

---

### 📦 Inventario & Catálogo de Productos

<div align="center">
  <img src="client/public/assets/docs/screenshot-inventory.png" alt="Inventario DAMA-CRM" width="960">
</div>

**Gestión de stock y catálogo avanzada:**
- **Vista Dual:** Tabla compacta / Cajas visuales con fotos en alta resolución
- **Stock en tiempo real** con barra cromática: verde (ok) / naranja (bajo) / rojo (agotado)
- **Movimientos de stock:** Entrada, salida, ajuste, devolución y transferencia entre almacenes
- **Márgenes:** precio de compra, precio de venta, % margen y beneficio por unidad
- **Multi-App Mapping:** Auto-mapeo con UnoPIM, OpenCart, Sage (1/50/200), Odoo, Shopify y WooCommerce
- **Sincronización en lote** de atributos, variantes, precios y metadatos
- Exportación a CSV e importación masiva desde Excel

---

### ⚙️ Configuración & Personalización White-Label

<div align="center">
  <img src="client/public/assets/docs/screenshot-settings.png" alt="Configuración DAMA-CRM" width="960">
</div>

**Personalización total por empresa/tenant:**
- **Identidad corporativa:** logotipo propio, colores de marca, nombre legal, CIF/NIF, dirección fiscal
- **Datos de facturación:** moneda (EUR, USD, GBP, MXN, COP), IBAN, texto de pie de facturas
- **White-Label:** eliminación total de marcas DAMA para reventa o marca blanca
- **Zoom UI / Escala global** de interfaz: 80% a 130% para monitores y portátiles
- **Tipografía adaptable:** tamaños XS, SM, MD, LG, XL
- **Estilos de iconos:** Animados (Bounce), Sólidos, Minimalistas
- **Campos personalizados (Custom Fields):** Añade campos propios a Contactos, Empresas, Deals, Proyectos, Facturas, Inventario y Tickets

---

### 👥 Portal del Empleado & Fichajes

**Control horario legal e integración de RRHH:**
- Fichaje digital de jornada con justificación (Oficina, Teletrabajo, Visita comercial, Pausa médica)
- **Registro de pausas y horas extra** con informes semanales y mensuales
- **Portal de Empleado privado:** consulta de nóminas en PDF con enmascaramiento RGPD de IBAN
- **Imputación de horas** a tareas y proyectos para control de rentabilidad
- **Directorio de empleados** con gestión de contratos, departamentos y estados (activo/baja/permiso)
- **Nóminas:** historial completo con exportación PDF por empleado
- **Sincronización Odoo** con `hr.attendance`

---

### 📋 Planificador Ágil & Proyectos

**Gestión de proyectos Scrum/Kanban:**
- **Sprints** con fechas inicio/fin, puntos de historia y velocidad del equipo
- **Historias de usuario** con estimación de puntos, asignación y prioridad
- **Kanban board** con columnas personalizables y WIP limits
- **Hilo de comentarios** en tiempo real por tarea
- **Registro de tiempos** imputados por tarea con resumen de desviación
- **Descripción en Markdown** con soporte de código, listas, tablas e imágenes

---

### 🎫 Mesa de Ayuda (Helpdesk) con SLAs

**Gestión de tickets y soporte:**
- **SLA configurables** por prioridad: Crítica (1h), Alta (4h), Media (24h), Baja (72h)
- **Estados:** Abierto → En progreso → Pendiente cliente → Resuelto → Cerrado
- Asignación automática por agente y departamento
- Vista Kanban y vista Lista con filtros por estado, prioridad y asignado
- **Escalado automático** si supera el SLA sin resolución

---

### 💬 Omnicanal & WhatsApp con IA

**Bandeja unificada de comunicaciones:**
- **WhatsApp Cloud API de Meta** — mensajes entrantes y salientes en tiempo real
- **Respuestas automáticas con IA** configurables por contexto
- **Email omnicanal** — recepción y respuesta desde el CRM
- **Chat interno de equipo** con canales departamentales y DMs
- Historial completo de conversaciones vinculado al contacto CRM

---

### 🔌 Integraciones & Conectores ERP

**Ecosistema de conectores nativos:**

| Integración | Funcionalidad |
|---|---|
| **Sage 1 (Business Cloud)** | Sincronización contable, clientes y facturas |
| **Sage 50** | Asientos contables, referencias proveedor y tarifas |
| **Sage 200** | Ledger enterprise, suscripciones y multiempresa |
| **Odoo** | Plantillas de producto, variantes, `hr.attendance` |
| **UnoPIM** | Catálogo PIM, familias de atributos y variantes en lote |
| **OpenCart** | Catálogo, pedidos y stock de tienda online |
| **WooCommerce** | Captura de pedidos → Deal + Contacto automático |
| **Shopify** | Metacampos, tags, variantes y pedidos |
| **n8n / Zapier** | Webhooks bidireccionales y automatizaciones sin código |
| **Meta WhatsApp Cloud API** | Mensajería omnicanal con respuestas IA |
| **Google Calendar** | Sincronización bidireccional de eventos y citas |
| **Apple Calendar / iCal** | Feed webcal:// con RFC 5545 |

---

### 🤖 Workflows & Automatizaciones

**Motor de automatización visual:**
- Triggers: Deal ganado, Contacto creado, Ticket abierto, Fecha de vencimiento, Webhook entrante
- Acciones: Enviar email, Crear tarea, Actualizar campo, Llamar webhook, Notificar por WhatsApp
- Condiciones lógicas AND/OR con operadores de comparación
- Historial de ejecuciones y logs de depuración

---

### 🏷️ Lead Capture & Widgets de Captación

**Generador de widgets y formularios embebibles:**
- **Widget flotante** de WhatsApp/Chat incrustable en cualquier web con 1 línea de código
- **Formulario de captación** HTML embebible en landing pages
- **Pixel de seguimiento** JavaScript para analytics de conversión
- **Chat flotante DAMA** con Widget personalizable de colores y posición

---

### 🚚 Logística & Couriers

**Gestión de envíos y seguimiento:**
- Integración con **GLS, NACEX, Amazon Logistics y Correos**
- Generación de códigos de seguimiento por carrier
- Estados: En preparación → Recogido → En tránsito → Entregado / Fallido
- Tasa de entrega exitosa y métricas por carrier

---

### 👑 God Mode SuperAdmin & Multi-Tenant

**Panel de administración global SaaS:**
- Gestión de todos los tenants (empresas) desde un único panel
- Cambio de contexto de tenant en tiempo real (X-Switch-Tenant-ID)
- Detección automática de subdominio `empresa.dama.com` → tenant context
- Configuración de módulos activos por empresa
- Impersonación segura de usuarios para soporte

---

## 🛠️ Arquitectura Técnica

```
┌────────────────────────────────────────────────────────────────┐
│                         Arquitectura                           │
├──────────────────────────┬─────────────────────────────────────┤
│ Frontend                 │ React 18 + Vite 8 + TypeScript 5    │
│ Estilos                  │ Tailwind CSS v3 + CSS Variables      │
│ Animaciones & Iconos     │ Framer Motion + Lucide Icons         │
│ Backend API REST         │ Node.js 20 + Express 4 + TypeScript  │
│ ORM & Migraciones        │ Prisma ORM + PostgreSQL 15           │
│ Caché & Rate Limiting    │ Redis 7                              │
│ Tiempo Real              │ WebSockets nativos (wsClient)        │
│ Autenticación            │ JWT + 2FA OTP (TOTP/HOTP)           │
│ Multi-Tenant             │ Row-Level Isolation por tenantId     │
│ Despliegue               │ Docker Compose + Traefik Proxy       │
│ DNS Wildcard             │ Dnsmasq (*.dama.com → 127.0.0.1)    │
│ Escritorio               │ Electron (Windows / Linux / macOS)   │
│ Móvil                    │ Capacitor (Android / iOS)            │
│ PWA                      │ Service Worker + Web Manifest        │
└──────────────────────────┴─────────────────────────────────────┘
```

### Stack de Seguridad

- **RBAC Multi-Rol:** ADMIN, SALES, TECH, SUPPORT, HR, EMPLOYEE, VIEWER
- **2FA TOTP/HOTP** compatible con Google Authenticator y Authy
- **Rate Limiting** Redis por IP y por usuario
- **CORS estricto** por lista de orígenes permitidos
- **Cabeceras de seguridad:** HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Auditoría:** log completo de acciones de usuario con diff de cambios

---

## 🚀 Despliegue Rápido con Docker

### 1. Clonar el repositorio

```bash
git clone https://github.com/Ignaciobrenas/DAMA-CRM.git
cd DAMA-CRM
```

### 2. Configurar variables de entorno

```bash
cp server/.env.example server/.env
# Editar server/.env con tus valores
```

### 3. Arrancar todos los contenedores

```bash
docker compose up -d
```

Esto levanta automáticamente:
- `crm-db` — PostgreSQL 15
- `crm-redis` — Redis 7
- `crm-server` — API Node.js en puerto 4000
- `crm-client` — Frontend React vía Nginx en puerto 80
- `crm-proxy` — Traefik reverse proxy
- `crm-dns` — Dnsmasq wildcard DNS para `*.dama.com`
- `crm-mailpit` — Servidor SMTP de pruebas (puerto 8025)

### 4. Ejecutar migraciones

```bash
docker compose exec crm-server npx prisma db push
```

### 5. Acceso a la aplicación

| Servicio | URL |
|---|---|
| **Frontend** | `http://localhost` o `http://app.dama.com` |
| **API Backend** | `http://localhost:4000/api` |
| **Swagger Docs** | `http://localhost:4000/api/docs` |
| **Mailpit SMTP UI** | `http://localhost:8025` |
| **God Mode SuperAdmin** | `http://god.dama.com` |

### Desarrollo Local

```bash
# Backend
cd server && npm install && npm run dev

# Frontend (nueva terminal)
cd client && npm install && npm run dev
# → http://localhost:5173
```

---

## ⚙️ Variables de Entorno

Crea `server/.env` con las siguientes variables:

```env
# Base de Datos
DATABASE_URL="postgresql://dama:dama_pass@localhost:5433/dama_crm?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Autenticación JWT
JWT_SECRET="tu-secreto-muy-seguro-aqui"
JWT_EXPIRES_IN="7d"

# Servidor
PORT=4000
NODE_ENV=production
CLIENT_URL=http://localhost:5173

# Email (SMTP)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="DAMA-CRM <noreply@dama.com>"

# WhatsApp Meta Cloud API (opcional)
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=
META_VERIFY_TOKEN=

# Google Calendar OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# n8n Webhooks (opcional)
N8N_API_KEY=
N8N_BASE_URL=
```

---

## 🧪 Batería de Pruebas Automatizadas

El proyecto cuenta con **116 tests automatizados** y validación de paridad completa en 11 idiomas:

```bash
npm run test:all
```

```
✔ DAMA-CRM Core Unit Tests                   (116 tests pass)
✔ DAMA-CRM Integration & Automation Tests    (7 tests pass)
✔ i18n 11-Language Parity Check              (1603/1603 keys × 11 locales = 100%)
```

Los tests cubren:
- **Lógica de negocio:** Facturación, IRPF, IVA, descuentos, cálculo de márgenes
- **Multi-Tenant Isolation:** Aislamiento por tenantId en todas las entidades
- **RBAC Matrix:** Permisos por rol en 7 roles × múltiples recursos
- **Validaciones:** Email RFC, teléfonos internacionales, NIF/NIE/CIF/IBAN MOD-97
- **Integraciones:** Webhooks de WooCommerce, Meta WhatsApp, n8n y UnoPIM
- **Calendario:** RFC 5545 iCal, recordatorios y aislamiento de calendarios
- **Exportación:** CSV UTF-8 BOM y generación PDF branded
- **Logística:** Carriers y transiciones de estado de envíos

---

## 🌐 Soporte Multi-Idioma: 11 Idiomas

DAMA-CRM está completamente traducido y sincronizado al 100% (1.603 claves de traducción):

| # | Idioma | Código | Estado |
|---|--------|--------|--------|
| 1 | 🇪🇸 Español | `es` | ✅ Base |
| 2 | 🏴 Català | `ca` | ✅ 100% |
| 3 | 🇬🇧 English | `en` | ✅ 100% |
| 4 | 🇫🇷 Français | `fr` | ✅ 100% |
| 5 | 🇩🇪 Deutsch | `de` | ✅ 100% |
| 6 | 🇮🇹 Italiano | `it` | ✅ 100% |
| 7 | 🇵🇹 Português | `pt` | ✅ 100% |
| 8 | 🇸🇦 العربية | `ar` | ✅ 100% + RTL |
| 9 | 🇨🇳 中文 | `zh` | ✅ 100% |
| 10 | 🇯🇵 日本語 | `ja` | ✅ 100% |
| 11 | 🇷🇺 Русский | `ru` | ✅ 100% |

---

## 📱 Multiplataforma

DAMA-CRM es una plataforma **Mobile-First** desplegable en cualquier entorno:

- **Web PWA:** Instalable desde el navegador como app nativa
- **Escritorio Electron:** Paquete nativo para Windows (`.exe`), Linux (`.deb`/AppImage) y macOS (`.dmg`)
- **Móvil Capacitor:** App nativa para Android (`.apk`/`.aab`) e iOS via Xcode
- **Navegación táctil:** Barra inferior con acceso al pulgar a módulos clave
- **Safe-Area Insets:** Soporte para bordes curvos de iPhone y Android moderno

---

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/assets/logos/dama-logo-vertical-white.png">
  <source media="(prefers-color-scheme: light)" srcset="client/public/assets/logos/dama-logo-vertical-dark.png">
  <img alt="DAMA-CRM" src="client/public/assets/logos/dama-logo-vertical-dark.png" width="160">
</picture>

<br>

**Hecho con ❤️ para empresas que merecen herramientas de primera.**

[Licencia MIT](LICENSE) · [Reportar un Bug](https://github.com/Ignaciobrenas/DAMA-CRM/issues) · [Solicitar Funcionalidad](https://github.com/Ignaciobrenas/DAMA-CRM/issues)

</div>

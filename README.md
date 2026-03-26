# DAMA-CRM: CRM Modular Open-Source y Self-Hosted para PYMES 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-success)](core/src/services/websocket.service.ts)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple)](client/public/manifest.json)

> **DAMA-CRM** es una plataforma completa de gestión de clientes (CRM), proyectos ágiles, facturación, automatizaciones e inventario, diseñada para ser **100% self-hosted**, sin costes de licencias recurrentes y desplegable a coste cero en infraestructuras propias o en la capa Always-Free de Oracle Cloud / Cloudflare.

---

## ⚡ Arranque Inmediato con un Solo Comando

Puedes arrancar simultáneamente el Backend Core (Node/Express/Prisma) y el Frontend SPA (React/Vite/Tailwind) desde la raíz del proyecto:

```bash
# 1. Instalar dependencias (si no lo has hecho aún)
npm install
npm --prefix core install
npm --prefix client install

# 2. Generar cliente Prisma
npm --prefix core run prisma:generate

# 3. ¡Arrancar todo el sistema!
npm run dev
```

Esto levantará concurrentemente:
* 🟢 **Frontend Web (Vite SPA + PWA):** [http://localhost:3000](http://localhost:3000)
* 🔵 **API Backend Core (Express + WebSockets):** [http://localhost:4000](http://localhost:4000)
* ⚡ **Canal WebSocket en tiempo real:** `ws://localhost:4000/ws` (o a través del proxy en `ws://localhost:3000/ws`)
* 📖 **Documentación Swagger OpenAPI 3.0 interactiva:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## ⚙️ Configuración de Variables de Entorno (`.env`)

El proyecto incluye archivos `.env` preconfigurados para desarrollo local inmediato:
* **Raíz (`.env`):** Utilizado por Docker Compose, scripts raíz y el proxy de Vite.
* **Core (`core/.env`):** Utilizado por el backend de Express, Prisma CLI y tests de base de datos.

| Variable | Descripción | Valor por Defecto (Dev) |
| :--- | :--- | :--- |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`) | `development` |
| `PORT` | Puerto HTTP del servidor Express | `4000` |
| `CLIENT_PORT` | Puerto del servidor de desarrollo Vite | `3000` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://crm_user:crm_password@localhost:5432/dama_crm?schema=public` |
| `POSTGRES_USER` | Usuario de PostgreSQL para Docker Compose | `crm_user` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL para Docker Compose | `crm_password` |
| `POSTGRES_DB` | Nombre de la base de datos | `dama_crm` |
| `REDIS_HOST` | Host del broker Redis (localhost o crm-redis) | `localhost` |
| `REDIS_PORT` | Puerto de conexión Redis | `6379` |
| `JWT_SECRET` | Clave secreta para firma y verificación de tokens | `super_secret_jwt_key_crm_dama_change_me_in_production` |
| `JWT_EXPIRES_IN` | Caducidad de sesiones JWT | `7d` |
| `SMTP_HOST` | Servidor SMTP para envío de correos y 2FA OTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto del servidor SMTP | `587` |
| `SMTP_SECURE` | Habilitar TLS directo (`true`/`false`) | `false` |
| `SMTP_USER` | Usuario o email de autenticación SMTP | `notificaciones@tudominio.com` |
| `SMTP_PASS` | Contraseña o token de aplicación SMTP | `tu_contrasena_de_aplicacion` |
| `SMTP_FROM` | Remitente de los correos emitidos | `"DAMA-CRM <no-reply@tudominio.com>"` |
| `UNOPIM_WEBHOOK_SECRET` | Token secreto para validar webhooks de UnoPIM | `unopim_secret_token_123` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN`| Token de verificación handshake Meta WhatsApp | `meta_verify_token_crm_456` |
| `DOMAIN_NAME` | Dominio de producción para Traefik / SSL | `crm.local` |
| `ACME_EMAIL` | Email de registro para Let's Encrypt SSL | `admin@dama-crm.local` |

---

## 🌟 Módulos y Funcionalidades Implementadas

### 🏢 1. Marca Blanca y Personalización de Empresa (Branding)
* **Logo Corporativo:** Sube tu propio logo o introduce una URL pública, reflejado al instante en el menú, login y barra superior.
* **Nombre de la Empresa:** Renombra la plataforma con la identidad de tu negocio.
* **Paleta de Colores Dinámica:** Selector de color HEX o paletas rápidas (Azul Real, Verde Esmeralda, Púrpura Tech, Naranja Pro, Carmín, Cian) inyectadas dinámicamente en tiempo de ejecución.
* **Bordes Redondeados Universales:** Ajusta la curvatura de toda la interfaz (8px, 14px, 20px o 28px Soft UI).

### ⚡ 2. Tiempo Real con WebSockets (`/ws`)
* **Pipeline en Vivo:** Sincronización instantánea de los cambios de fase en el tablero Kanban entre todos los agentes conectados.
* **Mensajería Omnicanal:** Recepción de mensajes de WhatsApp y correos en tiempo real en la pantalla de chat sin recargar.
* **Centro de Notificaciones:** Notificaciones emergentes automáticas con contador de no leídas en el Navbar para ventas ganadas, stock crítico y mensajes entrantes.

### 🛡️ 3. Mensajes de Error Amigables y Seguros
* Errores normalizados en cliente y servidor: sin volcados técnicos de base de datos ni trazas de pila que comprometan la seguridad.
* Mensajes comprensibles para el usuario con sugerencias claras de acción.

### 📊 4. Embudo Comercial y Pipeline Kanban
* Tablero visual arrastrar y soltar (*Drag & Drop*) con mutaciones ultraeficientes vía `PATCH`.
* Efecto de celebración con confeti interactivo al mover una venta a la fase **Ganada**.
* Drawer de registro para abrir actividades y campos personalizados al hacer clic en cualquier oportunidad.

### ⏱️ 5. Timeline de Actividades y Campos Personalizados Dinámicos
* Registro de **Llamadas, Reuniones, Notas y Tareas** con fechas, duración y marcas de completado.
* Motor de **Metadatos y Campos Personalizados** configurables (`TEXT`, `NUMBER`, `DATE`, `SELECT`, `BOOLEAN`) para contactos y oportunidades.

### 📱 6. PWA (Progressive Web App) y Preparación Móvil
* Aplicación instalable en escritorio, Android e iOS con [manifest.json](client/public/manifest.json) y [sw.js](client/public/sw.js) para soporte offline.
* Compatible con empaquetado nativo APK Android mediante **Capacitor**.

### 🧾 7. Presupuestos y Facturación con PDF Nativo
* Generación instantánea de presupuestos y facturas legales con desglose de IVA (21%).
* Motor vectorial con PDFKit descargable al vuelo sin dependencias externas pesadas.

### 📦 8. Sincronización de Inventario UnoPIM
* Receptor de webhooks de productos y stock (`product.updated`, `product.created`).
* Sweep nocturno automático para reconciliación de catálogos y stock bajo.

### 🤖 9. Motor de Automatizaciones en Segundo Plano
* Reglas configurables con disparadores (`deal.won`, `contact.created`, `invoice.paid`) y acciones automáticas (notificaciones, creación de proyectos, envío de mensajes).

### 📈 10. Business Intelligence & Informes
* Métricas en tiempo real: MRR, ARR, Win Rate, velocidad de sprints y exportación a CSV.

---

## 👥 Credenciales de Acceso Demo

| Rol | Correo | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Super Administrador (Ignacio)** | `ignaciobrenas@gmail.com` | `1` | Acceso total (`*`), RBAC universal, Gobernanza y Marca |
| **Administrador Demo** | `admin@dama-crm.local` | `Admin1234!` | Acceso universal (`*`), RBAC, Configuración y Marca |
| **Comercial / Ventas** | `ventas@dama-crm.local` | `Ventas1234!` | Contactos, Pipeline Kanban, Facturas, Chat Omnicanal |
| **Project Manager** | `pm@dama-crm.local` | `Pm1234!` | Proyectos Ágiles, Sprints, Tareas y SLAs |

---

### 🔒 Motor de Validación Estricta de Campos y Contraseñas
* **Contraseñas Robustas:** Mínimo 8 caracteres, al menos 1 letra mayúscula (A-Z), 1 letra minúscula (a-z), 1 número (0-9) y 1 carácter especial o símbolo (!@#$%...).
* **Verificación de Correo Electrónico:** Formato RFC 5322 estandarizado y saneamiento automático a minúsculas y sin espacios.
* **Validación de Teléfonos:** Formato numérico nacional e internacional (E.164: +34 600 000 000 o 912345678).
* **Campos Obligatorios:** Middleware de validación con Zod en Express que rechaza datos incompletos con respuestas 400 y mensajes comprensibles.
* **Medidor Reactivo de Fuerza de Contraseña:** Componente visual interactivo con checklist y porcentaje de seguridad en el alta de usuarios.

---

## 🧪 Ejecución de Tests Automatizados

La suite de tests unitarios e integración valida la lógica crítica del backend:

```bash
# Ejecutar tests de Core
npm test
# o desde la raíz
npm --prefix core test
```

Valida:
- Hasheo de contraseñas con bcrypt y generación de tokens JWT.
- Matriz dinámica de RBAC con permisos comodín.
- Cálculos matemáticos y redondeo de facturas e IVA.
- Validador de tipos de campos personalizados.
- Parser de webhooks de UnoPIM y Meta WhatsApp Cloud.
- Motor de disparadores de workflows.

---

## 🐳 Despliegue con Docker Compose (Producción)

```bash
# Levantar stack completo con Traefik, PostgreSQL, Redis, Core API y Nginx SPA
docker compose up -d --build
```

---

## 🌿 Política de Ramas y Despliegue (`staging`)

DAMA-CRM utiliza una estricta política de protección de ramas para asegurar la estabilidad:
* **Rama `staging` (Integración Principal):** Es la rama activa donde se centraliza y valida todo el desarrollo antes de pasar a producción.
* **Ramas de trabajo (`feature/*`, `fix/*`, `chore/*`):** Ramas aisladas para cada funcionalidad o corrección, que se fusionan en `staging`.
* **Ramas de producción (`main` / `master`):**
  - Los empujes directos (`git push`) están **estrictamente bloqueados** a través de hooks locales ([`.githooks/pre-push`](.githooks/pre-push)) y GitHub Actions ([`.github/workflows/block-main-push.yml`](.github/workflows/block-main-push.yml)).
  - Todo cambio destinado a producción debe provenir de un Pull Request o merge controlado desde `staging`.

```bash
# Flujo estándar de desarrollo:
git checkout staging
git checkout -b feature/mi-modulo
# ... realizar cambios y commits ...
git checkout staging
git merge feature/mi-modulo --no-ff
git push origin staging
```

---

## 📄 Licencia

Desarrollado bajo licencia **MIT** por [Ignacio](https://github.com/).

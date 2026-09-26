# DAMA-CRM: Plataforma Modular Open-Source y Self-Hosted para PYMES 🚀

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/assets/logos/dama-logo-white.svg">
  <source media="(prefers-color-scheme: light)" srcset="client/public/assets/logos/dama-logo-dark.svg">
  <img alt="DAMA-CRM Logo" src="client/public/assets/logos/dama-logo-dark.svg" width="380">
</picture>

<p align="center">
  <strong>CRM empresarial de alto rendimiento, gestión comercial ágil, pipeline Kanban, facturación con PDF vectorial, automatizaciones y centro de integraciones de terceros.</strong><br>
  <em>100% On-Premise y Self-Hosted • Zero Licencias Recurrentes • Compatible con Docker, Traefik y Let's Encrypt SSL</em>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL 15+](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis 7+](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![React 18+](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-success)](core/src/services/websocket.service.ts)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple)](client/public/manifest.json)

</div>

---

## 🎨 Nueva Imagen de Marca e Identidad Visual (Light & Dark Mode)

DAMA-CRM cuenta con una identidad visual moderna y vectorizada en formato SVG de alta definición, diseñada con adaptabilidad nativa según el tema del sistema operativo o la preferencia del usuario:

| Variante | Modo Claro (Light Mode) | Modo Oscuro (Dark Mode) |
| :--- | :---: | :---: |
| **Logotipo Completo** | ![DAMA Logo Dark](client/public/assets/logos/dama-logo-dark.svg) | ![DAMA Logo White](client/public/assets/logos/dama-logo-white.svg) |
| **Símbolo / Imagotipo** | <img src="client/public/assets/logos/dama-symbol-dark.svg" width="90" alt="DAMA Symbol Dark" /> | <img src="client/public/assets/logos/dama-symbol-white.svg" width="90" alt="DAMA Symbol White" /> |
| **Uso Principal** | Fondos blancos o claros (`#FFFFFF`, `#F8FAFC`) | Fondos oscuros (`#0F172A`, `#1E293B`) |

> [!TIP]
> **Comportamiento Placeholder Dinámico:** Si la empresa no sube un logotipo corporativo personalizado en los ajustes de marca blanca, el sistema utiliza automáticamente el imagotipo oficial DAMA con contraste inteligente: tono azul marino corporativo (`#072053`) en modo claro y blanco puro con transparencia en modo oscuro.

---

## 📸 Galería Visual de la Aplicación

### 1. Panel de Control y Métricas BI (Dashboard)
Visualiza KPIs de facturación, tasa de conversión, actividad del pipeline comercial y gráficos interactivos con transiciones fluidas.

| Modo Claro | Modo Oscuro |
| :---: | :---: |
| ![Dashboard Light](docs/screenshots/dama-crm-dashboard-light.png) | ![Dashboard Dark](docs/screenshots/dama-crm-dashboard-dark.png) |

---

### 2. Hub de Integraciones de Terceros (`/integrations`)
Catálogo integral con filtrado por categorías (ERP, E-Commerce, Automatización, Pasarelas de Pago, Comunicación), buscador en tiempo real, comprobación de conexión en vivo y panel de credenciales con control estricto para administradores.

| Integraciones en Modo Claro | Integraciones en Modo Oscuro |
| :---: | :---: |
| ![Integraciones Light](docs/screenshots/dama-crm-integrations-light.png) | ![Integraciones Dark](docs/screenshots/dama-crm-integrations-dark.png) |

---

### 3. Asistente de Onboarding Guiado (`/onboarding`) y Acceso Seguro
Experiencia de bienvenida en 4 pasos para configurar la identidad corporativa, moneda, perfiles de equipo e integraciones activas.

| Asistente de Onboarding | Pantalla de Acceso & Autenticación |
| :---: | :---: |
| ![Onboarding](docs/screenshots/dama-crm-onboarding.png) | ![Login](docs/screenshots/dama-crm-login.png) |

---

## ⚡ Inicio Rápido en Desarrollo Local

### Requisitos Previos
* **Node.js:** v20.x o superior
* **npm:** v10.x o superior
* **Docker Desktop** (para PostgreSQL y Redis) o PostgreSQL 15 local

### Pasos de Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/Ignaciobrenas/DAMA-CRM.git
cd DAMA-CRM

# 2. Instalar dependencias globales y de cada paquete
npm install
npm --prefix core install
npm --prefix client install

# 3. Configurar variables de entorno iniciales
cp .env.example .env

# 4. Levantar la base de datos PostgreSQL y Redis con Docker
docker compose up -d crm-db crm-redis

# 5. Aplicar migraciones y cargar datos demo iniciales (Seed)
npm run db:setup:pg

# 6. Iniciar entorno de desarrollo concurrente
npm run dev
```

Esto levantará automáticamente:
* 🟢 **Frontend Web (Vite SPA + PWA):** [http://localhost:5173](http://localhost:5173)
* 🔵 **API Backend Core (Express + WebSockets):** [http://localhost:4000](http://localhost:4000)
* ⚡ **Canal WebSocket en tiempo real:** `ws://localhost:4000/ws`
* 📖 **Documentación Swagger OpenAPI 3.0 interactiva:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
* 🗄️ **Base de datos PostgreSQL:** `localhost:5433` (mapeada en el contenedor `dama-crm-db`)
* 🔴 **Broker Redis:** `localhost:6379` (en el contenedor `dama-crm-redis`)

---

## 👥 Credenciales de Acceso Demo

| Perfil / Rol | Correo Electrónico | Contraseña | Permisos y Alcance |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `ignaciobrenas@gmail.com` | `1` | Acceso universal (`*`), RBAC dinámico, configuración de integraciones y marca |
| **Administrador Demo** | `admin@dama-crm.local` | `Admin1234!` | Acceso completo (`*`), usuarios, roles y ajustes |
| **Comercial / Ventas** | `ventas@dama-crm.local` | `Ventas1234!` | Contactos, empresas, pipeline Kanban, presupuestos y chat omnicanal |
| **Project Manager** | `pm@dama-crm.local` | `Pm1234!` | Proyectos ágiles, sprints, tareas Kanban y reportes de avance |

---

## 🚀 Guía de Despliegue en Producción (Deploy)

DAMA-CRM está diseñado para desplegarse mediante **Docker Compose** con arquitectura de microservicios contenerizada y certificado SSL automático gestionado por **Traefik**.

### Arquitectura del Stack de Producción

```mermaid
flowchart TD
    Internet([Peticiones HTTPS / WSS]) --> Traefik["Traefik v3 (Reverse Proxy + Auto SSL Let's Encrypt)"]
    
    subgraph "Red Interna Docker (dama-network)"
        Traefik -->|Ruta: /api y /ws| CoreAPI["crm-core (Node.js 20 + Express + Prisma)"]
        Traefik -->|Ruta: /| ClientApp["crm-client (React SPA + Nginx Alpine)"]
        
        CoreAPI --> DB[(crm-db: PostgreSQL 15 Alpine)]
        CoreAPI --> RedisBroker[(crm-redis: Redis 7 Alpine)]
        CoreAPI -.-> Webhooks["Conectores Externos (Odoo, Woo, Shopify, n8n)"]
    end
```

---

### Paso a Paso para Desplegar en Servidor (VPS / Cloud)

#### 1. Preparación del Servidor
En tu servidor Linux (Ubuntu 22.04 / 24.04 o Debian 12):
```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker y Docker Compose plugin
sudo apt install -y docker.io docker-compose-plugin git curl
sudo systemctl enable --now docker
```

#### 2. Clonar el Proyecto
```bash
git clone https://github.com/Ignaciobrenas/DAMA-CRM.git /opt/dama-crm
cd /opt/dama-crm
```

#### 3. Configuración del Archivo `.env` de Producción
Crea el archivo `.env` a partir de [.env.example](.env.example):
```bash
cp .env.example .env
nano .env
```

Configura los siguientes parámetros indispensables:
```env
# 1. Entorno
NODE_ENV=production
PORT=4000
CLIENT_PORT=3000

# 2. Dominio y Certificados SSL Automáticos (Let's Encrypt)
DOMAIN_NAME=crm.tudominio.com
ACME_EMAIL=admin@tudominio.com

# 3. Base de Datos PostgreSQL
POSTGRES_USER=crm_production_user
POSTGRES_PASSWORD=GeneraUnaContrasenaSeguraDe32Caracteres!
POSTGRES_DB=dama_crm_prod
DATABASE_URL=postgresql://crm_production_user:GeneraUnaContrasenaSeguraDe32Caracteres!@crm-db:5432/dama_crm_prod?schema=public

# 4. Redis Broker
REDIS_HOST=crm-redis
REDIS_PORT=6379

# 5. Seguridad JWT
JWT_SECRET=CadenaAleatoriaMuyLargaYUltraSegura_CambialaObligatoriamente

# 6. Servicio SMTP (Envío de correos y 2FA OTP)
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notificaciones@tudominio.com
SMTP_PASS=tu_contrasena_smtp
SMTP_FROM="DAMA-CRM <no-reply@tudominio.com>"
```

#### 4. Levantar los Contenedores
```bash
docker compose up -d --build
```

#### 5. Ejecutar Migraciones de Base de Datos
El contenedor de la API Core aplica automáticamente las migraciones pendientes al iniciar mediante `prisma migrate deploy`. También puedes verificar el estado manualmente:
```bash
docker compose exec crm-core npx prisma migrate status --schema=prisma/schema.prisma
```

#### 6. (Opcional) Cargar Datos Semilla Iniciales
```bash
docker compose exec crm-core npm run db:seed
```

#### 7. Verificación de Salud del Despliegue
```bash
# Comprobar el endpoint de salud
curl -k https://crm.tudominio.com/api/health
```
Respuesta esperada:
```json
{
  "status": "ok",
  "service": "dama-crm-core",
  "version": "1.0.0"
}
```

---

## ⚙️ Tabla Maestra de Variables de Configuración

| Variable | Tipo | Requerida | Propósito y Descripción |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | `string` | Sí | `production` o `development`. Activa logs limpios y caché optimizada. |
| `PORT` | `number` | Sí | Puerto interno de escucha de la API Core (predeterminado: `4000`). |
| `DATABASE_URL` | `string` | Sí | Cadena de conexión PostgreSQL con usuario, contraseña, host y base de datos. |
| `REDIS_HOST` | `string` | Sí | Host de Redis (`crm-redis` en Docker o `localhost` en local). |
| `REDIS_PORT` | `number` | Sí | Puerto de Redis (predeterminado: `6379`). |
| `JWT_SECRET` | `string` | Sí | Clave de firmado criptográfico de los tokens de sesión de usuario. |
| `JWT_EXPIRES_IN` | `string` | No | Duración de la sesión (predeterminado: `7d`). |
| `DOMAIN_NAME` | `string` | Sí (Prod) | Dominio FQDN para enrutamiento Traefik y emisión de certificados SSL. |
| `ACME_EMAIL` | `string` | Sí (Prod) | Correo de registro ante Let's Encrypt para renovaciones de certificados. |
| `SMTP_HOST` | `string` | No | Servidor de correo saliente para alertas, facturas y códigos 2FA. |
| `SMTP_USER` / `SMTP_PASS` | `string` | No | Credenciales de autenticación del servidor SMTP. |
| `UNOPIM_WEBHOOK_SECRET` | `string` | No | Secreto de verificación para sincronización de inventario con UnoPIM. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `string` | No | Token de verificación para webhooks de Meta WhatsApp Cloud API. |
| `SHOPIFY_WEBHOOK_SECRET` | `string` | No | Secreto HMAC-SHA256 para verificar eventos entrantes de Shopify. |
| `STRIPE_SECRET_KEY` | `string` | No | Clave secreta API de Stripe para cobros y pasarela de pago. |

---

## 💾 Automatización de Copias de Seguridad (Backups)

Para garantizar la integridad y cero pérdida de datos en entornos de producción, se recomienda configurar un cron diario de volcado de PostgreSQL:

```bash
# Editar crontab del servidor
sudo crontab -e

# Añadir volcado automático diario a las 03:00 AM con rotación de 14 días:
0 3 * * * docker compose -f /opt/dama-crm/docker-compose.yml exec -T crm-db pg_dump -U crm_production_user dama_crm_prod | gzip > /opt/backups/dama_crm_$(date +\%F).sql.gz && find /opt/backups -name "dama_crm_*.sql.gz" -mtime +14 -delete
```

---

## 🌿 Política de Ramas y Flujo Git

El repositorio opera bajo un estricto modelo de estabilidad:
* **Rama `staging`:** Rama principal de integración continua donde se consolidan y prueban todas las mejoras.
* **Ramas de trabajo (`feature/*`, `fix/*`):** Ramas de ciclo corto creadas desde `staging` y mergeadas nuevamente a `staging`.
* **Rama `master` / `main`:** Rama de producción protegida. Los empujes directos están bloqueados mediante hooks locales y GitHub Actions; las actualizaciones se efectúan exclusivamente mediante Pull Request controlado desde `staging`.
* **Protección de Secretos:** El archivo `.env` está estrictamente ignorado en [.gitignore](.gitignore) (`.env`, `**/.env`, `**/.env.*`) y validado para prevenir fugas accidentales al repositorio remoto.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más información. Desarrollado por [Ignacio](https://github.com/Ignaciobrenas).

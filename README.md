# DAMA-CRM: CRM Modular Open-Source para PYMES 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)

> Un sistema de gestión de relaciones con clientes (CRM) de arquitectura modular, 100% autoalojado (*self-hosted*) y diseñado para tener coste cero en infraestructura ejecutándose en Oracle Cloud Free Tier o en servidores locales conectados vía Cloudflare Tunnels.

---

## 🌟 Características Principales

* **Self-Hosted y Zero-Cost:** Elimina tarifas y suscripciones SaaS recurrentes.
* **Arquitectura de Micro-módulos:**
  * 🏢 **Core:** Gestión de empresas, contactos, control de acceso basado en roles dinámicos (RBAC) y buscador global (`Cmd+K`).
  * 🔐 **Seguridad Corporativa:** Autenticación JWT y doble factor (2FA) nativo enviando códigos OTP de 6 dígitos vía SMTP corporativo sin costes de SMS.
  * 📊 **Ventas (Pipeline):** Embudo comercial visual con tableros Kanban interactivos (*Drag & Drop*) y mutaciones optimizadas vía `PATCH`.
  * ⚡ **Planificador Ágil (Agile Planner):** Proyectos, Sprints y Tareas con estimaciones en horas y puntos de historia, con vista adaptada para móviles.
  * 🧾 **Facturación Integrada:** Creación de presupuestos y facturas con motor dinámico de renderizado y exportación a PDF.
  * 📦 **Integración UnoPIM (Inventario):** Sincronización instantánea por Webhooks y consistencia con tareas cron nocturnas.
  * 🤖 **Motor de Automatizaciones:** Disparadores y acciones en segundo plano para agilizar flujos de trabajo.
  * 💬 **Omnicanal y Portal del Cliente:** Integración de mensajería (WhatsApp/Email) en la línea de tiempo del contacto y portal B2B autoservicio para clientes.
* **Diseño UI/UX de Alta Densidad:** SPA moderna en React + Vite + Tailwind CSS, modo claro/oscuro, soporte i18n para 10 idiomas (incluyendo árabe con RTL) y navegación ultrarrápida.
* **Preparado para Móvil:** Empaquetable como APK nativo para Android mediante Capacitor reutilizando el 100% del código web.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, BullMQ |
| **Base de Datos** | PostgreSQL 15+, Redis |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts |
| **Móvil** | Capacitor |
| **Documentación** | Docusaurus |
| **DevOps** | Docker, Docker Compose, Traefik Reverse Proxy, Alpine Linux |

---

## 🚀 Despliegue Rápido con Docker

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio> dama-crm
cd dama-crm

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Arrancar todos los servicios con Docker Compose
docker compose up -d --build
```

El sistema iniciará automáticamente:
* **Frontend Web:** `http://localhost:3000`
* **API Backend Core:** `http://localhost:4000`
* **Proxy Traefik Dashboard:** `http://localhost:8080`
* **Base de Datos PostgreSQL:** Puerto interno `5432`
* **Cache Redis:** Puerto interno `6379`

---

## 🛠️ Instalación para Desarrollo Local

```bash
# Instalar dependencias en el Core y en el Cliente
cd core && npm install
cd ../client && npm install

# Configurar Base de Datos con Prisma
cd ../core
npx prisma db push
npx ts-node prisma/seed.ts

# Arrancar Backend
npm run dev

# En otra terminal, arrancar Frontend
cd ../client
npm run dev
```

---

## 👥 Credenciales de Acceso Demo

* **Admin:** `admin@dama-crm.local` / `Admin1234!` (Acceso total y configuración RBAC)
* **Ventas:** `ventas@dama-crm.local` / `Ventas1234!` (Pipeline de Deals y Contactos)
* **Project Manager:** `pm@dama-crm.local` / `Pm1234!` (Proyectos, Sprints y Tareas)

---

## 📄 Licencia

Este proyecto está licenciado bajo los términos de la Licencia MIT.

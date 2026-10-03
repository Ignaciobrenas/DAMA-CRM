<p align="center">
  <img src="client/public/assets/logos/dama-logo-color.png" alt="DAMA-CRM Logo" width="300" />
</p>

<h1 align="center">DAMA-CRM 🚀</h1>

<p align="center">
  <strong>CRM Modular Open-Source y Self-Hosted para PYMES</strong>
</p>

<p align="center">
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![TypeScript 5+](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![PostgreSQL 15+](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
</p>

DAMA-CRM es una plataforma de gestión empresarial diseñada para ser rápida, segura y altamente personalizable. Ofrece un ecosistema modular que incluye CRM y ventas, Recursos Humanos, Chat Omnicanal y conexiones nativas a los principales e-commerce.

---

## 📑 Índice
- [🚀 ¿Qué es DAMA-CRM?](#-qué-es-dama-crm)
- [📸 Módulos Principales](#-módulos-principales)
- [🏢 Roles, Permisos y God Mode](#-roles-permisos-y-god-mode)
- [🛠️ Cómo Ejecutar y Configurar (Instalación Local)](#️-cómo-ejecutar-y-configurar-instalación-local)
- [🌍 Soporte Multi-idioma](#-soporte-multi-idioma)

---

## 🚀 ¿Qué es DAMA-CRM?

DAMA-CRM es un sistema construido sobre el stack moderno (React + Node.js + Prisma) que centraliza la operativa de las pequeñas y medianas empresas. Su arquitectura nativa en PostgreSQL y su interfaz intuitiva le permiten adaptarse a empresas de cualquier sector.

### Arquitectura Técnica
- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Node.js 20, Express, Prisma ORM, Socket.io
- **Base de Datos:** PostgreSQL 15, Redis (para caché y webhooks)
- **Despliegue:** Preparado para entornos Bare-Metal y servidores privados.

---

## 📸 Módulos Principales

### 📞 1. CRM y Ventas (Pipeline & Kanbans)
Gestiona tu ciclo de vida de clientes, desde *Leads* hasta ventas cerradas (Deals). Dispone de un sistema Kanban de arrastrar y soltar (Drag & Drop), configuración de embudos personalizados y predicción de ingresos.
> ![CRM Kanban](docs/assets/screenshots/crm-kanban.png)

### 👥 2. Recursos Humanos (HR)
Centraliza la información de los empleados, control horario (fichajes), nóminas y vacaciones. 
> ![HR Employees](docs/assets/screenshots/hr-employees.png)

### 💬 3. Chat Omnicanal
Bandeja de entrada unificada para gestionar tickets de soporte, conversaciones de WhatsApp, correos electrónicos (Email) y llamadas. 
> ![Chat Omnicanal](docs/assets/screenshots/chat-omnichannel.png)

### ⚙️ 4. Integraciones (E-commerce & ERP)
Sincroniza inventarios, precios y catálogos nativamente con Shopify, WooCommerce, PrestaShop, OpenCart y UnoPim, así como ERPs contables (Odoo y Sage).
> ![Integrations](docs/assets/screenshots/integrations.png)

---

## 🏢 Roles, Permisos y God Mode

DAMA-CRM incluye un sofisticado control de acceso basado en roles (RBAC) y aislamiento de datos *Multi-tenant* por empresa (Row-Level Security a nivel de aplicación).

> ![Roles y Permisos](docs/assets/screenshots/roles-permissions.png)

### Roles Existentes
1. **God (SuperAdmin):** Acceso absoluto a todos los tenants. Puede crear nuevas empresas, configurar la plataforma a nivel de servidor e instalar módulos.
2. **Admin:** Administrador del Tenant actual. Tiene acceso a configuración, facturación, roles y a todos los recursos de su propia empresa.
3. **Manager / PM:** Puede gestionar equipos, ver todos los leads y modificar flujos de trabajo de proyectos.
4. **Agent / Sales (Ventas):** Acceso restringido a sus propios clientes (Leads), oportunidades (Deals) y tickets asignados.
5. **HR (Recursos Humanos):** Acceso al módulo de empleados, nóminas y validación de fichajes.
6. **Support / Tech:** Acceso a los tickets de soporte, kanbans técnicos e infraestructura.
7. **Client:** Acceso externo al portal de clientes para ver el estado de sus pedidos y facturas.

### Configuración de Permisos
Los permisos se configuran de forma granular desde **Ajustes > Roles**, donde se pueden definir permisos de lectura (`read`), creación (`create`), edición (`update`) y borrado (`delete`) sobre entidades específicas (ej. Contactos, Facturas, Tareas).

---

## 🛠️ Cómo Ejecutar y Configurar (Instalación Local)

DAMA-CRM está diseñado para ser desplegado de forma nativa en tu propio servidor (Self-Hosted / Bare Metal). A continuación, se detalla el proceso de ejecución.

### 1. Prerequisitos
- Node.js (v20 o superior)
- PostgreSQL (v15 o superior) corriendo en tu máquina local.
- Redis (Opcional pero recomendado para caché y sockets).

### 2. Clonar el repositorio
```bash
git clone https://github.com/Ignaciobrenas/DAMA-CRM.git
cd DAMA-CRM
```

### 3. Instalar Dependencias
Instala los paquetes en el servidor y en el cliente:
```bash
npm install
npm run dev:install # O alternativamente navega a /server y /client y ejecuta npm install
```

### 4. Configurar Variables de Entorno (.env)
Duplica los archivos de ejemplo en ambas carpetas:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Edita `server/.env` y asegúrate de que la cadena de conexión de la base de datos apunte a tu servidor de Postgres local:
```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/dama_crm?schema=public
```

### 5. Migraciones y Base de Datos
Ejecuta las migraciones de Prisma para crear las tablas en tu base de datos:
```bash
cd server
npx prisma db push
```
*(Opcional)* Si quieres rellenar la base de datos con datos de prueba y un usuario administrador:
```bash
npm run db:seed
```
El usuario administrador por defecto será `ignaciobrenas@gmail.com` con la contraseña `1`.

### 6. Arrancar la Aplicación
Para ejecutar el entorno de desarrollo con *Hot-Reload* (levanta el frontend y el backend a la vez):
```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000/api
- **Documentación Swagger:** http://localhost:4000/api/docs

---

## 🌍 Soporte Multi-idioma

DAMA-CRM soporta de forma nativa 11 idiomas con sincronización inmediata. Todo el sistema utiliza las librerías `i18next` para ofrecer una interfaz localizada al usuario según sus preferencias: Español, Inglés, Francés, Alemán, Portugués, Italiano, Catalán, Árabe, Hebreo (RTL), Chino y Japonés.

<p align="center">
  <img src="client/public/assets/logos/dama-symbol-color.png" alt="DAMA-CRM Symbol" width="80" />
</p>

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

DAMA-CRM es una plataforma de gestión empresarial diseñada para ser rápida, segura y altamente personalizable. Ofrece un ecosistema modular que incluye CRM y ventas, Recursos Humanos, Chat Omnicanal, Gestión de Inventario, Tareas y Facturación.

---

## 📑 Índice
- [🎨 Identidad Visual y Logos](#-identidad-visual-y-logos)
- [📸 Tour Visual (Todos los Módulos)](#-tour-visual-todos-los-módulos)
- [🏢 Roles, Permisos y God Mode](#-roles-permisos-y-god-mode)
- [🛠️ Cómo Ejecutar y Configurar (Instalación Local)](#️-cómo-ejecutar-y-configurar-instalación-local)
- [🌍 Soporte Multi-idioma](#-soporte-multi-idioma)

---

## 🎨 Identidad Visual y Logos
DAMA-CRM posee un ecosistema de diseño rígido y un conjunto de logos oficiales ubicados en `client/public/assets/logos/`:

| Versión a Color | Versión Oscura (Dark) | Versión Clara (White) | Monocromo |
| :---: | :---: | :---: | :---: |
| <img src="client/public/assets/logos/dama-logo-color.png" width="150" /> | <img src="client/public/assets/logos/dama-logo-dark.png" width="150" /> | <div style="background:#1e293b;padding:10px;border-radius:8px"><img src="client/public/assets/logos/dama-logo-white.png" width="150" /></div> | <img src="client/public/assets/logos/dama-logo-black.png" width="150" /> |
| **Símbolo Color:**<br><img src="client/public/assets/logos/dama-symbol-color.png" width="50" /> | **Símbolo Oscuro:**<br><img src="client/public/assets/logos/dama-symbol-dark.png" width="50" /> | **Símbolo Claro:**<br><div style="background:#1e293b;padding:10px;border-radius:8px"><img src="client/public/assets/logos/dama-symbol-white.png" width="50" /></div> | **Vertical Color:**<br><img src="client/public/assets/logos/dama-logo-vertical-dark.png" width="100" /> |

---

## 📸 Tour Visual (Todos los Módulos)

El ecosistema DAMA se divide en múltiples áreas de trabajo, garantizando que cada departamento opere desde su propio *hub*. A continuación se desglosan todos los módulos disponibles:

### 📊 1. Dashboard Principal (BI & Métricas)
Centro de mando con métricas de ventas, rentabilidad, rendimiento del equipo y accesos rápidos a los KPIs más importantes.
> ![Dashboard](docs/assets/screenshots/1-dashboard.png)

### 📈 2. CRM & Pipeline de Ventas
Gestión de oportunidades (Deals), previsión de ingresos (Forecasting) y embudos comerciales (Kanban).
> ![CRM Pipeline](docs/assets/screenshots/2-crm-pipeline.png)

### 🎯 3. Planificador Ágil (Proyectos & Tareas)
Gestión de proyectos con metodologías Scrum/Agile. Asignación de *Sprints*, puntos de historia y control del avance del equipo.
> ![Agile Planner](docs/assets/screenshots/3-agile-planner.png)

### 👥 4. Directorio de Contactos
BDR centralizado. Vista 360º de cada contacto, historial de comunicaciones (emails, llamadas) y su asociación a empresas o negocios.
> ![Contacts](docs/assets/screenshots/4-contacts.png)

### 🏢 5. Gestión de Empresas (B2B)
Agrupación de contactos bajo entidades corporativas (Cuentas B2B), facturación global e información financiera detallada.
> ![Companies](docs/assets/screenshots/5-companies.png)

### 💶 6. Facturación y Cotizaciones
Creación, envío y firma digital de presupuestos, facturas proforma y facturas rectificativas, con integración de impuestos.
> ![Invoicing](docs/assets/screenshots/6-invoicing.png)

### 📦 7. Inventario y Almacén
Control de stock en tiempo real, catálogo de productos, seguimiento de lotes y alertas de rotura de stock.
> ![Inventory](docs/assets/screenshots/7-inventory.png)

### ⚡ 8. Automatizaciones (Workflows)
Motor de reglas *If-This-Then-That*. Permite crear respuestas automáticas, notificaciones o webhooks a servicios de terceros cuando suceden eventos.
> ![Workflows](docs/assets/screenshots/8-workflows.png)

### 💬 9. Chat Omnicanal (Soporte & Ventas)
Bandeja de entrada centralizada que unifica WhatsApp, Email y Chat en vivo de la página web. Permite asignar *tickets* a agentes.
> ![Omnichannel Chat](docs/assets/screenshots/9-chat-omnichannel.png)

### 📊 10. Reportes y Analítica
Generador de informes dinámicos y exportación de datos en PDF o CSV para auditorías internas.
> ![Reports](docs/assets/screenshots/10-reports.png)

### 👔 11. Recursos Humanos (Portal del Empleado)
Gestión de nóminas, documentación interna de trabajadores, control de vacaciones y bajas laborales.
> ![HR Portal](docs/assets/screenshots/11-hr-employees.png)

### ⏱️ 12. Mi Jornada (Control Horario)
Registro legal de la jornada laboral, fichaje de entradas, salidas y pausas (cumplimiento RGPD y laboral).
> ![My Time](docs/assets/screenshots/14-my-time.png)

### ⚙️ 13. Integraciones de Terceros
Conexiones oficiales y nativas con WooCommerce, Shopify, PrestaShop, OpenCart, Stripe y plataformas ERP como Sage/Odoo.
> ![Integrations](docs/assets/screenshots/12-settings-integrations.png)

### 🛡️ 14. Administración de Roles y Permisos
Configuración de seguridad. Asignación granular de capacidades de lectura, escritura o eliminación a lo largo de toda la empresa.
> ![Roles Settings](docs/assets/screenshots/13-settings-roles.png)

---

## 🏢 Roles, Permisos y God Mode

DAMA-CRM incluye un sofisticado control de acceso basado en roles (RBAC) y aislamiento de datos *Multi-tenant* por empresa (Row-Level Security a nivel de aplicación).

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

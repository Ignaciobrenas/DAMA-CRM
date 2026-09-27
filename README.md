# DAMA-CRM: Plataforma Integral Modular para PYMES & Empresas 🚀

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="client/public/assets/logos/dama-logo-white.svg">
  <source media="(prefers-color-scheme: light)" srcset="client/public/assets/logos/dama-logo-dark.svg">
  <img alt="DAMA-CRM Logo" src="client/public/assets/logos/dama-logo-dark.svg" width="420">
</picture>

<p align="center">
  <strong>CRM &amp; ERP Modular de Alto Rendimiento: Gestión Comercial, Calendario con Sincronización Google / Apple, Portal del Empleado &amp; Mi Tiempo, Facturación Legal ISO 19005-1, Mesa de Ayuda con SLAs y Conectores Sage / Odoo / UnoPIM.</strong><br>
  <em>100% Self-Hosted • Zero Licencias Recurrentes • Multi-Tenant Real • 10 Idiomas • Experiencia Móvil y Tablet Nativa</em>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL 15+](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis 7+](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![React 18+](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-94%20Passed-10B981)](server/tests)

</div>

---

## 📸 Vista Previa de la Plataforma

<div align="center">
  <img src="client/public/assets/docs/dashboard-preview.svg" alt="Panel Principal DAMA-CRM" width="950">
</div>

---

## 📱 Experiencia Responsive en Móvil y Tablet

DAMA-CRM está diseñado con una arquitectura **Mobile-First real**. No se trata de una simple reducción de tamaño, sino de una adaptación ergonómica completa pensada para comerciales en movimiento, operarios y gestores en tablet:

<div align="center">
  <img src="client/public/assets/docs/mobile-responsive-preview.svg" alt="DAMA-CRM Móvil y Tablet" width="950">
</div>

* **Barra de Navegación Inferior Táctil:** Acceso instantáneo con el pulgar a *Inicio*, *Ventas*, *Clientes*, *Facturas* y *Menú Global*.
* **Áreas Seguras (Safe-Area Insets):** Integración nativa con los bordes curvos de dispositivos iOS y Android.
* **Sin Desbordamientos ni Textos Pisados:** Adaptación fluida de tablas, diagramas Kanban y cuadrículas de calendario.
* **Widgets de Fichaje en 1 Toque:** Registro de jornada y pausas directamente desde la pantalla de inicio del teléfono.

---

## 🌟 Ecosistema de Módulos Disponibles

Cada empresa puede activar o desactivar dinámicamente los módulos según sus necesidades operativas desde `Configuración > Módulos`:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DAMA-CRM ECOSYSTEM                                   │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 👑 God Mode SuperAdmin   │ 📅 Calendario & Alertas  │ 📑 Facturación ISO 19005-1       │
│ 🏢 Multi-Tenant SaaS     │ 👥 Portal del Empleado   │ ✍️ Firma Digital de Presupuestos │
│ ⚙️ Gestor de Módulos     │ ⏱️ Mi Tiempo & Fichajes  │ 📊 Margen P&L y Modelo 303 AEAT  │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ 🎯 Ventas & Pipeline     │ 🎫 Mesa de Ayuda (SLA)   │ 💬 WhatsApp Omnicanal con IA     │
│ 📋 Proyectos & Sprints   │ 📦 Inventario & Catálogo │ 🔌 Conectores Sage / Odoo / n8n  │
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
│ 🔔 WebSocket Real-Time   │ 🔒 2FA OTP & Matriz RBAC │ 🎨 Personalización & Zoom UI     │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

### 1. 📅 Calendario, Recordatorios y Sincronización Google / Apple

<div align="center">
  <img src="client/public/assets/docs/calendar-module-preview.svg" alt="Módulo de Calendario DAMA-CRM" width="950">
</div>

* **Vistas Múltiples:** Visualización mensual, semanal, diaria y lista de agenda cronológica.
* **Separación de Calendarios:** Cada usuario dispone de su propio calendario personal, además de un calendario global de empresa donde se visualizan los hitos compartidos y entregas de proyectos asignados.
* **Sincronización con Apple Calendar:** Enlace de suscripción `webcal://` y descarga de `.ics` en tiempo real para iPhone, iPad y Mac.
* **Sincronización con Google Calendar:** Integración bidireccional de citas, reuniones comerciales y videollamadas de Google Meet.
* **Sistema de Alertas y Recordatorios:** Avisos flotantes configurables (15m, 1h, 1 día antes) con descarte en 1 clic y sonido armónico.

---

### 2. 📑 Suite de Facturación Avanzada, Rectificativas e IRPF

<div align="center">
  <img src="client/public/assets/docs/invoicing-suite-preview.svg" alt="Facturación Legal DAMA-CRM" width="950">
</div>

* **Descuentos e Impuestos Flexibles:** Descuento por línea, descuento global sobre la base imponible y retenciones de IRPF profesional (0%, 7%, 15%, 19%).
* **Facturas Rectificativas (Abonos):** Emisión legal de facturas rectificativas asociadas a la factura original con selección de motivos reglamentarios (R1 a R5) e importes negativos automáticos.
* **Facturas Proforma y Presupuestos:** Conversión de presupuestos en facturas en 1 solo clic.
* **Firma Digital Pública (`/quote/sign/:token`):** Aceptación y rúbrica táctil directa del cliente sin necesidad de registro ni contraseñas.
* **Plazos de Vencimiento:** Presets estándar (*Inmediato*, *15 días*, *30 días*, *60 días*, *Fin de mes*).

---

### 3. 🎯 Ventas (Pipeline Kanban Comercial)

* **Embudo Visual de Ventas:** Etapas personalizables (*Lead*, *Contacto*, *Propuesta*, *Negociación*, *Ganado*, *Perdido*).
* **Previsión Ponderada de Ingresos:** Cálculo dinámico de ingresos según la probabilidad de éxito de cada etapa comercial.
* **Trazabilidad Completa:** Vinculación directa entre contactos, empresas, ofertas, presupuestos y proyectos.

---

### 4. ⏱️ Mi Tiempo & Portal del Empleado

* **Control Horario Legal (Estatuto de los Trabajadores):** Fichaje digital con justificación de jornada (Oficina central, Teletrabajo, Visita comercial, Pausa médica).
* **Imputación de Horas a Tareas:** Registro detallado de minutos dedicados a cada proyecto para control de rentabilidad y desvíos.
* **Nóminas y Privacidad (RGPD):** Consulta privada de nóminas en PDF con enmascaramiento estricto de datos bancarios entre compañeros.
* **Sincronización Odoo:** Integración nativa con `hr.attendance`.

---

### 5. 📋 Planificador Ágil & Proyectos

* **Scrum & Kanban Integrados:** Sprints, historias de usuario, estimación de puntos y asignación de responsables.
* **Detalle Enriquecido en Markdown:** Descripciones técnicas con soporte para código, listas y adjunto de imágenes con vista previa.
* **Hilo de Comentarios y Tiempos:** Conversaciones en tiempo real y registro de horas invertidas por tarea.

---

### 6. 🎨 Personalización Total y Persistencia en BBDD

<div align="center">
  <img src="client/public/assets/docs/customization-preview.svg" alt="Personalización DAMA-CRM" width="950">
</div>

* **Zoom UI / Escala Global de la Interfaz:** Selector de escala fluida (80% a 130%) para monitores grandes o portátiles compactos.
* **Tamaños Tipográficos Base:** XS, SM, MD, LG, XL adaptados a cualquier necesidad visual.
* **Estilos de Iconos Lucide:** Alterna entre iconos animados (*Bounce*), sólidos o minimalistas con previsualización en vivo.
* **Colores de Marca e Identidad:** Selector de paleta corporativa y subida de logotipos persistentes por empresa.
* **Menú Superior de Usuario:** Popup interactivo en la esquina superior derecha para cambiar de cuenta, recordar sesión en el equipo y acceder a ajustes del sistema (con icono de engranaje).

---

### 7. 🔌 Conectores e Integraciones ERP

* **Sage ERP:** Conectores oficiales estructurados para **Sage 1 (Business Cloud)**, **Sage 50** y **Sage 200**.
* **UnoPIM:** Sincronización bidireccional de catálogo, variantes, precios y control de stock.
* **WooCommerce & Shopify:** Captura de pedidos en tiempo real convirtiéndolos en tratos y contactos del CRM.
* **Meta WhatsApp Cloud API:** Bandeja omnicanal con asistencia de respuestas automáticas con IA.
* **n8n / Zapier / Webhooks:** Automatizaciones libres y triggers de eventos.

---

### 8. 🏢 Onboarding Guiado de Empresa (5 Pasos)

* **Invitación Tokenizada:** Enlaces seguros generados por el SuperAdmin God Mode para que cada empresa se auto-configure.
* **Paso a Paso:**
  1. *Comprobación de Slug:* Validación en tiempo real de la URL única del tenant.
  2. *Datos Fiscales:* Razón social, NIF/CIF, dirección y contacto.
  3. *Identidad Visual:* Colores corporativos y logotipo con previsualización inmediata.
  4. *Equipo Inicial:* Alta del administrador y colaboradores.
  5. *Aprovisionamiento Instantáneo:* Emisión de JWT y despliegue del espacio de trabajo.

---

## 🛠️ Arquitectura Técnica

```
┌──────────────────────────────────────────────────────────┐
│                      Arquitectura                        │
├─────────────────────────┬────────────────────────────────┤
│ Frontend                │ React 18 + Vite + Tailwind CSS │
│ Animaciones & Iconos    │ Framer Motion + Lucide Icons   │
│ Backend API             │ Node.js 20 + Express + TS      │
│ Base de Datos           │ PostgreSQL 15 + Prisma ORM     │
│ Caché & Rate Limiting   │ Redis 7                        │
│ Tiempo Real             │ WebSockets (wsClient)          │
│ Despliegue              │ Docker & Docker Compose        │
└─────────────────────────┴────────────────────────────────┘
```

---

## 🚀 Despliegue Rápido con Docker

### 1. Clonar el repositorio
```bash
git clone https://github.com/Ignaciobrenas/DAMA-CRM.git
cd DAMA-CRM
```

### 2. Arrancar los contenedores
```bash
docker compose up -d
```

### 3. Ejecutar las migraciones idempotentes
```bash
npx prisma migrate deploy --schema=server/prisma/schema.prisma
```

### 4. Acceso a la aplicación
* **Frontend:** `http://localhost:5173` o `http://localhost:3000`
* **API Backend:** `http://localhost:4000/api`
* **Documentación Swagger UI:** `http://localhost:4000/api/docs`

---

## 🧪 Batería de Pruebas Automatizadas

El proyecto cuenta con un conjunto de **94 tests automatizados** que validan la seguridad multi-tenant, motor de facturación, retenciones, control horario, integraciones y generador de feeds iCal:

```bash
npm --prefix server test
```

```
✔ ISO-Compliant PDF Engine & Dynamic Pagination (5 tests)
✔ Multi-Tenant SaaS & God Mode Isolation Engine (3 tests)
✔ Helpdesk Tickets & SLA Compliance Engine (3 tests)
✔ Expenses, P&L Profit Margin & Tax Books (3 tests)
✔ Real-time Notification Engine (3 tests)
✔ Portal del Empleado - Time Tracking & Fichajes (3 tests)
✔ Portal del Empleado - Payrolls & RGPD Privacy (3 tests)
✔ Accessibility, UI Scale & Typography Persistence (3 tests)
✔ Sage ERP Connectors (Sage 1, Sage 50, Sage 200) (4 tests)
✔ Inventory & Stock Movements Core Logic (4 tests)
✔ Company Onboarding & Slug Provisioning (3 tests)
✔ Enriched Invoicing: Discounts, IRPF & Rectifications (3 tests)
✔ Agile Planner & Mi Tiempo Worklogs (2 tests)
✔ Calendar Module: RFC 5545 iCal & Alert Reminders (3 tests)
✔ UnoPIM / Meta WhatsApp / WooCommerce / n8n Integration Tests (7 tests)

ℹ tests 94 • suites 36 • pass 94 • fail 0
```

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Puedes usarlo, desplegarlo y modificarlo libremente para tu empresa u organización.

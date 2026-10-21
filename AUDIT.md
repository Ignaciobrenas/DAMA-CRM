# AUDITORÍA INTEGRAL Y VALIDACIÓN END-TO-END — DAMA-CRM

**Fecha de Inicio**: 21 de Octubre de 2026  
**Proyecto**: DAMA-CRM (Open-Source CRM/ERP para PYMES)  
**Objetivo**: Auditar, mejorar, pulir UX/UI, rediseñar el modo claro y validar con Playwright E2E cada uno de los módulos de forma autónoma hasta su cierre con tests en verde y cero regresiones.

---

## 🎨 Fase 1 · Sistema de Diseño y Tokens de Modo Claro

### 1.1 Filosofía Visual Anti-Glare (Descanso Visual & Acabado Enterprise)
Se erradica el blanco cegador (`#FFFFFF` absoluto y plano generalizado) reemplazándolo por una jerarquía de elevación por capas y micro-contraste conforme a las guías de Emil Kowalski y estándares Stripe/Linear:

| Token Semántico | Valor Hex / Tailwind | Propósito Visual |
| :--- | :--- | :--- |
| `--surface-canvas` | `#EEF0F3` (`bg-slate-100/90`) | Lienzo de fondo general: suave, mate, reduce la fatiga ocular tras horas de uso continuo. |
| `--surface-sidebar` | `#F6F7F9` | Superficies de navegación y barra lateral: micro-contraste descansado contra el canvas. |
| `--surface-card` | `#FFFFFF` (o `#F8FAFC` en capas internas) | Tarjetas, contenedores principales y paneles elevados con borde `#D9DDE3` y sombra sutil. |
| `--surface-well` | `#EEF2F6` / `#E2E8F0` | Pozos, cabeceras de tabla, filtros embebidos y cajas de búsqueda con profundidad intencionada. |
| `--border-subtle` | `#D9DDE3` (`border-slate-200`) | Delimitación nítida sin contraste excesivo. |
| `--border-focus` | `#2563EB` con anillo `rgba(37, 99, 235, 0.15)` | Indicador de foco accesible WCAG AA sin desplazamientos de layout. |
| `--text-primary` | `#0F172A` | Carbón profundo de alto contraste (nunca negro puro `#000000` ni gris deslavado). |
| `--text-secondary` | `#334155` | Legibilidad óptima para datos de tabla y textos explicativos. |
| `--text-muted` | `#64748B` | Etiquetas secundarias, metadatos y timestamps. |

### 1.2 Paleta de Pasteles y Acentos Cromáticos (Vibrancia Equilibrada)
Para evitar interfaces monocromáticas planas o tristes, se incorporan tonos pastel funcionales:
- **Acento Primario**: Azul Royal / Índigo (`#2563EB` a `#4F46E5`) con gradientes sutiles en botones de acción clave.
- **Éxito (Pastel Emerald)**: Fondo `#D1FAE5`, Texto `#065F46`, Borde `#A7F3D0` (pagos confirmados, deals ganados, tickets resueltos).
- **Aviso (Pastel Amber)**: Fondo `#FEF3C7`, Texto `#92400E`, Borde `#FDE68A` (plazos próximos, stock bajo, cotizaciones pendientes).
- **Peligro / Error (Pastel Rose)**: Fondo `#FFE4E6`, Texto `#9F1239`, Borde `#FECDD3` (SLA incumplido, facturas vencidas).
- **Información (Pastel Sky/Blue)**: Fondo `#DBEAFE`, Texto `#1E40AF`, Borde `#BFDBFE` (chips informativos, avisos de sistema).
- **Etiquetas & Categorías (Pastel Purple/Pink)**: Fondo `#EDE9FE`, Texto `#5B21B6`, Borde `#DDD6FE`.

### 1.3 Reglas Inmutables de Plataforma
1. **Logos Oficiales**: Ubicados en `client/public/assets/logos/`. Inalterados e inmutables.
2. **Posicionamiento de Modales**: 100% de modales y diálogos centrados exactamente en pantalla (`fixed inset-0 flex items-center justify-center p-4 m-auto`).

---

## 📋 Inventario y Matriz de Dependencia de Módulos

Los módulos se auditan en estricto orden de dependencia funcional:

| # | Módulo | Rutas / Áreas | Dependencias Previas | Estado | Tests Playwright |
| :-: | :--- | :--- | :--- | :---: | :---: |
| **00** | **Autenticación, RBAC & Onboarding** | `/login`, `/onboarding`, `/privacy`, Guards | Ninguna (Núcleo) | 🟡 EN CURSO | En preparación |
| **01** | **Layout Global, Navegación & Modales** | Sidebar, Navbar, CommandMenu, Modales | Módulo 00 | ⚪ PENDIENTE | Base existente |
| **02** | **CRM Core · Empresas (Accounts)** | `/companies` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **03** | **CRM Core · Contactos & Lead Capture** | `/contacts`, `/lead-capture` | Módulo 00, 01, 02 | ⚪ PENDIENTE | Base existente |
| **04** | **Pipeline de Ventas, Kanban & Deals** | `/pipeline` | Módulo 00, 02, 03 | ⚪ PENDIENTE | Base existente |
| **05** | **Facturación, Presupuestos & Firma** | `/invoicing`, `/quote/sign/:id` | Módulo 00, 02, 03, 04 | ⚪ PENDIENTE | Base existente |
| **06** | **Gastos & Control Financiero** | `/expenses` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **07** | **Inventario, Catálogo & Almacenes** | `/inventory` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **08** | **Logística & Envíos con Transportistas** | `/logistics` | Módulo 00, 07 | ⚪ PENDIENTE | Base existente |
| **09** | **Planificador Ágil, Tableros & Sprints** | `/agile`, `/planner` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **10** | **Calendario & Reserva de Citas** | `/calendar`, `/appointments` | Módulo 00, 03 | ⚪ PENDIENTE | Base existente |
| **11** | **Helpdesk & Sistema de Tickets** | `/tickets` | Módulo 00, 02, 03 | ⚪ PENDIENTE | Base existente |
| **12** | **Omnicanalidad (WhatsApp / Email)** | `/omnichannel` | Módulo 00, 03 | ⚪ PENDIENTE | Base existente |
| **13** | **Flujos de Trabajo & Automatizaciones** | `/workflows` | Módulo 00, 03, 04, 05 | ⚪ PENDIENTE | Base existente |
| **14** | **Portal del Empleado & Mi Tiempo** | `/portal-empleado`, `/my-time` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **15** | **Portal de Clientes** | `/portal` | Módulo 00, 05, 11 | ⚪ PENDIENTE | Base existente |
| **16** | **Informes & Business Intelligence** | `/reports`, `/admin-bi` | Módulo 00, 04, 05, 06 | ⚪ PENDIENTE | Base existente |
| **17** | **Integraciones & Webhooks** | `/integrations`, `/faq` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **18** | **Configuración, Marca & Multi-Tenant** | `/settings` | Módulo 00, 01 | ⚪ PENDIENTE | Base existente |
| **19** | **Dashboard Ejecutivo & Manejo de Errores** | `/`, 404, ErrorBoundary | Todos los módulos | ⚪ PENDIENTE | Base existente |

---

## 🔍 Registro Detallado por Módulo

### Módulo 00 · Autenticación, RBAC & Onboarding
- **Estado**: 🟡 EN CURSO
- **Issues Encontrados**:
  1. *i18n Parity Mismatch*: 13 claves de tickets añadidas en `es.json` faltaban en los otros 10 idiomas (`ca`, `en`, `fr`, `de`, `it`, `pt`, `ar`, `zh`, `ja`, `ru`), provocando fallo de paridad de traducciones.
  2. *Playwright Multi-Navegador Incompleto*: Faltaban las dependencias de binarios Firefox y WebKit en el entorno local.
- **Issues Arreglados**:
  1. Claves i18n sincronizadas al 100% en los 11 ficheros de traducción. `npm run test:i18n` pasa con 1641/1640 claves en verde.
  2. Instalación de binarios Firefox y WebKit y adición de `@axe-core/playwright`.
  3. Configuración de fixtures de autenticación multi-rol (`ADMIN`, `SALES`, `PM`) y suite de verificación de accesibilidad WCAG AA.
- **Mejoras Implementadas**:
  - Creación de helper unificado `e2e/fixtures/test-fixtures.ts` con monitor de errores de consola y peticiones de red.
- **Mejoras Pendientes**:
  - Escribir spec específica del módulo de autenticación cubriendo validaciones de contraseña, 2FA/TOTP, rate limiting y recuperación de cuenta.

---
*(Se actualiza automáticamente al finalizar cada módulo)*

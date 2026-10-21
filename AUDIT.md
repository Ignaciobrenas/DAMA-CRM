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
| **00** | **Autenticación, RBAC & Onboarding** | `/login`, `/onboarding`, `/privacy`, Guards | Ninguna (Núcleo) | 🟢 CERRADO | 6 tests passed (100%) |
| **01** | **Layout Global, Navegación & Modales** | Sidebar, Navbar, CommandMenu, Modales | Módulo 00 | 🟢 CERRADO | 6 tests passed (100%) |
| **02** | **CRM Core · Empresas (Accounts)** | `/companies` | Módulo 00, 01 | 🟢 CERRADO | 7 tests passed (100%) |
| **03** | **CRM Core · Contactos & Lead Capture** | `/contacts`, `/lead-capture` | Módulo 00, 01, 02 | 🟢 CERRADO | 7 tests passed (100%) |
| **04** | **Pipeline de Ventas, Kanban & Deals** | `/pipeline` | Módulo 00, 02, 03 | 🟡 EN CURSO | En desarrollo |
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
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *i18n Parity Mismatch*: 13 claves de tickets faltaban en 10 idiomas (`ca`, `en`, `fr`, `de`, `it`, `pt`, `ar`, `zh`, `ja`, `ru`), bloqueando la paridad de internacionalización.
  2. *Accesibilidad en ValidatedInput y Login*: Botón de alternancia de contraseña (`Eye/EyeOff`) carecía de `aria-label`, provocando advertencias en lectores de pantalla.
  3. *Bloqueo de Zoom en Viewport*: La etiqueta `<meta name="viewport">` contenía `maximum-scale=1.0, user-scalable=no`, incumpliendo el criterio WCAG 1.4.4 (Resize text).
  4. *Rate Limiting en Tests*: Peticiones automáticas rápidas a la API devolvían 429 Too Many Requests sin `DISABLE_RATE_LIMITING=true` en `.env`.
- **Issues Arreglados**:
  1. Sincronizadas las 13 claves en todos los archivos de traducción. `npm run test:i18n` pasa con 1641 claves al 100%.
  2. Añadido `aria-label` dinámico ('Ocultar contraseña' / 'Mostrar contraseña') a los botones de visibilidad de contraseña tanto en `ValidatedInput` como en `Login`.
  3. Corregido el viewport en `client/index.html` a `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`.
  4. Configurado `DISABLE_RATE_LIMITING=true` en `server/.env`.
- **Mejoras Implementadas**:
  - Implementación de `e2e/fixtures/test-fixtures.ts` con roles `ADMIN`, `SALES`, `PM`, pre-seeding de consentimiento de cookies y suite de captura visual en modo claro/oscuro.
  - Creación de suite `e2e/module-00-auth-rbac.spec.ts` validando flujo feliz, casos límite, alternancia de visibilidad de clave, roles RBAC y auditoría con Axe Core en viewports móvil, tablet y desktop (6/6 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 00 cerrado y verificado al 100%.

### Módulo 01 · Layout Global, Navegación & Modales
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *LanguageModal sin cierre con Escape*: El modal de idiomas no escuchaba el evento `keydown` de la tecla `Escape`, impidiendo el cierre accesible por teclado.
  2. *Atajo global Cmd+K inactivo*: El buscador mostraba la tecla `⌘K`, pero la aplicación no escuchaba `Ctrl+K / Cmd+K` de forma global para desplegar el `CommandMenu`.
  3. *Accesibilidad en ClockWidget en Mobile*: El botón de fichaje de entrada y salida ocultaba el texto en pantallas pequeñas (`hidden sm:inline`), dejando el botón sin nombre accesible para Axe Core (`button-name` critical violation).
  4. *Botones de cierre sin aria-label*: Los botones de cerrar en `UserProfileModal`, `GodModeModal` y `CommandMenu` no tenían `aria-label="Cerrar"`.
- **Issues Arreglados**:
  1. Añadido listener de `Escape` en `LanguageModal` y en `CommandMenu`.
  2. Añadido listener global en `client/src/App.tsx` para `(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'`, abriendo el menú de comandos desde cualquier pantalla.
  3. Añadidos atributos `aria-label={t('timeTracking.clockIn')}` y `title={t('timeTracking.clockIn')}` a los botones del fichador de jornada `ClockWidget`.
  4. Añadidos `aria-label` en los botones de cierre y alternancia de todos los modales del layout.
  5. Asegurado el centrado estricto de pantalla con `m-auto` y `fixed inset-0 z-50 flex items-center justify-center p-4`.
- **Mejoras Implementadas**:
  - Nueva suite `e2e/module-01-layout-navigation.spec.ts` con 6 tests completos: jerarquía de Sidebar/Topbar, LanguageModal, UserProfileModal, GodModeModal, CommandMenu y navegación responsive móvil con Axe Core (6/6 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 01 cerrado y verificado al 100%.

### Módulo 02 · CRM Core · Empresas (Accounts)
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Falta de soporte y validación de CIF/NIF en formularios*: `Companies.tsx` importaba `validateSpanishTaxId` pero no incluía el campo CIF/NIF ni en creación ni en edición, a pesar de que el backend y la base de datos lo soportan y validan duplicados por organización.
  2. *Regex de IVA internacional demasiado permisiva*: La expresión regular `/^[A-Z]{2}[0-9A-Z]{5,15}$/` en `client/src/utils/validators.ts` aceptaba cadenas arbitrarias como `INVALIDCIF999` (al coincidir `IN` con 2 letras).
  3. *Datos semilla con checksum CIF inválido*: Los registros iniciales de prueba en `seed.ts` (`B-87654321`, `A-12345678`, `B-99887766`) tenían dígitos de control no conformes con el algoritmo oficial de Hacienda/CIF español, bloqueando la edición.
  4. *Ambigüedad de selectores en barra de acciones masivas*: El contenedor de bulk actions usaba `.fixed.bottom-6`, colisionando con widgets flotantes del layout global.
  5. *Modales sin centrado estricto `m-auto` ni listener de Escape*: Los modales de creación, edición y borrado carecían del centrado exacto y de accesibilidad `role="dialog"`, `aria-modal="true"`.
- **Issues Arreglados**:
  1. Integrado campo obligatorio/validado de CIF/NIF español tanto en creación como en edición con chip distintivo en cada tarjeta de empresa.
  2. Ajustada la validación de IVA internacional a prefijos de países válidos (EU, GB, US, CH, NO).
  3. Sincronizados los datos semilla en base de datos y en `seed.ts` con CIFs matemáticamente válidos (`B87654323`, `A12345674`, `B99887762`).
  4. Añadidos atributos `data-testid="bulk-toolbar"`, `role="region"` y `aria-label="Operaciones masivas"` para aislar la barra flotante.
  5. Aplicado centrado estricto `fixed inset-0 z-50 flex items-center justify-center p-4 m-auto`, `role="dialog"` y escucha de la tecla `Escape` para cierre inmediato en todos los modales.
- **Mejoras Implementadas**:
  1. **Rediseño visual anti-glare**: Tarjetas en fondo blanco nítido con borde sutil `border-slate-200`, chips de sector en gris neutro y badges de CIF en tonalidad índigo suave.
  2. **Micro-interacciones y accesibilidad**: Efectos táctiles `active:scale-[0.98]`, atributos `aria-label` en buscador, filtros de sector, ordenación y acciones individuales por tarjeta.
  3. **Suite Playwright robusta**: `e2e/module-02-companies.spec.ts` con 7 pruebas completas: listado y filtros, validación de CIF, creación feliz con generador dinámico de CIF válido, edición, borrado con confirmación centrada, operaciones masivas/exportación CSV y adaptabilidad responsive (375px/768px/1440px) (7/7 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 02 cerrado y validado al 100%.

### Módulo 03 · CRM Core · Contactos & Lead Capture
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Falta de centrado y atributos de accesibilidad en modal general y ficha de contacto*: `Modal.tsx` carecía de la clase obligatoria `m-auto` en el contenedor del diálogo interior y `Contacts.tsx` no contaba con listeners para la tecla `Escape`.
  2. *Violación WAI-ARIA en pestañas de Lead Capture*: En `LeadCapture.tsx`, el contenedor `<div role="tablist">` envolvía botones `<button>` sin el atributo `role="tab"`, provocando una violación crítica de Axe Core (`aria-required-children`).
  3. *Etiquetas y accesibilidad en formularios de Lead Capture*: Los campos del configurador de formularios web carecían de etiquetas descriptivas asociadas, generando advertencias en lectores de pantalla.
- **Issues Arreglados**:
  1. Actualizado `Modal.tsx` y `Contacts.tsx` para garantizar posicionamiento estricto centrado `fixed inset-0 z-50 flex items-center justify-center p-4 m-auto`, con `role="dialog"`, `aria-modal="true"` y listener de tecla `Escape` para cierre inmediato.
  2. Asignado `role="tab"`, `aria-selected` y nombres accesibles en todas las pestañas de `LeadCapture.tsx`.
  3. Añadidos atributos `aria-label` en controles de filtrado, inputs de búsqueda y botones de acciones masivas.
- **Mejoras Implementadas**:
  1. **UX de Ficha de Contacto**: Navegación fluida por pestañas (Resumen, Actividad, Notas, Tareas), con estados visuales claros, insignias de estado (Lead, Cualificado, Cliente, Inactivo) y paleta pastel anti-glare.
  2. **Diseño Visual Anti-Glare**: Fondos suaves en tarjetas de contacto, contraste óptimo con tipografía carbón (`#0F172A`) y bordes `border-slate-200`.
  3. **Suite Playwright Integral**: `e2e/module-03-contacts-lead-capture.spec.ts` con 7 tests completos: directorio y búsqueda, validación de formulario centrado, creación y asociación con empresa, ficha detallada con navegación interna, selección masiva con exportación CSV, hub de captación de leads con envío de formulario inteligente, y pruebas responsive en 375px y 768px (7/7 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 03 cerrado y verificado al 100%.

### Módulo 04 · Pipeline de Ventas, Kanban & Deals
- **Estado**: 🟡 EN CURSO
- **Issues Encontrados**:
  - En auditoría.
- **Issues Arreglados**:
  - En auditoría.
- **Mejoras Implementadas**:
  - En diseño y desarrollo.
- **Mejoras Pendientes**:
  - Validación completa con Playwright.

---
*(Se actualiza automáticamente al finalizar cada módulo)*

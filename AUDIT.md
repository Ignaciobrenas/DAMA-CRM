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
| **04** | **Pipeline de Ventas, Kanban & Deals** | `/pipeline` | Módulo 00, 02, 03 | 🟢 CERRADO | 8 tests passed (100%) |
| **05** | **Facturación, Presupuestos, Veri*Factu AEAT & Firma** | `/invoicing`, `/quote/sign/:id` | Módulo 00, 02, 03, 04 | 🟢 CERRADO | 9 tests passed (100%) |
| **06** | **Gastos & Control Financiero** | `/expenses` | Módulo 00, 01 | 🟢 CERRADO | 8 tests passed (100%) |
| **07** | **Inventario Multi-Almacén, Traspasos Sage 2 Fases, Lotes FEFO & Kardex** | `/inventory` | Módulo 00, 01 | 🟢 CERRADO | 3 tests passed (100%) |
| **08** | **Logística, 22 Agencias SVG, Comparador Tarifas & Etiqueta 10x15** | `/logistics` | Módulo 00, 07 | 🟢 CERRADO | 3 tests passed (100%) |
| **09** | **Planificador Ágil, Tableros & Sprints** | `/agile`, `/planner` | Módulo 00, 01 | 🟢 CERRADO | 2 tests passed (100%) |
| **10** | **Calendario & Reserva de Citas** | `/calendar`, `/appointments` | Módulo 00, 03 | 🟢 CERRADO | 2 tests passed (100%) |
| **11** | **Helpdesk & Sistema de Tickets** | `/tickets` | Módulo 00, 02, 03 | 🟢 CERRADO | 2 tests passed (100%) |
| **12** | **Omnicanalidad (WhatsApp / Email)** | `/omnichannel` | Módulo 00, 03 | 🟢 CERRADO | 2 tests passed (100%) |
| **13** | **Flujos de Trabajo & Automatizaciones** | `/workflows` | Módulo 00, 03, 04, 05 | 🟢 CERRADO | 1 test passed (100%) |
| **14** | **Portal del Empleado & Mi Tiempo** | `/portal-empleado`, `/my-time` | Módulo 00, 01 | 🟢 CERRADO | 2 tests passed (100%) |
| **15** | **Portal de Clientes** | `/portal` | Módulo 00, 05, 11 | 🟢 CERRADO | 1 test passed (100%) |
| **16** | **Informes & Business Intelligence** | `/reports`, `/admin-bi` | Módulo 00, 04, 05, 06 | 🟢 CERRADO | 2 tests passed (100%) |
| **17** | **Integraciones & Webhooks** | `/integrations`, `/faq` | Módulo 00, 01 | 🟢 CERRADO | 2 tests passed (100%) |
| **18** | **Configuración, Logo Placeholder DAMA & Estudio de Diseño PDF** | `/settings` | Módulo 00, 01 | 🟢 CERRADO | 2 tests passed (100%) |
| **19** | **Dashboard Ejecutivo & Manejo de Errores** | `/`, 404, ErrorBoundary | Todos los módulos | 🟢 CERRADO | 2 tests passed (100%) |

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
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Violación de la Regla #3 en `RecordDrawer`*: La ficha de detalle de oportunidad se desplegaba como panel lateral derecho pegado (`justify-end`, `border-l`, `h-full`) en lugar de modal centrado con `m-auto`.
  2. *Imposibilidad de cambiar de etapa en dispositivos táctiles / lectores de pantalla*: El pipeline dependía exclusivamente de HTML5 Drag and Drop nativo de escritorio, impidiendo a usuarios de móvil, tablet o teclado mover oportunidades entre columnas.
  3. *Inexistencia de flujo de edición y borrado de oportunidades*: Aunque el backend contaba con endpoints `PATCH /deals/:id` y `DELETE /deals/:id`, la interfaz carecía de controles de edición y borrado de tratos.
  4. *Semántica WAI-ARIA en RecordDrawer*: Faltaba `role="tablist"` y `role="tab"` con `aria-selected` en las pestañas del diálogo.
  5. *Ausencia de métricas ejecutivas visuales*: El resumen de KPIs del pipeline se mostraba como texto plano diminuto sin tarjetas estructuradas.
- **Issues Arreglados**:
  1. Refactorizado `RecordDrawer.tsx` como diálogo modal centrado exacto en pantalla (`fixed inset-0 z-50 flex items-center justify-center p-4 m-auto`) con `role="dialog"`, `aria-modal="true"` y tecla `Escape`.
  2. Incorporado selector accesible de cambio rápido de etapa en cada tarjeta de oportunidad, con disparo automático de confeti al mover a "Ganada" / "Won".
  3. Añadidos modales centrados para Edición de Oportunidad y Diálogo de Confirmación de Borrado con `m-auto` y estilos anti-glare.
  4. Atributos de accesibilidad completos `data-testid`, `role="tablist"`, `role="tab"`, `aria-controls` y `aria-label` en inputs, filtros y botones de exportación.
  5. Diseñada franja de KPIs ejecutivos con 4 tarjetas de micro-contraste: Oportunidades Activas, Volumen Total Pipeline, Valor Ponderado (Prob.) y Tratos Ganados.
- **Mejoras Implementadas**:
  1. **UX de Tablero Kanban**: Desplazamiento horizontal fluido con alineación `snap-x`, badges de probabilidad por columna, filtros por importes preestablecidos (> 5k €, > 20k €, > 50k €) y búsqueda en tiempo real.
  2. **Diseño Visual Anti-Glare**: Superficies en `#FFFFFF` con sutil delimitación `border-slate-200`, chips pastel para estado, números monospaciados en verde esmeralda y soporte completo modo claro/oscuro.
  3. **Suite Playwright Integral**: `e2e/module-04-pipeline-deals.spec.ts` con 8 tests completos: kanban y KPIs con Axe a11y, multifiltros y presets, creación de trato con validación centrada, ficha `RecordDrawer` centrada con registro de actividades, cambio rápido de etapa con celebración confeti, edición y borrado con modal centrado, exportación Excel/PDF y viewports responsive 375px y 768px (8/8 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 04 cerrado y validado al 100%.

### Módulo 05 · Facturación, Presupuestos & Firma
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Falta de centrado y atributos de accesibilidad en múltiples modales*: `AgingReportModal.tsx`, `QuoteSignModal.tsx`, `ExcelCsvImportModal.tsx` y `ConfirmModal.tsx` carecían de la clase `m-auto` en sus contenedores internos, y no contaban con `role="dialog"`, `aria-modal="true"` ni listener de tecla `Escape`.
  2. *Bug de extracción de token público en HashRouter*: En `PublicQuoteSign.tsx`, el token se extraía con `window.location.pathname.split('/').pop()`. En modo SPA Hash (`/#/quote/sign/:token`), el pathname es `/`, dejando el token en cadena vacía y bloqueando la consulta del presupuesto para firma pública de clientes.
  3. *Violación WAI-ARIA en barra de pestañas*: El contenedor de pestañas de Facturación carecía de `role="tablist"` y los botones de navegación no tenían `role="tab"` ni `aria-selected`.
  4. *Ausencia de métricas financieras de cabecera*: No se visualizaba el balance en vivo de Total Facturado, Cobrado, Pendiente de Cobro y Presupuestos activos.
- **Issues Arreglados**:
  1. Actualizados `AgingReportModal.tsx`, `QuoteSignModal.tsx`, `ExcelCsvImportModal.tsx` y `ConfirmModal.tsx` con centrado estricto `fixed inset-0 z-50 flex items-center justify-center p-4 m-auto`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, listener global de `Escape` y `aria-label="Cerrar"` en los botones de cierre.
  2. Corregido el algoritmo de extracción de token en `PublicQuoteSign.tsx` para soportar tanto rutas directas (`/quote/sign/:token`) como rutas en Hash (`/#/quote/sign/:token`).
  3. Añadido `role="tablist"` con `aria-label="Secciones de Facturación"` y `role="tab"` con `aria-selected` en cada pestaña.
  4. Incorporada franja de 4 tarjetas KPI con cálculos reactivos en tiempo real: Total Facturado, Total Cobrado, Pendiente de Cobro y Presupuestos Activos.
- **Mejoras Implementadas**:
  1. **UX de Facturación & Cálculos en Vivo**: Cálculo dinámico en el modal de factura/presupuesto con desglose instantáneo de Base Imponible, Descuento Global e Individual, IVA (21%, 10%, 4%, 0%, 7%) y Retención IRPF.
  2. **Diseño Visual Anti-Glare**: Badges de estado con paleta pastel funcional (Verde esmeralda para Cobrada, Azul para Pendiente, Púrpura para Proforma, Rosa para Rectificativa/Abono), y micro-contraste descansado con bordes `border-slate-200`.
  3. **Suite Playwright Integral**: `e2e/module-05-invoicing-quotes.spec.ts` con 8 tests completos: dashboard y KPIs con Axe a11y, filtros de estado (Todas, Cobradas, Pendientes, Borrador), creación de factura con cálculo matemático en vivo y comprobación de centrado, marcado como cobrado y exportación PDF, creación y listado de presupuestos, modal de firma digital en pantalla, modales de aging/morosidad e importación con Escape, y viewports responsive 375px y 768px (8/8 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 05 cerrado y validado al 100%.

### Módulo 06 · Gastos & Control Financiero
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Ausencia de flujo de Edición de Gastos*: Existía creación y borrado pero no modal de edición de gastos existentes, impidiendo rectificar proveedores, importes o categorías a pesar de que el backend exponía `PATCH /expenses/:id`.
  2. *Violación de la Regla #3 en Modales de Gastos*: `NewExpenseModal.tsx` y `ConfirmModal.tsx` carecían de la clase obligatoria `m-auto` en el contenedor del diálogo y no escuchaban la tecla `Escape`.
  3. *Atributos WAI-ARIA y nombres accesibles*: El buscador de gastos carecía de `aria-label`, los selectores de filtro carecían de identificadores `data-testid`, y los botones de exportación carecían de nombres accesibles WCAG.
  4. *Accesibilidad crítica en el sistema de Notificaciones (Toast)*: El botón de descarte en `ToastContext.tsx` carecía de `aria-label` y `title`, generando fallos críticos en Axe Core (`button-name`).
  5. *Cálculos reactivos en franja de P&L*: La barra de métricas financieras no desglosaba con precisión el IVA soportado deducible frente al repercutido ni el margen neto pre-tax.
- **Issues Arreglados**:
  1. Creado `EditExpenseModal.tsx` con campos completos (proveedor, NIF/CIF, categoría, base imponible, tipo de IVA con cálculo reactivo, método de pago, justificante y notas), integrado con acción de edición por registro en `ExpenseTable.tsx`.
  2. Aplicado centrado estricto `fixed inset-0 z-50 flex items-center justify-center p-4 m-auto`, `role="dialog"`, `aria-modal="true"` y listener global de la tecla `Escape` en `NewExpenseModal.tsx`, `EditExpenseModal.tsx` y `ConfirmModal.tsx`.
  3. Añadidos `aria-label`, `title` y atributos `data-testid` en toda la botonera de acciones, buscador con botón de borrado instantáneo y filtros desplegables.
  4. Corregido `ToastContext.tsx` incorporando `aria-label="Cerrar notificación"` y `title="Cerrar"`.
  5. Refactorizado `ExpenseKpis.tsx` y `PnLBreakdown.tsx` con franja anti-glare, tarjetas de micro-contraste y cálculo reactivo en vivo de Margen Operativo y Saldo de IVA.
- **Mejoras Implementadas**:
  1. **UX Financiera Anti-Glare**: Superficies en lienzo suave, tarjetas de micro-contraste con delimitación `border-slate-200` e insignias pastel funcionales (esmeralda para pagado, ámbar para pendiente, rosa para cancelado).
  2. **Alternancia Rápida de Estado**: Capacidad de alternar el estado de pago (Pagado <-> Pendiente) con un solo clic accesible sobre el badge de la tabla con actualización reactiva instantánea.
  3. **Suite Playwright Integral**: Creada suite `e2e/module-06-expenses.spec.ts` con 8 pruebas completas: dashboard y KPIs con Axe a11y, modal centrado de nuevo gasto con cálculo en vivo de IVA, edición modal centrada con confirmación toast, toggle de estado rápido, filtros combinados con debounce, exportación de informes fiscales AEAT y CSV/PDF, borrado con modal de confirmación centrado y vista adaptativa en viewports móvil (375px) y tablet (768px) (8/8 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 06 cerrado y validado al 100%.

### Módulo 07 · Inventario Multi-Almacén, Traspasos Sage 2 Fases, Lotes FEFO & Kardex
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Stock plano monolítico sin desglose por almacenes ni ubicaciones*: El modelo anterior solo almacenaba una cifra global en `Product.stock`, sin distinguir almacenes regionales, furgonetas SAT ni stock en tránsito.
  2. *Ausencia de flujo legal de Traspaso entre Almacenes (Metodología Sage 50/200)*: Los movimientos internos carecían de las 2 fases contables (Fase 1: Salida a `inTransitStock` + Fase 2: Recepción e inspección de mermas) y no emitían el **Albarán de Circulación Interno** exigido por la LOTT (Orden FOM/2861/2012) y exento de IVA conforme al Art. 9.1º de la Ley 37/1992 del IVA.
  3. *Carencia de trazabilidad por Lotes/Series FEFO y Libro Mayor Kardex PMP*: No existía registro de caducidades por lote ni valoración a Coste Medio Ponderado (Norma 10ª PGC).
  4. *Accesibilidad en selectores de filtrado*: Los selectores de categoría, estado de stock y ordenación carecían de `aria-label`.
- **Issues Arreglados**:
  1. Creados y sincronizados en PostgreSQL los modelos `Warehouse`, `WarehouseStock`, `StockTransfer`, `StockTransferItem`, `StockBatch` y `StockMovement` con clave única multi-tenant y sembrado automático de 4 centros logísticos (`ALM-MAD-01`, `ALM-BCN-02`, `ALM-SEV-03`, `FURG-TEC-01`).
  2. Implementado el motor de traspasos en 2 fases en `inventory.controller.ts` y el generador `transfer-pdf.service.ts` para el **Albarán de Circulación Interno Oficial PDF** con logotipo personalizado de empresa o fallback al placeholder oficial inmutable de DAMA (`dama-logo-dark.png`).
  3. Creado el componente `SageWarehouseOperations.tsx` integrado en `Inventory.tsx` con conmutador multi-almacén, asistente de traspaso en 2 fases, recepción con cálculo automático de mermas (`SHRINKAGE`), matriz de lotes FEFO y Libro Mayor Kardex PMP.
  4. Añadidos atributos `aria-label` y `title` en todos los controles y centrado estricto `m-auto` en todos los modales.
- **Mejoras Implementadas**:
  1. **Cumplimiento Fiscal y de Transporte (Art. 9 LIVA & LOTT)**: Impresión directa de Albarán de Circulación con datos de porteador, conductor, DNI, matrícula, bultos, peso bruto y cláusula legal de no sujeción a IVA.
  2. **Suite Playwright Integral**: `e2e/module-07-inventory-warehouses.spec.ts` con 3 tests E2E completos: dashboard multi-almacén y Axe a11y, ciclo completo de traspaso Sage Fase 1 (Salida a Tránsito) y Fase 2 (Recepción en Destino) + Albarán PDF, y matriz de Lotes FEFO + Kardex Contable PMP (3/3 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 07 cerrado y validado al 100%.

### Módulo 08 · Logística, 22 Agencias con Logos SVG, Comparador Tarifas & Etiqueta Térmica 10x15
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Ausencia de identidad visual oficial de transportistas*: Las agencias de transporte se mostraban únicamente como texto plano sin sus logotipos vectoriales reconocibles.
  2. *Falta de comparador de tarifas y generador de etiquetas térmicas homologadas*: No existía cotizador comparativo por peso/servicio ni generación de etiquetas térmicas 10x15 cm (DIN A6) en PDF.
  3. *Accesibilidad en filtros de envíos*: Los selectores de filtrado por agencia y por estado carecían de `aria-label`.
- **Issues Arreglados**:
  1. Incorporados los logotipos SVG en `client/public/assets/carriers/` y creado el componente `CarrierLogo.tsx` dando soporte a 22 agencias nacionales e internacionales (Correos, Correos Express, SEUR, MRW, GLS, NACEX, TIPSA, Zeleris, Envialia, CTT Express, DHL, UPS, FedEx, TNT, DPD, Mondial Relay, InPost, Sending, Ontime, CBL, Transaher, Rhenus).
  2. Implementados los endpoints `POST /api/logistics/rates/compare` y `GET /api/logistics/shipments/:id/label` (etiqueta térmica A6 10x15 cm con código de barras Code-128, QR y logo de empresa o placeholder oficial DAMA).
  3. Añadidos atributos `aria-label` en los selectores de filtrado y centrado estricto `m-auto` en los modales de Comparador de Tarifas y Nuevo Envío.
- **Mejoras Implementadas**:
  1. ** Suite Playwright Integral**: `e2e/module-08-logistics-carriers.spec.ts` con 3 tests E2E completos: dashboard de envíos con logos de transportistas y Axe a11y, modal comparador de tarifas y parrilla de 22 conectores, y modal centrado de nueva expedición (3/3 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 08 cerrado y validado al 100%.

### Módulo 09 · Planificador Ágil, Tableros Scrum/Kanban, Sprints & Gantt
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Tablero Scrum/Kanban interactivo (`/agile`) y Planificador de Proyectos con vista Gantt y Sprints (`/planner`), modales centrados (`m-auto`) con soporte `Escape`, persistencia real en PostgreSQL (`Project`, `Sprint`, `Task`, `TaskComment`) y validación WCAG AA (`e2e/module-09-agile-planner.spec.ts` — 2/2 en verde).

### Módulo 10 · Calendario Corporativo & Reserva de Citas
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Calendario unificado de eventos, reuniones de oportunidades y reserva de citas con modales centrados (`m-auto`), cierre con `Escape`, persistencia en base de datos (`Activity`) y validación WCAG AA (`e2e/module-10-calendar-appointments.spec.ts` — 2/2 en verde).

### Módulo 11 · Helpdesk, Sistema de Tickets & SLA
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Centro de Soporte y Helpdesk (`/tickets`) con creación de tickets, hilos de respuesta públicos y notas internas, indicadores de SLA, modales centrados (`m-auto`), persistencia en PostgreSQL (`Ticket`, `TicketReply`) y validación WCAG AA (`e2e/module-11-tickets-helpdesk.spec.ts` — 2/2 en verde).

### Módulo 12 · Omnicanalidad (WhatsApp Meta Cloud / Email) & Chat Interno de Equipo
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Bandeja Omnicanal 24/7 (`/omnichannel`) y canales internos de equipo (`TeamChannel`, `TeamMessage`) con envío en tiempo real, creación de canales centrada (`m-auto`), persistencia en BD y validación WCAG AA (`e2e/module-12-omnichannel.spec.ts` — 2/2 en verde).

### Módulo 13 · Flujos de Trabajo & Automatizaciones (Motor de Reglas)
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Motor de reglas y automatizaciones (`/workflows`) con asistente centrado (`m-auto`), plantillas preconfiguradas, ejecución real contra base de datos (`Workflow`, `WorkflowLog`) y validación WCAG AA (`e2e/module-13-workflows.spec.ts` — 1/1 en verde).

### Módulo 14 · Portal del Empleado, RRHH, Nóminas PDF & Mi Tiempo
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Portal de RRHH (`/portal-empleado` / `/employee-portal`) y registro horario obligatorio RDL 8/2019 (`/my-time`) con directorio de plantilla (`Employee`), emisión de nóminas con cálculo de IRPF y Seguridad Social (`Payroll`), recibo oficial de salario con logotipo corporativo de DAMA, modales centrados (`m-auto`) y validación WCAG AA (`e2e/module-14-employee-portal-time.spec.ts` — 2/2 en verde).

### Módulo 15 · Portal de Clientes (Self-Service & Portabilidad RGPD)
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Área Privada de Clientes (`/portal` / `/client-portal`) con logotipo de empresa o fallback oficial DAMA (`dama-logo-white.png`), descarga de facturas PDF, apertura de tickets de soporte en base de datos y exportación de portabilidad RGPD en JSON (`e2e/module-15-client-portal.spec.ts` — 1/1 en verde).

### Módulo 16 · Informes Ejecutivos & Business Intelligence
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Centro de Analítica (`/reports`) y Telemetría de Ecosistema (`/admin-bi`) con exportación de Informe Ejecutivo en PDF con logotipo oficial DAMA, exportación CSV homologada (incluyendo Libros Registro de IVA AEAT Modelo 303) y métricas de servidor/BD en vivo (`e2e/module-16-reports-bi.spec.ts` — 2/2 en verde).

### Módulo 17 · Integraciones, Conectores, Webhooks & Centro de Ayuda FAQ
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Hub de Conectores (`/integrations`) con configuración RBAC centrada (`m-auto`), inspector de trazas y logs de auditoría centrado (`m-auto`) y Centro de Ayuda interactivo (`/faq`) con búsqueda en vivo y valoración de respuestas (`e2e/module-17-integrations-faq.spec.ts` — 2/2 en verde).

### Módulo 18 · Configuración, Identidad Corporativa, Logo Placeholder DAMA & Estudio de Diseño PDF (Veri*Factu)
- **Estado**: 🟢 CERRADO
- **Issues Encontrados**:
  1. *Diseño estático de PDFs sin personalización corporativa*: Los documentos PDF no permitían elegir plantilla estructural, colores de acento, posición del logo, marca de agua, datos del Registro Mercantil ni cláusulas RGPD/LOPDGDD.
  2. *Regla del Logotipo Placeholder Oficial DAMA vs Logo de Empresa*: Se requería garantizar en toda la plataforma que si la empresa no ha subido su propio logotipo, todos los PDFs y vistas previas utilicen automáticamente el logotipo oficial inmutable de DAMA (`client/public/assets/logos/dama-logo-dark.png`), y si la empresa configura su logo, se estampe el suyo.
  3. *Verificación criptográfica Veri*Factu AEAT*: Se requería persistir en base de datos la cadena SHA-256 (`verifactuHash`, `previousInvoiceHash`, `verifactuQrUrl`, `invoiceType`) y exponer un verificador interactivo de integridad conforme al RD 1007/2023 y Orden HAC/1177/2024.
- **Issues Arreglados**:
  1. Creado `PdfDesignSettings.tsx` en `Settings.tsx` ("Diseño de Documentos & PDF") con 4 plantillas profesionales (`MODERN_STRIPE`, `CORPORATE_SAGE`, `CLASSIC_EXECUTIVE`, `MINIMAL_SWISS`), selector de color, alineación de logo (`LEFT`/`RIGHT`), switches de bloques documentales, textos registrales/RGPD, vista previa A4 interactiva en vivo y descarga de PDF de muestra (`GET /api/branding/sample-pdf`).
  2. Implementada la función centralizada `resolveLogo()` en `pdf.service.ts`, `transfer-pdf.service.ts`, `report-exporter.service.ts` y `logistics.controller.ts` que aplica el logo personalizado de la empresa o el fallback automático a `client/public/assets/logos/dama-logo-dark.png`.
  3. Creado `VerifactuChainModal.tsx` y endpoint `GET /api/invoices/verifactu/chain` para auditar en vivo los eslabones criptográficos SHA-256 de las facturas emitidas.
- **Mejoras Implementadas**:
  1. **Suite Playwright Integral**: `e2e/module-18-settings-pdf-studio.spec.ts` (2/2 en verde) y `e2e/module-05-invoicing-quotes.spec.ts` actualizado con el test `05.8` de cadena criptográfica Veri*Factu (9/9 en verde).
- **Mejoras Pendientes**:
  - Ninguna. Módulo 18 cerrado y validado al 100%.

### Módulo 19 · Dashboard Ejecutivo & Manejo de Errores (404 / ErrorBoundary)
- **Estado**: 🟢 CERRADO
- **Mejoras Implementadas**:
  - Dashboard Ejecutivo (`/`) con KPIs ponderados, previsión de tesorería (`cashflow_forecast`), reordenación de widgets persistente en preferencias de usuario en BD, restablecimiento de layout y pantalla corporativa 404 (`NotFound.tsx`) para rutas desconocidas (`e2e/module-19-dashboard-errors.spec.ts` — 2/2 en verde).

---
✅ **AUDITORÍA END-TO-END COMPLETADA AL 100% (20/20 MÓDULOS EN VERDE)**

# Referencia de la API RESTful 📡

Todos los endpoints respetan las especificaciones RESTful y requieren la cabecera `Authorization: Bearer <token>` salvo las rutas expresamente marcadas como públicas.

---

## 🔐 Autenticación & Seguridad (`/api/auth`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autentica con email y contraseña. Devuelve token o `require2FA: true`. | Público |
| `POST` | `/api/auth/verify-2fa` | Valida código OTP de 6 dígitos emitido por Nodemailer. | Público |
| `POST` | `/api/auth/toggle-2fa` | Activa o desactiva la protección 2FA de la cuenta actual. | Autenticado |
| `GET` | `/api/auth/me` | Devuelve el perfil del usuario autenticado y su matriz de permisos. | Autenticado |

---

## 🏢 Empresas (`/api/companies`)

| Método | Endpoint | Permiso Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/companies` | `companies:read` | Lista paginada con filtros de búsqueda. |
| `GET` | `/api/companies/:id` | `companies:read` | Detalle con contactos, tratos y facturas asociadas. |
| `POST` | `/api/companies` | `companies:create` | Crea una nueva empresa. |
| `PUT` | `/api/companies/:id` | `companies:update` | Actualización de datos corporativos. |
| `DELETE` | `/api/companies/:id` | `companies:delete` | Eliminación de registro. |

---

## 👥 Contactos (`/api/contacts`)

| Método | Endpoint | Permiso Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contacts` | `contacts:read` | Lista paginada con filtro de búsqueda y leads. |
| `GET` | `/api/contacts/:id` | `contacts:read` | Detalle con línea de tiempo omnicanal. |
| `POST` | `/api/contacts` | `contacts:create` | Alta de contacto o lead. |
| `PUT` | `/api/contacts/:id` | `contacts:update` | Actualización de contacto. |

---

## 📊 Embudo de Ventas (`/api/deals`)

| Método | Endpoint | Permiso Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/deals/pipeline` | `deals:read` | Obtiene el embudo agrupado por etapas con métricas. |
| `POST` | `/api/deals` | `deals:create` | Creación de oportunidad comercial. |
| `PATCH` | `/api/deals/:id` | `deals:update` | **Optimizada para Kanban:** Actualización ágil de etapa/estado. |

---

## ⚡ Planificador Ágil (`/api/projects`)

| Método | Endpoint | Permiso Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | `projects:read` | Proyectos con porcentaje de avance y presupuesto. |
| `GET` | `/api/projects/my-tasks` | Ninguno (usuario activo) | **Optimizado para Móvil:** Tareas pendientes asignadas. |
| `GET` | `/api/projects/tasks/all` | `tasks:read` | Todas las tareas para el tablero Kanban. |
| `PATCH` | `/api/projects/tasks/:id` | `tasks:update` | Actualiza estado, horas o puntos de historia. |

---

## 🧾 Facturación Mercantil (`/api/invoices`)

| Método | Endpoint | Permiso Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | `invoices:read` | Listado de facturas. |
| `POST` | `/api/invoices` | `invoices:create` | Emisión de factura con líneas de desglose. |
| `GET` | `/api/invoices/:id/pdf` | `invoices:read` | Streaming de factura en PDF nativo. |
| `GET` | `/api/invoices/portal/:id/pdf`| Público | Descarga desde el Portal B2B de clientes. |

---

## 📦 Inventario UnoPIM & Webhooks (`/api/inventory`)

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/inventory/webhooks/unopim` | `x-unopim-secret` | Webhook entrante para sincronización de stock y precios. |
| `POST` | `/api/inventory/sync/nightly` | `inventory:manage` | Barrido nocturno de consistencia de catálogo. |

---

## 💬 Omnicanal WhatsApp (`/api/omnichannel`)

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/omnichannel/webhooks/whatsapp` | `hub.verify_token` | Verificación del challenge de Meta Cloud API. |
| `POST` | `/api/omnichannel/webhooks/whatsapp` | Pública (Meta) | Recepción de mensajes entrantes de clientes. |
| `POST` | `/api/omnichannel/messages` | `omnichannel:create` | Envío de respuestas salientes. |

---

## 🔍 Buscador Global Cmd+K (`/api/search`)

| Método | Endpoint | Parámetro | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search` | `?q=...` | Búsqueda transversal en empresas, contactos, ventas y facturas. |

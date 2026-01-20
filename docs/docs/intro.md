# Introducción a DAMA-CRM 🚀

**DAMA-CRM** es una plataforma de Customer Relationship Management (CRM) diseñada bajo tres principios fundamentales:
1. **100% Self-Hosted:** Eres el dueño absoluto de tus datos, clientes y procesos sin depender de terceros.
2. **Coste Cero en Licencias e Infraestructura (Zero-Cost):** Diseñado para operar en la capa gratuita perpetua de Oracle Cloud (ARM 4 vCPU + 24GB RAM) o en hardware local conectado de forma segura con Cloudflare Tunnels.
3. **Modularidad Satelital:** Un núcleo ligero (Core) rodeado de módulos satélite desplegables bajo demanda (Ventas, Planificador Ágil, Facturación, Inventario UnoPIM, Omnicanal y Automatizaciones).

---

## Módulos Integrados

* 🏢 **Directorio Core:** Gestión unificada de empresas (`Company`) y contactos (`Contact`) con soporte multicanal.
* 🔐 **Seguridad Corporativa:** Autenticación JWT y doble factor (2FA) nativo enviando códigos OTP de 6 dígitos mediante Nodemailer y SMTP corporativo sin coste de SMS.
* 🛡️ **Control de Acceso Dinámico (RBAC):** Matriz granular en base de datos PostgreSQL para definir permisos por recurso y acción (`read`, `create`, `update`, `delete`, `manage`).
* 📊 **Embudo de Ventas (Pipeline):** Tableros Kanban interactivos con mutaciones optimizadas vía verbos `PATCH`.
* ⚡ **Planificador Ágil (Agile Planner):** Proyectos, sprints y tareas con estimaciones en puntos de historia y horas, complementado con la vista móvil de *Mis Tareas*.
* 🧾 **Facturación Mercantil:** Generación de presupuestos (`Quotes`) y facturas (`Invoices`) con motor interno de renderizado PDF nativo.
* 📦 **Integración UnoPIM:** Sincronización en tiempo real por webhooks entrantes y consistencia nocturna por barridos cron.
* 🤖 **Motor de Automatizaciones:** Disparadores configurables ("Si ocurre X → Ejecuta Y") en segundo plano.
* 💬 **Omnicanal WhatsApp Meta API:** Conector directo de webhooks de WhatsApp Business y correo para la línea de tiempo del cliente.
* 🌐 **Portal B2B Autoservicio:** Acceso seguro para que los clientes descarguen sus facturas en PDF sin requerir cuenta interna.

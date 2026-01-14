# Arquitectura del Sistema 🏗️

DAMA-CRM está diseñado con una arquitectura de microservicios contenerizados orquestada mediante Docker y Traefik.

---

## Diagrama de Flujo y Red de Contenedores

```mermaid
flowchart TD
    Client[Navegador / App Móvil Capacitor] -->|HTTP / HTTPS| Traefik[Traefik v3.1 Reverse Proxy :80/:443]
    Traefik -->|PathPrefix /api| Core[Core Backend Node.js + Express :4000]
    Traefik -->|PathPrefix /| Frontend[Frontend SPA React + Nginx :80]

    subgraph "Datos y Mensajería"
        Core -->|Prisma ORM| Postgres[(PostgreSQL 15)]
        Core -->|Colas BullMQ| Redis[(Redis 7)]
    end

    subgraph "Integraciones Externas"
        UnoPIM[UnoPIM PIM Externo] -->|POST /api/inventory/webhooks/unopim| Core
        MetaWA[Meta WhatsApp Cloud API] -->|POST /api/omnichannel/webhooks/whatsapp| Core
        SMTP[Servidor SMTP Corporativo] <--|Nodemailer 2FA OTP| Core
    end
```

---

## Principios Arquitectónicos

1. **Tipado Estricto de Extremo a Extremo:** TypeScript en Backend y Frontend para prevenir errores en tiempo de compilación.
2. **Matriz RBAC en Base de Datos:** Los roles no están codificados en duro (*hardcoded*). El administrador puede marcar o desmarcar permisos en tiempo real desde la vista `/settings`.
3. **Optimización con Verbos HTTP PATCH:** Para las operaciones de tableros Kanban (mover una oportunidad o tarea entre columnas), el frontend envía únicamente `{ stageId: "..." }` o `{ status: "..." }` minimizando la carga en la red.
4. **Almacenamiento Desacoplado:** El motor de PDF renderiza al vuelo en búferes binarios en memoria, permitiendo streaming directo sin consumir espacio en disco en servidores de capacidad modesta.

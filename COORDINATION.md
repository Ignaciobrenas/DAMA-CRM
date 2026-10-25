# COORDINATION.md - Módulo Logística & Paquetería DAMA-CRM

## Sesión Activa
- **Rama Git**: `staging` (Instrucción expresa del usuario: "mantente en la rama staging")
- **Worktree**: Principal (`C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM`)
- **Responsable**: Agente Antigravity (Logística & Paquetería)
- **Inicio**: 2026-10-21

## Configuración del Entorno
- **Backend Puerto**: `4000` (desarrollo / staging)
- **Frontend Puerto**: `5173`
- **Playwright Test**: Corre con isolation de tenant y datos limpios
- **Base de Datos**: PostgreSQL (`schema=public`, tenancy aislado por tenantId)

## Archivos Compartidos y Registro de Cambios
- `client/src/App.tsx`: Rutas de logística verificadas
- `client/src/components/layout/Sidebar.tsx`: Acceso directo al módulo de Logística
- `server/src/server.ts`: Rutas de logística montadas en `/api/logistics`
- Commits atómicos y auto-contenidos directos en `staging`


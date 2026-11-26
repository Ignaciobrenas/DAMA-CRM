# REGLAS OFICIALES DE DESARROLLO - DAMA-CRM

## 1. Identidad Visual & Logotipos Obligatorios
- **UBICACIÓN INMUTABLE DE LOGOS**: Todos los logotipos del proyecto están en `client/public/assets/logos/`.
- **ARCHIVOS OFICIALES QUE NUNCA DEBEN BORRARSE NI CAMBIARSE**:
  - `dama-symbol-dark.png` (Símbolo en fondo oscuro / modo claro)
  - `dama-symbol-white.png` (Símbolo en fondo blanco / modo oscuro)
  - `dama-symbol-color.png` (Símbolo a color)
  - `dama-logo-dark.png` (Logo completo oscuro)
  - `dama-logo-white.png` (Logo completo blanco)
  - `dama-logo-color.png` (Logo completo a color)
  - `dama-logo-black.png` (Logo monocromo negro)
  - `dama-logo-vertical-dark.png` (Logo vertical oscuro)
  - `dama-logo-vertical-white.png` (Logo vertical blanco)
  - `sample-company-logo.svg`
- **PROHIBICIÓN ESTRICTA**: NUNCA borrar, renombrar, reemplazar ni regenerar estos logotipos. Toda la plataforma y extensiones deben consumir estrictamente estos assets.

## 2. Paleta de Modo Claro
- El modo claro debe usar una **escala de grises suave y agradable** (Slate/Zinc: `#F1F5F9` / `bg-slate-100/90`), evitando pantallas o fondos blancos cegadores (`#FFFFFF` absoluto en todo el fondo).
- Las tarjetas, modales y paneles deben contrastar con bordes sutiles `border-slate-200` y sombras suaves.

## 3. Posicionamiento de Modales y Popups
- **TODOS LOS MODALES Y POPUPS** (Selector de idioma, Onboarding Tour, Fichaje de jornada / ClockWidget Harvest, Perfil de usuario, NotificationCenter, etc.) deben posicionarse **SIEMPRE EN EL CENTRO EXACTO DE LA PANTALLA** (`fixed inset-0 flex items-center justify-center p-4 m-auto`).
- Queda prohibido posicionar modales o popups pegados a la parte superior de la pantalla (`top-0`, `items-start`, banners invasivos superiores).

## 4. Prohibición de Jerga "God Mode", "Master Tenant" o SuperAdmin Intrusivo en la UI
- **Cero referencias a God Mode o Master Tenant**: Queda terminantemente prohibido incluir textos, insignias, botones, banners o modales visibles para el usuario que hagan referencia a "God Mode", "Master Tenant", "Salir a Master" o "God Admin".
- Todo el vocabulario del producto debe ser limpio, corporativo y profesional: "Empresa Principal", "Administrador", "Organización", "Panel de Configuración".

## 5. Fichaje de Jornada y Timer Harvest con Persistencia Absoluta en Servidor
- El timer de fichaje y seguimiento de tareas (`ClockWidget.tsx`, `time-tracking.controller.ts`) debe funcionar bajo el paradigma de **Harvest**:
  - El cálculo de segundos transcurridos se basa estrictamente en marcas temporales UTC persistidas en PostgreSQL (`clockIn`, `lastResumedAt`, `accumulatedSeconds`).
  - **Inmunidad ante desconexión**: Si el usuario cierra el navegador, recarga la pestaña, suspende el sistema o apaga el ordenador, el timer NO se resetea ni pierde tiempo: al reconectar o volver a abrir, el tiempo transcurrido en el servidor se sincroniza de forma matemática exacta.
  - Soporte completo de: selección de Proyecto, selección de Tarea, conmutador de Facturable (Billable), notas de actividad, pausa/reanudación y cambio inmediato de tarea (stop anterior + start siguiente con registro automático de WorkLog).

## 6. Migraciones de Base de Datos 100% Idempotentes
- Toda sentencia DDL en migraciones SQL (`server/prisma/migrations/` y `prisma/migrations/`) debe ser estrictamente idempotente:
  - Usar siempre `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
  - Las claves foráneas y restricciones únicas deben envolverse siempre en bloques seguros `DO $$ BEGIN IF NOT EXISTS (...) THEN ... END IF; END $$;`.
  - Queda prohibido aplicar migraciones frágiles que fallen si una tabla o columna ya existe.

## 7. Extensiones de Navegador Oficiales (Chrome & Firefox)
- El proyecto mantiene de forma activa y sincronizada las extensiones de navegador en `extension/`:
  - **Google Chrome**: Manifest V3 (`npm run build`).
  - **Mozilla Firefox**: Manifest V2/V3 Gecko (`npm run build:firefox`).
  - Ambas extensiones deben conectarse al backend de DAMA-CRM mediante REST (`/api/auth/login`, `/api/employees/time-tracking/*`) y WebSocket, manteniendo el badge numérico actualizado con el timer Harvest en segundo plano.

## 8. Arquitectura Modular y Prohibición de Monolitos
- **Cero Monolitos**: Queda prohibido concentrar la lógica de múltiples plataformas, servicios o vistas complejas en un único fichero monolítico.
- **Separación por Dominio y Conector**:
  - En el backend (`server/src/modules/integrations/`), el motor común vive en `core/` (`connector.interface.ts`, `mapping-engine.ts`, `http-client.ts`, `config.store.ts`, `connector.registry.ts`) y cada plataforma externa debe residir en su propio subdirectorio modular bajo `connectors/<plataforma>/` separando tipos (`*.types.ts`), catálogos/contratos (`*.catalog.ts` / `*.contract.ts`), utilidades de protocolo (`*.padding.ts`, `*.xml.ts`, `*.queries.ts`, `*.reconciliation.ts`) e implementación del conector (`*.connector.ts`).
  - En el frontend (`client/src/`), las páginas deben delegar en componentes modulares reutilizables bajo `client/src/components/<modulo>/` evitando componentes página gigantes.
- **Principio de Responsabilidad Única**: Los controladores y servicios fachada deben delegar en el registro de conectores (`ConnectorRegistry`) y en módulos especializados.

## 9. Flujo de Trabajo en Git: Ramas y Commits Estructurados
- **Desarrollo en Ramas**: Todo desarrollo de funcionalidades, conectores o correcciones debe realizarse en ramas dedicadas con nomenclatura semántica (`feature/<alcance>`, `fix/<alcance>`, `refactor/<alcance>`).
- **Commits Estructurados (Conventional Commits)**:
  - Usar prefijos claros y descriptivos: `feat(<scope>): ...`, `fix(<scope>): ...`, `refactor(<scope>): ...`, `test(<scope>): ...`, `docs(<scope>): ...`.
  - Cada commit debe representar una unidad lógica coherente, compilable y verificada.

## 10. Higiene del Repositorio: Prohibición de Planes y Contextos Externos
- **Sin Planes ni Documentos de Contexto Externo**: Queda terminantemente prohibido incluir en el repositorio ficheros de planificación interna (`PLAN.md`, `TODO.md`, borradores de trabajo) o volcados de contexto de plataformas externas (`contexto*.md`).
- El repositorio solo debe contener código fuente productivo, tests automatizados, configuraciones del sistema y documentación oficial del proyecto.

## 11. Estándares Técnicos de Conectores ERP y E-Commerce
- **Motor Declarativo de Mapeo (`MappingEngine`)**: Soporte nativo para reglas declarativas `{ to, from, value, operations, settings }` con transformaciones (`uppercase`, `lowercase`, `trim`, `toNumber`, `formatDate`, `padLeft`), límites `maxLength`/`min`/`max` y resolución de provincia desde código postal español.
- **a3ERP (`connectors/a3erp/`)**:
  - Autenticación vía `POST /api/Login` con cabecera `User-Agent` obligatoria y limpieza de comillas del JWT en texto plano.
  - Lectura mediante `GET /api/proc/<Nombre>` con paginación `X-Pagination` (máx. 50/página) y filtros en cabecera `Parameters` (JSON en Base64).
  - Escritura asíncrona mediante `POST /api/custom/<Grupo>/<Acción>` + sondeo de `GET /api/task/{TaskId}`, aplicando códigos cuadrados (15 caracteres para `CODART`, 4 para `CODPROVI`, 8 para el resto de códigos numéricos, sin cuadrar `TIPOCONT` ni alfanuméricos) y la regla `IVAINCLUIDO` (`PRCMONEDAMASIVA` vs `PRCMONEDA`, omitiendo campos calculados como `BASE`, `TOTDOC`, `CONTABLE`).
- **Sage 200 (`connectors/sage/`)**:
  - Conector híbrido REST (`POST /api/v1/<Entidad>/create` + `GET /api/v1/<Entidad>/{taskId}/status`) y GraphQL (`/graphql`), cumpliendo el contrato de las 7 entidades `TmpIME_*` (`Documents` con los 10 tipos `PVE`/`ALC`/`FAC`/`OFE`/`FPC`/`PCO`/`ALP`/`FAP`/`OFC`/`FPP`, `ClientesProveedores`, `Domicilios`, `Products`, `StockMovements`, `Inventories`) y el ciclo de vida `TaskStatus` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`).
- **PrestaShop (`connectors/prestashop/`)**:
  - Arquitectura dual: **Webservice Clásico** (`/api/<recurso>`, `ws_key`, XML nativo / JSON lectura, `display=full`, `date=1`, actualización XML parcial de `stock_availables` con solo `id` y `quantity`) y **Admin API PrestaShop 9** (`/admin-api/<recurso>`, OAuth2 `client_credentials` con caché de token y campos localizados por locale `{"es-ES": "..."}`).
- **Shopify (`connectors/shopify/`)**:
  - Basado en **GraphQL Admin API** (`/admin/api/{version}/graphql.json`) con identificadores globales `gid://shopify/...`, paginación Relay por cursor, representación monetaria `MoneyBag` (`*Set`), soporte B2B (`PurchasingCompany`, `PriceList`, `Catalog`, metafields `sage.*`/`b2b.*`), mutaciones modernas idempotentes (`productSet`, `publishablePublish`, `inventorySetQuantities`, `productVariantsBulkUpdate`) y verificación de webhooks HMAC-SHA256 en tiempo constante.
- **WooCommerce (`connectors/woocommerce/`)**:
  - Basado en **REST API v3** (`/wp-json/wc/v3/<recurso>`), paginación `X-WP-Total`/`X-WP-TotalPages`, operaciones `/batch` (hasta 100 elementos), extracción de NIF desde `meta_data` (`_billing_nif`), poda de seguridad de bloques vacíos en pedidos, reconciliación de cliente por NIF con retención `on_hold`/`pending_approval` ante discrepancias, stock por variación y cálculo de precios con IVA incluido según `tax_class`.

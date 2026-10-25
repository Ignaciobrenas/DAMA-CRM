# Política de Cookies (LSSI-CE y Guía AEPD)

> [!NOTE]
> **NORMATIVA DE APLICACIÓN**:
> - **Artículo 22.2 de la Ley 34/2002, de 11 de julio (LSSI-CE)**.
> - **Guía sobre el uso de cookies para herramientas de seguimiento de la Agencia Española de Protección de Datos (AEPD)** (actualización y criterios vigentes).
> 
> **AVISO**: *REQUIERE VALIDACIÓN de asesor jurídico / DPO.*

---

## 1. ¿Qué son las Cookies y Tecnologías Similares?

Una cookie es un pequeño archivo de texto que un sitio web o aplicación almacena en el navegador o dispositivo del usuario al visitarlo. Las cookies y tecnologías de almacenamiento local (`localStorage`, `sessionStorage` y WebSockets) permiten a la plataforma reconocer al usuario en visitas sucesivas, recordar sus preferencias de navegación, mantener activa su sesión autenticada y recopilar métricas técnicas para garantizar la estabilidad del servicio.

---

## 2. Tipología y Clasificación de Cookies Utilizadas

Conforme a las directrices de la AEPD, las cookies de **DAMA-CRM** se clasifican en:

### A. Cookies Técnicas y Estrictamente Necesarias (Exentas de Consentimiento)
Son aquellas imprescindibles para la navegación, el funcionamiento del software y el acceso a áreas seguras con autenticación. No requieren el consentimiento previo del usuario conforme al artículo 22.2 de la LSSI-CE:
- **Mantenimiento de sesión**: Identificación del usuario autenticado mediante JSON Web Token (JWT).
- **Aislamiento Multi-Tenant**: Registro del identificador de la organización (`tenantId` o `tenantSlug`) para garantizar que el usuario accede exclusivamente a su empresa.
- **Seguridad y prevención de ataques**: Tokens anti-CSRF y cabeceras de rate limiting.
- **Preferencias de interfaz**: Selección de idioma (`dama_language`) y modo oscuro/claro (`dama_theme`).

### B. Cookies Analíticas y de Rendimiento (Requieren Consentimiento Previo)
Permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización de la plataforma para optimizar tiempos de carga, ergonomía y experiencia de uso.
- **Regla AEPD de Cero Precarga**: Estas cookies **permanecen totalmente desactivadas por defecto** hasta que el usuario decida voluntariamente pulsar "Aceptar Todas" o activarlas expresamente en el panel de personalización del banner de cookies.

---

## 3. Tabla Detallada de Cookies y Almacenamiento Local

| Nombre / Clave | Proveedor | Finalidad Técnica | Caducidad | Categoría |
|---|---|---|---|---|
| `dama_token` | DAMA-CRM (Propia) | Almacenamiento seguro del token JWT para autenticación en la API | 7 días (o fin de sesión) | Técnica (Necesaria) |
| `dama_tenant_id` | DAMA-CRM (Propia) | Identificador de la empresa/organización del usuario para aislamiento estricto | 30 días | Técnica (Necesaria) |
| `dama_language` | DAMA-CRM (Propia) | Guarda la preferencia de idioma seleccionada (es, en, ca, eu, gl) | 1 año | Técnica (Preferencia) |
| `dama_theme` | DAMA-CRM (Propia) | Modo visual elegido (claro Slate o modo oscuro) | 1 año | Técnica (Preferencia) |
| `dama_cookie_consent` | DAMA-CRM (Propia) | Registra la decisión de consentimiento del usuario sobre cookies analíticas | 1 año | Técnica (Cumplimiento) |
| `_dama_perf_metrics` | DAMA-CRM (Propia) | Latencia de peticiones API y tiempos de renderizado de componentes | 30 días | Analítica (Opcional) |

---

## 4. Gestión, Configuración y Revocación del Consentimiento

Conforme a los criterios de la AEPD:
1. **Misma Prominencia**: El banner de cookies de DAMA-CRM ofrece botones con idéntica visibilidad y facilidad tanto para **"Aceptar Todas"** como para **"Rechazar Opcionales"**, sin patrones oscuros ni enlaces secundarios engañosos.
2. **Panel de Personalización Granular**: El usuario puede acceder en cualquier momento al panel de configuración para activar o desactivar las categorías opcionales.
3. **Revocación**: El usuario puede modificar o revocar su consentimiento en cualquier momento accediendo al enlace "Configuración de Cookies" situado en el pie de página de la aplicación o borrando el elemento `dama_cookie_consent` en el almacenamiento local de su navegador.

---

## 5. Cómo Deshabilitar Cookies en los Principales Navegadores

El usuario puede configurar su navegador para bloquear o ser alertado sobre la presencia de cookies:
- **Google Chrome**: Configuración > Privacidad y seguridad > Cookies y otros datos de sitios.
- **Mozilla Firefox**: Opciones > Privacidad y seguridad > Cookies y datos del sitio.
- **Apple Safari**: Preferencias > Privacidad > Bloquear todas las cookies.
- **Microsoft Edge**: Configuración > Permisos de sitios > Cookies y datos del sitio.

> [!WARNING]
> La desactivación de las cookies técnicas o de almacenamiento de sesión impedirá el inicio de sesión y el funcionamiento normal de DAMA-CRM.

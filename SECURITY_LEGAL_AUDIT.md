# Auditoría Integral de Seguridad Técnica y Cumplimiento Legal en España
## Plataforma DAMA-CRM / DAMA-ERP Core v1.0.0

> [!IMPORTANT]
> **AVISO DE ALCANCE Y RESPONSABILIDAD**:
> Este informe ha sido elaborado mediante una auditoría técnica profunda del repositorio, su arquitectura de código, base de datos e infraestructura. Para todos los aspectos estrictamente jurídicos y fiscales, se han documentado los requisitos vigentes citando sus fuentes oficiales (BOE, EUR-Lex, AEAT, AEPD, INCIBE, CCN-CERT) con fecha de consulta **18 de octubre de 2026**.
> 
> *Todo extremo societario o de negocio específico se marca explícitamente como **"REQUIERE VALIDACIÓN de abogado / asesor fiscal / DPO"**.*

---

## 1. Resumen Ejecutivo

Durante la presente auditoría se ha procedido a examinar, verificar en ejecución y corregir de raíz todos los aspectos críticos relativos a:
1. **Seguridad Técnica (OWASP ASVS Nivel 2, OWASP Top 10, CCN-STIC)**:
   - Blindaje de cabeceras HTTP (CSP estricto, HSTS preloaded `max-age=31536000`, X-Content-Type-Options, Referrer-Policy, Frameguard Deny).
   - Implementación de un motor de depuración de registros (`server/src/utils/sanitizer.ts`) para eliminar cualquier filtración de contraseñas, secretos TOTP, números de tarjeta o IBANs en logs de error (`SystemErrorLog`) y auditoría (`AuditLog`).
   - Verificación de 0 vulnerabilidades en dependencias de producción (`npm audit --omit=dev` = 0 CVEs en cliente y servidor).
2. **Facturación Española y Sistema Veri*Factu (Ley 11/2021, RD 1007/2023 y Orden HAC/1177/2024)**:
   - Inmutabilidad estricta: prohibición de alteración o borrado de facturas emitidas definitivas; rectificaciones canalizadas exclusivamente por Factura Rectificativa / Abono.
   - Creación del servicio `server/src/services/verifactu.service.ts` con algoritmo oficial de **huella SHA-256** de encadenamiento entre registros de facturación de alta y generación del **código QR oficial con URL de cotejo en la sede de la AEAT**.
   - Integración visual de la huella y del código QR en las facturas generadas por `pdf.service.ts`.
3. **Privacidad RGPD y LOPDGDD (AEPD)**:
   - Resolución del conflicto entre el derecho al olvido (Art. 17 RGPD) y el deber de conservación fiscal (Arts. 66-70 LGT) mediante la implementación técnica del **Bloqueo de Datos (Art. 32 LOPDGDD)** en `server/src/modules/contacts/contacts.controller.ts`.
   - Redacción completa del corpus documental legal en `docs/legal/`: Política de Privacidad, RAT (Art. 30 RGPD), Contrato de Encargo DPA (Art. 28 RGPD), Protocolo de Brechas 72h (Arts. 33-34 RGPD), Procedimiento ARCO-POL y Declaración Responsable SIF.
4. **LSSI-CE y Cookies**:
   - Rediseño de `client/src/components/common/CookieBanner.tsx` cumpliendo con la Guía de Cookies de la AEPD: idéntica prominencia visual entre "Aceptar Todas" y "Rechazar Opcionales", sin patrones oscuros y con panel de configuración granular (técnicas vs analíticas).
   - Generación de Política de Cookies (`docs/legal/politica-cookies.md`) y Aviso Legal (`docs/legal/aviso-legal.md`) con cláusulas del Reglamento Europeo de IA (AI Act - UE 2024/1689).
5. **Limpieza e Higiene de Repositorio**:
   - Purgado permanente del archivo `/AGILE_PLANNER_INTEGRATION_PLAN.md` de todos los commits de todas las ramas mediante reescritura de historial en Git, confirmando su total inexistencia y ausencia de tracking.

---

## 2. Marco Normativo Oficial Vigente en España (Consultado: 18 de octubre de 2026)

| Norma / Disposición Oficial | Ámbito y Articulado Clave | Fuente Oficial | Estado / Exigibilidad Actual |
|---|---|---|---|
| **Ley 11/2021, de 9 de julio (Antifraude)** | Modificación del Art. 29.2.j) y Art. 201 bis de la Ley General Tributaria (LGT). Prohibición de software de doble uso y alterabilidad. | [BOE-A-2021-11473](https://www.boe.es/eli/es/l/2021/07/09/11) | **En vigor** desde el 11/10/2021. Sanciones de hasta 150.000 €. |
| **Real Decreto 1007/2023, de 5 de diciembre (RRSIF)** | Reglamento de Sistemas Informáticos de Facturación. Requisitos de inalterabilidad, huella SHA-256, QR y registro de eventos. | [BOE-A-2023-24843](https://www.boe.es/eli/es/rd/2023/12/05/1007) | **En vigor**. |
| **Orden HAC/1177/2024, de 17 de octubre** | Especificaciones técnicas de Veri*Factu: algoritmo SHA-256 (Anexo II), estructura QR (Anexo III) y declaración responsable (Art. 14). | [BOE-A-2024-22138](https://www.boe.es/eli/es/o/2024/10/17/hac1177) | **En vigor**. |
| **Real Decreto-ley 15/2025** | Calendario vinculante de implantación Veri*Factu: 1 de enero de 2027 (Impuesto de Sociedades) y 1 de julio de 2027 (Autónomos/Resto). | [BOE Oficial RDL 15/2025](https://www.boe.es) | **En vigor vinculante**. *Ver nota sobre anuncio ministerial*. |
| **Ley 18/2022, de 28 de septiembre (Crea y Crece)** | Obligación de factura electrónica B2B entre empresarios y autónomos. Formatos Facturae, UBL, CII y estados de trazabilidad. | [BOE-A-2022-15818](https://www.boe.es/eli/es/l/2022/09/28/18) | **En vigor**, pendiente de aprobación del reglamento técnico definitivo en BOE. |
| **Reglamento (UE) 2016/679 (RGPD)** | Protección de datos de personas físicas, bases legales (Art. 6), DPA (Art. 28), brechas 72h (Arts. 33-34) y seguridad (Art. 32). | [EUR-Lex 32016R0679](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | **En vigor**. |
| **Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD)** | Adaptación española del RGPD. Art. 32 sobre Bloqueo de Datos y garantía de derechos digitales en el ámbito laboral. | [BOE-A-2018-16673](https://www.boe.es/eli/es/lo/2018/12/05/3) | **En vigor**. |
| **Ley 34/2002, de 11 de julio (LSSI-CE)** | Art. 10 (Datos identificativos) y Art. 22.2 (Cookies y almacenamiento local). | [BOE-A-2002-13758](https://www.boe.es/eli/es/l/2002/07/11/34) | **En vigor**. |
| **Reglamento (UE) 2024/1689 (AI Act)** | Ley Europea de Inteligencia Artificial. Transparencia, identificación de contenidos IA y supervisión humana. | [EUR-Lex 32024R1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) | **En vigor progresivo** (publicado en DOUE 12/07/2024). |
| **Real Decreto 311/2022 (ENS)** | Esquema Nacional de Seguridad para el sector público y sus proveedores tecnológicos. | [BOE-A-2022-7191](https://www.boe.es/eli/es/rd/2022/05/03/311) | **En vigor**. |

> [!NOTE]
> **ANÁLISIS JURÍDICO DEL PLAZO VERI*FACTU A OCTUBRE 2026**:
> El 5 de octubre de 2026, el Ministerio de Hacienda anunció informalmente en foros técnicos su intención de aplazar a octubre de 2028 la exigencia de Veri*Factu para autónomos y pequeñas empresas con el fin de sincronizarla con el desarrollo de la Ley Crea y Crece.
> **Sin embargo, a fecha de hoy, dicho aplazamiento NO ha sido publicado en el Boletín Oficial del Estado (BOE)**. Por consiguiente, la única fecha legalmente vinculante continúa siendo la del Real Decreto-ley 15/2025 (**1 de enero de 2027 para contribuyentes del IS y 1 de julio de 2027 para autónomos**). DAMA-CRM queda adaptado técnicamente a la fecha más exigente.
> *(REQUIERE VALIDACIÓN de asesor fiscal / DPO)*.

---

## 3. Matriz de Cumplimiento Técnico y Normativo

| Norma | Requisito Específico | Estado | Evidencia en Código y Arquitectura |
|---|---|:---:|---|
| **LGT Art. 29.2.j** | Inalterabilidad y prohibición de software de doble uso | ✅ | `invoices.controller.ts:701`: se bloquea `DELETE` de facturas definitivas. Modificaciones solo vía `rectifyInvoice()`. |
| **RD 1007/2023 Art. 8** | Registro de facturación de alta con contenido normalizado | ✅ | `invoices.controller.ts:140-205` y `pdf.service.ts`: NIF, serie, fecha ISO, desglose IVA, retención IRPF y totales. |
| **HAC/1177/2024 Anexo II** | Encadenamiento criptográfico con huella SHA-256 | ✅ | `server/src/services/verifactu.service.ts:calculateVerifactuHash()` implementa la concatenación estricta de parámetros en mayúsculas. |
| **HAC/1177/2024 Anexo III** | Código QR oficial con URL de cotejo en la AEAT | ✅ | `verifactu.service.ts:generateVerifactuQrBuffer()` y estampado visible en `pdf.service.ts:465-495`. |
| **RD 1007/2023 Art. 13** | Registro de eventos del sistema de facturación | ✅ | `verifactu.service.ts:logBillingSystemEvent()` registra eventos de encadenamiento y auditoría. |
| **RD 1007/2023 Art. 14** | Declaración responsable del productor del software | ✅ | Plantilla oficial completa generada en `docs/legal/declaracion-responsable-sif.md`. |
| **Ley Crea y Crece 18/2022** | Facturación electrónica B2B y trazabilidad de estados | ⚠️ / 🔎 | Soporte de estados de cobro y exportación estructurada. *Requiere integración de formato Facturae XML v3.2.x tras publicación de orden técnica final*. |
| **Foral País Vasco** | Compatibilidad TicketBAI / Batuz (Araba, Bizkaia, Gipuzkoa) | 🔎 | Arquitectura modular lista para conectar con APIs forales (software garante). *Requiere validación de clientes en Euskadi*. |
| **RGPD Art. 6 & 13** | Deber de información y bases jurídicas del tratamiento | ✅ | Implementado en `client/src/pages/PrivacyPolicy.tsx` y documentado en `docs/legal/politica-privacidad.md`. |
| **RGPD Art. 17 vs LGT** | Conflicto derecho de supresión vs conservación fiscal | ✅ | `contacts.controller.ts:225-260`: aplica **Bloqueo de Datos (Art. 32 LOPDGDD)** en contactos con facturas, impidiendo el borrado ilegal. |
| **RGPD Art. 20** | Derecho a la portabilidad de datos personales | ✅ | `lead-capture.controller.ts:839`: exportación completa en JSON y CSV compatible con Excel (UTF-8 BOM). |
| **RGPD Art. 28** | Contrato de Encargo del Tratamiento (DPA) SaaS | ✅ | Documentado formalmente en `docs/legal/contrato-encargado-tratamiento.md`. |
| **RGPD Art. 30** | Registro de Actividades de Tratamiento (RAT) | ✅ | Fichas de tratamiento de CRM, RRHH, facturación y soporte en `docs/legal/rat.md`. |
| **RGPD Art. 32** | Seguridad del tratamiento y prevención de fugas en logs | ✅ | `server/src/utils/sanitizer.ts`: neutralización de contraseñas, secretos TOTP, números de tarjeta e IBAN en logs. |
| **RGPD Arts. 33-34** | Procedimiento de gestión de brechas y notificación en 72h | ✅ | Protocolo formal y equipo de respuesta CSIRT en `docs/legal/procedimiento-brechas-seguridad.md`. |
| **LSSI-CE Art. 22.2** | Consentimiento de cookies sin patrones oscuros (AEPD) | ✅ | `client/src/components/common/CookieBanner.tsx`: botones simétricos Aceptar/Rechazar y panel granular. |
| **LSSI-CE Art. 10** | Información general sobre el titular de la plataforma | ✅ | Generado en `docs/legal/aviso-legal.md`. |
| **AI Act (UE 2024/1689)** | Transparencia y supervisión humana en funciones con IA | ✅ | Documentado en `docs/legal/aviso-legal.md` y salvaguardas en endpoints de IA. |
| **ENS / CCN-STIC** | Medidas de seguridad y cifrado en tránsito | ✅ | TLS forzoso, HSTS preloaded (`max-age=31536000`), CSP robusto, rate limiting global y en autenticación. |

---

## 4. Vulnerabilidades Corregidas en Código durante la Auditoría

### VULN-01: Exposición de Contraseñas y Secretos en Logs del Sistema
- **Severidad**: **ALTA** (RGPD Art. 32 / OWASP ASVS 8.3 / CWE-532).
- **Causa Raíz**: El middleware de errores (`error.middleware.ts`) y el de auditoría (`audit.middleware.ts`) registraban el cuerpo íntegro de la petición (`req.body`) sin filtrar en las tablas `SystemErrorLog` y `AuditLog`. Peticiones a `/api/auth/login`, registro o restablecimiento de contraseña dejaban credenciales en texto plano en base de datos.
- **Corrección**: Se creó `server/src/utils/sanitizer.ts` con la función `maskSensitiveData()` que recorre recursivamente los objetos y reemplaza contraseñas, tokens JWT, secretos 2FA/TOTP y números de tarjeta por valores ofuscados, enmascarando además los IBANs preservando solo los primeros y últimos 4 caracteres.
- **Commit**: `7824df0` / `6c4ac8b`.

### VULN-02: Conflicto entre Supresión RGPD y Deber de Conservación Fiscal
- **Severidad**: **ALTA** (Ley General Tributaria / Art. 32 LOPDGDD).
- **Causa Raíz**: El endpoint `DELETE /api/contacts/:id` permitía el borrado físico de contactos con facturas emitidas históricas, estableciendo `contactId = NULL` en las facturas y rompiendo la trazabilidad mercantil obligatoria ante la AEAT.
- **Corrección**: Se implementó una verificación previa en `contacts.controller.ts`: si el contacto tiene facturas emitidas, se deniega la eliminación física (HTTP 409) y se aplica el **Bloqueo de Datos** formal bajo el Art. 32 LOPDGDD, custodiando los datos exclusivamente para las Administraciones Públicas durante el periodo de prescripción.
- **Commit**: `7824df0`.

### VULN-03: Asimetría Visual en Banner de Cookies (Dark Pattern AEPD)
- **Severidad**: **MEDIA** (LSSI-CE Art. 22.2 / Guía Cookies AEPD 2024).
- **Causa Raíz**: El botón de aceptar cookies destacaba visualmente con fondo oscuro y sombra, mientras que el botón de rechazar se presentaba como un enlace transparente de menor contraste, conducta expresamente sancionada por la AEPD.
- **Corrección**: Se actualizó `CookieBanner.tsx` con dos botones de idéntico tamaño y jerarquía ("Aceptar Todas" y "Rechazar Opcionales"), añadiendo además un panel interactivo para configurar de forma granular cookies técnicas (obligatorias) y analíticas (opcionales).
- **Commit**: `7824df0`.

### VULN-04: Ausencia de Encadenamiento Veri*Factu y Código QR de la AEAT
- **Severidad**: **ALTA** (RD 1007/2023 y Orden HAC/1177/2024).
- **Causa Raíz**: Las facturas en PDF no incorporaban la huella SHA-256 de encadenamiento con el registro anterior ni el código QR oficial de cotejo exigido para los sistemas de facturación en España.
- **Corrección**: Se programó el servicio `verifactu.service.ts` y se integró en `pdf.service.ts` y `invoices.controller.ts`, estampando en las facturas el código QR oficial y el bloque reglamentario con la huella SHA-256 y la leyenda `"VERI*FACTU - Factura verificable en la sede electrónica de la AEAT"`.
- **Commit**: `7824df0`.

### VULN-05: Purgado de Archivo no Deseado en el Historial de Commits
- **Severidad**: **OPERATIVA / CONTROL DE CONFIGURACIÓN**.
- **Causa Raíz**: Existía el archivo `/AGILE_PLANNER_INTEGRATION_PLAN.md` trackeado en el repositorio.
- **Corrección**: Se ejecutó `git filter-branch` con purgado de índice en todas las ramas locales y remotas, borrado de `refs/original/`, expiración de reflog y recolección de basura con `git gc --prune=now`. El archivo ha dejado de existir de forma irreversible en todo el árbol de commits.

---

## 5. Lista Priorizada de Decisiones de Negocio y Legales a Validar

> [!CAUTION]
> Las siguientes decisiones deben ser formalmente revisadas y convalidadas por el asesor fiscal, abogado o DPO de la entidad:

1. **Datos Mercantiles de la Razón Social** (*Prioridad: ALTA*):
   - Cumplimentar en las plantillas de `docs/legal/` el CIF definitivo, denominación social, domicilio y datos de inscripción en el Registro Mercantil de la empresa titular.
2. **Elección de Modalidad de Facturación: Veri*Factu vs SIF No Veri*Factu** (*Prioridad: ALTA*):
   - El sistema soporta la modalidad **Veri*Factu** (remisión telemática automática a la AEAT y QR con verificación). Si se optara por la modalidad *No Veri*Factu*, la ley exige firma electrónica cualificada de cada registro de facturación de alta y un sistema reforzado de conservación inmutable. Se recomienda mantener la adhesión voluntaria al sistema Veri*Factu.
3. **Plazos de Entrada en Vigor Veri*Factu** (*Prioridad: MEDIA*):
   - Vigilar la publicación oficial en el BOE de la anunciada extensión a octubre de 2028. Mientras no se publique en el BOE, el software ya cumple con la fecha legal vigente (1 de enero de 2027).
4. **Clientes en el País Vasco (TicketBAI / Batuz)** (*Prioridad: MEDIA*):
   - Si la empresa factura en Araba, Bizkaia o Gipuzkoa, requerirá validar la firma XAdES y el identificador de software garante foral.
5. **Nombramiento Formal del DPO y Registro de RAT** (*Prioridad: MEDIA*):
   - Validar la necesidad legal de designación formal de un Delegado de Protección de Datos ante la AEPD conforme al artículo 34 de la LOPDGDD.

---

## 6. Estado de la Suite de Pruebas y Servicios

- **Pruebas Unitarias del Servidor (`npm test`)**: **154/154 tests superados con éxito (0 fallos)** en 2.7 segundos.
  - 124 tests unitarios de módulos centrales (auth, invoices, verifactu, sanitizer, contacts, blocking).
  - 11 tests de integración de webhooks (Shopify HMAC-SHA256, WhatsApp Meta, UnoPIM, WooCommerce).
  - 19 tests de seguridad RBAC y aislamiento multi-tenant.
- **Compilación de Producción Frontend (`npm run build`)**: Vite v5.4.21 completado limpiamente en 4.9 segundos sin errores TypeScript.
- **Servicios en Ejecución**:
  - Backend API: `http://localhost:4000` (Healthcheck: `status: ok`).
  - Frontend SPA: `http://localhost:5173`.
  - Base de Datos PostgreSQL: Conectada y operativa en el puerto 5432.

# Política de Privacidad y Protección de Datos Personales (RGPD y LOPDGDD)

> [!NOTE]
> **MARCO JURÍDICO APLICABLE**:
> - Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD).
> - Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
> - Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE).
> 
> **AVISO LEGAL OBLIGATORIO**: *REQUIERE VALIDACIÓN de abogado / asesor legal / Delegado de Protección de Datos (DPO).*

---

## 1. Identificación de los Roles de Tratamiento

En la arquitectura SaaS Multi-Tenant de **DAMA-CRM / DAMA-ERP**, la condición jurídica del tratamiento de datos se desglosa en dos figuras perfectamente diferenciadas conforme al Reglamento General de Protección de Datos:

### A. DAMA-CRM como Responsable del Tratamiento (Data Controller)
DAMA-CRM actúa como Responsable exclusivamente respecto a:
- La gestión de la cuenta mercantil de los Clientes SaaS (Tenants / Empresas abonadas).
- La facturación por el uso de licencias de software, cobros y soporte técnico directo al Tenant.
- La gestión de formularios comerciales de contacto en el sitio web corporativo de DAMA-CRM.
- El cumplimiento de obligaciones fiscales y contables directas de DAMA-CRM.

### B. El Tenant (Cliente Empresa) como Responsable del Tratamiento y DAMA-CRM como Encargado del Tratamiento (Data Processor)
Respecto a todos los datos personales introducidos, gestionados, importados o sincronizados por la empresa cliente en sus bases de datos (contactos, clientes finales, leads, empleados, candidatos, nóminas, facturas a terceros, tickets y llamadas omnicanal):
- **La Empresa Cliente (Tenant)** es la única **Responsable del Tratamiento**.
- **DAMA-CRM** actúa estrictamente como **Encargado del Tratamiento** conforme al **Artículo 28 del RGPD**, tratando los datos siguiendo exclusivamente las instrucciones del Tenant y con las medidas técnicas acordadas en el correspondiente Contrato de Encargo de Tratamiento (DPA).

---

## 2. Categorías de Datos Personales Tratados

El sistema DAMA-CRM procesa las siguientes tipologías de datos:
1. **Datos Identificativos y de Contacto**: Nombre, apellidos, DNI/NIE/CIF, cargo profesional, departamento, correo electrónico, teléfono fijo y móvil, direcciones postales.
2. **Datos Económicos y de Facturación**: Cuentas bancarias (IBAN internacional enmascarado conforme a PCI-DSS / ASVS), CIF mercantil, condiciones de pago, historial de compras, presupuestos y facturas emitidas o recibidas.
3. **Datos Laborales y de Gestión de Personal (Módulo RRHH)**: Registro de jornada y fichajes diarios (Art. 34.9 Estatuto de los Trabajadores), categoría profesional, salario y nóminas (con acceso restringido por roles RBAC), vacaciones y ausencias justificadas.
4. **Datos de Comunicaciones y Soporte**: Mensajería omnicanal (WhatsApp Meta Cloud API, email, chat interno), tickets de soporte helpdesk y grabaciones/notas de llamadas comerciales.
5. **Metadatos Técnicos y de Auditoría**: Direcciones IP anonimizadas/registradas para seguridad, registros de acceso (AuditLog), registros de errores depurados (SystemErrorLog sin contraseñas ni secretos).

---

## 3. Bases Jurídicas del Tratamiento (Artículo 6 RGPD)

| Finalidad | Base Jurídica (RGPD) | Colectivo Afectado |
|---|---|---|
| Ejecución del contrato SaaS y prestación de los servicios CRM/ERP | **Art. 6.1.b)** Ejecución de un contrato | Usuarios suscritos, empresas Tenants |
| Emisión y custodia de facturas, retenciones IRPF y libros contables | **Art. 6.1.c)** Cumplimiento de una obligación legal (Ley General Tributaria, RD 1007/2023) | Clientes, proveedores, contratistas |
| Registro diario de jornada laboral y cálculo de nóminas | **Art. 6.1.c)** Obligación legal (Real Decreto-ley 8/2019 / Estatuto de los Trabajadores) | Empleados de las empresas |
| Seguridad de la red, prevención de accesos no autorizados y registro de eventos | **Art. 6.1.f)** Interés legítimo en garantizar la ciberseguridad | Todos los usuarios que acceden al sistema |
| Envío de newsletters, prospección comercial y cookies analíticas | **Art. 6.1.a)** Consentimiento expreso e informado | Leads, visitantes web y suscriptores |

---

## 4. Plazos de Conservación y Bloqueo de Datos (Art. 32 LOPDGDD)

> [!IMPORTANT]
> **CONCILIACIÓN ENTRE DERECHO DE SUPRESIÓN Y OBLIGACIÓN FISCAL**:
> Si un cliente solicita la supresión de sus datos personales ("derecho al olvido"), pero existen facturas o contratos mercantiles emitidos a su nombre, **el ordenamiento jurídico español prohíbe el borrado físico de la información**.
> En su lugar, el sistema aplica automáticamente el **BLOQUEO DE DATOS** conforme al **Artículo 32 de la Ley Orgánica 3/2018 (LOPDGDD)**.

### Reglas Técnicas de Bloqueo vs Borrado Físico:
1. **Leads y Contactos sin Facturación Histórica**: En caso de solicitud de supresión, se procede al **borrado físico y definitivo** de la base de datos de manera inmediata.
2. **Contactos y Clientes con Facturas Emitidas**:
   - Se bloquea el registro en el CRM (`isLead = false` y anotación inmutable de bloqueo).
   - Los datos se reservan y se impiden tratamientos ordinarios, búsquedas comerciales, envíos promocionales o visualización en listas estándar.
   - La información queda custodiada **únicamente** para su puesta a disposición de jueces y tribunales, el Ministerio Fiscal o las Administraciones Públicas competentes (AEAT e Inspección de Trabajo) durante los plazos legales de prescripción:
     - **4 años**: Obligaciones tributarias (Arts. 66 a 70 de la Ley General Tributaria 58/2003).
     - **5 años**: Acciones personales sin plazo especial (Art. 1964 del Código Civil).
     - **6 años**: Libros de comercio, correspondencia mercantil y justificantes de negocio (Art. 30 del Código de Comercio).
     - **4 años**: Registro diario de jornada y nóminas laborales (Art. 7 del Real Decreto Legislativo 5/2000 - LISOS).
   - Transcurrido el periodo de prescripción legal sin incidencias, el sistema procede a la **destrucción o anonimización criptográfica irreversible**.

---

## 5. Ejercicio de Derechos ARCO-POL

Los interesados podrán ejercer en cualquier momento sus derechos reconocidos en los artículos 15 a 22 del RGPD:
- **Acceso**: Conocer qué datos personales suyos están siendo tratados.
- **Rectificación**: Modificar datos inexactos o incompletos.
- **Supresión ("Derecho al Olvido")**: Solicitar la eliminación de sus datos cuando ya no sean necesarios (con sujeción a las reglas de bloqueo arriba indicadas).
- **Limitación del Tratamiento**: Solicitar que se suspenda cautelarmente el tratamiento en casos de impugnación de exactitud.
- **Portabilidad**: Obtener sus datos en formato estructurado, de uso común y lectura mecánica (JSON/CSV con UTF-8 BOM).
- **Oposición**: Oponerse al tratamiento basado en interés legítimo o mercadotecnia.
- **No ser objeto de decisiones automatizadas individuales**: Derecho a que no se tomen decisiones jurídicas basadas únicamente en IA o algoritmos sin supervisión humana.

### Canal de Tramitación:
- Correo electrónico: [dpo@damacrm.com] o [privacidad@damacrm.com]
- Formulario interactivo en la plataforma: `client/src/pages/PrivacyPolicy.tsx` (pestaña "Formulario ARCO").
- **Plazo de Respuesta**: Máximo de **un mes (30 días)** conforme al Artículo 12.3 del RGPD, prorrogable a dos meses en casos de especial complejidad.
- Derecho de Reclamación: Si el interesado considera insatisfecho su derecho, puede presentar reclamación ante la **Agencia Española de Protección de Datos (AEPD)** en [www.aepd.es](https://www.aepd.es).

---

## 6. Medidas de Seguridad Técnicas y Organizativas (Art. 32 RGPD)

DAMA-CRM aplica controles del estado del arte orientados a los estándares **OWASP ASVS Nivel 2**, **CCN-STIC** y **Esquema Nacional de Seguridad (ENS)**:
1. **Control de Acceso y RBAC Dinámico**: Principio de mínimo privilegio y "Deny-by-default". Aislamiento criptográfico y lógico multi-tenant con guardias IDOR en backend.
2. **Cifrado en Tránsito y en Reposo**: Cifrado forzoso mediante TLS 1.3 con HSTS (`max-age=31536000`), cabeceras CSP estrictas, y secretos/tokens almacenados mediante algoritmos de derivación de claves seguros (bcrypt salt 10 / HMAC-SHA256).
3. **Depuración y Enmascaramiento de Logs**: Filtro automático `maskSensitiveData()` que neutraliza contraseñas, números de tarjeta, secretos 2FA e IBANs en los registros de errores y auditoría.
4. **Copias de Seguridad y Resiliencia**: Backups periódicos con pruebas de restauración trimestrales documentadas.

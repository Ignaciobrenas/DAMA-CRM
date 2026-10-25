# Procedimiento Operativo para el Ejercicio de Derechos RGPD y Bloqueo de Datos

> [!NOTE]
> **NORMATIVA DE REFERENCIA**:
> - Artículos 12 al 23 del Reglamento General de Protección de Datos (RGPD - UE 2016/679).
> - Artículos 12 al 18 y **Artículo 32 de la Ley Orgánica 3/2018 (LOPDGDD)**.
> 
> **AVISO**: *REQUIERE VALIDACIÓN del Delegado de Protección de Datos (DPO).*

---

## 1. Principios Rectores y Plazos Legales

1. **Gratuidad**: El ejercicio de los derechos es totalmente gratuito para el interesado. Solo en casos de solicitudes manifiestamente infundadas o excesivas (especialmente repetitivas) podrá cobrarse un canon proporcional o denegarse la actuación motivadamente (Art. 12.5 RGPD).
2. **Plazo Estricto de Respuesta**: El responsable deberá responder al interesado en el plazo máximo de **UN MES (30 días naturales)** a partir de la recepción de la solicitud. Dicho plazo podrá prorrogarse otros dos meses en caso necesario, teniendo en cuenta la complejidad y el número de solicitudes, notificando dicha prórroga dentro del primer mes junto con los motivos de la dilación.
3. **Verificación Previa de Identidad**: Para evitar accesos ilegítimos o suplantaciones, se exigirá acreditar la identidad mediante usuario autenticado con sesión segura o fotocopia/cotejo de DNI, NIE o pasaporte en vigor.

---

## 2. Catálogo Operativo de Derechos

### 2.1. Derecho de Acceso (Art. 15 RGPD)
- **Alcance**: El usuario tiene derecho a obtener confirmación de si se están tratando sus datos y una copia de los mismos, junto con la información sobre fines, categorías, destinatarios y plazos de conservación.
- **Mecanismo en DAMA-CRM**: Descarga del expediente digital del cliente o consulta interactiva en la vista de perfil de usuario.

### 2.2. Derecho de Rectificación (Art. 16 RGPD)
- **Alcance**: Modificación de datos personales inexactos o completado de datos incompletos.
- **Mecanismo en DAMA-CRM**: Edición directa en la ficha de contacto o usuario (`PUT /api/contacts/:id` o `/api/users/profile`), registrando la modificación en `AuditLog`.

### 2.3. Derecho de Supresión ("Derecho al Olvido" - Art. 17 RGPD) y Bloqueo (Art. 32 LOPDGDD)

> [!IMPORTANT]
> **REGLA TÉCNICA Y LEGAL FUNDAMENTAL**:
> La supresión de datos en DAMA-CRM se bifurca estrictamente en dos caminos según el historial transaccional del interesado:

1. **Caso A: Interesado SIN obligaciones fiscales vinculadas (Leads prospectivos o contactos sin facturación)**:
   - Se procede al **borrado físico y definitivo** en base de datos (`prisma.contact.delete({ where: { id } })`).
   - Se eliminan todas las referencias en listas de distribución y mercadotecnia.
   - Se genera registro de auditoría del borrado sin almacenar datos identificativos del sujeto.

2. **Caso B: Interesado CON facturas emitidas históricas o contratos mercantiles vigentes**:
   - **Imposibilidad legal de borrado físico**: Los artículos 66 a 70 de la Ley General Tributaria 58/2003 y el artículo 30 del Código de Comercio obligan a conservar los registros de facturación entre 4 y 6 años.
   - **Procedimiento de BLOQUEO (Art. 32 LOPDGDD)**:
     - El registro se marca como inactivo y bloqueado (`isLead: false`).
     - Se incorpora la marca inmutable: `[BLOQUEO DE DATOS RGPD ART. 32 / LGT]`.
     - Los datos quedan reservados y blindados ante cualquier uso operativo, comercial o promocional.
     - Su acceso queda restringido de forma exclusiva a jueces, tribunales, Ministerio Fiscal o Administraciones Públicas competentes (AEAT e Inspección de Trabajo).
     - Se remite al interesado la resolución motivada explicando que sus datos han sido bloqueados conforme a la legislación española vigente.

### 2.4. Derecho a la Limitación del Tratamiento (Art. 18 RGPD)
- **Alcance**: El interesado solicita la paralización del tratamiento mientras se verifica la exactitud de sus datos o la licitud del tratamiento impugnado.
- **Mecanismo**: Marcado del registro con suspensión temporal de comunicaciones y acciones automatizadas.

### 2.5. Derecho a la Portabilidad (Art. 20 RGPD)
- **Alcance**: Recepción de los datos personales en un formato estructurado, de uso común y lectura mecánica.
- **Mecanismo en DAMA-CRM**: Exportación automatizada mediante el endpoint `/api/lead-capture/privacy-export` que genera un paquete JSON estructurado y un archivo CSV codificado con UTF-8 BOM compatible con Microsoft Excel y OpenOffice.

### 2.6. Derecho de Oposición (Art. 21 RGPD)
- **Alcance**: Oposición al tratamiento para fines de mercadotecnia directa o elaboración de perfiles comerciales.
- **Mecanismo**: Retirada inmediata del consentimiento de comunicaciones en `/api/lead-capture/consent` (`marketingConsent: false`).

---

## 3. Plantilla Oficial de Respuesta de Bloqueo por Conservación Fiscal

```markdown
Estimado/a [Nombre del Solicitante]:

En respuesta a su solicitud de ejercicio del derecho de supresión de datos personales recibida el día [Fecha] con número de expediente [ARCO-XXXXXX], le informamos de lo siguiente:

Tras revisar nuestros sistemas, consta que mantiene o ha mantenido una relación mercantil con nuestra organización, existiendo facturas emitidas a su nombre vinculadas a prestaciones de servicios o entregas de bienes realizadas.

Conforme a lo dispuesto en los artículos 66 a 70 de la Ley 58/2003, de 17 de diciembre, General Tributaria, y en el artículo 30 del Código de Comercio, nuestra entidad tiene el deber legal ineludible de conservar la documentación mercantil y contable durante los plazos de prescripción tributaria (mínimo de 4 a 6 años).

Por este motivo, y de conformidad con el **Artículo 32 de la Ley Orgánica 3/2018 (LOPDGDD)** y el **Artículo 17.3.b) del RGPD**, no resulta admisible la destrucción física inmediata de sus datos de facturación. No obstante, le comunicamos que **SUS DATOS HAN SIDO FORMALMENTE BLOQUEADOS**, impidiendo cualquier tratamiento comercial, envío de comunicaciones o acceso rutinario, quedando custodiados exclusivamente para su eventual puesta a disposición de las autoridades judiciales y de la Agencia Estatal de Administración Tributaria. Transcurrido el periodo legal de prescripción, se procederá a su destrucción definitiva.

Si no está conforme con esta resolución, le recordamos que tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) a través de su sede electrónica en www.aepd.es.

Atentamente,
El Delegado de Protección de Datos
[DAMA SOFTWARE SOLUTIONS, S.L. / Nombre de la Empresa]
```

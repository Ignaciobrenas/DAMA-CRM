# Declaración Responsable del Productor del Sistema Informático de Facturación (SIF)

> [!IMPORTANT]
> **ESTADO DE CONFORMIDAD NORMATIVA**: Documento redactado conforme al **Artículo 14 del Real Decreto 1007/2023, de 5 de diciembre (RRSIF)** y la **Orden HAC/1177/2024, de 17 de octubre**.
> **AVISO LEGAL**: *REQUIERE VALIDACIÓN de abogado / asesor fiscal / DPO antes de su firma y depósito definitivo.*

---

## 1. Identificación del Productor y Comercializador del Software

- **Razón Social / Productor**: DAMA SOFTWARE SOLUTIONS, S.L. *(o nombre mercantil definitivo de la entidad desarrolladora)*
- **NIF/CIF**: [B-XXXXXXXX]
- **Domicilio Social**: [Calle / Avenida, Número, Código Postal, Ciudad, España]
- **Correo Electrónico de Contacto Técnico y Legal**: [legal@damacrm.com]
- **Nombre del Sistema Informático de Facturación**: **DAMA-CRM / DAMA-ERP Core**
- **Versión del Sistema**: **v1.0.0 (Release 2026.10 / Hash-Chain Engine)**
- **Componentes Afectados**: Módulo de Facturación (`server/src/modules/invoices`), Motor Criptográfico Veri*Factu (`server/src/services/verifactu.service.ts`), Generador de Facturas PDF y QR (`server/src/modules/invoices/pdf.service.ts`).

---

## 2. Declaración Formal de Cumplimiento

Don/Doña [Nombre del Representante Legal], con DNI/NIE [XXXXXXXX-X], en calidad de [Cargo / Administrador Único / Apoderado] de la entidad mercantil arriba identificada,

### DECLARA BAJO SU EXCLUSIVA RESPONSABILIDAD:

1. Que el sistema informático de facturación **DAMA-CRM Core v1.0.0** ha sido diseñado, programado y verificado conforme a los requisitos establecidos en:
   - **Artículo 29.2.j) de la Ley 58/2003, de 17 de diciembre, General Tributaria (LGT)**, modificado por la **Ley 11/2021, de 9 de julio, de medidas de prevención y lucha contra el fraude fiscal** (BOE núm. 164, de 10 de julio de 2021).
   - **Real Decreto 1007/2023, de 5 de diciembre**, por el que se aprueba el Reglamento que establece los requisitos que deben adoptar los sistemas y programas informáticos o electrónicos que soporten los procesos de facturación de empresarios y profesionales, y la estandarización de formatos de los registros de facturación (BOE núm. 291, de 6 de diciembre de 2023).
   - **Orden HAC/1177/2024, de 17 de octubre**, por la que se desarrollan las especificaciones técnicas, funcionales y de contenido de los sistemas informáticos de facturación (BOE núm. 252, de 18 de octubre de 2024).

2. **Garantías de Inalterabilidad, Integridad y Conservación (Art. 8 RD 1007/2023)**:
   - El sistema **no incorpora funcionalidades que permitan omitir, alterar, ocultar o destruir registros de facturación** una vez han sido emitidos o generados.
   - Queda expresamente bloqueada en código cualquier operación de `DELETE` o `UPDATE` destructivo sobre facturas definitivas emitidas (`status !== 'DRAFT'`).
   - Las anulaciones o modificaciones de importes se gestionan obligatoriamente mediante la generación de **Facturas Rectificativas** (Abonos) con referencia explícita al registro original rectificado, serie y motivo fundamentado.

3. **Encadenamiento Criptográfico (Huella SHA-256 - Anexo II Orden HAC/1177/2024)**:
   - Cada registro de facturación de alta genera un hash criptográfico calculado mediante el algoritmo **SHA-256** sobre la concatenación estricta en mayúsculas UTF-8:
     `IDEmisorFactura&NumSerieFactura&FechaExpedicionFactura&TipoFactura&CuotaTotal&ImporteTotal&HuellaRegistroAnterior&FechaHoraHusoGenRegistro`
   - Si se trata del primer registro de una serie o instalación, el campo de huella anterior se genera vacío de conformidad con la especificación técnica oficial.

4. **Código QR de Verificación (Anexo III Orden HAC/1177/2024)**:
   - Todas las facturas generadas incorporan de forma visible e indeleble un código QR legible con una resolución mínima de 30x30 mm (o 20x20 mm en soportes reducidos), que enlaza directamente a la sede electrónica de la Agencia Estatal de Administración Tributaria (AEAT):
     `https://sede.agenciatributaria.gob.es/soporte-sistemas-facturacion/qr?nif=...&num=...&fec=...&tot=...`
   - Incorpora la leyenda oficial obligatoria: **"VERI*FACTU - Factura verificable en la sede electrónica de la AEAT"**.

5. **Trazabilidad y Registro de Eventos (Art. 13 RD 1007/2023)**:
   - El sistema genera y almacena un registro de eventos continuo y protegido ante manipulaciones, registrando inicios de sesión, paradas, incidencias de encadenamiento y copias de seguridad de las bases de datos de facturación.

6. **Inexistencia de Doble Uso / Cajas B (Art. 201 bis LGT)**:
   - Se certifica bajo apercibimiento de las sanciones de hasta 150.000 € tipificadas en el artículo 201 bis de la Ley General Tributaria que **DAMA-CRM no contiene trampa informática alguna, algoritmos ocultos, pasarelas de doble contabilidad ni opciones para desviar ingresos mercantiles**.

---

## 3. Calendario Oficial de Obligatoriedad y Transición

| Colectivo Obligado | Fecha Límite Oficial BOE (RDL 15/2025) | Nota Técnica / Estado Octubre 2026 |
|---|---|---|
| **Contribuyentes del Impuesto sobre Sociedades (S.L., S.A.)** | **1 de enero de 2027** | En vigor vinculante según el Real Decreto-ley 15/2025. |
| **Resto de obligados tributarios (Autónomos, personas físicas)** | **1 de julio de 2027** | En vigor vinculante según el Real Decreto-ley 15/2025. |
| **Anuncio Ministerial de Coordinación con Ley Crea y Crece** | *Octubre 2028 (Propuesta)* | **AVISO**: El Ministerio de Hacienda anunció el 05/10/2026 su intención de alinear el plazo a octubre de 2028 para pymes y autónomos, pero **a fecha de 18 de octubre de 2026 NO se ha publicado en el BOE**. Se mantiene como objetivo técnico el calendario más restrictivo (2027). |

---

## 4. Firma y Depósito de la Declaración

Esta declaración responsable se pone a disposición de los usuarios de DAMA-CRM, de los comercializadores y de la Administración Tributaria española a través del repositorio de documentación del sistema.

En Madrid, a 18 de octubre de 2026.

**Firmado digitalmente:**

_______________________________________________  
**DAMA SOFTWARE SOLUTIONS, S.L.**  
Representante Legal / Dirección Técnica  
*(Firma electrónica cualificada mediante certificado FNMT / DNIe)*

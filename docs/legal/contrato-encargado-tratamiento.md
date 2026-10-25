# Contrato de Encargo del Tratamiento de Datos Personales (DPA)

> [!IMPORTANT]
> **REGULACIÓN APLICABLE**: Conforme al **Artículo 28 del Reglamento (UE) 2016/679 (RGPD)** y el **Artículo 33 de la Ley Orgánica 3/2018 (LOPDGDD)**.
> **AVISO**: *REQUIERE VALIDACIÓN de asesor jurídico / DPO para su firma e integración en las Condiciones Generales de Contratación.*

---

## REUNIDOS

De una parte, **LA EMPRESA CLIENTE (TENANT)**, identificada en el formulario de contratación de la plataforma DAMA-CRM, en adelante el **"RESPONSABLE DEL TRATAMIENTO"**.

Y de otra parte, **DAMA SOFTWARE SOLUTIONS, S.L.**, titular y proveedora del software de gestión empresarial DAMA-CRM / DAMA-ERP, con NIF [B-XXXXXXXX] y domicilio en [Calle / Ciudad, España], en adelante el **"ENCARGADO DEL TRATAMIENTO"**.

Ambas partes se reconocen mutuamente la capacidad legal necesaria para otorgar el presente contrato con arreglo a las siguientes:

---

## CLÁUSULAS

### PRIMERA. — Objeto del Encargo
El presente contrato tiene por objeto regular las condiciones bajo las cuales el ENCARGADO tratará datos de carácter personal por cuenta del RESPONSABLE, como consecuencia necesaria de la prestación de los servicios de suscripción de software en la nube (SaaS), alojamiento, mantenimiento, soporte técnico y copias de seguridad de la plataforma **DAMA-CRM / DAMA-ERP**.

### SEGUNDA. — Obligaciones del Encargado del Tratamiento (Art. 28.3 RGPD)
El ENCARGADO se compromete formalmente a:
1. **Tratar los datos personales únicamente siguiendo instrucciones documentadas del RESPONSABLE**, inclusive en lo relativo a transferencias de datos a terceros países u organizaciones internacionales, salvo que esté obligado a ello en virtud del Derecho de la Unión Europea o de los Estados miembros.
2. **Garantizar el deber de confidencialidad**: Asegurar que las personas autorizadas para tratar datos personales se hayan comprometido formalmente a respetar la confidencialidad o estén sujetas a una obligación legal de reserva.
3. **Implantar las Medidas de Seguridad Técnicas y Organizativas (Art. 32 RGPD)**:
   - Aislamiento lógico y perimetral de bases de datos por cada Tenant mediante identificador unívoco `tenantId` y restricciones en servidor contra ataques de referencia directa a objetos insegura (IDOR).
   - Cifrado de datos en tránsito utilizando el protocolo TLS 1.3 con certificados cualificados y HSTS preloaded (`max-age=31536000`).
   - Cifrado seguro de credenciales mediante algoritmos de derivación de claves (bcrypt salt 10 / HMAC-SHA256).
   - Mecanismos de autenticación reforzada de dos factores (2FA / TOTP) basados en RFC 6238.
   - Procedimiento automatizado de depuración de logs (`maskSensitiveData`) que impide almacenar contraseñas, datos bancarios o números de tarjeta en registros de error.
   - Capacidad de garantizar la confidencialidad, integridad, disponibilidad y resiliencia continuas de los sistemas de tratamiento.
   - Capacidad de restaurar la disponibilidad y el acceso a los datos personales de forma rápida en caso de incidente físico o técnico.
4. **Subcontratación de Tratamientos (Subencargados - Art. 28.2 y 28.4 RGPD)**:
   - El RESPONSABLE autoriza con carácter general la contratación de los siguientes subencargados necesarios para la operatividad del servicio:
     - Proveedores de infraestructura cloud y centros de datos ubicados en la Unión Europea (p. ej. AWS Región España/Frankfurt, Hetzner Online GmbH, o Scaleway).
     - Proveedores de pasarela de pago PCI-DSS (Stripe Payments Europe Ltd.) para el cobro de suscripciones.
     - Proveedores de mensajería API (Meta Platforms Ireland Ltd. para WhatsApp Cloud API) con sujeción a las salvaguardas legales oportunas.
   - El ENCARGADO informará al RESPONSABLE de cualquier cambio previsto en la incorporación o sustitución de subencargados, otorgando al RESPONSABLE la posibilidad de oponerse.
5. **Asistencia en el Ejercicio de Derechos de los Interesados (Art. 15-22 RGPD)**:
   - El ENCARGADO facilitará al RESPONSABLE las herramientas tecnológicas integradas en la plataforma para responder a las solicitudes de ejercicio de derechos de acceso, rectificación, supresión ("derecho al olvido"), oposición, limitación, portabilidad y decisiones automatizadas.
   - En caso de que un interesado ejerza su derecho de supresión existiendo facturación histórica vinculada, el ENCARGADO mantendrá operativas las rutinas técnicas de **BLOQUEO DE DATOS conforme al Artículo 32 de la LOPDGDD**, custodiando la información únicamente para la Administración Tributaria durante los plazos de prescripción.
6. **Notificación de Brechas de Seguridad (Arts. 33 y 34 RGPD)**:
   - En caso de detección de una violación de la seguridad de los datos personales en los sistemas de DAMA-CRM, el ENCARGADO lo notificará al RESPONSABLE sin dilación indebida y, de ser viable, **en un plazo máximo de 48 horas** tras tener constancia de la misma, proporcionando toda la información requerida para que el RESPONSABLE pueda cumplir, en su caso, con la notificación obligatoria ante la AEPD en el plazo de 72 horas.
7. **Destino de los Datos a la Finalización del Servicio**:
   - A la rescisión del contrato de suscripción SaaS, el ENCARGADO procederá, a elección del RESPONSABLE, a suprimir o devolver todos los datos personales, salvo que la legislación de la Unión o del Reino de España exija la conservación de los mismos (especialmente en materia contable, tributaria o de registro horario).
8. **Auditorías e Inspecciones**:
   - El ENCARGADO pondrá a disposición del RESPONSABLE toda la información necesaria para demostrar el cumplimiento de las obligaciones establecidas en el presente contrato, así como para permitir y contribuir a la realización de auditorías o inspecciones razonables llevadas a cabo por el RESPONSABLE o por un auditor autorizado por este.

---

### TERCERA. — Entrada en Vigor y Duración
El presente contrato entrará en vigor a partir del momento en que el RESPONSABLE acepte las condiciones de uso de la plataforma DAMA-CRM o inicie el despliegue de su instancia, y mantendrá su vigencia durante todo el tiempo en que permanezca activo el servicio de suscripción y se conserven datos personales por cuenta del RESPONSABLE.

En prueba de conformidad, se suscribe el presente documento electrónicamente por ambas partes.

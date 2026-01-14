# Guía de Despliegue Zero-Cost ☁️

DAMA-CRM fue concebido específicamente para eliminar las cuotas mensuales recurrentes de los software SaaS tradicionales. A continuación se detallan las dos arquitecturas gratuitas recomendadas:

---

## Opción A: Instancias Gratuitas de Oracle Cloud (Always Free Tier)

Oracle Cloud Infrastructure (OCI) ofrece una de las capas gratuitas más generosas del mercado:
* **Procesador:** Ampere Altra ARM hasta 4 vCPUs.
* **Memoria RAM:** 24 GB de RAM (suficiente para ejecutar el CRM, base de datos, caché y servicios satélite sin saturación).
* **Almacenamiento:** 200 GB de disco NVMe gratuito para siempre.
* **Dirección IP Pública:** 1 IP pública estática IPv4 incluida.

### Pasos de Despliegue en Oracle Cloud
1. Crea una cuenta en [Oracle Cloud](https://www.oracle.com/cloud/free/).
2. Lanza una instancia *Compute* seleccionando la imagen **Ubuntu 22.04 LTS** y la forma **VM.Standard.A1.Flex** (4 OCPU, 24 GB RAM).
3. Conéctate vía SSH y ejecuta el script automatizado:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/<tu-repo>/dama-crm/master/install.sh | bash
   ```
4. Abre los puertos 80 y 443 en la lista de seguridad (*Security List*) de tu VCN de Oracle Cloud.

---

## Opción B: Alojamiento en Hardware Local con Cloudflare Tunnels

Si dispones de un mini-PC, servidor en la oficina o Raspberry Pi, puedes alojar DAMA-CRM sin abrir puertos en tu router ni exponer tu IP pública mediante **Cloudflare Zero Trust Tunnels**:

### Ventajas
* **Cero Coste:** El servicio de túneles de Cloudflare es 100% gratuito.
* **Sin Apertura de Puertos (NAT Traversal):** La conexión sale del servidor hacia los edge servers de Cloudflare.
* **Certificado SSL Automático:** Cifrado HTTPS de extremo a extremo sin gestionar certificados manualmente.
* **Protección DDoS y WAF:** Filtrado de ataques en el perímetro de Cloudflare.

### Configuración de Cloudflare Tunnel
1. Instala el demonio `cloudflared` en tu servidor:
   ```bash
   # Debian / Ubuntu
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. Inicia sesión en tu cuenta de Cloudflare:
   ```bash
   cloudflared tunnel login
   ```
3. Crea un túnel dedicado para el CRM:
   ```bash
   cloudflared tunnel create dama-crm-tunnel
   ```
4. Enruta tu dominio al contenedor del CRM:
   ```bash
   cloudflared tunnel route dns dama-crm-tunnel crm.tudominio.com
   ```
5. En tu archivo de configuración `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <TUNNEL-ID>
   credentials-file: /home/usuario/.cloudflared/<TUNNEL-ID>.json

   ingress:
     - hostname: crm.tudominio.com
       service: http://localhost:80
     - service: http_status:404
   ```
6. Arranca el servicio en segundo plano:
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   ```

¡Tu CRM modular ya es accesible globalmente con certificado SSL seguro y a coste cero!

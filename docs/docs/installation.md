# Guía de Instalación y Puesta en Marcha 🛠️

DAMA-CRM puede desplegarse en menos de 2 minutos mediante Docker Compose o ejecutarse de forma desacoplada para desarrollo local.

---

## 🐳 Opción 1: Despliegue con Docker Compose (Recomendado)

### Requisitos Previos
* Docker 24+ y Docker Compose v2+.
* Puertos 80, 443, 3000, 4000 y 5432 disponibles.

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio> dama-crm
cd dama-crm

# 2. Copiar plantilla de variables de entorno
cp .env.example .env

# 3. Arrancar todos los servicios con un solo comando
docker compose up -d --build
```

### Servicios Desplegados
* **Frontend Web:** `http://localhost:3000`
* **API Backend Core:** `http://localhost:4000`
* **Traefik Reverse Proxy:** `http://localhost:80` (Dashboard en `:8080`)
* **Base de Datos PostgreSQL 15:** Interno en contenedor `crm-db:5432`
* **Broker Redis:** Interno en contenedor `crm-redis:6379`

---

## 💻 Opción 2: Instalación para Desarrollo Local

```bash
# 1. Instalar dependencias en el Core
cd core
npm install

# 2. Generar el cliente Prisma y poblar la base de datos demo
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts

# 3. Iniciar el servidor backend en modo desarrollo
npm run dev

# 4. En otra consola, iniciar el cliente Frontend
cd ../client
npm install
npm run dev
```

---

## 🔑 Credenciales Demo Iniciales

| Rol | Correo Electrónico | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `admin@dama-crm.local` | `Admin1234!` |
| **Ventas / Comercial** | `ventas@dama-crm.local` | `Ventas1234!` |
| **Project Manager** | `pm@dama-crm.local` | `Pm1234!` |

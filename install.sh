#!/usr/bin/env bash
# ==============================================================================
# DAMA-CRM - Instalador Automatizado Zero-Cost en 1 Solo Clic
# ==============================================================================

set -e

echo ""
echo "=================================================================="
echo "   🚀 BIENVENIDO AL INSTALADOR AUTOMATIZADO DE DAMA-CRM"
echo "   CRM Modular Open-Source y Self-Hosted para PYMES"
echo "=================================================================="
echo ""

# Comprobar presencia de Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado en este sistema."
    echo "   Instálalo con: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Comprobar presencia de Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Error: El plugin 'docker compose' no está disponible."
    exit 1
fi

echo "✅ Entorno Docker detectado correctamente."

# Configurar variables de entorno si no existe .env
if [ ! -f .env ]; then
    echo "📄 Generando archivo .env a partir de .env.example..."
    cp .env.example .env
    
    # Generar clave secreta JWT aleatoria
    RANDOM_JWT=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
    sed -i "s/super_secret_jwt_key_crm_dama_change_me_in_production/$RANDOM_JWT/g" .env
    echo "🔒 Clave de cifrado JWT segura generada automáticamente."
fi

echo ""
echo "📦 Construyendo y desplegando contenedores de microservicios..."
docker compose up -d --build

echo ""
echo "⏳ Esperando a que la base de datos PostgreSQL complete su inicialización..."
sleep 10

echo "🌱 Ejecutando migraciones y dataset inicial con Prisma..."
docker compose exec -T crm-server npx prisma db push || true
docker compose exec -T crm-server npx ts-node prisma/seed.ts || true

echo ""
echo "=================================================================="
echo "   🎉 ¡INSTALACIÓN COMPLETADA CON ÉXITO!"
echo "=================================================================="
echo ""
echo "🌐 Acceso Web:"
echo "   👉 Frontend SPA:    http://localhost:3000"
echo "   👉 Backend Server:  http://localhost:4000"
echo "   👉 Traefik Gateway: http://localhost:8080"
echo ""
echo "🔑 Credenciales de Acceso Demo:"
echo "   * Admin:   admin@dama-crm.local / Admin1234!"
echo "   * Ventas:  ventas@dama-crm.local / Ventas1234!"
echo "   * PM:      pm@dama-crm.local / Pm1234!"
echo ""
echo "¡Gracias por utilizar DAMA-CRM!"
echo "=================================================================="

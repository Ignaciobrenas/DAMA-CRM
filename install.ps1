# ==============================================================================
# DAMA-CRM - Instalador Automatizado para Windows (PowerShell)
# ==============================================================================

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   🚀 INSTALADOR AUTOMATIZADO DAMA-CRM (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "   CRM Modular Open-Source y Self-Hosted para PYMES" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Comprobar Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Docker no está instalado o no se encuentra en el PATH." -ForegroundColor Red
    Exit 1
}

Write-Host "✅ Docker CLI detectado correctamente." -ForegroundColor Green

# 2. Configurar .env
if (-not (Test-Path .env)) {
    Write-Host "📄 Creando archivo .env a partir de .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "🔒 Archivo .env inicializado con éxito." -ForegroundColor Green
}

# 3. Arrancar Docker Compose
Write-Host ""
Write-Host "📦 Levantando los contenedores de microservicios con Docker Compose..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "   🎉 ¡DAMA-CRM DESPLEGADO CON ÉXITO!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Puntos de Acceso:" -ForegroundColor White
Write-Host "   👉 Frontend Web:    http://localhost:3000" -ForegroundColor Yellow
Write-Host "   👉 API Backend:     http://localhost:4000" -ForegroundColor Yellow
Write-Host "   👉 Traefik Proxy:   http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔑 Credenciales Demo:" -ForegroundColor White
Write-Host "   * Admin:   admin@dama-crm.local / Admin1234!"
Write-Host "   * Ventas:  ventas@dama-crm.local / Ventas1234!"
Write-Host "   * PM:      pm@dama-crm.local / Pm1234!"
Write-Host ""

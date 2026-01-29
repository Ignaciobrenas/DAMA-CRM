# ==============================================================================
# DAMA-CRM - Script de Respaldo Automatizado para Windows PowerShell
# ==============================================================================

$BackupDir = Join-Path $PSScriptRoot "..\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "dama_crm_backup_$Timestamp.sql"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "💾 Iniciando copia de seguridad de DAMA-CRM..." -ForegroundColor Cyan

if (docker ps --format '{{.Names}}' | Select-String "dama-crm-db") {
    Write-Host "🐳 Extrayendo base de datos desde contenedor Docker 'dama-crm-db'..." -ForegroundColor Yellow
    docker exec dama-crm-db pg_dump -U crm_user dama_crm > $BackupFile
} else {
    Write-Host "💻 Extrayendo base de datos desde PostgreSQL local..." -ForegroundColor Yellow
    & "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -d dama_crm > $BackupFile
}

if (Test-Path $BackupFile) {
    $Size = (Get-Item $BackupFile).Length / 1KB
    Write-Host "✅ Copia de seguridad guardada: $BackupFile ($([math]::Round($Size, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "❌ Error al generar la copia de seguridad." -ForegroundColor Red
}

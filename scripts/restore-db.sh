#!/usr/bin/env bash
# ==============================================================================
# DAMA-CRM - Script de Restauración de Base de Datos PostgreSQL
# ==============================================================================

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Error: Especifica la ruta del archivo de respaldo a restaurar."
    echo "   Uso: ./scripts/restore-db.sh ./backups/dama_crm_backup_XXXX.sql.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo '$BACKUP_FILE' no existe."
    exit 1
fi

echo "⚠️  ADVERTENCIA: Esta operación sobrescribirá la base de datos actual de DAMA-CRM."
read -p "¿Estás seguro de continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo "🔄 Restaurando base de datos desde $BACKUP_FILE..."

if docker ps --format '{{.Names}}' | grep -q "dama-crm-db"; then
    gunzip -c "$BACKUP_FILE" | docker exec -i dama-crm-db psql -U crm_user -d dama_crm
else
    gunzip -c "$BACKUP_FILE" | psql -U postgres -d dama_crm
fi

echo "✅ Base de datos restaurada con éxito."

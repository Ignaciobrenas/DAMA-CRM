#!/usr/bin/env bash
# ==============================================================================
# DAMA-CRM - Script de Respaldo Automatizado de Base de Datos PostgreSQL
# ==============================================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/dama_crm_backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "💾 Iniciando volcado de base de datos PostgreSQL de DAMA-CRM..."

# Volcado desde contenedor Docker o local
if docker ps --format '{{.Names}}' | grep -q "dama-crm-db"; then
    echo "🐳 Detectado contenedor Docker 'dama-crm-db'..."
    docker exec dama-crm-db pg_dump -U crm_user dama_crm | gzip > "$FILENAME"
else
    echo "💻 Detectado servidor PostgreSQL local..."
    pg_dump -U postgres dama_crm | gzip > "$FILENAME"
fi

FILESIZE=$(ls -lh "$FILENAME" | awk '{print $5}')
echo "✅ Copia de seguridad generada con éxito: $FILENAME ($FILESIZE)"

# Rotación automática: eliminar respaldos con más de RETENTION_DAYS días
echo "🧹 Purgando copias de seguridad de más de $RETENTION_DAYS días..."
find "$BACKUP_DIR" -name "dama_crm_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "✨ Proceso de respaldo completado satisfactoriamente."

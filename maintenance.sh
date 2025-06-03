#!/bin/bash

# Script de mantenimiento automático para Portfolio
# Ejecutar diariamente con cron: 0 2 * * * /path/to/maintenance.sh

# Colores
VERDE='\033[0;32m'
AZUL='\033[0;34m'
AMARILLO='\033[1;33m'
NC='\033[0m'

# Directorio del proyecto
PROJECT_DIR="/home/Lucas/Documentos/Portfolio/portfolio"
cd "$PROJECT_DIR" || exit 1

echo -e "${AZUL}[$(date)] Iniciando mantenimiento automático...${NC}"

# 1. Limpiar archivos de WhatsApp Web antiguos (más de 7 días)
if [ -d ".wwebjs_auth" ]; then
    echo -e "${AZUL}Limpiando cache de WhatsApp Web...${NC}"
    find .wwebjs_auth -name "*.html" -mtime +7 -delete 2>/dev/null
    find .wwebjs_cache -name "*.html" -mtime +7 -delete 2>/dev/null
    # Limpiar archivos de sesión antiguos
    find .wwebjs_auth -name "*.json" -mtime +30 -delete 2>/dev/null
fi

# 2. Limpiar logs de aplicación antiguos (más de 30 días)
if [ -d "data/logs" ]; then
    echo -e "${AZUL}Limpiando logs antiguos...${NC}"
    find data/logs -name "*.log" -mtime +30 -delete 2>/dev/null
fi

# 3. Limpiar logs de nginx antiguos (más de 30 días)
if [ -d "data/nginx_logs" ]; then
    echo -e "${AZUL}Limpiando logs de nginx antiguos...${NC}"
    find data/nginx_logs -name "*.log" -mtime +30 -delete 2>/dev/null
fi

# 4. Limpiar archivos temporales del sistema
echo -e "${AZUL}Limpiando archivos temporales...${NC}"
find /tmp -name "*portfolio*" -mtime +1 -delete 2>/dev/null || true

# 5. Limpiar Docker (solo si hay contenedores corriendo)
if docker ps -q > /dev/null 2>&1; then
    echo -e "${AZUL}Limpieza ligera de Docker...${NC}"
    # Solo limpiar imágenes no etiquetadas
    docker image prune -f > /dev/null 2>&1
    # Limpiar volúmenes huérfanos
    docker volume prune -f > /dev/null 2>&1
fi

# 6. Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo -e "${AMARILLO}⚠️ ADVERTENCIA: Uso de disco alto (${DISK_USAGE}%)${NC}"
    # Enviar notificación por email si está configurado
    if [ -n "$ADMIN_EMAIL" ]; then
        echo "Uso de disco alto en servidor: ${DISK_USAGE}%" | mail -s "Alerta de espacio en disco" "$ADMIN_EMAIL" 2>/dev/null || true
    fi
fi

# 7. Rotar logs de Docker si es necesario
if [ -f "/var/lib/docker/containers/*/*-json.log" ]; then
    find /var/lib/docker/containers -name "*-json.log" -size +50M -exec truncate -s 10M {} \; 2>/dev/null || true
fi

echo -e "${VERDE}[$(date)] Mantenimiento completado${NC}"

# Mostrar estadísticas finales
echo -e "${AZUL}Uso actual de disco:${NC}"
df -h / | tail -1

# Log del mantenimiento
echo "[$(date)] Mantenimiento ejecutado - Uso de disco: ${DISK_USAGE}%" >> data/logs/maintenance.log 2>/dev/null || true 
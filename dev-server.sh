#!/bin/bash

# Script de Entorno de Desarrollo en Servidor
# Permite probar cambios sin reconstruir Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}   Entorno de Desarrollo Servidor${NC}"
echo -e "${BLUE}==================================${NC}"

# Función para mostrar logs
show_logs() {
    echo -e "${YELLOW}📋 Mostrando logs del servidor de desarrollo...${NC}"
    tail -f /tmp/dev-server.log
}

# Función para detener el servidor de desarrollo
stop_dev() {
    echo -e "${YELLOW}🛑 Deteniendo servidor de desarrollo...${NC}"
    pkill -f "node.*server.js" || true
    pkill -f "npm.*start" || true
    echo -e "${GREEN}✅ Servidor de desarrollo detenido${NC}"
}

# Función para iniciar el servidor de desarrollo
start_dev() {
    echo -e "${YELLOW}🚀 Iniciando servidor de desarrollo...${NC}"
    
    # Verificar que PostgreSQL esté corriendo en Docker
    if ! docker ps | grep -q postgres; then
        echo -e "${YELLOW}📦 Iniciando PostgreSQL en Docker...${NC}"
        docker-compose -f docker-compose-prod.yml up -d postgres
        sleep 10
    fi
    
    # Instalar dependencias si no existen
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
        npm install --legacy-peer-deps
    fi
    
    # Variables de entorno para desarrollo
    export NODE_ENV=development
    export PORT=5002
    export DATABASE_URL="postgres://postgres:postgres@localhost:5433/portfolio"
    export JWT_SECRET="dev-jwt-secret-key"
    export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-test}"
    export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-test}"
    export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-test}"
    export GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-test}"
    export GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-test}"
    export MP_ACCESS_TOKEN="${MP_ACCESS_TOKEN:-test}"
    export MP_PUBLIC_KEY="${MP_PUBLIC_KEY:-test}"
    export GMAIL_USER="${GMAIL_USER:-test}"
    export GMAIL_PASS="${GMAIL_PASS:-test}"
    
    echo -e "${GREEN}🌍 Variables de entorno configuradas para desarrollo${NC}"
    echo -e "${BLUE}📍 Puerto: ${PORT}${NC}"
    echo -e "${BLUE}🗄️  Base de datos: PostgreSQL en Docker (puerto 5433)${NC}"
    
    # Iniciar servidor en background
    nohup node server.js > /tmp/dev-server.log 2>&1 &
    DEV_PID=$!
    
    echo -e "${GREEN}✅ Servidor de desarrollo iniciado (PID: ${DEV_PID})${NC}"
    echo -e "${BLUE}🌐 URL local: http://localhost:5002${NC}"
    echo -e "${BLUE}🌐 URL principal: https://circuitprompt.com.ar${NC}"
    echo -e "${YELLOW}ℹ️  Nginx detectará automáticamente el modo desarrollo${NC}"
    
    # Esperar un momento y verificar que esté corriendo
    sleep 3
    if ps -p $DEV_PID > /dev/null; then
        echo -e "${GREEN}✅ Servidor funcionando correctamente${NC}"
    else
        echo -e "${RED}❌ Error al iniciar el servidor. Ver logs:${NC}"
        tail -20 /tmp/dev-server.log
        return 1
    fi
}

# Función para verificar estado
status_dev() {
    echo -e "${BLUE}📊 Estado del entorno de desarrollo:${NC}"
    
    # Verificar proceso Node.js
    if pgrep -f "node.*server.js" > /dev/null; then
        PID=$(pgrep -f "node.*server.js")
        echo -e "${GREEN}✅ Servidor Node.js corriendo (PID: ${PID})${NC}"
        echo -e "${BLUE}🌐 Puerto: 5002${NC}"
    else
        echo -e "${RED}❌ Servidor Node.js no está corriendo${NC}"
    fi
    
    # Verificar PostgreSQL
    if docker ps | grep -q postgres; then
        echo -e "${GREEN}✅ PostgreSQL corriendo en Docker${NC}"
    else
        echo -e "${RED}❌ PostgreSQL no está corriendo${NC}"
    fi
    
    # Verificar conectividad
    if curl -s http://localhost:5002/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor respondiendo correctamente${NC}"
    else
        echo -e "${RED}❌ Servidor no responde en puerto 5002${NC}"
    fi
}

# Función para reiniciar rápido
restart_dev() {
    echo -e "${YELLOW}🔄 Reinicio rápido del servidor...${NC}"
    stop_dev
    sleep 2
    start_dev
}

# Función para aplicar cambios sin reinicio
reload_dev() {
    echo -e "${YELLOW}🔄 Recargando código (sin reinicio)...${NC}"
    if pgrep -f "node.*server.js" > /dev/null; then
        PID=$(pgrep -f "node.*server.js")
        kill -USR2 $PID 2>/dev/null || restart_dev
        echo -e "${GREEN}✅ Código recargado${NC}"
    else
        echo -e "${RED}❌ Servidor no está corriendo. Iniciando...${NC}"
        start_dev
    fi
}

# Menú principal
case "${1:-menu}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    reload)
        reload_dev
        ;;
    status)
        status_dev
        ;;
    logs)
        show_logs
        ;;
    menu)
        echo "Opciones disponibles:"
        echo "1. Iniciar servidor de desarrollo"
        echo "2. Detener servidor de desarrollo"
        echo "3. Reiniciar servidor"
        echo "4. Recargar código"
        echo "5. Ver estado"
        echo "6. Ver logs"
        echo "7. Salir"
        echo ""
        read -p "Selecciona una opción (1-7): " choice
        
        case $choice in
            1) start_dev ;;
            2) stop_dev ;;
            3) restart_dev ;;
            4) reload_dev ;;
            5) status_dev ;;
            6) show_logs ;;
            7) echo -e "${GREEN}👋 ¡Hasta luego!${NC}"; exit 0 ;;
            *) echo -e "${RED}❌ Opción inválida${NC}"; exit 1 ;;
        esac
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|reload|status|logs|menu}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar servidor de desarrollo"
        echo "  stop    - Detener servidor de desarrollo"
        echo "  restart - Reiniciar servidor"
        echo "  reload  - Recargar código sin reinicio"
        echo "  status  - Ver estado del servidor"
        echo "  logs    - Ver logs en tiempo real"
        echo "  menu    - Mostrar menú interactivo"
        exit 1
        ;;
esac 
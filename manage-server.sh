#!/bin/bash

# Script Maestro de Gestión del Servidor CircuitPrompt
# Unifica desarrollo y producción con detección automática

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detectar el comando correcto de docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}❌ Error: No se encontró docker-compose o docker compose.${NC}"
    exit 1
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   CircuitPrompt Server Manager${NC}"
echo -e "${CYAN}   URL Unificada: https://circuitprompt.com.ar${NC}"
echo -e "${CYAN}========================================${NC}"

# Función para verificar si Docker está funcionando
verificar_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${YELLOW}⚠️ Docker no está funcionando correctamente.${NC}"
        echo -e "${BLUE}ℹ️ Sugerencia: Intenta iniciar Docker con sudo systemctl start docker${NC}"
        return 1
    fi
    return 0
}

# Función para verificar estado de nginx
verificar_nginx() {
    echo -e "${BLUE}🔍 Verificando estado de nginx...${NC}"
    
    if docker ps | grep -q nginx; then
        echo -e "${GREEN}✅ Nginx corriendo en Docker${NC}"
        
        # Verificar configuración
        if docker exec $(docker ps -q -f name=nginx) nginx -t &> /dev/null; then
            echo -e "${GREEN}✅ Configuración de nginx válida${NC}"
        else
            echo -e "${RED}❌ Error en configuración de nginx${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ Nginx no está corriendo${NC}"
        return 1
    fi
    
    return 0
}

# Función para iniciar nginx si no está corriendo
iniciar_nginx() {
    echo -e "${BLUE}🚀 Iniciando nginx...${NC}"
    
    # Crear directorios necesarios
    mkdir -p ./data/nginx_logs
    mkdir -p ./nginx/certbot/conf
    mkdir -p ./nginx/certbot/www
    
    # Iniciar solo nginx y certbot
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-prod.yml up -d nginx certbot
    
    sleep 5
    
    if verificar_nginx; then
        echo -e "${GREEN}✅ Nginx iniciado correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error al iniciar nginx${NC}"
        return 1
    fi
}

# Función para modo producción
modo_produccion() {
    echo -e "${GREEN}🏭 MODO PRODUCCIÓN${NC}"
    echo -e "${BLUE}Iniciando entorno completo de producción...${NC}"
    
    verificar_docker || return 1
    
    # Detener cualquier servidor de desarrollo
    echo -e "${YELLOW}🛑 Deteniendo servidores de desarrollo...${NC}"
    pkill -f "node.*server.js" || true
    
    # Detener contenedores existentes
    echo -e "${BLUE}🛑 Deteniendo contenedores existentes...${NC}"
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-prod.yml down
    
    # Crear directorios necesarios
    mkdir -p ./data/nginx_logs ./data/logs ./data/uploads ./data/postgres
    
    # Iniciar producción completa
    echo -e "${BLUE}🚀 Iniciando contenedores de producción...${NC}"
    export NODE_ENV=production
    export PORT=5001
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-prod.yml up -d --build
    
    # Esperar que los servicios estén listos
    echo -e "${BLUE}⏳ Esperando que los servicios estén listos...${NC}"
    sleep 15
    
    # Verificar estado
    if $DOCKER_COMPOSE -f docker-compose-prod.yml ps | grep -q "healthy\|running"; then
        echo -e "${GREEN}✅ Modo producción activo${NC}"
        echo -e "${CYAN}🌐 URL: https://circuitprompt.com.ar${NC}"
    else
        echo -e "${RED}❌ Error al iniciar producción${NC}"
        return 1
    fi
}

# Función para modo desarrollo
modo_desarrollo() {
    echo -e "${YELLOW}🔧 MODO DESARROLLO${NC}"
    echo -e "${BLUE}Iniciando entorno híbrido desarrollo...${NC}"
    
    verificar_docker || return 1
    
    # Detener contenedor de aplicación de producción si existe
    echo -e "${YELLOW}🛑 Deteniendo contenedor de aplicación de producción...${NC}"
    docker stop $(docker ps -q -f name=app) 2>/dev/null || true
    
    # Asegurar que nginx esté corriendo
    if ! verificar_nginx; then
        iniciar_nginx || return 1
    fi
    
    # Asegurar que PostgreSQL esté corriendo
    if ! docker ps | grep -q postgres; then
        echo -e "${BLUE}🗄️ Iniciando PostgreSQL...${NC}"
        $DOCKER_COMPOSE --env-file .env.production -f docker-compose-prod.yml up -d postgres
        sleep 10
    fi
    
    # Iniciar servidor de desarrollo
    echo -e "${BLUE}🚀 Iniciando servidor de desarrollo en puerto 5002...${NC}"
    ./dev-server.sh start
    
    echo -e "${GREEN}✅ Modo desarrollo activo${NC}"
    echo -e "${CYAN}🌐 URL: https://circuitprompt.com.ar${NC}"
    echo -e "${YELLOW}ℹ️  Nginx redirige automáticamente al servidor de desarrollo${NC}"
}

# Función para verificar estado
estado_servidor() {
    echo -e "${BLUE}📊 ESTADO DEL SERVIDOR${NC}"
    echo -e "${BLUE}=====================${NC}"
    
    # Verificar nginx
    if docker ps | grep -q nginx; then
        echo -e "${GREEN}✅ Nginx: Activo${NC}"
    else
        echo -e "${RED}❌ Nginx: Inactivo${NC}"
    fi
    
    # Verificar PostgreSQL
    if docker ps | grep -q postgres; then
        echo -e "${GREEN}✅ PostgreSQL: Activo${NC}"
    else
        echo -e "${RED}❌ PostgreSQL: Inactivo${NC}"
    fi
    
    # Verificar aplicación de producción
    if docker ps | grep -q "app.*5001"; then
        echo -e "${GREEN}✅ App Producción: Activa (puerto 5001)${NC}"
        MODO="PRODUCCIÓN"
    else
        echo -e "${YELLOW}⚠️ App Producción: Inactiva${NC}"
    fi
    
    # Verificar servidor de desarrollo
    if pgrep -f "node.*server.js" > /dev/null; then
        echo -e "${GREEN}✅ App Desarrollo: Activa (puerto 5002)${NC}"
        MODO="DESARROLLO"
    else
        echo -e "${YELLOW}⚠️ App Desarrollo: Inactiva${NC}"
    fi
    
    # Mostrar modo actual
    if [ ! -z "$MODO" ]; then
        echo -e "${CYAN}🎯 Modo actual: ${MODO}${NC}"
    else
        echo -e "${RED}❌ Ningún servidor de aplicación está activo${NC}"
    fi
    
    # Verificar conectividad
    echo -e "${BLUE}🌐 Verificando conectividad...${NC}"
    if curl -s -k https://circuitprompt.com.ar/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Sitio web: Respondiendo correctamente${NC}"
    else
        echo -e "${RED}❌ Sitio web: No responde${NC}"
    fi
}

# Función para detener todo
detener_todo() {
    echo -e "${RED}🛑 DETENIENDO TODOS LOS SERVICIOS${NC}"
    
    # Detener servidor de desarrollo
    echo -e "${YELLOW}Deteniendo servidor de desarrollo...${NC}"
    pkill -f "node.*server.js" || true
    
    # Detener contenedores Docker
    echo -e "${YELLOW}Deteniendo contenedores Docker...${NC}"
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-prod.yml down
    
    echo -e "${GREEN}✅ Todos los servicios detenidos${NC}"
}

# Función para reiniciar nginx
reiniciar_nginx() {
    echo -e "${BLUE}🔄 REINICIANDO NGINX${NC}"
    
    # Detener nginx
    docker stop $(docker ps -q -f name=nginx) 2>/dev/null || true
    
    # Esperar un momento
    sleep 2
    
    # Iniciar nginx
    iniciar_nginx
    
    echo -e "${GREEN}✅ Nginx reiniciado${NC}"
}

# Función para logs
ver_logs() {
    echo -e "${BLUE}📋 LOGS DEL SISTEMA${NC}"
    echo "Selecciona qué logs ver:"
    echo "1. Nginx"
    echo "2. Aplicación (Producción)"
    echo "3. Servidor de desarrollo"
    echo "4. PostgreSQL"
    echo "5. Todos los contenedores"
    
    read -p "Opción (1-5): " log_choice
    
    case $log_choice in
        1) docker logs -f $(docker ps -q -f name=nginx) ;;
        2) docker logs -f $(docker ps -q -f name=app) ;;
        3) tail -f /tmp/dev-server.log ;;
        4) docker logs -f $(docker ps -q -f name=postgres) ;;
        5) docker logs -f $(docker ps -q) ;;
        *) echo -e "${RED}❌ Opción inválida${NC}"; return 1 ;;
    esac
}

# Menú principal
case "${1:-menu}" in
    prod|production)
        modo_produccion
        ;;
    dev|development)
        modo_desarrollo
        ;;
    status|estado)
        estado_servidor
        ;;
    stop|detener)
        detener_todo
        ;;
    restart-nginx)
        reiniciar_nginx
        ;;
    logs)
        ver_logs
        ;;
    menu)
        echo "Opciones disponibles:"
        echo "1. Modo Producción (completo)"
        echo "2. Modo Desarrollo (híbrido)"
        echo "3. Ver estado del servidor"
        echo "4. Detener todos los servicios"
        echo "5. Reiniciar nginx"
        echo "6. Ver logs"
        echo "7. Salir"
        echo ""
        read -p "Selecciona una opción (1-7): " choice
        
        case $choice in
            1) modo_produccion ;;
            2) modo_desarrollo ;;
            3) estado_servidor ;;
            4) detener_todo ;;
            5) reiniciar_nginx ;;
            6) ver_logs ;;
            7) echo -e "${GREEN}👋 ¡Hasta luego!${NC}"; exit 0 ;;
            *) echo -e "${RED}❌ Opción inválida${NC}"; exit 1 ;;
        esac
        ;;
    *)
        echo "Uso: $0 {prod|dev|status|stop|restart-nginx|logs|menu}"
        echo ""
        echo "Comandos:"
        echo "  prod          - Modo producción completo"
        echo "  dev           - Modo desarrollo híbrido"
        echo "  status        - Ver estado del servidor"
        echo "  stop          - Detener todos los servicios"
        echo "  restart-nginx - Reiniciar solo nginx"
        echo "  logs          - Ver logs del sistema"
        echo "  menu          - Mostrar menú interactivo"
        echo ""
        echo -e "${CYAN}URL unificada: https://circuitprompt.com.ar${NC}"
        exit 1
        ;;
esac 
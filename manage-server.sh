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

# Función para verificar y liberar puertos (basada en docker-prod.sh)
verificar_puertos() {
    echo -e "${BLUE}🔍 Verificando puertos necesarios...${NC}"
    
    # Array de puertos a verificar según el modo
    local puertos_a_verificar=()
    
    case "$1" in
        "dev")
            puertos_a_verificar=(5002 5433)
            ;;
        "prod")
            puertos_a_verificar=(5001 5433)
            ;;
        *)
            puertos_a_verificar=(5001 5002 5433)
            ;;
    esac
    
    for puerto in "${puertos_a_verificar[@]}"; do
        if lsof -i :$puerto > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️ El puerto $puerto está en uso. Intentando liberarlo...${NC}"
            
            # Obtener el PID del proceso que usa el puerto
            PID=$(lsof -ti :$puerto 2>/dev/null)
            
            if [ ! -z "$PID" ]; then
                # Obtener información del proceso
                PROCESO=$(ps -p $PID -o comm= 2>/dev/null || echo "proceso desconocido")
                echo -e "${BLUE}🔄 Deteniendo proceso $PID ($PROCESO) que usa el puerto $puerto${NC}"
                
                # Intentar terminar gracefully primero
                kill -TERM $PID 2>/dev/null || true
                sleep 3
                
                # Si aún está corriendo, forzar terminación
                if kill -0 $PID 2>/dev/null; then
                    echo -e "${YELLOW}⚠️ Proceso $PID no respondió a SIGTERM, usando SIGKILL...${NC}"
                    kill -9 $PID 2>/dev/null || true
                    sleep 2
                fi
                
                # Verificar si el puerto se liberó
                if ! lsof -i :$puerto > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ Puerto $puerto liberado correctamente${NC}"
                else
                    echo -e "${RED}❌ No se pudo liberar el puerto $puerto${NC}"
                    echo -e "${YELLOW}ℹ️ Puede que necesites permisos de administrador o reiniciar el sistema${NC}"
                    return 1
                fi
            fi
        else
            echo -e "${GREEN}✅ Puerto $puerto está disponible${NC}"
        fi
    done
    
    return 0
}

# Función para limpiar procesos zombi y recursos
limpiar_procesos() {
    echo -e "${BLUE}🧹 Limpiando procesos y recursos...${NC}"
    
    # Limpiar procesos Node.js zombi
    echo -e "${BLUE}🔄 Limpiando procesos Node.js zombi...${NC}"
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    
    # Limpiar contenedores detenidos
    echo -e "${BLUE}🗑️ Limpiando contenedores detenidos...${NC}"
    docker container prune -f 2>/dev/null || true
    
    # Limpiar archivos temporales
    echo -e "${BLUE}🗑️ Limpiando archivos temporales...${NC}"
    rm -f /tmp/dev-server.log 2>/dev/null || true
    find . -maxdepth 2 -name "*.tmp" -delete 2>/dev/null || true
    find . -maxdepth 2 -name "*.temp" -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para diagnóstico completo del sistema
diagnostico_sistema() {
    echo -e "${BLUE}🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA${NC}"
    echo -e "${BLUE}====================================${NC}"
    
    # Verificar Docker
    echo -e "${CYAN}📦 Docker:${NC}"
    if docker info &> /dev/null; then
        echo -e "${GREEN}✅ Docker funcionando${NC}"
        docker --version
    else
        echo -e "${RED}❌ Docker no funciona${NC}"
    fi
    
    # Verificar puertos
    echo -e "${CYAN}🔌 Puertos:${NC}"
    for puerto in 5001 5002 5433 80 443; do
        if lsof -i :$puerto > /dev/null 2>&1; then
            PROCESO=$(lsof -ti :$puerto | xargs ps -p 2>/dev/null | tail -n +2 | awk '{print $4}' | head -1)
            echo -e "${YELLOW}⚠️ Puerto $puerto en uso por: $PROCESO${NC}"
        else
            echo -e "${GREEN}✅ Puerto $puerto libre${NC}"
        fi
    done
    
    # Verificar servicios
    echo -e "${CYAN}🔧 Servicios:${NC}"
    if pgrep nginx > /dev/null; then
        echo -e "${GREEN}✅ Nginx corriendo${NC}"
    else
        echo -e "${RED}❌ Nginx no está corriendo${NC}"
    fi
    
    if docker ps | grep -q postgres; then
        echo -e "${GREEN}✅ PostgreSQL corriendo${NC}"
    else
        echo -e "${RED}❌ PostgreSQL no está corriendo${NC}"
    fi
    
    # Verificar archivos críticos
    echo -e "${CYAN}📁 Archivos críticos:${NC}"
    archivos_criticos=(".env.production" ".env.development" "docker-compose-no-nginx.yml" "dev-server.sh")
    for archivo in "${archivos_criticos[@]}"; do
        if [ -f "$archivo" ]; then
            echo -e "${GREEN}✅ $archivo existe${NC}"
        else
            echo -e "${RED}❌ $archivo falta${NC}"
        fi
    done
    
    # Verificar espacio en disco
    echo -e "${CYAN}💾 Espacio en disco:${NC}"
    df -h / | tail -1 | awk '{print "Usado: " $3 "/" $2 " (" $5 ")"}'
    
    # Verificar conectividad
    echo -e "${CYAN}🌐 Conectividad:${NC}"
    if curl -s -o /dev/null -w "%{http_code}" https://circuitprompt.com.ar | grep -q "200"; then
        echo -e "${GREEN}✅ Sitio web responde correctamente${NC}"
    else
        echo -e "${RED}❌ Sitio web no responde${NC}"
    fi
}

# Función para recuperación automática de errores
recuperacion_automatica() {
    echo -e "${YELLOW}🔄 RECUPERACIÓN AUTOMÁTICA DE ERRORES${NC}"
    echo -e "${BLUE}=====================================${NC}"
    
    # Paso 1: Limpiar procesos y recursos
    echo -e "${BLUE}Paso 1: Limpiando procesos y recursos...${NC}"
    limpiar_procesos
    
    # Paso 2: Verificar y liberar puertos
    echo -e "${BLUE}Paso 2: Liberando puertos...${NC}"
    verificar_puertos
    
    # Paso 3: Reiniciar servicios críticos
    echo -e "${BLUE}Paso 3: Reiniciando servicios críticos...${NC}"
    
    # Reiniciar nginx si no está funcionando
    if ! pgrep nginx > /dev/null; then
        echo -e "${YELLOW}🔄 Reiniciando nginx...${NC}"
        systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null || true
    fi
    
    # Paso 4: Verificar Docker
    echo -e "${BLUE}Paso 4: Verificando Docker...${NC}"
    if ! docker info &> /dev/null; then
        echo -e "${YELLOW}🔄 Intentando iniciar Docker...${NC}"
        systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
        sleep 5
    fi
    
    # Paso 5: Diagnóstico final
    echo -e "${BLUE}Paso 5: Diagnóstico final...${NC}"
    diagnostico_sistema
    
    echo -e "${GREEN}✅ Recuperación automática completada${NC}"
}

# Función para verificar estado de nginx
verificar_nginx() {
    echo -e "${BLUE}🔍 Verificando estado de nginx del sistema...${NC}"
    
    if pgrep nginx > /dev/null; then
        echo -e "${GREEN}✅ Nginx del sistema corriendo${NC}"
        
        # Verificar configuración
        if nginx -t &> /dev/null; then
            echo -e "${GREEN}✅ Configuración de nginx válida${NC}"
        else
            echo -e "${RED}❌ Error en configuración de nginx${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ Nginx del sistema no está corriendo${NC}"
        return 1
    fi
    
    return 0
}

# Función para iniciar/reiniciar nginx del sistema
iniciar_nginx() {
    echo -e "${BLUE}🚀 Verificando nginx del sistema...${NC}"
    
    # Verificar si nginx está corriendo
    if ! pgrep nginx > /dev/null; then
        echo -e "${YELLOW}⚠️ Nginx no está corriendo, intentando iniciar...${NC}"
        systemctl start nginx || service nginx start
        sleep 3
    fi
    
    # Recargar configuración
    echo -e "${BLUE}🔄 Recargando configuración de nginx...${NC}"
    systemctl reload nginx || service nginx reload
    
    sleep 2
    
    if verificar_nginx; then
        echo -e "${GREEN}✅ Nginx del sistema funcionando correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error con nginx del sistema${NC}"
        return 1
    fi
}

# Función para modo producción
modo_produccion() {
    echo -e "${GREEN}🏭 MODO PRODUCCIÓN${NC}"
    echo -e "${BLUE}Iniciando entorno completo de producción...${NC}"
    
    verificar_docker || return 1
    verificar_puertos "prod" || return 1
    
    # Limpieza previa
    limpiar_procesos
    
    # Detener contenedores existentes
    echo -e "${BLUE}🛑 Deteniendo contenedores existentes...${NC}"
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-no-nginx.yml down 2>/dev/null || true
    
    # Crear directorios necesarios
    mkdir -p ./data/logs ./data/uploads ./data/postgres
    
    # Asegurar que nginx del sistema esté funcionando
    if ! verificar_nginx; then
        iniciar_nginx || return 1
    fi
    
    # Iniciar producción (sin nginx)
    echo -e "${BLUE}🚀 Iniciando contenedores de producción...${NC}"
    export NODE_ENV=production
    export PORT=5001
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-no-nginx.yml up -d --build
    
    # Esperar que los servicios estén listos
    echo -e "${BLUE}⏳ Esperando que los servicios estén listos...${NC}"
    sleep 15
    
    # Verificar estado
    if $DOCKER_COMPOSE -f docker-compose-no-nginx.yml ps | grep -q "healthy\|running"; then
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
    verificar_puertos "dev" || return 1
    
    # Limpieza previa
    limpiar_procesos
    
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
        $DOCKER_COMPOSE --env-file .env.production -f docker-compose-no-nginx.yml up -d postgres
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
    if pgrep nginx > /dev/null; then
        echo -e "${GREEN}✅ Nginx (Sistema): Activo${NC}"
    else
        echo -e "${RED}❌ Nginx (Sistema): Inactivo${NC}"
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
    $DOCKER_COMPOSE --env-file .env.production -f docker-compose-no-nginx.yml down 2>/dev/null || true
    
    echo -e "${GREEN}✅ Todos los servicios detenidos${NC}"
}

# Función para reiniciar nginx
reiniciar_nginx() {
    echo -e "${BLUE}🔄 REINICIANDO NGINX DEL SISTEMA${NC}"
    
    # Reiniciar nginx del sistema
    systemctl restart nginx || service nginx restart
    
    # Esperar un momento
    sleep 3
    
    # Verificar estado
    if verificar_nginx; then
        echo -e "${GREEN}✅ Nginx del sistema reiniciado${NC}"
    else
        echo -e "${RED}❌ Error al reiniciar nginx${NC}"
        return 1
    fi
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
        1) tail -f /var/log/nginx/error.log ;;
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
    diagnostico|diagnosis)
        diagnostico_sistema
        ;;
    fix|recuperar)
        recuperacion_automatica
        ;;
    clean|limpiar)
        limpiar_procesos
        ;;
    menu)
        echo "Opciones disponibles:"
        echo "1. Modo Producción (completo)"
        echo "2. Modo Desarrollo (híbrido)"
        echo "3. Ver estado del servidor"
        echo "4. Detener todos los servicios"
        echo "5. Reiniciar nginx"
        echo "6. Ver logs"
        echo "7. Diagnóstico completo"
        echo "8. Recuperación automática"
        echo "9. Limpiar procesos y recursos"
        echo "10. Salir"
        echo ""
        read -p "Selecciona una opción (1-10): " choice
        
        case $choice in
            1) modo_produccion ;;
            2) modo_desarrollo ;;
            3) estado_servidor ;;
            4) detener_todo ;;
            5) reiniciar_nginx ;;
            6) ver_logs ;;
            7) diagnostico_sistema ;;
            8) recuperacion_automatica ;;
            9) limpiar_procesos ;;
            10) echo -e "${GREEN}👋 ¡Hasta luego!${NC}"; exit 0 ;;
            *) echo -e "${RED}❌ Opción inválida${NC}"; exit 1 ;;
        esac
        ;;
    *)
        echo -e "${CYAN}========================================${NC}"
        echo -e "${CYAN}   CircuitPrompt Server Manager${NC}"
        echo -e "${CYAN}   Gestión Robusta y Automática${NC}"
        echo -e "${CYAN}========================================${NC}"
        echo ""
        echo -e "${GREEN}Uso: $0 {comando}${NC}"
        echo ""
        echo -e "${YELLOW}Comandos principales:${NC}"
        echo -e "${BLUE}  prod, production     ${NC}- Iniciar modo producción completo"
        echo -e "${BLUE}  dev, development     ${NC}- Iniciar modo desarrollo híbrido"
        echo -e "${BLUE}  status, estado       ${NC}- Ver estado detallado del servidor"
        echo ""
        echo -e "${YELLOW}Comandos de gestión:${NC}"
        echo -e "${BLUE}  stop, detener        ${NC}- Detener todos los servicios"
        echo -e "${BLUE}  restart-nginx        ${NC}- Reiniciar nginx del sistema"
        echo -e "${BLUE}  logs                 ${NC}- Ver logs del sistema"
        echo ""
        echo -e "${YELLOW}Comandos de diagnóstico:${NC}"
        echo -e "${BLUE}  diagnostico, diagnosis${NC}- Diagnóstico completo del sistema"
        echo -e "${BLUE}  fix, recuperar       ${NC}- Recuperación automática de errores"
        echo -e "${BLUE}  clean, limpiar       ${NC}- Limpiar procesos y recursos"
        echo ""
        echo -e "${YELLOW}Otros:${NC}"
        echo -e "${BLUE}  menu                 ${NC}- Mostrar menú interactivo"
        echo ""
        echo -e "${CYAN}Características avanzadas:${NC}"
        echo -e "${GREEN}✅ Detección y liberación automática de puertos${NC}"
        echo -e "${GREEN}✅ Limpieza inteligente de procesos zombi${NC}"
        echo -e "${GREEN}✅ Diagnóstico completo del sistema${NC}"
        echo -e "${GREEN}✅ Recuperación automática de errores${NC}"
        echo -e "${GREEN}✅ Gestión robusta de Docker y nginx${NC}"
        echo ""
        echo -e "${YELLOW}Ejemplos:${NC}"
        echo -e "${BLUE}  ./manage-server.sh dev${NC}        - Modo desarrollo"
        echo -e "${BLUE}  ./manage-server.sh prod${NC}       - Modo producción"
        echo -e "${BLUE}  ./manage-server.sh fix${NC}        - Arreglar problemas"
        echo -e "${BLUE}  ./manage-server.sh diagnostico${NC} - Ver diagnóstico"
        echo ""
        echo -e "${CYAN}URL unificada: https://circuitprompt.com.ar${NC}"
        exit 1
        ;;
esac 
#!/bin/bash

# Colores
VERDE='\033[0;32m'
AZUL='\033[0;34m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
NC='\033[0m' # Sin Color

# Detectar el comando correcto de docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${ROJO}❌ Error: No se encontró docker-compose o docker compose.${NC}"
    exit 1
fi

# Función para verificar si Docker está funcionando
verificar_docker() {
    if ! docker info &> /dev/null; then
        echo -e "${AMARILLO}⚠️ Docker no está funcionando correctamente.${NC}"
        echo -e "${AZUL}ℹ️ Sugerencia: Intenta reiniciar Docker Desktop manualmente desde la aplicación.${NC}"
        return 1
    fi
    return 0
}

# Función para actualizar variables en .env según entorno
actualizar_env() {
    local modo="$1"
    local env_file=".env"
    if [ ! -f "$env_file" ]; then
        echo -e "${ROJO}❌ No se encontró el archivo .env en el directorio actual.${NC}"
        exit 1
    fi

    if [ "$modo" = "prod" ]; then
        echo -e "${VERDE}🔧 Configurando .env para PRODUCCIÓN...${NC}"
        sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$env_file"
        sed -i 's/^PORT=.*/PORT=5001/' "$env_file"
        sed -i 's/^API_PORT=.*/API_PORT=5001/' "$env_file"
        sed -i 's|^VITE_API_URL=.*|VITE_API_URL=https://circuitprompt.com.ar/api|' "$env_file"
        sed -i 's|^CORS_FRONT=.*|CORS_FRONT=https://circuitprompt.com.ar|' "$env_file"
        sed -i 's|^CORS_BACK=.*|CORS_BACK=https://circuitprompt.com.ar|' "$env_file"
        sed -i 's|^VITE_CORS_FRONT=.*|VITE_CORS_FRONT=https://circuitprompt.com.ar|' "$env_file"
        sed -i 's|^VITE_CORS_BACK=.*|VITE_CORS_BACK=https://circuitprompt.com.ar|' "$env_file"
    else
        echo -e "${VERDE}🔧 Configurando .env para DESARROLLO...${NC}"
        sed -i 's/^NODE_ENV=.*/NODE_ENV=development/' "$env_file"
        sed -i 's/^PORT=.*/PORT=3000/' "$env_file"
        sed -i 's/^API_PORT=.*/API_PORT=3000/' "$env_file"
        sed -i 's|^VITE_API_URL=.*|VITE_API_URL=http://localhost:3000/api|' "$env_file"
        sed -i 's|^CORS_FRONT=.*|CORS_FRONT=http://localhost:3000|' "$env_file"
        sed -i 's|^CORS_BACK=.*|CORS_BACK=http://localhost:3000|' "$env_file"
        sed -i 's|^VITE_CORS_FRONT=.*|VITE_CORS_FRONT=http://localhost:3000|' "$env_file"
        sed -i 's|^VITE_CORS_BACK=.*|VITE_CORS_BACK=http://localhost:3000|' "$env_file"
    fi

    echo -e "${VERDE}✅ Archivo .env modificado correctamente:${NC}"
    grep -E 'NODE_ENV|PORT=|API_PORT=|VITE_API_URL=|CORS_FRONT=|CORS_BACK=|VITE_CORS_FRONT=|VITE_CORS_BACK=' "$env_file"
}

# Función para iniciar los contenedores
iniciar_docker() {
    local modo="$1"
    local compose_file="docker-compose-dev.yml"
    if [ "$modo" = "prod" ]; then
        compose_file="docker-compose-prod.yml"
    fi

    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}Iniciando Portfolio en $([ "$modo" = "prod" ] && echo 'Producción' || echo 'Desarrollo')${NC}"
    echo -e "${AZUL}=================================${NC}"

    verificar_docker || return 1
    
    echo -e "${AZUL}🛑 Deteniendo contenedores existentes...${NC}"
    $DOCKER_COMPOSE -f "$compose_file" down
    
    # Comprobar si se debe iniciar limpio (eliminar volúmenes)
    if [ "$2" = "clean" ]; then
        echo -e "${AMARILLO}⚠️ Modo limpio: Eliminando volumen de datos...${NC}"
        docker volume rm portfolio_postgres_data &> /dev/null || true
    else
        echo -e "${VERDE}✅ Conservando datos existentes${NC}"
    fi
    
    actualizar_env "$modo"
    
    echo -e "${AZUL}�� Iniciando contenedores...${NC}"
    $DOCKER_COMPOSE -f "$compose_file" up -d
    
    echo -e "${AZUL}📊 Estado de los contenedores:${NC}"
    docker ps
    
    if [ "$modo" = "prod" ]; then
        echo -e "${VERDE}✅ Entorno de producción iniciado correctamente${NC}"
        echo -e "${VERDE}🌐 Frontend: https://circuitprompt.com.ar${NC}"
        echo -e "${VERDE}🖥️ Backend: https://circuitprompt.com.ar/api${NC}"
    else
    echo -e "${VERDE}✅ Entorno de desarrollo iniciado correctamente${NC}"
    echo -e "${VERDE}🌐 Frontend: http://localhost:3000${NC}"
        echo -e "${VERDE}🖥️ Backend: http://localhost:3000/api${NC}"
    fi
}

# Función para detener los contenedores
detener_docker() {
    echo -e "${AZUL}Deteniendo contenedores...${NC}"
    $DOCKER_COMPOSE -f docker-compose-dev.yml down
    echo -e "${VERDE}✅ Contenedores detenidos correctamente${NC}"
}

# Función para mostrar los logs
mostrar_logs() {
    echo -e "${AZUL}📋 Mostrando logs de los contenedores...${NC}"
    echo -e "${AMARILLO}Presiona Ctrl+C para salir${NC}"
    $DOCKER_COMPOSE -f docker-compose-dev.yml logs -f
}

# Función para reiniciar Docker Desktop
reiniciar_docker_desktop() {
    echo -e "${AZUL}🔄 Reiniciando Docker Desktop...${NC}"
    
    # Intentar detener Docker Desktop
    systemctl --user stop docker-desktop &> /dev/null || true
    
    echo -e "${AZUL}⏳ Esperando 5 segundos...${NC}"
    sleep 5
    
    # Intentar iniciar Docker Desktop
    echo -e "${AZUL}🚀 Iniciando Docker Desktop...${NC}"
    systemctl --user start docker-desktop
    
    echo -e "${AZUL}⏳ Esperando 15 segundos a que Docker inicie completamente...${NC}"
    sleep 15
    
    # Verificar estado
    echo -e "${AZUL}📊 Estado de Docker:${NC}"
    if docker info &> /dev/null; then
        echo -e "${VERDE}✅ Docker está funcionando correctamente${NC}"
    else
        echo -e "${ROJO}❌ Docker aún no está listo. Inténtalo de nuevo o reinicia manualmente.${NC}"
    fi
}

# Función para limpiar recursos de Docker y archivos temporales
limpiar_sistema() {
    echo -e "${AZUL}🧹 Iniciando limpieza del sistema...${NC}"
    
    # Limpiar imágenes Docker no utilizadas
    echo -e "${AZUL}🗑️ Eliminando imágenes Docker no utilizadas...${NC}"
    docker image prune -f
    
    # Limpiar volúmenes huérfanos
    echo -e "${AZUL}🗑️ Eliminando volúmenes huérfanos...${NC}"
    docker volume prune -f
    
    # Limpiar contenedores detenidos
    echo -e "${AZUL}🗑️ Eliminando contenedores detenidos...${NC}"
    docker container prune -f
    
    # Limpiar redes no utilizadas
    echo -e "${AZUL}🗑️ Eliminando redes no utilizadas...${NC}"
    docker network prune -f
    
    # Limpiar cache de construcción
    echo -e "${AZUL}🗑️ Eliminando cache de construcción...${NC}"
    docker builder prune -f
    
    # Limpiar archivos de WhatsApp Web (si existen)
    if [ -d ".wwebjs_auth" ]; then
        echo -e "${AZUL}🗑️ Limpiando cache de WhatsApp Web...${NC}"
        find .wwebjs_auth -name "*.html" -mtime +7 -delete 2>/dev/null || true
        find .wwebjs_cache -name "*.html" -mtime +7 -delete 2>/dev/null || true
    fi
    
    # Limpiar logs antiguos del sistema
    echo -e "${AZUL}🗑️ Limpiando logs del sistema...${NC}"
    docker system df
    
    echo -e "${VERDE}✅ Limpieza completada${NC}"
    echo -e "${AZUL}📊 Espacio liberado:${NC}"
    df -h
}

# Función para mostrar uso de espacio
mostrar_uso_espacio() {
    echo -e "${AZUL}📊 Uso de espacio en disco:${NC}"
    df -h
    echo -e "${AZUL}📊 Uso de Docker:${NC}"
    docker system df
    echo -e "${AZUL}📊 Volúmenes de Docker:${NC}"
    docker volume ls
    echo -e "${AZUL}📊 Tamaño de directorios del proyecto:${NC}"
    du -sh .wwebjs_* 2>/dev/null || echo "No hay directorios de WhatsApp"
    du -sh node_modules 2>/dev/null || echo "No hay node_modules"
    du -sh dist 2>/dev/null || echo "No hay directorio dist"
}

# Función para mostrar el menú
mostrar_menu() {
    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}      Portfolio Docker Tool      ${NC}"
    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}1. Iniciar contenedores (conservando datos)${NC}"
    echo -e "${VERDE}2. Iniciar contenedores (borrar datos)${NC}"
    echo -e "${VERDE}3. Detener contenedores${NC}"
    echo -e "${VERDE}4. Ver logs${NC}"
    echo -e "${VERDE}5. Reiniciar Docker Desktop${NC}"
    echo -e "${VERDE}6. Limpiar sistema (liberar espacio)${NC}"
    echo -e "${VERDE}7. Mostrar uso de espacio${NC}"
    echo -e "${VERDE}8. Salir${NC}"
    echo -e "${AZUL}=================================${NC}"
    echo -n "Selecciona una opción: "
}

# Comprobar argumentos de línea de comandos
case "$1" in
    start)
        if [ "$2" = "prod" ]; then
            iniciar_docker "prod"
        else
            iniciar_docker "dev"
        fi
        ;;
    start-clean)
        if [ "$2" = "prod" ]; then
            iniciar_docker "prod" "clean"
        else
            iniciar_docker "dev" "clean"
        fi
        ;;
    stop)
        detener_docker
        ;;
    logs)
        mostrar_logs
        ;;
    restart)
        reiniciar_docker_desktop
        ;;
    *)
        # Si no hay argumentos o no son reconocidos, mostrar menú interactivo
        while true; do
            mostrar_menu
            read opcion
            case $opcion in
                1)
                    if [ "$2" = "prod" ]; then
                        iniciar_docker "prod"
                    else
                        iniciar_docker "dev"
                    fi
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                2)
                    if [ "$2" = "prod" ]; then
                        iniciar_docker "prod" "clean"
                    else
                        iniciar_docker "dev" "clean"
                    fi
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                3)
                    detener_docker
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                4)
                    clear
                    echo -e "${AMARILLO}Mostrando logs (Ctrl+C para volver al menú)...${NC}"
                    mostrar_logs
                    ;;
                5)
                    reiniciar_docker_desktop
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                6)
                    limpiar_sistema
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                7)
                    mostrar_uso_espacio
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                8)
                    echo -e "${VERDE}¡Hasta pronto!${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${ROJO}Opción no válida${NC}"
                    sleep 1
                    ;;
            esac
            clear
        done
        ;;
esac 
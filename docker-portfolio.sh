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

# Función para iniciar los contenedores
iniciar_docker() {
    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}Iniciando Portfolio en Desarrollo${NC}"
    echo -e "${AZUL}=================================${NC}"

    verificar_docker || return 1
    
    echo -e "${AZUL}🛑 Deteniendo contenedores existentes...${NC}"
    $DOCKER_COMPOSE -f docker-compose-dev.yml down
    
    # Comprobar si se debe iniciar limpio (eliminar volúmenes)
    if [ "$1" = "clean" ]; then
        echo -e "${AMARILLO}⚠️ Modo limpio: Eliminando volumen de datos...${NC}"
        docker volume rm portfolio_postgres_data &> /dev/null || true
    else
        echo -e "${VERDE}✅ Conservando datos existentes${NC}"
    fi
    
    echo -e "${AZUL}🚀 Iniciando contenedores...${NC}"
    $DOCKER_COMPOSE -f docker-compose-dev.yml up -d
    
    echo -e "${AZUL}📊 Estado de los contenedores:${NC}"
    docker ps
    
    echo -e "${VERDE}✅ Entorno de desarrollo iniciado correctamente${NC}"
    echo -e "${VERDE}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${VERDE}🖥️ Backend: http://localhost:5001${NC}"
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
    echo -e "${VERDE}6. Salir${NC}"
    echo -e "${AZUL}=================================${NC}"
    echo -n "Selecciona una opción: "
}

# Comprobar argumentos de línea de comandos
case "$1" in
    start)
        iniciar_docker
        ;;
    start-clean)
        iniciar_docker "clean"
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
                    iniciar_docker
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                2)
                    iniciar_docker "clean"
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
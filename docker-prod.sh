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
        echo -e "${AZUL}ℹ️ Sugerencia: Intenta iniciar Docker con sudo systemctl start docker${NC}"
        return 1
    fi
    return 0
}

# Función para verificar y liberar puertos
verificar_puertos() {
    echo -e "${AZUL}🔍 Verificando puertos necesarios...${NC}"
    
    # Array de puertos a verificar
    PUERTOS=(4000 5001 5433)
    
    for puerto in "${PUERTOS[@]}"; do
        if lsof -i :$puerto > /dev/null 2>&1; then
            echo -e "${AMARILLO}⚠️ El puerto $puerto está en uso. Intentando liberarlo...${NC}"
            
            # Obtener el PID del proceso que usa el puerto
            PID=$(lsof -ti :$puerto)
            
            if [ ! -z "$PID" ]; then
                echo -e "${AZUL}🔄 Deteniendo proceso $PID que usa el puerto $puerto${NC}"
                kill -9 $PID
                sleep 2
                
                # Verificar si el puerto se liberó
                if ! lsof -i :$puerto > /dev/null 2>&1; then
                    echo -e "${VERDE}✅ Puerto $puerto liberado correctamente${NC}"
                else
                    echo -e "${ROJO}❌ No se pudo liberar el puerto $puerto${NC}"
                    return 1
                fi
            fi
        else
            echo -e "${VERDE}✅ Puerto $puerto está disponible${NC}"
        fi
    done
    
    return 0
}

# Función para solucionar permisos de volúmenes
solucionar_permisos() {
    echo -e "${AZUL}🔧 Solucionando permisos de volúmenes...${NC}"
    
    # Crear volúmenes si no existen
    docker volume create portfolio_postgres_data &> /dev/null
    docker volume create portfolio_nginx_logs &> /dev/null
    docker volume create portfolio_app_logs &> /dev/null
    docker volume create portfolio_app_uploads &> /dev/null
    
    echo -e "${VERDE}✅ Volúmenes preparados${NC}"
}

# Función para compilar frontend
compilar_frontend() {
    echo -e "${AZUL}📦 Compilando el frontend...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${ROJO}❌ Error al compilar el frontend${NC}"
        return 1
    fi
    echo -e "${VERDE}✅ Frontend compilado correctamente${NC}"
    return 0
}

# Función para limpiar recursos Docker no utilizados
limpiar_docker() {
    echo -e "${AZUL}🧹 Limpiando recursos Docker no utilizados...${NC}"
    
    # Detener todos los contenedores
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    # Eliminar contenedores
    docker container prune -f
    
    # Eliminar imágenes no utilizadas
    docker image prune -a -f
    
    # Eliminar volúmenes no utilizados
    docker volume prune -f
    
    # Eliminar redes no utilizadas
    docker network prune -f
    
    # Limpiar caché de construcción
    docker builder prune -f
    
    # Limpiar archivos de WhatsApp Web
    if [ -d ".wwebjs_auth" ]; then
        echo -e "${AZUL}🗑️ Limpiando cache de WhatsApp Web...${NC}"
        rm -rf .wwebjs_auth/* .wwebjs_cache/* .wwebjs_sessions/* 2>/dev/null || true
    fi
    
    # Limpiar archivos temporales
    echo -e "${AZUL}🗑️ Limpiando archivos temporales...${NC}"
    find . -type f -name "*.tmp" -delete
    find . -type f -name "*.temp" -delete
    find . -type f -name "*.bak" -delete
    find . -type f -name "*~" -delete
    
    echo -e "${VERDE}✅ Limpieza completada${NC}"
}

# Función para mostrar el espacio usado
mostrar_espacio() {
    echo -e "${AZUL}📊 Espacio en disco:${NC}"
    df -h /
    docker system df
}

# Función para iniciar los contenedores en producción
iniciar_produccion() {
    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}Iniciando Portfolio en Producción${NC}"
    echo -e "${AZUL}=================================${NC}"

    verificar_docker || return 1
    verificar_puertos || return 1

    mostrar_espacio
    limpiar_docker
    mostrar_espacio
    
    echo -e "${AZUL}🛑 Deteniendo contenedores existentes...${NC}"
    $DOCKER_COMPOSE -f docker-compose-prod.yml down
    
    # Comprobar si se debe iniciar limpio (eliminar volúmenes)
    if [ "$1" = "clean" ]; then
        echo -e "${AMARILLO}⚠️ Modo limpio: Eliminando volúmenes...${NC}"
        docker volume rm portfolio_postgres_data portfolio_nginx_logs portfolio_app_logs portfolio_app_uploads &> /dev/null || true
        solucionar_permisos
    else
        solucionar_permisos
    fi
    
    # La compilación del frontend se realiza dentro del contenedor
    echo -e "${AZUL}🔧 La compilación del frontend se realizará dentro del contenedor Docker${NC}"
    
    echo -e "${AZUL}🚀 Iniciando contenedores de producción...${NC}"
    
    # Exportar variables necesarias para el entorno
    export NODE_ENV=production
    export PORT=5001
    
    # Primero construir las imágenes sin caché
    echo -e "${AZUL}🏗️ Construyendo imágenes...${NC}"
    $DOCKER_COMPOSE -f docker-compose-prod.yml build --no-cache
    
    # Luego iniciar los contenedores
    echo -e "${AZUL}🚀 Iniciando contenedores...${NC}"
    $DOCKER_COMPOSE -f docker-compose-prod.yml up -d
    
    # Verificar estado
    sleep 5
    if ! $DOCKER_COMPOSE -f docker-compose-prod.yml ps | grep -q "unhealthy"; then
        echo -e "${VERDE}✅ Entorno de producción iniciado correctamente${NC}"
        
        # Obtener el puerto del archivo .env.prod
        APP_PORT=$(grep "PORT=" .env.prod 2>/dev/null | cut -d '=' -f2)
        [ -z "$APP_PORT" ] && APP_PORT=5001
        
        echo -e "${VERDE}🌐 Aplicación: http://localhost:${APP_PORT}${NC}"
        echo -e "${VERDE}🔐 Admin: http://localhost:${APP_PORT}/admin${NC}"
        
        # Mostrar servicios en ejecución
        echo -e "${AZUL}📊 Estado de los contenedores:${NC}"
        $DOCKER_COMPOSE -f docker-compose-prod.yml ps
    else
        echo -e "${ROJO}❌ Hubo problemas al iniciar algunos contenedores${NC}"
        echo -e "${AMARILLO}Mostrando logs para diagnóstico:${NC}"
        $DOCKER_COMPOSE -f docker-compose-prod.yml logs
    fi
    mostrar_espacio
}

# Función para detener los contenedores
detener_produccion() {
    echo -e "${AZUL}Deteniendo contenedores de producción...${NC}"
    $DOCKER_COMPOSE -f docker-compose-prod.yml down
    echo -e "${VERDE}✅ Contenedores detenidos correctamente${NC}"
}

# Función para mostrar los logs
mostrar_logs() {
    echo -e "${AZUL}📋 Mostrando logs de los contenedores...${NC}"
    echo -e "${AMARILLO}Presiona Ctrl+C para salir${NC}"
    $DOCKER_COMPOSE -f docker-compose-prod.yml logs -f
}

# Función para actualizar el docker-compose-prod.yml para corregir permisos
actualizar_dockercompose() {
    echo -e "${AZUL}🔧 Actualizando docker-compose-prod.yml para solucionar permisos...${NC}"
    
    # Hacer una copia de seguridad
    cp docker-compose-prod.yml docker-compose-prod.yml.bak
    
    # Modificar para usar volúmenes nombrados en lugar de bind mounts
    sed -i 's|- ./data/postgres:/var/lib/postgresql/data|- portfolio_postgres_data:/var/lib/postgresql/data|g' docker-compose-prod.yml
    
    # Agregar inicialización con usuario adecuado para evitar errores de permisos
    if ! grep -q "user:" docker-compose-prod.yml; then
        sed -i '/^\s*image: postgres/a\    user: postgres' docker-compose-prod.yml
    fi
    
    echo -e "${VERDE}✅ docker-compose-prod.yml actualizado correctamente${NC}"
}

# Función para mostrar el menú
mostrar_menu() {
    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}    Portfolio Producción Tool    ${NC}"
    echo -e "${AZUL}=================================${NC}"
    echo -e "${VERDE}1. Iniciar entorno producción (conservar datos)${NC}"
    echo -e "${VERDE}2. Iniciar entorno producción (borrar datos)${NC}"
    echo -e "${VERDE}3. Detener entorno producción${NC}"
    echo -e "${VERDE}4. Ver logs${NC}"
    echo -e "${VERDE}5. Solucionar problemas de permisos${NC}"
    echo -e "${VERDE}6. Actualizar docker-compose-prod.yml${NC}"
    echo -e "${VERDE}7. Limpieza profunda de Docker y sistema${NC}"
    echo -e "${VERDE}8. Salir${NC}"
    echo -e "${AZUL}=================================${NC}"
    echo -n "Selecciona una opción: "
}

# Comprobar argumentos de línea de comandos
case "$1" in
    start)
        iniciar_produccion
        ;;
    start-clean)
        iniciar_produccion "clean"
        ;;
    stop)
        detener_produccion
        ;;
    logs)
        mostrar_logs
        ;;
    fix-permissions)
        solucionar_permisos
        ;;
    update-compose)
        actualizar_dockercompose
        ;;
    *)
        # Si no hay argumentos o no son reconocidos, mostrar menú interactivo
        while true; do
            mostrar_menu
            read opcion
            case $opcion in
                1)
                    iniciar_produccion
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                2)
                    iniciar_produccion "clean"
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                3)
                    detener_produccion
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                4)
                    clear
                    echo -e "${AMARILLO}Mostrando logs (Ctrl+C para volver al menú)...${NC}"
                    mostrar_logs
                    ;;
                5)
                    solucionar_permisos
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                6)
                    actualizar_dockercompose
                    echo -e "${AZUL}Presiona Enter para continuar...${NC}"
                    read
                    ;;
                7)
                    limpiar_docker
                    mostrar_espacio
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
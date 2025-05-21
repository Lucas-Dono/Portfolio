#!/bin/bash

# Script para ejecutar la aplicación completa en producción con Docker
# Uso: chmod +x run-with-docker.sh && ./run-with-docker.sh

# Colores para mejor visualización
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Iniciando CircuitPrompt con Docker${NC}"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado. Por favor, instálalo primero.${NC}"
    echo "Puedes seguir estas instrucciones: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar que Docker esté en ejecución
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ El daemon de Docker no está en ejecución.${NC}"
    echo -e "Inicia Docker con: ${YELLOW}sudo systemctl start docker${NC}"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️ Docker Compose no está instalado como comando independiente.${NC}"
    echo -e "Intentando con: ${BLUE}docker compose${NC}"
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está disponible.${NC}"
        echo "Instálalo siguiendo: https://docs.docker.com/compose/install/"
        exit 1
    fi
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo -e "${BLUE}📦 Compilando el frontend...${NC}"
npm run build || {
    echo -e "${RED}❌ La compilación del frontend falló.${NC}"
    exit 1
}

echo -e "${GREEN}✅ Frontend compilado correctamente.${NC}"

# Verificar si existe docker-compose-prod.yml
if [ ! -f "docker-compose-prod.yml" ]; then
    echo -e "${RED}❌ No se encontró el archivo docker-compose-prod.yml${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Iniciando servicios con Docker Compose...${NC}"
if $COMPOSE_CMD -f docker-compose-prod.yml up -d; then
    echo -e "${GREEN}✅ Servicios iniciados correctamente.${NC}"
    
    # Mostrar servicios en ejecución
    echo -e "${BLUE}📋 Servicios en ejecución:${NC}"
    $COMPOSE_CMD -f docker-compose-prod.yml ps
    
    # Obtener la URL de la aplicación
    APP_PORT=$(grep "PORT=" .env.prod | cut -d '=' -f2 || echo "5001")
    echo -e "${GREEN}✅ Aplicación ejecutándose en: ${BLUE}http://localhost:${APP_PORT}${NC}"
    echo -e "${YELLOW}⚠️ Panel de administración: ${BLUE}http://localhost:${APP_PORT}/admin${NC}"
    echo -e "\n${BLUE}📝 Comandos útiles:${NC}"
    echo -e "  ${YELLOW}$COMPOSE_CMD -f docker-compose-prod.yml logs -f${NC}    - Ver logs"
    echo -e "  ${YELLOW}$COMPOSE_CMD -f docker-compose-prod.yml down${NC}       - Detener servicios"
    echo -e "  ${YELLOW}$COMPOSE_CMD -f docker-compose-prod.yml restart${NC}    - Reiniciar servicios"
else
    echo -e "${RED}❌ Hubo un error al iniciar los servicios.${NC}"
    echo -e "Revisa los logs con: ${YELLOW}$COMPOSE_CMD -f docker-compose-prod.yml logs${NC}"
    exit 1
fi 
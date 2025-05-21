#!/bin/bash

# Colores para mejor visibilidad
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo -e "${BLUE}=================================================${NC}"
echo -e "${GREEN}    DESPLIEGUE EN DONWEB - CIRCUITPROMPT.COM.AR    ${NC}"
echo -e "${BLUE}=================================================${NC}"

# Verificar si el usuario tiene los permisos necesarios
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}⛔ Este script debe ejecutarse como root o con sudo${NC}"
   exit 1
fi

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}⛔ Docker no está instalado. Instalando...${NC}"
    
    # Instalación de Docker
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Iniciar y habilitar Docker
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}✅ Docker instalado correctamente${NC}"
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo -e "${RED}⛔ Docker Compose no está instalado. Instalando...${NC}"
    
    # Instalar Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker Compose instalado correctamente${NC}"
fi

# Determinar el comando de Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}⛔ No se pudo determinar el comando de Docker Compose${NC}"
    exit 1
fi

# Crear directorios necesarios
echo -e "${BLUE}🔍 Creando directorios necesarios...${NC}"
mkdir -p ./nginx/certbot/conf
mkdir -p ./nginx/certbot/www
mkdir -p ./data/postgres
mkdir -p ./logs
mkdir -p ./uploads

# Asegurarse de que los permisos son correctos
echo -e "${BLUE}🔧 Configurando permisos...${NC}"
chown -R 1000:1000 ./logs ./uploads

# Verificar si el archivo .env.prod existe
if [ ! -f .env.prod ]; then
    echo -e "${RED}⛔ No se encontró el archivo .env.prod${NC}"
    exit 1
fi

# Detener contenedores existentes
echo -e "${BLUE}🛑 Deteniendo contenedores existentes...${NC}"
$DOCKER_COMPOSE -f docker-compose-prod.yml down

# Crear volúmenes
echo -e "${BLUE}📦 Creando volúmenes Docker...${NC}"
docker volume create portfolio_postgres_data
docker volume create portfolio_nginx_logs
docker volume create portfolio_app_logs
docker volume create portfolio_app_uploads

# Construir y levantar contenedores
echo -e "${BLUE}🚀 Iniciando contenedores de producción...${NC}"
$DOCKER_COMPOSE -f docker-compose-prod.yml up -d --build

# Esperar a que los contenedores estén listos
echo -e "${BLUE}⏳ Esperando a que los contenedores estén listos...${NC}"
sleep 20

# Verificar estado
echo -e "${BLUE}📊 Verificando estado...${NC}"
$DOCKER_COMPOSE -f docker-compose-prod.yml ps

# Instrucciones para configurar Let's Encrypt
echo -e "${YELLOW}
============================================================
INSTRUCCIONES PARA CONFIGURAR SSL CON LET'S ENCRYPT
============================================================
1. Necesitas configurar certificados SSL una vez que el servidor esté en línea.
2. Para obtener los certificados, ejecuta:

   $DOCKER_COMPOSE -f docker-compose-prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d circuitprompt.com.ar -d www.circuitprompt.com.ar

3. Sigue las instrucciones en pantalla para completar el proceso.
4. Reinicia Nginx después de obtener los certificados:

   $DOCKER_COMPOSE -f docker-compose-prod.yml exec nginx nginx -s reload

5. Let's Encrypt renovará automáticamente tus certificados.
============================================================
${NC}"

echo -e "${GREEN}✅ ¡Despliegue completado! Tu aplicación debería estar accesible en https://circuitprompt.com.ar${NC}"
echo -e "${BLUE}📊 Logs: $DOCKER_COMPOSE -f docker-compose-prod.yml logs -f${NC}" 
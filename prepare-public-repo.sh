#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}   PREPARACIÓN DE VERSIÓN PÚBLICA DEL REPOSITORIO  ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Verificar si se proporcionó un nombre de repositorio
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes proporcionar un nombre para el repositorio público${NC}"
    echo -e "${YELLOW}Uso: ./prepare-public-repo.sh nombre-repositorio-publico${NC}"
    exit 1
fi

REPO_NAME=$1
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
PUBLIC_REPO_PATH="$PARENT_DIR/$REPO_NAME"

echo -e "${YELLOW}Este script creará una versión pública de tu repositorio en:${NC}"
echo -e "${BLUE}$PUBLIC_REPO_PATH${NC}"
echo -e "${YELLOW}¿Deseas continuar? (s/n)${NC}"
read -r CONFIRM

if [[ $CONFIRM != "s" && $CONFIRM != "S" ]]; then
    echo -e "${RED}Operación cancelada.${NC}"
    exit 0
fi

# Crear una copia del repositorio
echo -e "${BLUE}Creando copia del repositorio...${NC}"
mkdir -p "$PUBLIC_REPO_PATH"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' "$CURRENT_DIR/" "$PUBLIC_REPO_PATH/"

# Entrar al directorio del nuevo repositorio
cd "$PUBLIC_REPO_PATH" || { echo -e "${RED}Error al acceder al directorio público${NC}"; exit 1; }

# Restaurar el .gitignore original para excluir archivos sensibles
echo -e "${BLUE}Restaurando .gitignore original...${NC}"
cat > .gitignore << EOF
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencias
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Producción
/dist
/dist-ssr
/build

# Variables de entorno (excepto ejemplos)
.env
.env.*
!.env.example
!.env.template

# Archivos temporales
*.local
.temp
.cache

# Editor directories y archivos
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Uploads
/uploads/*
!/uploads/.gitkeep

# Certificados y claves
*.pem
*.key
*.crt

# Docker
.docker/data
/nginx/certbot/conf/*
/nginx/certbot/www/*

# Otros
.eslintcache
.netlify
EOF

# Eliminar archivos sensibles
echo -e "${BLUE}Eliminando archivos sensibles...${NC}"
rm -f .env .env.* secrets/* 2>/dev/null || true
rm -rf .wwebjs_auth/ .wwebjs_cache/ 2>/dev/null || true

# Crear archivo .env.example si no existe
if [ ! -f .env.example ]; then
    echo -e "${BLUE}Creando archivo .env.example...${NC}"
    cp "$CURRENT_DIR/.env.example" .env.example 2>/dev/null || 
    echo "# Variables de entorno de ejemplo (completar con tus propias claves)" > .env.example
fi

# Inicializar nuevo repositorio Git
echo -e "${BLUE}Inicializando repositorio Git...${NC}"
git init
git add .
git commit -m "Versión pública inicial"

echo -e "${GREEN}¡Terminado! Repositorio público creado en: ${BLUE}$PUBLIC_REPO_PATH${NC}"
echo -e "${YELLOW}Para subir a GitHub, ejecuta los siguientes comandos:${NC}"
echo -e "${BLUE}cd $PUBLIC_REPO_PATH${NC}"
echo -e "${BLUE}git remote add origin https://github.com/TU_USUARIO/$REPO_NAME.git${NC}"
echo -e "${BLUE}git push -u origin main${NC}"

echo -e "${YELLOW}Nota: Reemplaza 'TU_USUARIO' por tu nombre de usuario de GitHub${NC}" 
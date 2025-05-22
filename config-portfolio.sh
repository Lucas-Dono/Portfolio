#!/bin/bash

# Colores para los mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
function print_header() {
    echo -e "\n${MAGENTA}===================================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}===================================================${NC}\n"
}

print_header "CONFIGURADOR DE PORTFOLIO - CIRCUITPROMPT"

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js no está instalado. Por favor, instálalo primero.${NC}"
    exit 1
fi

# Verificar que el archivo verifyConfig.js exista
if [ ! -f "verifyConfig.js" ]; then
    echo -e "${RED}[ERROR] No se encontró el archivo verifyConfig.js${NC}"
    exit 1
fi

# Hacer ejecutable el script si no lo es
if [ ! -x "verifyConfig.js" ]; then
    chmod +x verifyConfig.js
    echo -e "${BLUE}[INFO] Permisos de ejecución otorgados a verifyConfig.js${NC}"
fi

# Instalar dependencias necesarias si no existen
echo -e "${BLUE}[INFO] Verificando dependencias necesarias...${NC}"
PACKAGES_TO_CHECK=("node-fetch" "dotenv")
PACKAGES_TO_INSTALL=()

for package in "${PACKAGES_TO_CHECK[@]}"; do
    if ! grep -q "\"$package\"" package.json; then
        PACKAGES_TO_INSTALL+=("$package")
    fi
done

if [ ${#PACKAGES_TO_INSTALL[@]} -gt 0 ]; then
    echo -e "${YELLOW}[AVISO] Se instalarán las siguientes dependencias: ${PACKAGES_TO_INSTALL[*]}${NC}"
    npm install --save "${PACKAGES_TO_INSTALL[@]}"
fi

# Ejecutar el script de configuración
echo -e "${GREEN}[ÉXITO] Todo listo para configurar tu aplicación${NC}"
node verifyConfig.js

# Verificar si la ejecución fue exitosa
if [ $? -eq 0 ]; then
    print_header "CONFIGURACIÓN COMPLETADA"
    echo -e "${GREEN}[ÉXITO] Tu aplicación ha sido configurada correctamente${NC}"
    echo -e "${BLUE}[INFO] Para desplegar en producción, usa: ./donweb-deploy.sh${NC}"
    echo -e "${BLUE}[INFO] Para desarrollo local, usa: npm run dev${NC}"
else
    print_header "ERROR EN LA CONFIGURACIÓN"
    echo -e "${RED}[ERROR] Hubo un problema durante la configuración${NC}"
    echo -e "${YELLOW}[SUGERENCIA] Revisa los mensajes de error e intenta nuevamente${NC}"
fi 
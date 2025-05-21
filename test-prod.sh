#!/bin/bash

# Script para probar el entorno de producción localmente
# Uso: chmod +x test-prod.sh && ./test-prod.sh

# Colores para mejor visualización
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando prueba de entorno de producción para CircuitPrompt${NC}"

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor, instálalo primero.${NC}"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ No se encontraron archivos server.js o package.json. Asegúrate de estar en el directorio del proyecto.${NC}"
    exit 1
fi

# Crear archivo .env.test-prod si no existe
if [ ! -f ".env.test-prod" ]; then
    echo -e "${YELLOW}⚠️ Creando archivo .env.test-prod para pruebas...${NC}"
    cp .env.prod .env.test-prod
    echo "# Configuración modificada para pruebas locales" >> .env.test-prod
    echo "PORT=5001" >> .env.test-prod
    echo "NODE_ENV=production" >> .env.test-prod
    echo "WHATSAPP_DISABLE_WEB=false" >> .env.test-prod
    echo "WHATSAPP_DATA_PATH=./.wwebjs_auth" >> .env.test-prod
fi

# Asegurarse que el puerto esté disponible
echo -e "${BLUE}🔍 Verificando si el puerto 5001 está disponible...${NC}"
if lsof -i:5001 > /dev/null; then
    echo -e "${YELLOW}⚠️ El puerto 5001 ya está en uso. Intentando detener el proceso...${NC}"
    fuser -k 5001/tcp || true
    sleep 2
fi

# Compilar el frontend
echo -e "${BLUE}📦 Compilando el frontend...${NC}"
npm run build

# Si la compilación falló, salir
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ La compilación del frontend falló. Revisa los errores.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend compilado correctamente.${NC}"

# Verificar existencia de la carpeta dist
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ No se encontró la carpeta 'dist'. La compilación podría haber fallado.${NC}"
    exit 1
fi

# Asegurarse que todas las dependencias estén instaladas
echo -e "${BLUE}📦 Verificando dependencias...${NC}"
npm ci

# Probar la conexión a la base de datos (usando sintaxis de módulos ES)
echo -e "${BLUE}🔄 Probando conexión a la base de datos...${NC}"
cat > test-db.js << 'EOF'
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Configurar entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: '.env.test-prod' });

// Importar el módulo de DB
import connectDB from './config/database.js';

// Probar conexión
try {
  const db = await connectDB();
  if (db) {
    console.log('✅ Conexión a BD exitosa');
    process.exit(0);
  } else {
    console.error('❌ Error de conexión: No se obtuvo instancia de BD');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error de conexión:', err);
  process.exit(1);
}
EOF

NODE_ENV=production node test-db.js
DB_RESULT=$?
rm test-db.js

if [ $DB_RESULT -ne 0 ]; then
    echo -e "${YELLOW}⚠️ La conexión a la base de datos falló. El servidor funcionará, pero algunas características podrían no estar disponibles.${NC}"
    # Aquí podrías agregar lógica para usar SQLite o fallback a JSON
else
    echo -e "${GREEN}✅ Conexión a la base de datos exitosa.${NC}"
fi

# Iniciar el servidor en modo producción
echo -e "${BLUE}🚀 Iniciando servidor en modo producción en el puerto 5001...${NC}"
echo -e "${YELLOW}⚠️ Presiona Ctrl+C para detener el servidor cuando hayas terminado las pruebas.${NC}"

# Ejecutar con variables de entorno de producción, forzando puerto 5001
export PORT=5001
NODE_ENV=production node server.js 
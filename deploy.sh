#!/bin/bash

# Script para desplegar en el servidor de Donweb con CloudPanel

# Generar build de producción 
echo "🔨 Generando build de producción..."
npm run build

# Empaquetar archivos para transferir
echo "📦 Empaquetando archivos para transferir..."
tar -czf deploy-package.tar.gz dist server.js .env.prod node_modules package.json process.json

# Transferir al servidor
echo "📤 Transfiriendo archivos al servidor..."
scp deploy-package.tar.gz circuitprompt@circuitprompt.com.ar:/home/circuitprompt/

# Conectar al servidor para desplegar
echo "🚀 Conectando al servidor para desplegar..."
ssh circuitprompt@circuitprompt.com.ar << 'ENDSSH'
  cd /home/circuitprompt
  
  # Descomprimir paquete
  echo "📂 Descomprimiendo paquete..."
  tar -xzf deploy-package.tar.gz
  
  # Mover archivos a la carpeta de la aplicación
  echo "🔄 Moviendo archivos a la carpeta de la aplicación..."
  
  # Crear el directorio de la aplicación si no existe
  mkdir -p /home/circuitprompt/portfolio
  
  # Mover los archivos al directorio de la aplicación
  cp -r dist /home/circuitprompt/portfolio/
  cp server.js /home/circuitprompt/portfolio/
  cp .env.prod /home/circuitprompt/portfolio/.env
  cp -r node_modules /home/circuitprompt/portfolio/
  cp package.json /home/circuitprompt/portfolio/
  cp process.json /home/circuitprompt/portfolio/
  
  # Entrar en el directorio de la aplicación
  cd /home/circuitprompt/portfolio
  
  # Verificar si PM2 está instalado, instalarlo si no lo está
  if ! command -v pm2 &> /dev/null; then
    echo "🔧 Instalando PM2..."
    npm install -g pm2
  fi
  
  # Detener la aplicación existente si está corriendo
  echo "🛑 Deteniendo aplicación existente si está corriendo..."
  pm2 stop portfolio || true
  
  # Iniciar la aplicación con PM2
  echo "🚀 Iniciando aplicación con PM2..."
  NODE_ENV=production pm2 start process.json
  
  # Guardar la configuración de PM2
  pm2 save
  
  # Limpiar archivos temporales
  echo "🧹 Limpiando archivos temporales..."
  cd /home/circuitprompt
  rm deploy-package.tar.gz
  
  echo "✅ Despliegue completado!"
ENDSSH

# Eliminar el paquete local
echo "🧹 Limpiando archivos temporales locales..."
rm deploy-package.tar.gz

echo "✅ Proceso de despliegue completado!" 
#!/bin/bash

# Script de despliegue para CircuitPrompt
# Para ejecutar: chmod +x deploy.sh && ./deploy.sh

set -e  # Detener script si hay algún error

echo "🚀 Iniciando despliegue de CircuitPrompt..."

# Verificar si estamos en producción
if [ "$NODE_ENV" != "production" ]; then
  echo "⚙️ Configurando entorno de producción..."
  export NODE_ENV=production
fi

# Verificar Node.js
node_version=$(node -v)
echo "📋 Usando Node.js $node_version"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --only=production

# Construir la aplicación
echo "🏗️ Construyendo la aplicación..."
npm run build

# Verificar que el build se haya generado correctamente
if [ ! -d "./dist" ]; then
  echo "❌ Error: No se encontró la carpeta 'dist'. La compilación ha fallado."
  exit 1
fi

# Instalar PM2 si no está instalado
if ! command -v pm2 &> /dev/null; then
  echo "📦 Instalando PM2..."
  npm install -g pm2
fi

# Verificar si la aplicación ya está en PM2
if pm2 list | grep -q "circuitprompt"; then
  echo "🔄 Reiniciando aplicación en PM2..."
  pm2 restart circuitprompt
else
  echo "🚀 Iniciando aplicación con PM2..."
  pm2 start server.js --name circuitprompt
fi

# Guardar configuración de PM2
echo "💾 Guardando configuración de PM2..."
pm2 save

# Imprimir estado
echo "✅ Despliegue completado. La aplicación está en ejecución."
echo "🌐 La aplicación debería estar accesible en https://circuitprompt.com.ar"
echo ""
echo "📊 Estado de PM2:"
pm2 status

echo ""
echo "🔍 Para ver logs: pm2 logs circuitprompt"
echo "🔄 Para reiniciar: pm2 restart circuitprompt"
echo "🛑 Para detener: pm2 stop circuitprompt" 
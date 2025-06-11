#!/bin/bash

echo "🚀 Iniciando desarrollo rápido sin Docker..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar si PostgreSQL está corriendo
if command -v psql &> /dev/null; then
    if ! pgrep -x "postgres" > /dev/null; then
        echo "⚠️  PostgreSQL no está corriendo. Por favor inicia PostgreSQL:"
        echo "   sudo systemctl start postgresql"
        echo "   o"
        echo "   sudo service postgresql start"
    else
        echo "✅ PostgreSQL está corriendo"
    fi
else
    echo "⚠️  PostgreSQL no está instalado. El proyecto funcionará en modo sin base de datos."
fi

echo "🔧 Configurando variables de entorno..."

# Crear directorio de datos si no existe
mkdir -p data

# Verificar que el archivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Creando uno básico..."
    cat > .env << EOF
NODE_ENV=development
PORT=5001

# Base de datos PostgreSQL
DB_NAME=portfolio
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
DB_DIALECT=postgres

# Desactivar MongoDB completamente
DISABLE_MONGODB=true

# JWT
JWT_SECRET=tu_jwt_secret_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_mercadopago_token

# Frontend
VITE_API_URL=http://localhost:5001/api
EOF
fi

echo "🌐 Iniciando servicios..."

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Configurar trap para limpiar al salir
trap cleanup SIGINT SIGTERM

# Iniciar backend en segundo plano
echo "🔧 Iniciando backend en puerto 5001..."
node server.js &
BACKEND_PID=$!

# Esperar un momento para que el backend se inicie
sleep 3

# Iniciar frontend en segundo plano
echo "🎨 Iniciando frontend en puerto 5173..."
npm run dev:frontend &
FRONTEND_PID=$!

echo "✅ Servicios iniciados:"
echo "   - Backend: http://localhost:5001"
echo "   - Frontend: http://localhost:5173"
echo "   - API: http://localhost:5001/api"
echo ""
echo "📝 Logs en tiempo real:"
echo "   - Presiona Ctrl+C para detener todos los servicios"
echo ""

# Esperar a que los procesos terminen
wait $BACKEND_PID $FRONTEND_PID 
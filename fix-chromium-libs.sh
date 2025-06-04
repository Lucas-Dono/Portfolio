#!/bin/bash

echo "🔧 Instalando bibliotecas necesarias para Chromium..."

# Verificar el sistema operativo
if command -v apt-get &> /dev/null; then
    # Debian/Ubuntu
    echo "📦 Instalando dependencias en sistema Debian/Ubuntu"
    sudo apt-get update
    sudo apt-get install -y \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libxtst6 \
        libbrotli1
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    echo "📦 Instalando dependencias en sistema CentOS/RHEL"
    sudo yum install -y \
        nss \
        atk \
        atk-bridge \
        cups-libs \
        libdrm \
        libxkbcommon \
        libXcomposite \
        libXdamage \
        libXfixes \
        libXrandr \
        mesa-libgbm \
        alsa-lib \
        pango \
        cairo \
        libXtst \
        brotli
fi

echo "🔄 Verificando rutas de Chromium..."
CHROMIUM_PATH=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo "")

if [ -z "$CHROMIUM_PATH" ]; then
    echo "⚠️ No se encontró una instalación de Chromium. Intentando instalar..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y chromium-browser
    elif command -v yum &> /dev/null; then
        sudo yum install -y chromium
    fi
    
    CHROMIUM_PATH=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo "")
    
    if [ -z "$CHROMIUM_PATH" ]; then
        echo "❌ No se pudo instalar Chromium automáticamente."
        exit 1
    fi
fi

echo "✅ Chromium encontrado en: $CHROMIUM_PATH"

# Crear archivo de entorno para PM2
echo "📝 Creando archivo de entorno para PM2..."
cat > .env.whatsapp << EOF
PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH
EOF

# Verificar si existe la carpeta server
if [ ! -d "server" ]; then
    echo "📁 Creando directorio server..."
    mkdir -p server
fi

echo "📝 Creando archivo de configuración para WhatsApp..."
cat > server/whatsapp-config.js << EOF
// Configuración para WhatsApp Web.js
export const puppeteerOptions = {
    executablePath: '$CHROMIUM_PATH',
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-extensions'
    ]
};

export default { puppeteerOptions };
EOF

# Crear un script de prueba definitivo usando módulos ES
echo "🧪 Creando script de prueba con la configuración correcta..."

cat > test-whatsapp-final.mjs << EOF
// Importar correctamente un módulo CommonJS en un entorno ESM
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import path from 'path';
import { fileURLToPath } from 'url';
import { puppeteerOptions } from './server/whatsapp-config.js';

// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Iniciando cliente de WhatsApp Web...');
console.log('📂 Ruta de Chromium:', puppeteerOptions.executablePath);
console.log('📂 Ruta de almacenamiento:', path.join(__dirname, '.wwebjs_auth'));

// Crear cliente con configuración personalizada
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "test-whatsapp",
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: puppeteerOptions
});

// Manejar eventos
client.on('qr', (qr) => {
    console.log('✅ Código QR generado:');
    console.log(qr);
    console.log('🎉 WhatsApp Web funciona correctamente.');
    setTimeout(() => process.exit(0), 1000);
});

client.on('auth_failure', (error) => {
    console.error('❌ Error de autenticación:', error);
    process.exit(1);
});

client.on('disconnected', (reason) => {
    console.error('❌ Desconexión:', reason);
    process.exit(1);
});

// Inicializar con timeout
const timeout = setTimeout(() => {
    console.error('❌ Timeout al inicializar WhatsApp Web');
    process.exit(1);
}, 30000);

client.initialize()
    .catch(error => {
        console.error('❌ Error al inicializar WhatsApp Web:', error);
        clearTimeout(timeout);
        process.exit(1);
    });
EOF

# Ejecutar el script de prueba (usando .mjs para módulos ES)
echo "🚀 Probando WhatsApp Web con la nueva configuración..."
node test-whatsapp-final.mjs

if [ $? -eq 0 ]; then
    echo "✅ Configuración de WhatsApp Web exitosa"
    
    # Actualizar .env con WHATSAPP_DISABLE_WEB=false
    if grep -q "WHATSAPP_DISABLE_WEB" .env; then
        # Reemplazar la línea existente
        sed -i 's/WHATSAPP_DISABLE_WEB=.*/WHATSAPP_DISABLE_WEB=false/' .env
        echo "✅ Actualizado .env con WHATSAPP_DISABLE_WEB=false"
    else
        # Añadir la línea si no existe
        echo "WHATSAPP_DISABLE_WEB=false" >> .env
        echo "✅ Añadido WHATSAPP_DISABLE_WEB=false a .env"
    fi
    
    # Instrucciones para reiniciar el servicio
    echo "
📋 INSTRUCCIONES PARA REINICIAR EL SERVICIO:
1. Ejecuta: node server.js
2. Accede a /admin/qr para escanear el código QR
"
else
    echo "❌ Todavía hay problemas con WhatsApp Web."
    echo "
📋 PROBLEMAS COMUNES Y SOLUCIONES:

1. PROBLEMA DE PUPPETEER: Comprueba que Puppeteer puede usar el navegador
   export PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH
   npx puppeteer-test

2. PROBLEMA DE PERMISOS: Comprueba que tienes permisos en el navegador
   ls -la $CHROMIUM_PATH

3. INTENTA LA SOLUCIÓN NO-SANDBOX (último recurso):
   Modifica server/whatsapp-config.js para añadir '--no-sandbox' a los argumentos
"
    exit 1
fi 
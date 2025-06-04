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

echo "📝 Creando archivo de configuración para WhatsApp..."
cat > server/whatsapp-config.js << EOF
// Configuración para WhatsApp Web.js
module.exports = {
    puppeteerOptions: {
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
    }
};
EOF

# Crear un script de prueba definitivo
echo "🧪 Creando script de prueba con la configuración correcta..."

cat > test-whatsapp-final.js << EOF
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

// Cargar configuración personalizada
const whatsappConfig = require('./server/whatsapp-config');

console.log('🔍 Iniciando cliente de WhatsApp Web...');
console.log('📂 Ruta de Chromium:', whatsappConfig.puppeteerOptions.executablePath);
console.log('📂 Ruta de almacenamiento:', path.join(__dirname, '.wwebjs_auth'));

// Crear cliente con configuración personalizada
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "test-whatsapp",
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: whatsappConfig.puppeteerOptions
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

# Modificar server.js para usar la configuración
echo "🔧 Verificando si necesitamos modificar server.js..."

# Ejecutar el script de prueba
echo "🚀 Probando WhatsApp Web con la nueva configuración..."
node test-whatsapp-final.js

if [ $? -eq 0 ]; then
    echo "✅ Configuración de WhatsApp Web exitosa"
    
    # Instrucciones para reiniciar con la nueva configuración
    echo "
📋 INSTRUCCIONES PARA REINICIAR EL SERVICIO CON LA NUEVA CONFIGURACIÓN:
1. Ejecuta: pm2 restart circuitprompt --env-path=.env.whatsapp
2. Verifica el log: pm2 logs circuitprompt
3. Accede a /admin/qr para escanear el código QR
"
else
    echo "❌ Todavía hay problemas con WhatsApp Web."
    echo "
📋 INTENTA EJECUTAR ESTOS COMANDOS ADICIONALES:

# Verificar si hay errores de instalación de Chromium
ldd $CHROMIUM_PATH | grep 'not found'

# Verificar permisos
ls -la $CHROMIUM_PATH

# Ejecutar en modo no-sandbox (como último recurso)
export PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH
node -e \"
const puppeteer = require('puppeteer-core');
(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: '$CHROMIUM_PATH',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Navegador iniciado correctamente');
    await browser.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
})()
\"
"
    exit 1
fi 
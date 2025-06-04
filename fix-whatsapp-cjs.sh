#!/bin/bash

echo "🔧 Solucionando problemas de WhatsApp Web (versión CommonJS)..."

# Crear directorio para almacenar la sesión si no existe
mkdir -p .wwebjs_auth
chmod 755 .wwebjs_auth

# Reiniciar dependencias
echo "🔄 Reinstalando dependencias de WhatsApp Web..."

# Usar versiones específicas que funcionan bien juntas
npm uninstall whatsapp-web.js puppeteer puppeteer-core --force
npm install whatsapp-web.js@latest puppeteer@22.8.2 puppeteer-core@22.8.2 --force

# Crear un script de prueba para verificar la configuración
echo "🧪 Creando script de prueba para WhatsApp Web (CommonJS)..."

cat > test-whatsapp.cjs << 'EOF'
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

console.log('🔍 Iniciando cliente de WhatsApp Web...');
console.log('📂 Ruta de almacenamiento:', path.join(__dirname, '.wwebjs_auth'));

// Crear cliente con configuración mínima
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "test-whatsapp",
    dataPath: path.join(__dirname, '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

// Evento de código QR (sólo mostrar mensaje)
client.on('qr', () => {
  console.log('✅ Generación de QR exitosa!');
  console.log('🎉 WhatsApp Web funciona correctamente.');
  process.exit(0);
});

// Manejar errores
client.on('auth_failure', (error) => {
  console.error('❌ Error de autenticación:', error);
  process.exit(1);
});

client.on('disconnected', (reason) => {
  console.error('❌ Desconexión:', reason);
  process.exit(1);
});

// Inicializar con timeout de 30 segundos
const timeout = setTimeout(() => {
  console.error('❌ Timeout al inicializar WhatsApp Web');
  process.exit(1);
}, 30000);

client.initialize().catch(error => {
  console.error('❌ Error al inicializar WhatsApp Web:', error);
  clearTimeout(timeout);
  process.exit(1);
});
EOF

# Ejecutar el script de prueba
echo "🚀 Probando WhatsApp Web..."
node test-whatsapp.cjs

if [ $? -eq 0 ]; then
  echo "✅ Configuración de WhatsApp Web exitosa"
  echo "📱 Puedes reiniciar el servidor y acceder a /admin/qr para generar el código QR"
  
  # Limpiar archivo de prueba
  rm test-whatsapp.cjs
else
  echo "❌ Hubo problemas con WhatsApp Web. Verificando la ruta de Chromium..."
  
  # Intentar identificar y solucionar problemas de Chromium
  echo "🔍 Buscando rutas de Chromium..."
  which chromium-browser
  which chromium
  which google-chrome
  which chrome
  
  echo "📦 Verificando puppeteer..."
  node -e "console.log(require('puppeteer-core')._preferredRevision)"
  
  echo "🛠️ Intentando instalar Chromium manualmente..."
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer@22.8.2 puppeteer-core@22.8.2 --force
  node -e "require('puppeteer').executablePath()"
  
  echo "❌ Por favor, revisa los logs y ejecuta los comandos necesarios para instalar Chromium en tu sistema."
  rm test-whatsapp.cjs
  exit 1
fi

# Instrucciones finales
echo "
📋 INSTRUCCIONES PARA REINICIAR EL SERVICIO:
1. Ejecuta: pm2 restart circuitprompt
2. Verifica el log: pm2 logs circuitprompt
3. Accede a /admin/qr para escanear el código QR
" 
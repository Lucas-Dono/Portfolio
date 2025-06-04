#!/bin/bash

echo "🔧 Solucionando problemas de WhatsApp Web..."

# Crear directorio para almacenar la sesión si no existe
mkdir -p .wwebjs_auth
chmod 755 .wwebjs_auth

# Reiniciar dependencias
echo "🔄 Reinstalando dependencias de WhatsApp Web..."

# Usar versiones específicas que funcionan bien juntas
npm uninstall whatsapp-web.js puppeteer puppeteer-core --force
npm install whatsapp-web.js@latest puppeteer@22.8.2 --force

# Crear un script de prueba para verificar la configuración
echo "🧪 Creando script de prueba para WhatsApp Web..."

cat > test-whatsapp.mjs << 'EOF'
import { Client, LocalAuth } from 'whatsapp-web.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Iniciando cliente de WhatsApp Web...');
console.log('📂 Ruta de almacenamiento:', join(__dirname, '.wwebjs_auth'));

// Crear cliente con configuración mínima
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "test-whatsapp",
    dataPath: join(__dirname, '.wwebjs_auth')
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
node test-whatsapp.mjs

if [ $? -eq 0 ]; then
  echo "✅ Configuración de WhatsApp Web exitosa"
  echo "📱 Puedes reiniciar el servidor y acceder a /admin/qr para generar el código QR"
  
  # Limpiar archivo de prueba
  rm test-whatsapp.mjs
else
  echo "❌ Hubo problemas con WhatsApp Web. Verifica si necesitas instalar dependencias adicionales."
  rm test-whatsapp.mjs
  exit 1
fi

# Instrucciones finales
echo "
📋 INSTRUCCIONES PARA REINICIAR EL SERVICIO:
1. Ejecuta: pm2 restart circuitprompt
2. Verifica el log: pm2 logs circuitprompt
3. Accede a /admin/qr para escanear el código QR
" 
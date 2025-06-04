#!/bin/bash

echo "🔧 Solucionando WhatsApp Web en el servidor..."

# Asegurarnos que el directorio server existe
mkdir -p server

# Crear archivo de configuración para WhatsApp
echo "📝 Creando configuración de WhatsApp para servidor..."
cat > server/whatsapp-config.js << EOF
// Configuración para WhatsApp Web.js en servidor
export const puppeteerOptions = {
    // Usar el navegador del sistema
    executablePath: '/usr/bin/chromium-browser',
    // Modo headless con nueva sintaxis
    headless: 'new',
    // Argumentos críticos para entornos restrictivos
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--single-process',
        '--window-size=800,600',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--remote-debugging-port=0'
    ]
};

export default { puppeteerOptions };
EOF

# Modificar .env para deshabilitar temporalmente WhatsApp Web
echo "🔄 Actualizando configuración en .env..."
if grep -q "WHATSAPP_DISABLE_WEB" .env; then
    # Backup del archivo original
    cp .env .env.backup
    # Deshabilitar WhatsApp Web temporalmente
    sed -i 's/WHATSAPP_DISABLE_WEB=.*/WHATSAPP_DISABLE_WEB=true/' .env
    echo "✅ WhatsApp Web deshabilitado temporalmente en .env"
else
    # Añadir la configuración si no existe
    echo "WHATSAPP_DISABLE_WEB=true" >> .env
    echo "✅ Añadido WHATSAPP_DISABLE_WEB=true a .env"
fi

# Crear un script simple para probar Puppeteer directamente
echo "📝 Creando script de diagnóstico de Puppeteer..."
cat > test-puppeteer-server.mjs << EOF
// Script para probar Puppeteer en el servidor
import puppeteer from 'puppeteer-core';

console.log('🔍 Iniciando test de Puppeteer en el servidor...');

// Configuración robusta para entornos restrictivos
const puppeteerOptions = {
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--single-process',
        '--window-size=800,600',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--remote-debugging-port=0'
    ]
};

(async () => {
    try {
        console.log('🚀 Iniciando navegador con configuración robusta...');
        const browser = await puppeteer.launch(puppeteerOptions);
        
        console.log('✅ Navegador iniciado correctamente');
        console.log('📊 Versión del navegador:', await browser.version());
        
        console.log('🔍 Abriendo nueva página...');
        const page = await browser.newPage();
        
        console.log('🌐 Navegando a google.com...');
        await page.goto('https://www.google.com');
        
        console.log('📝 Obteniendo título de la página...');
        const title = await page.title();
        console.log('📄 Título:', title);
        
        console.log('🔄 Cerrando navegador...');
        await browser.close();
        
        console.log('✅ Test completado exitosamente - Puppeteer funciona correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error durante el test de Puppeteer:', error);
        return false;
    }
})();
EOF

echo "📋 INSTRUCCIONES PARA EL SERVIDOR:

1. EJECUTA EL TEST DE DIAGNÓSTICO:
   node test-puppeteer-server.mjs
   
2. SI EL TEST FUNCIONA:
   a) Edita .env y cambia WHATSAPP_DISABLE_WEB=false
   b) Reinicia el servidor con: node server.js
   c) Accede a /admin/qr para escanear el código QR

3. SI EL TEST FALLA:
   a) Instala los paquetes necesarios:
      sudo apt-get update
      sudo apt-get install -y chromium-browser gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
   b) Verifica la ruta de Chromium: which chromium-browser
   c) Actualiza la ruta en server/whatsapp-config.js si es necesario
"

echo "✅ Script completado. Sigue las instrucciones para el servidor." 
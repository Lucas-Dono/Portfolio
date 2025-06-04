#!/bin/bash

echo "🔧 Configurando WhatsApp Web para el servidor..."

# Instalar dependencias del sistema para Puppeteer/Chromium
echo "📦 Instalando dependencias del sistema..."

# Para Ubuntu/Debian
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libasound2t64 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc-s1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils

# Para CentOS/RHEL/Fedora
elif command -v yum &> /dev/null; then
    sudo yum update -y
    sudo yum install -y \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        ipa-gothic-fonts \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils

elif command -v dnf &> /dev/null; then
    sudo dnf update -y
    sudo dnf install -y \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        ipa-gothic-fonts \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils
fi

echo "🔄 Reinstalando dependencias de Node.js..."

# Reinstalar whatsapp-web.js y puppeteer
npm uninstall whatsapp-web.js puppeteer-core --force
npm install whatsapp-web.js@latest --force

echo "🎯 Configurando Puppeteer..."

# Instalar Chromium para Puppeteer
npx puppeteer browsers install chrome

echo "🧪 Probando configuración..."

# Crear script de prueba como .mjs para compatibilidad con ESM
cat > test-puppeteer.mjs << 'EOF'
import puppeteer from 'puppeteer-core';

(async () => {
  try {
    console.log('🔍 Buscando Chromium...');
    
    // Intentar encontrar Chromium
    const browser = await puppeteer.launch({
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
    });
    
    console.log('✅ Puppeteer funciona correctamente');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error con Puppeteer:', error.message);
    process.exit(1);
  }
})();
EOF

# Ejecutar prueba
node test-puppeteer.mjs

if [ $? -eq 0 ]; then
    echo "🎉 WhatsApp Web configurado correctamente"
    echo "📱 Puedes reiniciar el servidor y acceder a /admin/qr para generar el código QR"
    
    # Limpiar archivo de prueba
    rm test-puppeteer.mjs
    
    # Crear directorio para sesiones si no existe
    mkdir -p .wwebjs_auth
    chmod 755 .wwebjs_auth
    
    echo "📁 Directorio de sesiones creado en .wwebjs_auth"
else
    echo "❌ Hubo problemas con la configuración. Revisa los logs arriba."
    rm test-puppeteer.mjs
    exit 1
fi 
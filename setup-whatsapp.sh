#!/bin/bash

# Script para configurar WhatsApp Web JS en el servidor
echo "🚀 Instalando dependencias para WhatsApp Web JS..."

# Instalar dependencias necesarias para Puppeteer/Chromium
apt-get update
apt-get install -y \
    gconf-service \
    libgbm-dev \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
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
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

# Crear directorio para la sesión de WhatsApp
mkdir -p /home/circuitprompt/htdocs/circuitprompt.com.ar/.wwebjs_auth
chmod 755 /home/circuitprompt/htdocs/circuitprompt.com.ar/.wwebjs_auth

echo "✅ Dependencias instaladas correctamente"
echo "📱 Ahora puedes iniciar la aplicación y acceder a /admin/qr para escanear el código QR" 
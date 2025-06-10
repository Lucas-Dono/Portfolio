FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    docker-cli

# Instalar dependencias globales
RUN npm install -g concurrently

# Copiar archivos de configuración primero para aprovechar la caché de Docker
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias con --legacy-peer-deps para resolver conflictos
RUN npm install --legacy-peer-deps

# Crear estructura de directorios necesaria
RUN mkdir -p backend/middleware backend/routes backend/controllers backend/models

# Copiar el código fuente
COPY . .

# Asegurar permisos correctos
RUN chown -R node:node /app

# Cambiar al usuario node para mejor seguridad
USER node

# Exponer puertos (frontend y backend)
EXPOSE 3001
EXPOSE 5001

# Configurar variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Comando para iniciar la aplicación
CMD ["npm", "run", "dev"] 
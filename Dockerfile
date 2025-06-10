FROM node:20-alpine

WORKDIR /app

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
EXPOSE 3000
EXPOSE 5001

# Comando para iniciar la aplicación
CMD ["npm", "run", "dev"] 
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias globales
RUN npm install -g concurrently

# Copiar archivos de configuración primero para aprovechar la caché de Docker
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias con --legacy-peer-deps para resolver conflictos
RUN npm install --legacy-peer-deps

# Crear estructura de directorios
RUN mkdir -p backend/middleware backend/routes backend/controllers backend/models

# Copiar el código fuente manteniendo la estructura
COPY backend/middleware ./backend/middleware
COPY backend/routes ./backend/routes
COPY backend/controllers ./backend/controllers
COPY backend/models ./backend/models
COPY backend/server.js ./backend/
COPY backend/.env ./backend/

# Exponer puertos (frontend y backend)
EXPOSE 3000
EXPOSE 5001

# Comando para iniciar la aplicación
CMD ["npm", "run", "dev"] 
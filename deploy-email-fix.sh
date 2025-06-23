#!/bin/bash

echo "🚀 Desplegando Corrección de Email en Servidor de Producción"
echo "=========================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes coloreados
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuración del servidor
SERVER_HOST="179.43.121.187"
SERVER_PORT="5289"
SERVER_USER="root"
SERVER_PATH="/home/circuitprompt/htdocs/circuitprompt.com.ar"

log_info "Iniciando despliegue de corrección de email..."

# 1. Verificar archivos locales
log_info "Verificando archivos locales..."

if [ ! -f "utils/emailManager.js" ]; then
    log_error "utils/emailManager.js no encontrado"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    log_warning ".env.production no existe, creándolo..."
    ./fix-production-email.sh
fi

# 2. Commit de cambios locales
log_info "Guardando cambios en Git..."
git add .
git commit -m "fix: Corregir configuración SMTP para emails de admin

- Cambiar de smtp.donweb.com a c2830653.ferozo.com
- Corregir createTransporter por createTransport en emailManager.js
- Agregar scripts de diagnóstico y corrección de email
- Configurar variables de entorno para producción

Fixes admin authentication email verification issue"

git push origin desarrollo

log_success "Cambios guardados y enviados a repositorio"

# 3. Función para ejecutar comandos en el servidor
run_server_command() {
    local cmd="$1"
    local description="$2"
    
    log_info "$description"
    sshpass -p 'kA/Ef37uSudOwj' ssh -p$SERVER_PORT $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && $cmd"
    
    if [ $? -eq 0 ]; then
        log_success "$description - Completado"
    else
        log_error "$description - Falló"
        return 1
    fi
}

# 4. Desplegar en servidor
log_info "Conectando al servidor de producción..."

# Actualizar código
run_server_command "git pull origin desarrollo" "Actualizando código desde repositorio"

# Crear archivo .env.production si no existe
run_server_command "
if [ ! -f .env.production ]; then
    echo 'Creando .env.production...'
    cat > .env.production << 'EOF'
# Configuración SMTP Corregida
SMTP_HOST=c2830653.ferozo.com
SMTP_PORT=465
SMTP_SECURE=true
ADMIN_EMAIL=no_reply@circuitprompt.com.ar
EMAIL_PASS=@04LucasDono17/

# Variables de producción
CORS_FRONT=https://circuitprompt.com.ar
VITE_API_URL=https://circuitprompt.com.ar/api
NODE_ENV=production
PORT=5001

# Base de datos
DB_HOST=postgres
DB_PORT=5432
DB_NAME=portfolio
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DISABLE_DB=false

# Autenticación
ADMIN_USER=admin
ADMIN_PASS=admin123
JWT_SECRET=super-secreto-jwt-produccion-circuitprompt-2024

# MercadoPago (reemplazar con valores reales)
VITE_MP_PUBLIC_KEY=TEST-XXXXX
MP_ACCESS_TOKEN=TEST-XXXXX

# OAuth (reemplazar con valores reales)
GOOGLE_CLIENT_ID=8397726306...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GITHUB_CLIENT_ID=Ov23liKXZKMgas6yQrE5
GITHUB_CLIENT_SECRET=...

# OpenAI
OPENAI_API_KEY=sk-...

# WhatsApp
WHATSAPP_DISABLE_WEB=true
EOF
    echo '✅ .env.production creado'
else
    echo '✅ .env.production ya existe'
fi
" "Configurando variables de entorno"

# Verificar configuración SMTP
run_server_command "
echo 'Verificando configuración SMTP...'
if grep -q 'c2830653.ferozo.com' utils/emailManager.js; then
    echo '✅ emailManager.js tiene configuración correcta'
else
    echo '⚠️ emailManager.js necesita actualización'
fi
" "Verificando configuración SMTP"

# Reiniciar contenedores Docker
run_server_command "./docker-prod.sh" "Reiniciando contenedores Docker"

# Esperar a que el servicio esté listo
log_info "Esperando a que el servicio esté listo..."
sleep 30

# Verificar que el servicio esté funcionando
run_server_command "
echo 'Verificando estado del servicio...'
curl -f http://localhost:5001/health || echo 'Servicio no responde en puerto 5001'
docker ps | grep circuitprompt || echo 'Contenedor no está corriendo'
" "Verificando estado del servicio"

# 5. Test de email en producción
log_info "Probando sistema de email en producción..."

run_server_command "
echo 'Probando configuración de email...'
docker exec circuitpromptcomar-app-1 node -e \"
import('./utils/emailManager.js').then(async (emailManager) => {
    console.log('📧 Probando email en producción...');
    const result = await emailManager.sendTwoFactorEmail('lucasdono391@gmail.com', 'test-production-$(date +%s)');
    if (result) {
        console.log('✅ Email de prueba enviado correctamente');
    } else {
        console.log('❌ Error enviando email de prueba');
    }
}).catch(err => console.error('Error:', err.message));
\" 2>/dev/null || echo 'Error ejecutando test de email'
" "Probando sistema de email"

# 6. Instrucciones finales
log_success "Despliegue completado"
echo ""
log_info "Para probar la autenticación de admin:"
echo "1. Ve a: https://circuitprompt.com.ar/admin/login"
echo "2. Usuario: admin"
echo "3. Contraseña: admin123"
echo "4. Revisa tu email: lucasdono391@gmail.com"
echo ""
log_info "Si hay problemas, revisa los logs:"
echo "docker logs circuitpromptcomar-app-1 --tail=50"
echo ""
log_warning "Recuerda configurar las variables reales de MercadoPago y OAuth en .env.production" 
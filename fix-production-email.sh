#!/bin/bash

echo "🔧 Arreglando Configuración de Email en Producción"
echo "=================================================="

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

# Verificar si estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    log_error "No se encontró server.js. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

log_info "Iniciando corrección de configuración de email..."

# 1. Verificar si existe .env.production
if [ ! -f ".env.production" ]; then
    log_warning ".env.production no existe, creándolo desde .env.production.example"
    
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        log_success ".env.production creado desde .env.production.example"
    else
        log_error ".env.production.example no existe. Ejecuta primero: node fix-email-config.js"
        exit 1
    fi
else
    log_info ".env.production existe, actualizando configuración SMTP..."
fi

# 2. Actualizar variables SMTP en .env.production
log_info "Actualizando variables SMTP en .env.production..."

# Backup del archivo original
cp .env.production .env.production.backup
log_info "Backup creado: .env.production.backup"

# Actualizar o agregar variables SMTP
update_env_var() {
    local key=$1
    local value=$2
    local file=".env.production"
    
    if grep -q "^${key}=" "$file"; then
        # Variable existe, actualizarla
        sed -i "s/^${key}=.*/${key}=${value}/" "$file"
        log_success "Actualizada: ${key}=${value}"
    else
        # Variable no existe, agregarla
        echo "${key}=${value}" >> "$file"
        log_success "Agregada: ${key}=${value}"
    fi
}

# Aplicar configuración SMTP correcta
update_env_var "SMTP_HOST" "c2830653.ferozo.com"
update_env_var "SMTP_PORT" "465"
update_env_var "SMTP_SECURE" "true"
update_env_var "ADMIN_EMAIL" "no_reply@circuitprompt.com.ar"
update_env_var "EMAIL_PASS" "@04LucasDono17/"

# Variables adicionales importantes
update_env_var "CORS_FRONT" "https://circuitprompt.com.ar"
update_env_var "VITE_API_URL" "https://circuitprompt.com.ar/api"
update_env_var "NODE_ENV" "production"

# 3. Verificar que emailManager.js esté actualizado
log_info "Verificando emailManager.js..."

if grep -q "c2830653.ferozo.com" "utils/emailManager.js"; then
    log_success "emailManager.js ya tiene la configuración correcta"
else
    log_warning "emailManager.js necesita actualización, ejecutando fix-email-config.js..."
    node fix-email-config.js
fi

# 4. Mostrar configuración actual
log_info "Configuración SMTP actual en .env.production:"
echo "----------------------------------------"
grep -E "^(SMTP_|ADMIN_EMAIL|EMAIL_PASS)" .env.production | while read line; do
    key=$(echo "$line" | cut -d'=' -f1)
    value=$(echo "$line" | cut -d'=' -f2-)
    
    if [[ "$key" == "EMAIL_PASS" ]]; then
        echo "$key=***CONFIGURADO***"
    else
        echo "$line"
    fi
done
echo "----------------------------------------"

# 5. Instrucciones para aplicar en servidor
log_info "Para aplicar en el servidor de producción:"
echo ""
echo "1. Subir archivos al servidor:"
echo "   scp .env.production root@179.43.121.187:/path/to/project/"
echo "   scp utils/emailManager.js root@179.43.121.187:/path/to/project/utils/"
echo ""
echo "2. O ejecutar en el servidor:"
echo "   ssh -p5289 root@179.43.121.187"
echo "   cd /path/to/project"
echo "   git pull"
echo "   ./fix-production-email.sh"
echo "   ./docker-prod.sh"
echo ""

# 6. Test de configuración local
log_info "Probando configuración local..."
if command -v node >/dev/null 2>&1; then
    node -e "
    import('./utils/emailManager.js').then(async (emailManager) => {
        console.log('✅ emailManager.js se carga correctamente');
        
        // Test básico de configuración
        const testResult = await emailManager.sendTwoFactorEmail('lucasdono391@gmail.com', 'test-token-123');
        if (testResult) {
            console.log('✅ Test de email exitoso - Revisa tu bandeja de entrada');
        } else {
            console.log('❌ Test de email falló - Revisa la configuración');
        }
    }).catch(err => {
        console.error('❌ Error cargando emailManager.js:', err.message);
    });
    "
else
    log_warning "Node.js no disponible para test automático"
fi

log_success "Configuración de email corregida completamente"
log_info "Recuerda reiniciar el servidor Docker después de aplicar cambios: ./docker-prod.sh" 
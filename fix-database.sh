#!/bin/bash

# Script para corregir errores de base de datos PostgreSQL
echo "🔧 Iniciando corrección de errores de base de datos..."

# Configuración de la base de datos
DB_NAME="circuitprompt"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Color para los mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Verificando conexión con la base de datos...${NC}"

# Función para ejecutar comandos SQL
execute_sql() {
    local sql_command="$1"
    local description="$2"
    
    echo -e "${YELLOW}⚡ $description${NC}"
    
    if docker exec -i circuitpromptcomar-postgres-1 psql -U "$DB_USER" -d "$DB_NAME" -c "$sql_command" 2>/dev/null; then
        echo -e "${GREEN}✅ $description - Completado${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - Error${NC}"
        return 1
    fi
}

# 1. Limpiar índices duplicados
echo -e "${YELLOW}🧹 Limpiando índices duplicados...${NC}"
execute_sql "DROP INDEX IF EXISTS idx_refund_user_id;" "Eliminando índice idx_refund_user_id"
execute_sql "DROP INDEX IF EXISTS idx_refund_status;" "Eliminando índice idx_refund_status"
execute_sql "DROP INDEX IF EXISTS idx_refund_created_at;" "Eliminando índice idx_refund_created_at"
execute_sql "DROP INDEX IF EXISTS idx_user_services_user_id;" "Eliminando índice idx_user_services_user_id"
execute_sql "DROP INDEX IF EXISTS idx_user_services_payment_id;" "Eliminando índice idx_user_services_payment_id"
execute_sql "DROP INDEX IF EXISTS idx_user_services_status;" "Eliminando índice idx_user_services_status"

# 2. Eliminar tablas problemáticas
echo -e "${YELLOW}🗑️ Eliminando tablas problemáticas...${NC}"
execute_sql "DROP TABLE IF EXISTS refund_requests CASCADE;" "Eliminando tabla refund_requests"
execute_sql "DROP TABLE IF EXISTS user_services CASCADE;" "Eliminando tabla user_services"

# 3. Recrear tabla refund_requests
echo -e "${YELLOW}🔨 Recreando tabla refund_requests...${NC}"
cat << 'EOF' | docker exec -i circuitpromptcomar-postgres-1 psql -U "$DB_USER" -d "$DB_NAME"
CREATE TABLE refund_requests (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_id VARCHAR(255) NULL,
    admin_notes TEXT NULL,
    mercadopago_refund_id VARCHAR(255) NULL,
    user_email VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL DEFAULT 'lucasdono391@gmail.com',
    service_name VARCHAR(255) NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tabla refund_requests creada correctamente${NC}"
else
    echo -e "${RED}❌ Error al crear tabla refund_requests${NC}"
fi

# 4. Recrear tabla user_services
echo -e "${YELLOW}🔨 Recreando tabla user_services...${NC}"
cat << 'EOF' | docker exec -i circuitpromptcomar-postgres-1 psql -U "$DB_USER" -d "$DB_NAME"
CREATE TABLE user_services (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    payment_id VARCHAR(100) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    details JSONB,
    full_name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    stage VARCHAR(100),
    next_task TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tabla user_services creada correctamente${NC}"
else
    echo -e "${RED}❌ Error al crear tabla user_services${NC}"
fi

# 5. Crear índices
echo -e "${YELLOW}📊 Creando índices...${NC}"
execute_sql "CREATE INDEX idx_refund_user_id ON refund_requests(user_id);" "Creando índice idx_refund_user_id"
execute_sql "CREATE INDEX idx_refund_status ON refund_requests(status);" "Creando índice idx_refund_status"
execute_sql "CREATE INDEX idx_refund_created_at ON refund_requests(created_at);" "Creando índice idx_refund_created_at"
execute_sql "CREATE INDEX idx_user_services_user_id ON user_services(user_id);" "Creando índice idx_user_services_user_id"
execute_sql "CREATE INDEX idx_user_services_payment_id ON user_services(payment_id);" "Creando índice idx_user_services_payment_id"
execute_sql "CREATE INDEX idx_user_services_status ON user_services(status);" "Creando índice idx_user_services_status"

# 6. Crear función y trigger para updated_at
echo -e "${YELLOW}⚙️ Creando función y trigger...${NC}"
cat << 'EOF' | docker exec -i circuitpromptcomar-postgres-1 psql -U "$DB_USER" -d "$DB_NAME"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_services_updated_at
    BEFORE UPDATE ON user_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Función y trigger creados correctamente${NC}"
else
    echo -e "${RED}❌ Error al crear función y trigger${NC}"
fi

# 7. Verificar que las tablas existen
echo -e "${YELLOW}🔍 Verificando tablas creadas...${NC}"
execute_sql "\dt refund_requests" "Verificando tabla refund_requests"
execute_sql "\dt user_services" "Verificando tabla user_services"

echo -e "${GREEN}🎉 Corrección de base de datos completada${NC}"
echo -e "${YELLOW}💡 Ahora puedes reiniciar el servidor con: docker-compose -f docker-compose-prod.yml restart${NC}" 
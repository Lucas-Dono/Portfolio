-- Script para corregir errores de base de datos
-- Ejecutar este script para limpiar y recrear las tablas problemáticas

-- 1. Eliminar índices duplicados si existen
DROP INDEX IF EXISTS idx_refund_user_id;
DROP INDEX IF EXISTS idx_refund_status;
DROP INDEX IF EXISTS idx_refund_created_at;
DROP INDEX IF EXISTS idx_user_services_user_id;
DROP INDEX IF EXISTS idx_user_services_payment_id;
DROP INDEX IF EXISTS idx_user_services_status;

-- 2. Eliminar tablas si existen (en orden correcto por foreign keys)
DROP TABLE IF EXISTS refund_requests CASCADE;
DROP TABLE IF EXISTS user_services CASCADE;

-- 3. Recrear tabla refund_requests con tipos correctos
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

-- 4. Recrear tabla user_services con tipos correctos
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

-- 5. Crear foreign keys solo si la tabla users existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE refund_requests ADD CONSTRAINT fk_refund_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        ALTER TABLE user_services ADD CONSTRAINT fk_user_services_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Crear índices
CREATE INDEX idx_refund_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_status ON refund_requests(status);
CREATE INDEX idx_refund_created_at ON refund_requests(created_at);
CREATE INDEX idx_user_services_user_id ON user_services(user_id);
CREATE INDEX idx_user_services_payment_id ON user_services(payment_id);
CREATE INDEX idx_user_services_status ON user_services(status);

-- 7. Crear función y trigger para updated_at
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

-- 8. Comentarios para documentación
COMMENT ON TABLE refund_requests IS 'Almacena solicitudes de reembolso de usuarios y su estado de procesamiento';
COMMENT ON TABLE user_services IS 'Almacena los servicios contratados por los usuarios'; 
-- Crear la tabla de servicios de usuario
CREATE TABLE IF NOT EXISTS user_services (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_services_payment_id ON user_services(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_services_status ON user_services(status);

-- Crear un trigger para actualizar automáticamente updated_at
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
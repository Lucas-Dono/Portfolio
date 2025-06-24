-- Migración para crear tabla de promociones
-- Archivo: migrations/create_promociones_table.sql

CREATE TABLE IF NOT EXISTS promociones (
    id VARCHAR(255) PRIMARY KEY,
    servicio_id VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('GRATIS', 'DESCUENTO')),
    valor_descuento INTEGER DEFAULT NULL,
    cantidad_limite INTEGER NOT NULL DEFAULT 1,
    cantidad_usada INTEGER NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_promociones_servicio_id ON promociones(servicio_id);
CREATE INDEX IF NOT EXISTS idx_promociones_activa ON promociones(activa);
CREATE INDEX IF NOT EXISTS idx_promociones_tipo ON promociones(tipo);
CREATE INDEX IF NOT EXISTS idx_promociones_fecha_expiracion ON promociones(fecha_expiracion);

-- Insertar promociones iniciales (las que estaban hardcodeadas)
INSERT INTO promociones (id, servicio_id, tipo, cantidad_limite, cantidad_usada, activa, fecha_creacion) 
VALUES 
    ('promo-basic-gratis', 'landing-page', 'GRATIS', 3, 1, true, CURRENT_TIMESTAMP),
    ('promo-standard-descuento', 'basic-website', 'DESCUENTO', 5, 2, true, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Actualizar el valor de descuento para la promoción de descuento
UPDATE promociones 
SET valor_descuento = 20 
WHERE id = 'promo-standard-descuento' AND tipo = 'DESCUENTO';

COMMENT ON TABLE promociones IS 'Tabla de promociones para servicios';
COMMENT ON COLUMN promociones.servicio_id IS 'ID del servicio al que aplica la promoción';
COMMENT ON COLUMN promociones.tipo IS 'Tipo de promoción: GRATIS o DESCUENTO';
COMMENT ON COLUMN promociones.valor_descuento IS 'Porcentaje de descuento (solo para tipo DESCUENTO)';
COMMENT ON COLUMN promociones.cantidad_limite IS 'Máximo número de usos permitidos';
COMMENT ON COLUMN promociones.cantidad_usada IS 'Número de veces que se ha usado';
COMMENT ON COLUMN promociones.activa IS 'Si la promoción está activa';
COMMENT ON COLUMN promociones.fecha_expiracion IS 'Fecha de expiración (opcional)'; 
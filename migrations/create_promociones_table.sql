-- Migración para crear tabla de promociones
-- Archivo: migrations/create_promociones_table.sql

CREATE TABLE IF NOT EXISTS promociones (
    id VARCHAR(255) PRIMARY KEY,
    "servicioId" VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('GRATIS', 'DESCUENTO')),
    "valorDescuento" INTEGER DEFAULT NULL,
    "cantidadLimite" INTEGER NOT NULL DEFAULT 1,
    "cantidadUsada" INTEGER NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    "fechaFin" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_promociones_servicio_id ON promociones("servicioId");
CREATE INDEX IF NOT EXISTS idx_promociones_activa ON promociones(activa);
CREATE INDEX IF NOT EXISTS idx_promociones_tipo ON promociones(tipo);
CREATE INDEX IF NOT EXISTS idx_promociones_fecha_fin ON promociones("fechaFin");

-- Insertar promociones iniciales solo si no existen (usando servicioId como identificador único)
INSERT INTO promociones ("servicioId", tipo, "cantidadLimite", "cantidadUsada", activa, "valorDescuento", "createdAt") 
SELECT 'landing-page', 'GRATIS', 3, 1, true, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE "servicioId" = 'landing-page' AND tipo = 'GRATIS');

INSERT INTO promociones ("servicioId", tipo, "cantidadLimite", "cantidadUsada", activa, "valorDescuento", "createdAt") 
SELECT 'basic-website', 'DESCUENTO', 5, 2, true, 20, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM promociones WHERE "servicioId" = 'basic-website' AND tipo = 'DESCUENTO');

COMMENT ON TABLE promociones IS 'Tabla de promociones para servicios';
COMMENT ON COLUMN promociones."servicioId" IS 'ID del servicio al que aplica la promoción';
COMMENT ON COLUMN promociones.tipo IS 'Tipo de promoción: GRATIS o DESCUENTO';
COMMENT ON COLUMN promociones."valorDescuento" IS 'Porcentaje de descuento (solo para tipo DESCUENTO)';
COMMENT ON COLUMN promociones."cantidadLimite" IS 'Máximo número de usos permitidos';
COMMENT ON COLUMN promociones."cantidadUsada" IS 'Número de veces que se ha usado';
COMMENT ON COLUMN promociones.activa IS 'Si la promoción está activa';
COMMENT ON COLUMN promociones."fechaFin" IS 'Fecha de expiración (opcional)'; 
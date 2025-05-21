-- Script de inicialización de la base de datos

-- Crear tabla de servicios
CREATE TABLE
IF NOT EXISTS "servicios"
(
  "id" VARCHAR
(255) PRIMARY KEY,
  "title" VARCHAR
(255) NOT NULL,
  "description" TEXT NOT NULL,
  "features" JSONB DEFAULT '[]'::jsonb,
  "isPaquete" BOOLEAN DEFAULT FALSE,
  "price" FLOAT NOT NULL,
  "originalPrice" FLOAT,
  "createdAt" TIMESTAMP
WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP
WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
WITH TIME ZONE DEFAULT NULL
);

-- Crear tabla de addons
CREATE TABLE
IF NOT EXISTS "addons"
(
  "id" VARCHAR
(255) PRIMARY KEY,
  "name" VARCHAR
(255) NOT NULL,
  "description" TEXT NOT NULL,
  "price" FLOAT NOT NULL,
  "oneTime" BOOLEAN DEFAULT TRUE,
  "duration" VARCHAR
(255),
  "createdAt" TIMESTAMP
WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP
WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
WITH TIME ZONE DEFAULT NULL
);

-- Crear tabla de promociones
CREATE TABLE
IF NOT EXISTS "promociones"
(
  "id" SERIAL PRIMARY KEY,
  "servicioId" VARCHAR
(255) NOT NULL,
  "tipo" VARCHAR
(50) NOT NULL,
  "valorDescuento" FLOAT,
  "cantidadLimite" INTEGER NOT NULL,
  "cantidadUsada" INTEGER DEFAULT 0,
  "activa" BOOLEAN DEFAULT TRUE,
  "fechaInicio" TIMESTAMP
WITH TIME ZONE,
  "fechaFin" TIMESTAMP
WITH TIME ZONE,
  "createdAt" TIMESTAMP
WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP
WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
WITH TIME ZONE DEFAULT NULL,
  CONSTRAINT "fk_servicio" FOREIGN KEY
("servicioId") REFERENCES "servicios"
("id") ON
DELETE CASCADE
);

-- Insertar datos de ejemplo para servicios
INSERT INTO "servicios"
  ("id", "title", "description", "features", "isPaquete", "price", "originalPrice", "createdAt", "updatedAt")
VALUES
  ('basic', 'Básico', 'Plan básico para pequeños negocios', '["Diseño responsive", "Hasta 5 páginas", "SEO básico", "1 revisión"]'
::jsonb, false, 29997, 39997, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('standard', 'Estándar', 'Plan recomendado para la mayoría de negocios', '["Diseño premium responsive", "Hasta 10 páginas", "SEO avanzado", "Blog integrado", "3 revisiones", "Soporte por 1 mes"]'::jsonb, false, 69997, 89997, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('premium', 'Premium', 'Plan completo con todas las características', '["Diseño exclusivo a medida", "Páginas ilimitadas", "SEO profesional", "Blog y foro", "Revisiones ilimitadas", "Soporte por 3 meses", "Panel de administración"]'::jsonb, false, 149997, 199997, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enterprise', 'Empresarial', 'Solución integral para grandes empresas', '["Consultoría estratégica digital", "Diseño corporativo exclusivo", "Arquitectura de información", "Integración con sistemas existentes", "SEO personalizado", "Soporte prioritario", "Mantenimiento incluido"]'::jsonb, false, 249997, 349997, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('starter-pack', 'Paquete Inicial', 'Todo lo necesario para empezar', '["Sitio web básico", "Dominio por 1 año", "Hosting por 1 año", "Certificado SSL", "Correo corporativo"]'::jsonb, true, 49997, 69997, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('business-pack', 'Paquete Empresarial', 'Solución completa para tu negocio', '["Sitio web premium", "Dominio por 2 años", "Hosting por 2 años", "Certificado SSL", "5 correos corporativos", "Posicionamiento básico en Google", "Integración con redes sociales"]'::jsonb, true, 119997, 169997, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar datos de ejemplo para addons
INSERT INTO "addons"
  ("id", "name", "description", "price", "oneTime", "duration", "createdAt", "updatedAt")
VALUES
  ('domain', 'Dominio Personalizado', 'Registro de dominio personalizado para tu sitio web', 2500, false, '1 año', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hosting', 'Hosting Premium', 'Alojamiento de alta velocidad para tu sitio web', 5000, false, '1 año', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ssl', 'Certificado SSL', 'Asegura tu sitio web con HTTPS', 3000, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seo', 'SEO Avanzado', 'Optimización avanzada para motores de búsqueda', 15000, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('maintenance', 'Mantenimiento Mensual', 'Servicio de mantenimiento y actualizaciones', 4000, false, '1 mes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('extra-page', 'Página Adicional', 'Añade una página extra a tu sitio web', 2500, true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar datos de ejemplo para promociones
INSERT INTO "promociones"
  ("servicioId", "tipo", "valorDescuento", "cantidadLimite", "cantidadUsada", "activa", "fechaInicio", "fechaFin", "createdAt", "updatedAt")
VALUES
  ('basic', 'DESCUENTO', 20, 5, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL
'30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('standard', 'DESCUENTO', 15, 3, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('premium', 'DESCUENTO', 10, 2, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('starter-pack', 'GRATIS', NULL, 1, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 
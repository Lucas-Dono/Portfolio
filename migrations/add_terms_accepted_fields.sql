-- Agregar campos para aceptación de términos y condiciones a la tabla de usuarios

-- Primero verificar si la columna ya existe
DO $
$
BEGIN
    -- Verificar si la columna 'termsAccepted' existe
    IF NOT EXISTS (
        SELECT
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'termsAccepted'
    ) THEN
    -- Añadir columna 'termsAccepted'
    ALTER TABLE users ADD COLUMN "termsAccepted" BOOLEAN DEFAULT FALSE;
RAISE NOTICE 'Columna "termsAccepted" añadida a la tabla users';
    ELSE
        RAISE NOTICE 'Columna "termsAccepted" ya existe en la tabla users';
END
IF;

    -- Verificar si la columna 'termsAcceptedAt' existe
    IF NOT EXISTS (
        SELECT
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'termsAcceptedAt'
    ) THEN
-- Añadir columna 'termsAcceptedAt'
ALTER TABLE users ADD COLUMN "termsAcceptedAt" TIMESTAMP
WITH TIME ZONE;
        RAISE NOTICE 'Columna "termsAcceptedAt" añadida a la tabla users';
    ELSE
        RAISE NOTICE 'Columna "termsAcceptedAt" ya existe en la tabla users';
END
IF;

    -- Para usuarios existentes, establecer termsAccepted=true y termsAcceptedAt=now()
    -- ya que presumiblemente aceptaron los términos al registrarse
    UPDATE users
    SET "termsAccepted" = TRUE, 
        "termsAcceptedAt" = NOW()
    WHERE "termsAccepted" IS NULL OR "termsAccepted" = FALSE;

RAISE NOTICE 'Usuarios existentes actualizados con termsAccepted=TRUE';
END
$$; 
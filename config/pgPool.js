import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la base de datos usando la URL de conexión
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/portfolio'
});

export { pool }; 
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Obtener parámetros de conexión desde .env
const DB_NAME = process.env.DB_NAME || 'portfolio';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_SSL = process.env.DB_SSL === 'true';

// Opciones SSL seguras para producción
const sslOptions = DB_SSL ? {
    require: true,
    rejectUnauthorized: false // Para conexiones seguras a Heroku u otros proveedores
} : false;

// Crear la conexión pool
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
    ssl: sslOptions,
});

export { pool }; 
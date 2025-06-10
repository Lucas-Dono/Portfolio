import { pool } from '../config/pgPool.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 Iniciando migración...');

        // Leer el archivo SQL
        const migrationPath = path.join(__dirname, '../migrations/create_user_services_table.sql');
        const sql = await fs.readFile(migrationPath, 'utf8');

        // Iniciar transacción
        await client.query('BEGIN');

        // Ejecutar la migración
        await client.query(sql);

        // Confirmar transacción
        await client.query('COMMIT');

        console.log('✅ Migración completada exitosamente');
    } catch (error) {
        // Revertir cambios en caso de error
        await client.query('ROLLBACK');
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Ejecutar la migración
runMigration()
    .then(() => {
        console.log('✨ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    }); 
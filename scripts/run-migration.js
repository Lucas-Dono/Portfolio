import { pool } from '../config/pgPool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations(shouldClosePool = false) {
    try {
        console.log('🔄 Ejecutando migraciones...');
        
        // Crear tabla de historial de migraciones si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Lista de archivos de migración en orden
        const migrationFiles = [
            '../migrations/refund_requests.sql',
            '../migrations/create_user_services_table.sql',
            '../migrations/create_promociones_table.sql',
            '../migrations/create_chat_tables.sql'
        ];
        
        for (const migrationFile of migrationFiles) {
            const migrationName = path.basename(migrationFile);
            
            // Verificar si la migración ya fue ejecutada
            const historyCheck = await pool.query(
                'SELECT * FROM migration_history WHERE migration_name = $1',
                [migrationName]
            );
            
            if (historyCheck.rows.length > 0) {
                console.log(`⏭️ Migración ya ejecutada: ${migrationFile} - Saltando...`);
                continue;
            }
            
            const migrationPath = path.join(__dirname, migrationFile);
            
            if (fs.existsSync(migrationPath)) {
                console.log(`📄 Ejecutando migración: ${migrationFile}`);
                
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                
                try {
                    await pool.query(migrationSQL);
                    
                    // Marcar migración como completada
                    await pool.query(
                        'INSERT INTO migration_history (migration_name) VALUES ($1)',
                        [migrationName]
                    );
                    
                    console.log(`✅ Migración completada: ${migrationFile}`);
                } catch (migrationError) {
                    // Manejar errores específicos que no son críticos
                    if (migrationError.code === '42P07' && migrationError.message.includes('already exists')) {
                        console.log(`⚠️ Elementos ya existen en migración: ${migrationFile} - Marcando como completada...`);
                        
                        // Marcar como completada aunque haya fallado por elementos existentes
                        await pool.query(
                            'INSERT INTO migration_history (migration_name) VALUES ($1) ON CONFLICT DO NOTHING',
                            [migrationName]
                        );
                    } else if (migrationError.code === '42P01' && migrationError.message.includes('does not exist')) {
                        console.log(`⚠️ Tabla base no existe para migración: ${migrationFile} - Saltando...`);
                    } else {
                        // Para otros errores, re-lanzar
                        throw migrationError;
                    }
                }
            } else {
                console.log(`⚠️ Archivo de migración no encontrado: ${migrationFile}`);
            }
        }
        
        // Crear archivos JSON necesarios si no existen
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const userServicesFile = path.join(dataDir, 'userServices.json');
        if (!fs.existsSync(userServicesFile)) {
            console.log('📄 Creando archivo userServices.json...');
            fs.writeFileSync(userServicesFile, JSON.stringify([], null, 2));
            console.log('✅ Archivo userServices.json creado');
        }
        
        console.log('🎉 Todas las migraciones completadas exitosamente');
        
    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
        throw error;
    } finally {
        // Solo cerrar el pool si se ejecuta como script independiente
        if (shouldClosePool) {
            console.log('🔒 Cerrando pool de conexiones...');
        await pool.end();
        }
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations(true).catch(console.error);
}

export default runMigrations; 
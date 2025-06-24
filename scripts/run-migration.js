import { pool } from '../config/pgPool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    try {
        console.log('🔄 Ejecutando migraciones...');
        
        // Lista de archivos de migración en orden
        const migrationFiles = [
            '../migrations/refund_requests.sql',
            '../migrations/create_user_services_table.sql',
            '../migrations/create_promociones_table.sql'
        ];
        
        for (const migrationFile of migrationFiles) {
            const migrationPath = path.join(__dirname, migrationFile);
            
            if (fs.existsSync(migrationPath)) {
                console.log(`📄 Ejecutando migración: ${migrationFile}`);
                
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                
                try {
                    await pool.query(migrationSQL);
                    console.log(`✅ Migración completada: ${migrationFile}`);
                } catch (migrationError) {
                    // Manejar errores específicos que no son críticos
                    if (migrationError.code === '42P07' && migrationError.message.includes('already exists')) {
                        console.log(`⚠️ Elementos ya existen en migración: ${migrationFile} - Continuando...`);
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
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().catch(console.error);
}

export default runMigrations; 
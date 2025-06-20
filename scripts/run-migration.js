import { pgPool } from '../config/pgPool.js';
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
            '../migrations/create_user_services_table.sql'
        ];
        
        for (const migrationFile of migrationFiles) {
            const migrationPath = path.join(__dirname, migrationFile);
            
            if (fs.existsSync(migrationPath)) {
                console.log(`📄 Ejecutando migración: ${migrationFile}`);
                
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                await pgPool.query(migrationSQL);
                
                console.log(`✅ Migración completada: ${migrationFile}`);
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
        await pgPool.end();
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().catch(console.error);
}

export default runMigrations; 
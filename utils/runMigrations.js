import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import initializeDatabase from '../config/database.js';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de migraciones
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

/**
 * Ejecuta todas las migraciones pendientes en orden
 */
async function runMigrations() {
    console.log('📊 Iniciando migraciones...');

    try {
        // Inicializar base de datos
        await initializeDatabase();

        // Leer archivos de migración
        const files = await fs.readdir(MIGRATIONS_DIR);
        const migrationFiles = files
            .filter(file => file.endsWith('.js'))
            .sort(); // Ordenar por nombre para ejecución secuencial

        console.log(`🔍 Se encontraron ${migrationFiles.length} archivos de migración`);

        // Ejecutar cada migración
        for (const file of migrationFiles) {
            try {
                console.log(`⚙️ Ejecutando migración: ${file}`);

                // Importar dinámicamente el archivo de migración
                const migrationPath = path.join(MIGRATIONS_DIR, file);
                const migration = await import(migrationPath);

                // Ejecutar la migración
                if (typeof migration.up === 'function') {
                    await migration.up();
                    console.log(`✅ Migración ${file} completada exitosamente`);
                } else if (typeof migration.default?.up === 'function') {
                    await migration.default.up();
                    console.log(`✅ Migración ${file} completada exitosamente`);
                } else {
                    console.warn(`⚠️ Migración ${file} no tiene un método 'up'`);
                }
            } catch (error) {
                console.error(`❌ Error al ejecutar migración ${file}:`, error);
                // Continuar con la siguiente migración
            }
        }

        console.log('✅ Proceso de migración finalizado');
    } catch (error) {
        console.error('❌ Error en el proceso de migración:', error);
        process.exit(1);
    }
}

// Si este archivo se ejecuta directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runMigrations()
        .then(() => {
            console.log('Migraciones completadas, terminando proceso');
            process.exit(0);
        })
        .catch(error => {
            console.error('Error en migraciones:', error);
            process.exit(1);
        });
}

export default runMigrations; 
#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta actual usando ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[ÉXITO]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}[ADVERTENCIA]${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`)
};

// Función para corregir la configuración de la base de datos
async function fixDatabaseConfig(filePath) {
    try {
        log.info(`Verificando ${filePath}...`);

        // Leer el archivo
        const content = await fs.readFile(filePath, 'utf8');

        // Corregir DB_PORT para que siempre sea 5432
        const correctedContent = content.replace(
            /DB_PORT=.*/g,
            'DB_PORT=5432'
        );

        // Corregir DATABASE_URL para asegurarnos de que use el puerto 5432
        const correctedContentWithUrl = correctedContent.replace(
            /DATABASE_URL=postgres:\/\/.*@.*:\d+\/.*/g,
            'DATABASE_URL=postgres://postgres:postgres@postgres:5432/portfolio'
        );

        // Verificar si hubo cambios
        if (content !== correctedContentWithUrl) {
            // Guardar el archivo corregido
            await fs.writeFile(filePath, correctedContentWithUrl);
            log.success(`Archivo ${filePath} actualizado correctamente.`);
            return true;
        } else {
            log.info(`No se requieren cambios en ${filePath}.`);
            return false;
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            log.warning(`El archivo ${filePath} no existe.`);
        } else {
            log.error(`Error al procesar ${filePath}: ${error.message}`);
        }
        return false;
    }
}

// Función principal
async function main() {
    log.header("CORRECCIÓN DE CONFIGURACIÓN DE BASE DE DATOS");

    // Rutas a los archivos .env
    const envFilePath = path.resolve(process.cwd(), '.env');
    const envProdFilePath = path.resolve(process.cwd(), '.env.prod');

    let changesCount = 0;

    // Corregir .env
    if (await fixDatabaseConfig(envFilePath)) {
        changesCount++;
    }

    // Corregir .env.prod
    if (await fixDatabaseConfig(envProdFilePath)) {
        changesCount++;
    }

    // Verificar docker-compose.yml para asegurarse de que la base de datos expone el puerto correcto
    try {
        const composeFilePath = path.resolve(process.cwd(), 'docker-compose.yml');
        const composeProdFilePath = path.resolve(process.cwd(), 'docker-compose-prod.yml');

        for (const filePath of [composeFilePath, composeProdFilePath]) {
            if (await fs.access(filePath).then(() => true).catch(() => false)) {
                log.info(`Verificando puertos de PostgreSQL en ${filePath}...`);

                let content = await fs.readFile(filePath, 'utf8');

                // Buscar la configuración de puertos de postgres y asegurarse de que mapea al puerto 5432
                if (content.includes('postgres:')) {
                    const correctedContent = content.replace(
                        /(\s+postgres:[\s\S]*?ports:[\s\S]*?-\s*["'])\d+:\d+(["'])/,
                        '$1127.0.0.1:5433:5432$2'
                    );

                    if (content !== correctedContent) {
                        await fs.writeFile(filePath, correctedContent);
                        log.success(`Configuración de puertos de PostgreSQL corregida en ${filePath}.`);
                        changesCount++;
                    } else {
                        log.info(`Configuración de puertos de PostgreSQL es correcta en ${filePath}.`);
                    }
                }
            }
        }
    } catch (error) {
        log.error(`Error al verificar archivos docker-compose: ${error.message}`);
    }

    // Resumen
    log.header("RESUMEN");

    if (changesCount > 0) {
        log.success(`Se realizaron ${changesCount} correcciones en los archivos de configuración.`);
        log.info("Para aplicar estos cambios, reinicia los contenedores con:");
        log.info("    docker compose down && docker compose up -d");
    } else {
        log.info("No fue necesario realizar correcciones en los archivos de configuración.");
    }
}

// Ejecutar
main().catch(error => {
    log.error(`Error inesperado: ${error.message}`);
}); 
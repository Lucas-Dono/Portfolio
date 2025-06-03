#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import dotenv from 'dotenv';
import os from 'os';

// Crear una interfaz de lectura/escritura
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para preguntar al usuario
const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

// Función para mostrar mensajes coloreados
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
    title: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`),
};

// Función para probar la conexión a un endpoint
async function testEndpoint(url, maxRetries = 3) {
    log.info(`Probando conexión a: ${url}`);

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, { timeout: 5000 });
            const status = response.status;

            if (status >= 200 && status < 400) {
                log.success(`Conexión exitosa a ${url} (Status: ${status})`);
                return true;
            } else {
                log.error(`Error al conectar a ${url} - Status: ${status}`);
                return false;
            }
        } catch (error) {
            log.warning(`Intento ${i + 1}/${maxRetries} fallido: ${error.message}`);

            if (i === maxRetries - 1) {
                log.error(`No se pudo conectar a ${url} después de ${maxRetries} intentos`);
                return false;
            }

            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return false;
}

// Función para actualizar el archivo .env
async function updateEnvFile(port, isProduction = false) {
    try {
        const envFile = isProduction ? '.env.prod' : '.env';
        const envPath = path.resolve(process.cwd(), envFile);

        let envContent = await fs.readFile(envPath, 'utf-8');

        // Actualizar el puerto de la aplicación
        envContent = envContent.replace(/PORT=\d+/g, `PORT=${port}`);
        envContent = envContent.replace(/API_PORT=\d+/g, `API_PORT=${port}`);

        // Asegurarnos de que el puerto de la base de datos siempre sea 5432 (estándar de PostgreSQL)
        envContent = envContent.replace(/DB_PORT=\d+/g, `DB_PORT=5432`);

        // Actualizar URLs CORS según sea necesario
        if (isProduction) {
            // En producción, configurar para el dominio
            envContent = envContent.replace(/CORS_FRONT=.*/g, `CORS_FRONT=https://circuitprompt.com.ar`);
            envContent = envContent.replace(/CORS_BACK=.*/g, `CORS_BACK=https://circuitprompt.com.ar`);
            envContent = envContent.replace(/VITE_CORS_FRONT=.*/g, `VITE_CORS_FRONT=https://circuitprompt.com.ar`);
            envContent = envContent.replace(/VITE_CORS_BACK=.*/g, `VITE_CORS_BACK=https://circuitprompt.com.ar`);
            envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=https://circuitprompt.com.ar/api`);
        } else {
            // En desarrollo, configurar para localhost con el puerto actual
            envContent = envContent.replace(/CORS_FRONT=.*/g, `CORS_FRONT=http://localhost:${port}`);
            envContent = envContent.replace(/CORS_BACK=.*/g, `CORS_BACK=http://localhost:${port}`);
            envContent = envContent.replace(/VITE_CORS_FRONT=.*/g, `VITE_CORS_FRONT=http://localhost:${port}`);
            envContent = envContent.replace(/VITE_CORS_BACK=.*/g, `VITE_CORS_BACK=http://localhost:${port}`);
            envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=http://localhost:${port}/api`);
        }

        await fs.writeFile(envPath, envContent);
        log.success(`Archivo ${envFile} actualizado con puerto ${port}`);

        return true;
    } catch (error) {
        log.error(`Error al actualizar el archivo .env: ${error.message}`);
        return false;
    }
}

// Función para actualizar docker-compose.yml
async function updateDockerComposeFile(port, isProduction = false) {
    try {
        const composeFile = isProduction ? 'docker-compose-prod.yml' : 'docker-compose.yml';
        const composePath = path.resolve(process.cwd(), composeFile);

        let composeContent = await fs.readFile(composePath, 'utf-8');

        // Actualizar el mapeo de puertos para el servicio app
        composeContent = composeContent.replace(/ports:[\s\S]*?-\s*["']?\d+:\d+["']?/m,
            `ports:\n      - "${port}:${port}"`);

        // Si es producción, actualizar también el healthcheck
        if (isProduction) {
            composeContent = composeContent.replace(
                /healthcheck:[\s\S]*?test:\s*\[\s*"CMD",\s*"curl",\s*"-f",\s*"http:\/\/localhost:\d+\/health"\s*\]/m,
                `healthcheck:\n      test: [ "CMD", "curl", "-f", "http://localhost:${port}/health" ]`
            );
        }

        await fs.writeFile(composePath, composeContent);
        log.success(`Archivo ${composeFile} actualizado con puerto ${port}`);

        return true;
    } catch (error) {
        log.error(`Error al actualizar el archivo docker-compose: ${error.message}`);
        return false;
    }
}

// Función para actualizar configuración de Nginx si estamos en producción
async function updateNginxConfig(port, isProduction = false) {
    if (!isProduction) return true; // Solo actualizar en producción

    try {
        const nginxPath = path.resolve(process.cwd(), 'nginx/conf/default.conf');

        if (await fs.access(nginxPath).then(() => true).catch(() => false)) {
            let nginxContent = await fs.readFile(nginxPath, 'utf-8');

            // Actualizar proxy_pass para la ruta principal
            nginxContent = nginxContent.replace(
                /proxy_pass http:\/\/app:\d+;/g,
                `proxy_pass http://app:${port};`
            );

            // Actualizar proxy_pass para las rutas de API
            nginxContent = nginxContent.replace(
                /proxy_pass http:\/\/app:\d+\/health;/g,
                `proxy_pass http://app:${port}/health;`
            );

            nginxContent = nginxContent.replace(
                /proxy_pass http:\/\/app:\d+\/api;/g,
                `proxy_pass http://app:${port}/api;`
            );

            nginxContent = nginxContent.replace(
                /proxy_pass http:\/\/app:\d+\/admin;/g,
                `proxy_pass http://app:${port}/admin;`
            );

            await fs.writeFile(nginxPath, nginxContent);
            log.success(`Configuración de Nginx actualizada con puerto ${port}`);
        }

        return true;
    } catch (error) {
        log.error(`Error al actualizar la configuración de Nginx: ${error.message}`);
        return false;
    }
}

// Función para actualizar la configuración de Vite
async function updateViteConfig(port) {
    try {
        const vitePath = path.resolve(process.cwd(), 'vite.config.ts');

        if (await fs.access(vitePath).then(() => true).catch(() => false)) {
            let viteContent = await fs.readFile(vitePath, 'utf-8');

            // Actualizar el proxy target
            viteContent = viteContent.replace(
                /target: ['"]http:\/\/localhost:\d+['"]/g,
                `target: 'http://localhost:${port}'`
            );

            await fs.writeFile(vitePath, viteContent);
            log.success(`Configuración de Vite actualizada con puerto ${port}`);
        }

        return true;
    } catch (error) {
        log.error(`Error al actualizar la configuración de Vite: ${error.message}`);
        return false;
    }
}

// Función para verificar si hay algún archivo de construcción de frontend
async function hasDistFolder() {
    const distPath = path.resolve(process.cwd(), 'dist');
    return fs.access(distPath).then(() => true).catch(() => false);
}

// Función para reconstruir el frontend
async function rebuildFrontend() {
    try {
        log.info("Reconstruyendo el frontend para aplicar los cambios de configuración...");

        // Verificar si npm está instalado
        try {
            execSync('npm --version', { stdio: 'ignore' });
        } catch (error) {
            log.error("No se pudo encontrar npm. Asegúrate de tener Node.js instalado.");
            return false;
        }

        // Ejecutar el comando de construcción
        log.info("Ejecutando 'npm run build'...");
        execSync('npm run build', { stdio: 'inherit' });

        log.success("Frontend reconstruido exitosamente");
        return true;
    } catch (error) {
        log.error(`Error al reconstruir el frontend: ${error.message}`);
        return false;
    }
}

// Función para reiniciar los contenedores Docker
async function restartDockerContainers(isProduction = false) {
    try {
        const composeFile = isProduction ? 'docker-compose-prod.yml' : 'docker-compose.yml';
        log.info(`Reiniciando contenedores Docker con ${composeFile}...`);

        // Verificar si Docker Compose está instalado
        try {
            execSync('docker compose version', { stdio: 'ignore' });
        } catch (error) {
            log.error("No se pudo encontrar docker compose. Asegúrate de tener Docker instalado.");
            return false;
        }

        // Reiniciar los contenedores
        log.info("Ejecutando 'docker compose down'...");
        execSync(`docker compose -f ${composeFile} down`, { stdio: 'inherit' });

        log.info("Ejecutando 'docker compose up -d'...");
        execSync(`docker compose -f ${composeFile} up -d`, { stdio: 'inherit' });

        log.success("Contenedores Docker reiniciados exitosamente");
        return true;
    } catch (error) {
        log.error(`Error al reiniciar los contenedores Docker: ${error.message}`);
        return false;
    }
}

// Función para probar los puertos disponibles en localhost
async function testLocalPorts(startPort = 3000, endPort = 9000) {
    log.title("PRUEBA DE PUERTOS DISPONIBLES");

    const availablePorts = [];

    for (let port = startPort; port <= endPort; port += 1000) {
        try {
            // Intentar iniciar un servidor en este puerto
            const testServer = await import('http').then(http => {
                return new Promise(resolve => {
                    const server = http.createServer();
                    server.listen(port, () => {
                        server.close(() => resolve({ port, available: true }));
                    });
                    server.on('error', () => resolve({ port, available: false }));
                });
            });

            if (testServer.available) {
                log.success(`Puerto ${port} disponible`);
                availablePorts.push(port);
            } else {
                log.warning(`Puerto ${port} no disponible`);
            }
        } catch (error) {
            log.warning(`Error al probar puerto ${port}: ${error.message}`);
        }
    }

    return availablePorts;
}

// Función para probar todas las combinaciones de puertos y encontrar la mejor
async function findBestConfiguration() {
    log.title("BUSCANDO LA MEJOR CONFIGURACIÓN");

    const availablePorts = await testLocalPorts();

    if (availablePorts.length === 0) {
        log.error("No se encontraron puertos disponibles para probar");
        return null;
    }

    // Probar cada puerto disponible
    for (const port of availablePorts) {
        log.info(`Probando configuración con puerto ${port}`);

        // Actualizar archivos con este puerto
        await updateEnvFile(port);
        await updateDockerComposeFile(port);
        await updateViteConfig(port);

        // Preguntar si desean reconstruir el frontend
        const rebuildAnswer = await askQuestion("¿Deseas reconstruir el frontend para aplicar los cambios? (s/n): ");
        if (rebuildAnswer.toLowerCase() === 's') {
            await rebuildFrontend();
        }

        // Preguntar si desean reiniciar los contenedores
        const restartAnswer = await askQuestion("¿Deseas reiniciar los contenedores Docker? (s/n): ");
        if (restartAnswer.toLowerCase() === 's') {
            await restartDockerContainers();
        }

        // Darle tiempo al usuario para probar manualmente
        log.warning(`Configuración actualizada para puerto ${port}`);
        const answer = await askQuestion(`¿Funciona la aplicación con puerto ${port}? (s/n): `);

        if (answer.toLowerCase() === 's') {
            return port; // Encontramos una configuración que funciona
        }
    }

    return null; // No encontramos ninguna configuración que funcione
}

// Función para verificar problemas comunes
async function checkCommonIssues() {
    log.title("VERIFICANDO PROBLEMAS COMUNES");

    // 1. Verificar que el frontend no tenga URLs hardcodeadas
    let issues = 0;

    try {
        // Buscar archivos JavaScript en dist
        const distPath = path.resolve(process.cwd(), 'dist');
        if (await fs.access(distPath).then(() => true).catch(() => false)) {
            log.info("Escaneando archivos del frontend compilado...");

            // Buscar archivos JavaScript
            const files = await fs.readdir(path.join(distPath, 'assets'));
            const jsFiles = files.filter(file => file.endsWith('.js'));

            for (const file of jsFiles) {
                const content = await fs.readFile(path.join(distPath, 'assets', file), 'utf-8');

                // Buscar localhost hardcodeado
                const localhostMatches = content.match(/http:\/\/localhost:\d+\/api/g);
                if (localhostMatches && localhostMatches.length > 0) {
                    log.warning(`Encontradas ${localhostMatches.length} referencias a localhost en ${file}`);
                    log.warning(`Ejemplos: ${localhostMatches.slice(0, 3).join(', ')}${localhostMatches.length > 3 ? ', ...' : ''}`);
                    issues++;
                }
            }

            if (issues > 0) {
                log.warning(`Se encontraron ${issues} problemas. Es posible que necesites reconstruir el frontend.`);
                const rebuildAnswer = await askQuestion("¿Deseas reconstruir el frontend ahora? (s/n): ");
                if (rebuildAnswer.toLowerCase() === 's') {
                    await rebuildFrontend();
                }
            } else {
                log.success("No se encontraron problemas con URLs hardcodeadas en el frontend");
            }
        }
    } catch (error) {
        log.error(`Error al verificar problemas comunes: ${error.message}`);
    }

    return issues;
}

// Función principal
async function main() {
    log.title("VERIFICADOR DE CONFIGURACIÓN DE PORTFOLIO");
    log.info("Este script te ayudará a encontrar la configuración óptima para tu aplicación");

    try {
        // Preguntar si estamos configurando para producción o desarrollo
        const targetEnv = await askQuestion("¿Configurar para producción? (s/n): ");
        const isProduction = targetEnv.toLowerCase() === 's';

        if (isProduction) {
            log.title("CONFIGURACIÓN PARA PRODUCCIÓN");

            // Preguntar por el puerto de producción
            const port = await askQuestion("Ingresa el puerto para producción (recomendado: 7001): ");

            // Actualizar archivos para producción
            await updateEnvFile(port, true);
            await updateDockerComposeFile(port, true);
            await updateNginxConfig(port, true);
            await updateViteConfig(port);

            // Verificar si tenemos que reconstruir el frontend
            if (await hasDistFolder()) {
                const rebuildAnswer = await askQuestion("¿Deseas reconstruir el frontend para aplicar los cambios? (s/n): ");
                if (rebuildAnswer.toLowerCase() === 's') {
                    await rebuildFrontend();
                }
            }

            log.success("¡Configuración para producción completada!");
            log.info("La aplicación está lista para ser desplegada en circuitprompt.com.ar");
            log.info("Recuerda ejecutar los scripts de despliegue para aplicar los cambios");
        } else {
            log.title("CONFIGURACIÓN PARA DESARROLLO LOCAL");

            // Verificar problemas comunes primero
            await checkCommonIssues();

            // Buscar la mejor configuración automáticamente
            const bestPort = await findBestConfiguration();

            if (bestPort) {
                log.success(`¡Configuración exitosa con puerto ${bestPort}!`);
                log.info("Ahora puedes ejecutar la aplicación normalmente");
            } else {
                log.error("No se pudo encontrar una configuración que funcione automáticamente");
                log.info("Intenta configurar manualmente o verifica tu red");
            }
        }
    } catch (error) {
        log.error(`Error durante la verificación: ${error.message}`);
    } finally {
        rl.close();
    }
}

// Ejecutar la función principal
main(); 
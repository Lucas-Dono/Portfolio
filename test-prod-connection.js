#!/usr/bin/env node

import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
import readline from 'readline';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

// Obtener la ruta actual usando ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer archivo .env.prod si existe, de lo contrario .env
const prodEnvPath = path.join(process.cwd(), '.env.prod');
const devEnvPath = path.join(process.cwd(), '.env');

if (fs.existsSync(prodEnvPath)) {
    dotenv.config({ path: prodEnvPath });
    console.log('Usando archivo de configuración: .env.prod');
} else {
    dotenv.config({ path: devEnvPath });
    console.log('Archivo .env.prod no encontrado, usando .env');
}

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

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para preguntar al usuario
const ask = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

// Función para comprobar si un puerto está abierto
async function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.setTimeout(3000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, host);
    });
}

// Función para probar una URL y devolver el resultado
async function testEndpoint(url, description) {
    log.info(`Probando ${description}: ${url}`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        const status = response.status;
        let body;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
            if (body.length > 100) {
                body = body.substring(0, 100) + '...';
            }
        }

        if (status >= 200 && status < 300) {
            log.success(`✅ ${description}: Respuesta exitosa (${status})`);
            return { success: true, status, body };
        } else {
            log.error(`❌ ${description}: Error ${status}`);
            return { success: false, status, body };
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            log.error(`❌ ${description}: Tiempo de espera agotado`);
            return { success: false, error: 'Timeout' };
        }
        log.error(`❌ ${description}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Función principal
async function main() {
    log.header('TEST DE CONECTIVIDAD API PORTFOLIO - MODO PRODUCCIÓN');

    // Obtener puertos del archivo .env.prod
    const apiPort = process.env.PORT || '7001';
    log.info(`Puerto API configurado: ${apiPort}`);

    // Verificar si los puertos están abiertos
    log.header('VERIFICACIÓN DE PUERTOS');

    const isApiPortOpen = await checkPort('localhost', apiPort);
    if (isApiPortOpen) {
        log.success(`✅ Puerto API (${apiPort}) está abierto y aceptando conexiones`);
    } else {
        log.error(`❌ Puerto API (${apiPort}) no está respondiendo`);
    }

    // Probar endpoints API
    log.header('PRUEBAS DE ENDPOINTS API');

    // Verificar health check
    const healthResult = await testEndpoint(`http://localhost:${apiPort}/health`, 'Health check');

    // Verificar API de servicios
    const apiResult = await testEndpoint(`http://localhost:${apiPort}/api/servicios`, 'API de servicios');

    // Probar CORS
    log.header('PRUEBA DE CORS');

    try {
        // Simular solicitud CORS desde el frontend
        const corsOrigin = process.env.CORS_FRONT || 'https://circuitprompt.com.ar';
        const corsResponse = await fetch(`http://localhost:${apiPort}/api/servicios`, {
            headers: {
                'Origin': corsOrigin,
                'Accept': 'application/json'
            }
        });

        const corsHeaders = {
            'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
            'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
            'access-control-allow-headers': corsResponse.headers.get('access-control-allow-headers')
        };

        if (corsHeaders['access-control-allow-origin']) {
            log.success('✅ CORS está correctamente configurado');
            log.info(`CORS Origin: ${corsHeaders['access-control-allow-origin']}`);

            if (corsHeaders['access-control-allow-origin'] === corsOrigin) {
                log.success(`✅ CORS Origin coincide con el configurado: ${corsOrigin}`);
            } else {
                log.warning(`⚠️ CORS Origin devuelto (${corsHeaders['access-control-allow-origin']}) no coincide con el configurado: ${corsOrigin}`);
            }
        } else {
            log.error('❌ CORS no está correctamente configurado');
        }
    } catch (error) {
        log.error(`❌ Error en prueba CORS: ${error.message}`);
    }

    log.header('RESULTADOS');

    if (!isApiPortOpen) {
        log.error('❌ El servidor no está escuchando en el puerto configurado.');
        log.warning('- Verifica que el docker-compose-prod.yml tenga el puerto 7001 correctamente configurado');
        log.warning('- Asegúrate de que .env.prod tenga PORT=7001');
    } else if (!healthResult?.success) {
        log.error('❌ El servidor está escuchando, pero el health check no responde correctamente.');
    } else if (!apiResult?.success) {
        log.error('❌ El servidor está respondiendo, pero la API de servicios no funciona correctamente.');
    } else {
        log.success('✅ El servidor API está correctamente configurado para producción.');
        log.info('Cuando despliegues en tu servidor cloud, solo necesitarás asegurarte de que:');
        log.info('1. El puerto 7001 esté expuesto y accesible');
        log.info('2. Las configuraciones CORS permitan solicitudes desde tu dominio');
    }

    log.info('\nPruebas completadas.');
    rl.close();
}

// Ejecutar
main().catch(error => {
    log.error(`Error inesperado: ${error.message}`);
    rl.close();
}); 
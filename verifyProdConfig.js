/**
 * Script para verificar la configuración de producción
 * Ejecutar con: node verifyProdConfig.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisificar exec
const execAsync = promisify(exec);

// Configurar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno de producción
dotenv.config({ path: '.env.prod' });

// Función para mostrar mensajes con colores
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Función para imprimir mensajes con formato
const print = {
    info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.cyan}📋 ${msg}${colors.reset}`),
};

// Verificar archivos requeridos
async function checkRequiredFiles() {
    print.section('Verificando archivos requeridos');

    const requiredFiles = [
        { path: 'server.js', description: 'Archivo principal del servidor' },
        { path: 'package.json', description: 'Configuración del proyecto' },
        { path: '.env.prod', description: 'Variables de entorno de producción' },
        { path: 'WHATSAPP-GUIDE.md', description: 'Guía de WhatsApp Web', required: false },
        { path: 'setup-whatsapp.sh', description: 'Script de instalación de WhatsApp', required: false },
    ];

    // Verificar si el frontend ya está compilado
    try {
        await fs.promises.access('dist', fs.constants.F_OK);
        requiredFiles.push({ path: 'dist/index.html', description: 'Frontend compilado' });
        print.info('Se encontró la carpeta dist, verificando archivos compilados');
    } catch (err) {
        print.info('No se encontró la carpeta dist. Primero debes compilar el frontend con "npm run build"');
    }

    let allPresent = true;
    for (const file of requiredFiles) {
        try {
            await fs.promises.access(file.path, fs.constants.F_OK);
            print.success(`${file.path} - ${file.description}`);
        } catch (err) {
            if (file.required === false) {
                print.warning(`${file.path} - ${file.description} (Recomendado pero no obligatorio)`);
            } else {
                print.error(`No se encontró ${file.path} - ${file.description}`);
                allPresent = false;
            }
        }
    }

    return allPresent;
}

// Verificar variables de entorno críticas
function checkEnvVars() {
    print.section('Verificando variables de entorno críticas');

    const criticalVars = [
        { name: 'PORT', defaultValue: '5001', description: 'Puerto del servidor' },
        { name: 'NODE_ENV', expectedValue: 'production', description: 'Entorno (debe ser production)' },
        { name: 'JWT_SECRET', description: 'Secreto para tokens JWT' },
        { name: 'ADMIN_USER', description: 'Usuario administrador' },
        { name: 'ADMIN_PASS', description: 'Contraseña de administrador' },
        { name: 'DB_NAME', description: 'Nombre de la base de datos' },
        { name: 'DB_USER', description: 'Usuario de la base de datos' },
        { name: 'DB_PASSWORD', description: 'Contraseña de la base de datos' },
        { name: 'DB_HOST', description: 'Host de la base de datos' },
        { name: 'DB_PORT', defaultValue: '5432', description: 'Puerto de la base de datos' },
        { name: 'CORS_FRONT', description: 'URL del frontend para CORS' },
        { name: 'VITE_API_URL', description: 'URL de la API para el frontend' },
        { name: 'WHATSAPP_DISABLE_WEB', description: 'Desactivar WhatsApp Web' },
        { name: 'GROUP_CHAT_ID', required: false, description: 'ID del grupo de WhatsApp' },
    ];

    let allValid = true;
    let missingCount = 0;

    for (const v of criticalVars) {
        const value = process.env[v.name];

        if (!value && !v.defaultValue && v.required !== false) {
            print.error(`${v.name} - No está definida (${v.description})`);
            missingCount++;
            allValid = false;
        } else if (v.expectedValue && value !== v.expectedValue) {
            print.warning(`${v.name} - Valor: ${value}, esperado: ${v.expectedValue} (${v.description})`);
            allValid = false;
        } else if (!value && v.defaultValue) {
            print.warning(`${v.name} - Usando valor por defecto: ${v.defaultValue} (${v.description})`);
        } else if (!value && v.required === false) {
            print.warning(`${v.name} - No definida (${v.description}), opcional para algunas funciones`);
        } else {
            const displayValue = v.name.includes('PASSWORD') || v.name.includes('SECRET') || v.name.includes('PASS')
                ? '********'
                : value;
            print.success(`${v.name} - ${displayValue} (${v.description})`);
        }
    }

    if (missingCount > 0) {
        print.warning(`Faltan ${missingCount} variables críticas. Edita el archivo .env.prod para configurarlas.`);
    }

    return allValid;
}

// Verificar dependencias críticas
function checkDependencies() {
    print.section('Verificando dependencias críticas');

    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const criticalDeps = [
            { name: 'express', description: 'Servidor web' },
            { name: 'whatsapp-web.js', description: 'Cliente de WhatsApp' },
            { name: 'sequelize', description: 'ORM para la base de datos' },
            { name: 'pg', description: 'Cliente PostgreSQL' },
            { name: 'jsonwebtoken', description: 'Autenticación JWT' },
            { name: 'nodemailer', description: 'Envío de correos' },
            { name: 'openai', description: 'API de OpenAI' }
        ];

        let allPresent = true;
        for (const dep of criticalDeps) {
            if (dependencies[dep.name]) {
                print.success(`${dep.name}@${dependencies[dep.name]} - ${dep.description}`);
            } else {
                print.error(`${dep.name} - No está instalada (${dep.description})`);
                allPresent = false;
            }
        }

        return allPresent;
    } catch (err) {
        print.error(`Error al leer package.json: ${err.message}`);
        return false;
    }
}

// Verificar carpeta dist
function checkDist() {
    print.section('Verificando frontend compilado');

    try {
        const distPath = path.join(__dirname, 'dist');
        const files = fs.readdirSync(distPath);

        const requiredAssets = ['index.html', 'assets'];
        const missingAssets = requiredAssets.filter(asset => !files.includes(asset) &&
            !files.some(file => file.startsWith(asset)));

        if (missingAssets.length === 0) {
            print.success(`Frontend compilado correctamente. Archivos: ${files.length}`);
            return true;
        } else {
            print.error(`Faltan archivos importantes en la carpeta dist: ${missingAssets.join(', ')}`);
            return false;
        }
    } catch (err) {
        print.error(`Error al verificar carpeta dist: ${err.message}`);
        return false;
    }
}

// Verificar servicios externos
async function checkExternalServices() {
    print.section('Verificando servicios externos');

    let servicesOk = true;

    // Verificar Docker
    try {
        const { stdout } = await execAsync('docker --version');
        print.success(`Docker: ${stdout.trim()}`);

        // Verificar si Docker está en ejecución
        await execAsync('docker info');
        print.success('Docker daemon está en ejecución');
    } catch (err) {
        if (err.message.includes('command not found')) {
            print.warning('Docker no está instalado. Algunas funciones podrían no estar disponibles.');
        } else {
            print.warning(`Docker está instalado pero no en ejecución: ${err.message}`);
        }
        servicesOk = false;
    }

    // Verificar PostgreSQL localmente
    try {
        await execAsync('which psql');
        print.success('PostgreSQL: Cliente instalado localmente');
    } catch (err) {
        print.warning('PostgreSQL: Cliente no instalado localmente. La base de datos solo funcionará con Docker.');
        servicesOk = false;
    }

    // Verificar Node.js
    try {
        const { stdout } = await execAsync('node --version');
        print.success(`Node.js: ${stdout.trim()}`);
    } catch (err) {
        print.error(`Error al verificar Node.js: ${err.message}`);
        servicesOk = false;
    }

    return servicesOk;
}

// Función principal
async function main() {
    console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN DE PRODUCCIÓN\n');

    const filesOk = await checkRequiredFiles();
    const envVarsOk = checkEnvVars();
    const dependenciesOk = checkDependencies();
    const servicesOk = await checkExternalServices();

    let distOk = false;
    try {
        await fs.promises.access('dist', fs.constants.F_OK);
        distOk = checkDist();
    } catch (err) {
        print.warning('Frontend no compilado. Ejecuta "npm run build" antes de desplegar.');
    }

    console.log('\n📊 RESUMEN:');
    console.log(`${filesOk ? '✅' : '❌'} Archivos requeridos`);
    console.log(`${envVarsOk ? '✅' : '⚠️'} Variables de entorno`);
    console.log(`${dependenciesOk ? '✅' : '❌'} Dependencias`);
    console.log(`${distOk ? '✅' : '⚠️'} Frontend compilado`);
    console.log(`${servicesOk ? '✅' : '⚠️'} Servicios externos`);

    const readyForProd = filesOk && envVarsOk && dependenciesOk && distOk;

    if (readyForProd) {
        console.log(`\n${colors.green}✅ ¡Todo está listo para producción! Puedes ejecutar:`);
        console.log(`   ./test-prod.sh    - para probar localmente`);
        console.log(`   pm2 start server.js --name circuitprompt -- --env production    - para desplegar${colors.reset}\n`);
    } else if (filesOk && envVarsOk && dependenciesOk) {
        console.log(`\n${colors.yellow}⚠️ Casi listo. Ejecuta estos comandos:${colors.reset}`);
        if (!distOk) console.log(`   npm run build              - para compilar el frontend`);
        console.log(`   ./test-prod.sh             - para probar localmente después\n`);
    } else {
        console.log(`\n${colors.yellow}⚠️ Hay problemas que debes solucionar antes de desplegar en producción.${colors.reset}\n`);
    }

    // Mensaje adicional si Docker no está disponible
    if (!servicesOk) {
        console.log(`${colors.blue}💡 Tip: Para usar Docker, asegúrate de que esté instalado y en ejecución:${colors.reset}`);
        console.log(`   sudo systemctl start docker   - Iniciar servicio Docker`);
        console.log(`   sudo docker-compose up -d     - Iniciar servicios con Docker Compose\n`);
    }
}

main().catch(err => {
    console.error(`\n${colors.red}❌ Error durante la verificación: ${err.message}${colors.reset}\n`);
}); 
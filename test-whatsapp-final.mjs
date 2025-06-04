// Importar correctamente un módulo CommonJS en un entorno ESM
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import path from 'path';
import { fileURLToPath } from 'url';
import { puppeteerOptions } from './server/whatsapp-config.js';

// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Iniciando cliente de WhatsApp Web...');
console.log('📂 Ruta de Chromium:', puppeteerOptions.executablePath);
console.log('📂 Ruta de almacenamiento:', path.join(__dirname, '.wwebjs_auth'));

// Crear cliente con configuración personalizada
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "test-whatsapp",
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: puppeteerOptions
});

// Manejar eventos
client.on('qr', (qr) => {
    console.log('✅ Código QR generado:');
    console.log(qr);
    console.log('🎉 WhatsApp Web funciona correctamente.');
    setTimeout(() => process.exit(0), 1000);
});

client.on('auth_failure', (error) => {
    console.error('❌ Error de autenticación:', error);
    process.exit(1);
});

client.on('disconnected', (reason) => {
    console.error('❌ Desconexión:', reason);
    process.exit(1);
});

// Inicializar con timeout
const timeout = setTimeout(() => {
    console.error('❌ Timeout al inicializar WhatsApp Web');
    process.exit(1);
}, 30000);

client.initialize()
    .catch(error => {
        console.error('❌ Error al inicializar WhatsApp Web:', error);
        clearTimeout(timeout);
        process.exit(1);
    });

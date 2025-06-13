// Script para actualizar la configuración de WhatsApp Web en server.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo server.js
const serverJsPath = path.join(__dirname, 'server.js');

console.log('🔍 Buscando configuración de WhatsApp Web en server.js...');

// Leer el archivo
let serverJsContent;
try {
    serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
    console.log('✅ Archivo server.js encontrado');
} catch (error) {
    console.error('❌ Error al leer server.js:', error.message);
    process.exit(1);
}

// Buscar la sección de inicialización de cliente WhatsApp Web
const whatsappClientSection = serverJsContent.match(/client = new Client\(\{[\s\S]*?\}\);/);

if (!whatsappClientSection) {
    console.error('❌ No se encontró la inicialización del cliente WhatsApp Web en server.js');
    process.exit(1);
}

console.log('✅ Sección de inicialización de WhatsApp Web encontrada');

// Crear una copia de seguridad
try {
    fs.writeFileSync(`${serverJsPath}.bak`, serverJsContent);
    console.log('✅ Copia de seguridad creada en server.js.bak');
} catch (error) {
    console.error('❌ Error al crear copia de seguridad:', error.message);
    process.exit(1);
}

// Configuración actualizada más robusta para entornos de servidor
const updatedClientConfig = `client = new Client({
    authStrategy: new LocalAuth({
      clientId: "contact-bot",
      dataPath: process.env.WHATSAPP_DATA_PATH || './.wwebjs_auth'
    }),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--single-process',
        '--window-size=800,600',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--remote-debugging-port=0'
      ],
      timeout: 60000
    }
  });`;

// Reemplazar la sección en el archivo
const updatedContent = serverJsContent.replace(whatsappClientSection[0], updatedClientConfig);

// Escribir el archivo actualizado
try {
    fs.writeFileSync(serverJsPath, updatedContent);
    console.log('✅ Archivo server.js actualizado correctamente');
    console.log('🚀 Configuración de WhatsApp Web mejorada para entornos de servidor');
} catch (error) {
    console.error('❌ Error al actualizar server.js:', error.message);
    process.exit(1);
}

console.log(`
📋 INSTRUCCIONES:
1. Sube los archivos actualizados al servidor
2. Ejecuta: chmod +x fix-server-whatsapp.sh
3. Ejecuta: ./fix-server-whatsapp.sh
4. Sigue las instrucciones que aparecerán en pantalla
`); 
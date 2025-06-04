// Script para aplicar parche al server.js y usar la configuración de WhatsApp

const fs = require('fs');
const path = require('path');

// Ruta al archivo server.js
const serverJsPath = path.join(__dirname, 'server.js');

console.log('🔍 Buscando sección de WhatsApp Web en server.js...');

// Leer el archivo
let serverJsContent;
try {
    serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
    console.log('✅ Archivo server.js encontrado');
} catch (error) {
    console.error('❌ Error al leer server.js:', error.message);
    process.exit(1);
}

// Buscar la sección de WhatsApp Web
const whatsappSection = serverJsContent.match(/\/\/ Inicializamos WhatsApp Web[\s\S]*?client = new Client\({[\s\S]*?\}\);/);

if (!whatsappSection) {
    console.error('❌ No se encontró la sección de inicialización de WhatsApp Web en server.js');
    process.exit(1);
}

console.log('✅ Sección de WhatsApp Web encontrada');

// Crear una copia de seguridad
try {
    fs.writeFileSync(`${serverJsPath}.bak`, serverJsContent);
    console.log('✅ Copia de seguridad creada en server.js.bak');
} catch (error) {
    console.error('❌ Error al crear copia de seguridad:', error.message);
    process.exit(1);
}

// Preparar el código de reemplazo
const replacementCode = `// Inicializamos WhatsApp Web con persistencia en ./session solo si no está deshabilitado
let client;
let qrCode = '';

// Verificar si WhatsApp Web está deshabilitado
const whatsappDisabled = process.env.WHATSAPP_DISABLE_WEB === 'true';

if (!whatsappDisabled) {
  // Cargar configuración personalizada
  let whatsappConfig;
  try {
    whatsappConfig = require('./whatsapp-config');
    console.log('✅ Configuración de WhatsApp cargada correctamente');
  } catch (error) {
    console.warn('⚠️ No se encontró archivo de configuración whatsapp-config.js, usando valores por defecto');
    whatsappConfig = {
      puppeteerOptions: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    };
  }

  // Usar variable de entorno si está definida
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log(\`✅ Usando Chromium desde variable de entorno: \${process.env.PUPPETEER_EXECUTABLE_PATH}\`);
    whatsappConfig.puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "contact-bot",
      dataPath: process.env.WHATSAPP_DATA_PATH || './.wwebjs_auth'
    }),
    puppeteer: whatsappConfig.puppeteerOptions
  });`;

// Reemplazar la sección en el archivo
const updatedContent = serverJsContent.replace(whatsappSection[0], replacementCode);

// Escribir el archivo actualizado
try {
    fs.writeFileSync(serverJsPath, updatedContent);
    console.log('✅ Archivo server.js actualizado correctamente');
    console.log('🚀 Ahora WhatsApp Web usará la configuración personalizada y la variable de entorno PUPPETEER_EXECUTABLE_PATH');
} catch (error) {
    console.error('❌ Error al actualizar server.js:', error.message);
    process.exit(1);
}

console.log('🎉 Parche aplicado con éxito. Reinicia el servidor para aplicar los cambios.'); 
import express from 'express';
import basicAuth from 'express-basic-auth';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import bodyParser from 'body-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import {
  classificationPrompt,
  baseSystemPrompt,
  getKnowledgeForCategory
} from './src/ia/prompts.js';

// Importaciones para la base de datos y autenticación
import connectDB from './config/database.js';
// Importar rutas SQL para autenticación (nuevo)
import authRoutes from './routes/authRoutesSql.js';
// Importar rutas de pago
import paymentRoutes from './routes/paymentRoutes.js';
// Importar rutas de reembolso
import refundRoutes from './routes/refundRoutes.js';
// Importar rutas de usuario
import userRoutes from './routes/userRoutes.js';
// Importar rutas de administración
import adminRoutes from './routes/adminRoutes.js';
// Importar rutas de precios
import preciosRoutes from './routes/preciosRoutes.js';

// Importar controladores de pago
import { processPayment, createPreference, handleWebhook, processApiPayment } from './controllers/paymentController.js';

// Rutas explícitas para servicios de usuario (backup para solucionar problemas de rutas)
import * as userServicesController from './controllers/userServicesController.js';

dotenv.config(); // Cargar variables de entorno

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// Llamamos a la inicialización de la base de datos PostgreSQL (Sequelize)
connectDB().then(sequelizeInstance => {
  if (sequelizeInstance || process.env.DISABLE_DB === 'true' || process.env.ENABLE_FILE_FALLBACK === 'true') {
    console.log('✅ Inicialización de base de datos (PostgreSQL/Sequelize o fallback) completada.');
    // Aquí podrías continuar con la configuración de la app que depende de la BD si es necesario
  } else {
    console.error('❌ No se pudo inicializar la base de datos PostgreSQL y no hay modo fallback habilitado. El servidor podría no funcionar correctamente.');
    // Considera no iniciar el servidor o manejar este caso críticamente si la BD es esencial.
  }
}).catch(error => {
  console.error('❌ Fallo crítico durante la inicialización de la base de datos (PostgreSQL/Sequelize):', error);
  // Considera no iniciar el servidor.
});

// IMPORTANTE: Configurar body-parser ANTES de las rutas
// Parsear solicitudes application/json
app.use(bodyParser.json());
// Parsear solicitudes application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para manejar métodos PATCH y otros explícitamente
app.use((req, res, next) => {
  if (req.method === 'PATCH') {
    console.log(`🔧 Recibida solicitud PATCH: ${req.originalUrl}`);
  }
  next();
});

// Configuración de CORS: permite los orígenes indicados en .env
const corsOrigins = [
  process.env.CORS_FRONT,
  process.env.CORS_BACK,
  'https://circuitprompt.com.ar',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // Vite usa este puerto por defecto
  'http://localhost:5001',
  'http://127.0.0.1:5173', // También incluir 127.0.0.1
  'https://www.mercadopago.com',
  'https://api.mercadopago.com',
  'https://secure.mercadopago.com',
  'https://sdk.mercadopago.com',
  'https://*.mercadopago.com',
  'https://*.mercadolibre.com',
  'https://*.mlstatic.com'
].filter(Boolean);

console.log('📍 Configuración CORS - Orígenes permitidos:', corsOrigins);

// Configuración CORS completa usando el middleware cors
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);

    // En producción, permitir explícitamente el dominio principal
    if (origin === 'https://circuitprompt.com.ar') {
      return callback(null, true);
    }

    // Permitir todos los orígenes en desarrollo para facilitar pruebas
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // En producción, verificar contra la lista de orígenes permitidos
    if (corsOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origen bloqueado por CORS: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization',
    'X-HTTP-Method-Override', 'x-meli-session-id', 'device-id', 'x-idempotency-key',
    'x-flow-id', 'x-product-id', 'x-tracking-id', 'Cookie', 'Set-Cookie'
  ],
  exposedHeaders: ['Content-Disposition', 'Set-Cookie']
}));

// Middleware adicional para asegurar que siempre se respondan preflight requests OPTIONS
app.options('*', cors());

// Middleware para forzar encabezados CORS en cada respuesta
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Middleware para logger básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Servir archivos estáticos del frontend (build de Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware especial para depurar rutas de servicios
app.use('/api/users/services', (req, res, next) => {
  console.log(`🔎 Depuración de servicios: ${req.method} ${req.originalUrl}`);
  console.log(`🔧 Parámetros de ruta:`, req.params);
  console.log(`🔍 Query:`, req.query);
  console.log(`📦 Encabezados:`, req.headers);

  const oldSend = res.send;
  res.send = function (data) {
    console.log(`📤 Respuesta enviada:`, typeof data === 'string' ? data.substring(0, 200) : '[Objeto]');
    oldSend.apply(res, arguments);
  };

  next();
});

// Middleware para configurar cookies
app.use((req, res, next) => {
  // Guardar una referencia al método original de cookie
  const originalCookie = res.cookie;

  // Reemplazar el método con nuestra versión personalizada
  res.cookie = function (name, value, options = {}) {
    // Para todas las cookies, usar opciones compatibles para cross-domain
    options = {
      ...options,
      sameSite: 'none',
      secure: true,
      httpOnly: false,
      path: '/'
    };

    // Registrar cada cookie
    console.log(`✅ Configurando cookie: ${name}`);

    // Llamar al método original con las opciones modificadas
    return originalCookie.call(this, name, value, options);
  };

  next();
});

// Middleware para habilitar solicitudes cross-origin
app.use((req, res, next) => {
  // Establecer una cookie inicial simple como prueba
  res.cookie('test-cookie', 'test-value', { sameSite: 'none', secure: true });
  next();
});

// Middleware de autenticación básica para rutas /admin
app.use('/admin', basicAuth({ users: { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'password' }, challenge: true }));

// Rutas de autenticación (ahora usando SQL)
app.use('/api/auth', authRoutes);

// Rutas de pago
app.use('/api/payments', paymentRoutes);

// Rutas de reembolsos
app.use('/api/refunds', refundRoutes);

// Rutas de usuario
app.use('/api/users', userRoutes);

// Rutas de precios
app.use('/api', preciosRoutes);

// Rutas de administración
app.use('/api/admin', (req, res, next) => {
  // Verificación simplificada para desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔐 Modo desarrollo: Bypass de autenticación para rutas de administración');
    console.log('Headers recibidos:', req.headers);

    // Establecer un usuario administrador por defecto para desarrollo
    req.user = {
      userId: 'admin-user',
      role: 'admin'
    };

    return next();
  }

  // En producción, verificar el token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado: Se requiere token de administrador' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error al verificar token de administrador:', error);
    return res.status(403).json({ error: 'Token inválido o sin permisos suficientes' });
  }
}, adminRoutes);

// Rutas explícitas para servicios de usuario (backup para solucionar problemas de rutas)
// Ruta GET para obtener servicios
app.get('/api/users/services', userServicesController.getUserServices);
// Ruta POST para registrar servicios
app.post('/api/users/services', userServicesController.registerUserService);
// Rutas para actualizar progreso
app.patch('/api/users/services/:serviceId/progress', userServicesController.updateServiceProgress);
// Rutas explícitas para detalles - soportar todos los métodos comunes
app.put('/api/users/services/:serviceId/details', userServicesController.updateServiceDetails);
app.patch('/api/users/services/:serviceId/details', userServicesController.updateServiceDetails);
app.post('/api/users/services/:serviceId/details', userServicesController.updateServiceDetails);

// Ruta de debug para mostrar servicios
app.get('/api/users/services/debug', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const { fileURLToPath } = await import('url');
    const path = await import('path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const USER_SERVICES_FILE = path.join(__dirname, './data/userServices.json');

    const data = await fs.readFile(USER_SERVICES_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas de pagos
app.post('/api/payments/process', processPayment);
app.post('/api/payments/preference', createPreference);
app.post('/api/payments/process-api', processApiPayment); // Nueva ruta para procesar pagos via API
app.post('/api/payments/webhook', handleWebhook);

// Inicializamos WhatsApp Web con persistencia en ./session solo si no está deshabilitado
let client;
let qrCode = '';

// Verificar si WhatsApp Web está deshabilitado
const whatsappDisabled = process.env.WHATSAPP_DISABLE_WEB === 'true';

if (!whatsappDisabled) {
  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "contact-bot",
      dataPath: process.env.WHATSAPP_DATA_PATH || './.wwebjs_auth'
    }),
    puppeteer: {
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
  });

  client.on('qr', qr => {
    qrCode = qr;
    console.log('Escanea este QR en tu WhatsApp:');
    qrcode.generate(qr, { small: true });
  });
} else {
  console.log('⚠️ WhatsApp Web deshabilitado en modo desarrollo');
}

//client.on('ready', async () => {
//  console.log('✅ WhatsApp Web listo');

// Listar grupos disponibles en consola
//  const chats = await client.getChats();
//  const groups = chats.filter(chat => chat.isGroup);
// console.log('📋 Grupos disponibles:');
//  groups.forEach(g => console.log(`· ${g.name} -> ${g.id._serialized}`));
//});

// Configurar eventos de WhatsApp solo si no está deshabilitado
if (!whatsappDisabled) {
  // Escuchar mensajes para aceptar enlaces de invitación a grupos
  client.on('message', async msg => {
    if (msg.body.startsWith('https://chat.whatsapp.com/')) {
      try {
        const inviteCode = msg.body.split('https://chat.whatsapp.com/')[1].trim();
        const group = await client.acceptInvite(inviteCode);
        console.log(`🚀 Te uniste al grupo "${group.name}" con ID ${group.id._serialized}`);
      } catch (err) {
        console.error('Error al aceptar invitación de grupo:', err);
      }
    }
  });

  // Escuchar eventos de autenticación y desconexión para debug
  client.on('authenticated', () => {
    console.log('✅ WhatsApp autenticado con éxito');
    // Limpiar código QR cuando ya está autenticado
    qrCode = '';
  });

  client.on('auth_failure', msg => {
    console.error('❌ Fallo de autenticación en WhatsApp Web:', msg);
    // Regenerar QR en caso de fallo de autenticación
    console.log('🔄 Reiniciando cliente para generar nuevo QR...');
    setTimeout(() => {
      client.initialize().catch(err => console.error('Error al reinicializar WhatsApp Web:', err));
    }, 3000);
  });

  client.on('disconnected', reason => {
    console.warn('⚠️ Cliente WhatsApp desconectado. Razón:', reason);
    // Reintentar conexión después de un tiempo
    console.log('🔄 Reiniciando cliente en 5 segundos...');
    setTimeout(() => {
      client.initialize().catch(err => console.error('Error al reinicializar WhatsApp Web:', err));
    }, 5000);
  });

  // Agregar escucha de errores de Puppeteer
  client.on('error', error => {
    console.error('❌ Error en cliente de WhatsApp:', error);
  });

  // Inicializo WhatsApp Web para generar QR al arrancar
  client.initialize().catch(err => console.error('Error al inicializar WhatsApp Web:', err));
}

// Ruta segura para obtener el último QR
app.get('/admin/qr', (req, res) => {
  if (whatsappDisabled) {
    return res.status(503).send('WhatsApp Web está deshabilitado en este entorno');
  }
  if (!qrCode) return res.status(404).send('QR no generado todavía');

  // Dar opción de ver el QR en formato HTML con una imagen escaneable
  if (req.query.format === 'html' || req.headers.accept?.includes('text/html')) {
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
    res.send(`
      <html>
        <head>
          <title>WhatsApp Web QR - CircuitPrompt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
            img { max-width: 100%; margin: 20px 0; border: 1px solid #ddd; }
            .refresh { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
            .timer { font-size: 0.9em; color: #666; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>Escanea este código QR con WhatsApp</h2>
          <p>Abre WhatsApp en tu teléfono > Menú > WhatsApp Web > Escanea este código</p>
          <img src="${qrImage}" alt="WhatsApp QR Code">
          <div>
            <button class="refresh" onclick="window.location.reload()">Refrescar QR</button>
          </div>
          <p class="timer">El QR se actualiza automáticamente cada 60 segundos</p>
          <script>
            setTimeout(() => window.location.reload(), 60000);
          </script>
        </body>
      </html>
    `);
  } else {
    // Formato texto plano (original)
    res.type('text/plain').send(qrCode);
  }
});

// Ruta segura para reiniciar la sesión y generar nuevo QR
app.post('/admin/restart', (req, res) => {
  if (whatsappDisabled) {
    return res.status(503).json({
      ok: false,
      message: 'WhatsApp Web está deshabilitado en este entorno'
    });
  }
  client.destroy();
  client.initialize();
  qrCode = '';
  res.json({ ok: true, message: 'Reiniciando sesión y generando nuevo QR' });
});

// Interfaz de administración de WhatsApp
app.get('/admin/whatsapp', async (req, res) => {
  if (whatsappDisabled) {
    return res.status(503).send('WhatsApp Web está deshabilitado en este entorno');
  }

  // Verificar estado de la sesión
  let sessionStatus = 'No iniciado';
  let whatsappGroups = [];

  try {
    if (client.info) {
      sessionStatus = 'Conectado';

      // Intentar obtener los grupos a los que pertenece el bot
      try {
        const chats = await client.getChats();
        whatsappGroups = chats
          .filter(chat => chat.isGroup)
          .map(g => ({
            nombre: g.name,
            id: g.id._serialized,
            participantes: g.participants?.length || 'Desconocido'
          }));
      } catch (err) {
        console.error('Error al obtener grupos:', err);
      }
    }
  } catch (err) {
    sessionStatus = 'No autenticado';
  }

  // Crear interfaz HTML de administración
  res.send(`
    <html>
      <head>
        <title>Administración de WhatsApp - CircuitPrompt</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #3498db; }
          .card { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #ddd; }
          .status { padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: bold; }
          .status.connected { background: #d4edda; color: #155724; }
          .status.disconnected { background: #f8d7da; color: #721c24; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; }
          button { background: #3498db; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; }
          button:hover { background: #2980b9; }
          button.warning { background: #e74c3c; }
          button.warning:hover { background: #c0392b; }
          .actions { margin-top: 20px; }
          code { background: #f8f8f8; padding: 2px 4px; border-radius: 3px; font-size: 90%; }
        </style>
      </head>
      <body>
        <h1>Panel de Administración de WhatsApp</h1>
        
        <div class="card">
          <h2>Estado de la Conexión</h2>
          <div class="status ${sessionStatus === 'Conectado' ? 'connected' : 'disconnected'}">
            ${sessionStatus}
          </div>
          <div class="actions">
            <a href="/admin/qr?format=html"><button>Ver Código QR</button></a>
            <button onclick="reiniciarSesion()">Reiniciar Sesión</button>
          </div>
        </div>
        
        <div class="card">
          <h2>Grupos Disponibles (${whatsappGroups.length})</h2>
          ${whatsappGroups.length > 0 ? `
            <table>
              <tr>
                <th>Nombre</th>
                <th>ID</th>
                <th>Participantes</th>
              </tr>
              ${whatsappGroups.map(grupo => `
                <tr>
                  <td>${grupo.nombre}</td>
                  <td><code>${grupo.id}</code></td>
                  <td>${grupo.participantes}</td>
                </tr>
              `).join('')}
            </table>
            <p>Para usar estos grupos en tu aplicación, configura la variable <code>GROUP_CHAT_ID</code> en tu archivo .env con el ID del grupo deseado.</p>
          ` : `
            <p>No hay grupos disponibles o no estás autenticado.</p>
            <p>Para usar WhatsApp, primero debes:</p>
            <ol>
              <li>Escanear el <a href="/admin/qr?format=html">código QR</a> con tu teléfono</li>
              <li>Unirte a los grupos donde quieras que el bot envíe mensajes</li>
              <li>Actualizar esta página para ver los grupos disponibles</li>
            </ol>
          `}
        </div>
        
        <div class="card">
          <h2>Configuración en .env</h2>
          <p>Variables de entorno importantes:</p>
          <ul>
            <li><code>GROUP_CHAT_ID</code>: ID del grupo de WhatsApp para enviar mensajes</li>
            <li><code>WHATSAPP_DISABLE_WEB</code>: Establecer a 'true' para deshabilitar WhatsApp Web</li>
            <li><code>WHATSAPP_DATA_PATH</code>: Ruta para los archivos de sesión (opcional)</li>
          </ul>
        </div>
        
        <script>
          function reiniciarSesion() {
            if (confirm('¿Estás seguro? Se cerrará la sesión actual y tendrás que escanear un nuevo código QR.')) {
              fetch('/admin/restart', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                  alert(data.message);
                  window.location.href = '/admin/qr?format=html';
                })
                .catch(error => alert('Error: ' + error));
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Ruta principal de admin: redirige al panel de administración
app.get('/admin', (req, res) => {
  res.redirect('/admin/whatsapp');
});

// Configuración de Email (SMTP) para notificaciones de error con Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS // Debe ser una contraseña de aplicación de Gmail
  }
});

// Verifico la conexión SMTP y muestro resultado, ignorando errores de DNS temporales
transporter.verify((err, success) => {
  if (err) {
    // Ignorar error DNS temporal
    if (err.code === 'EDNS') {
      console.warn('⚠️ DNS lookup fallido para smtp.gmail.com, omitiendo verificación SMTP inicial');
    } else {
      console.error('❌ Error en verificación SMTP:', err);
    }
  } else {
    console.log('✅ SMTP verificado correctamente con Gmail');
  }
});

// Configuración de Google Sheets para fallback
const sheetsAuth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function fallback(error, formData) {
  try {
    // Envía email de notificación de error
    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: '⚠️ Error de WhatsApp Bot',
      text: `Error al enviar mensaje por WhatsApp:\n${error.message}`
    });
    console.log('👍 Notificación por email enviada correctamente');
  } catch (e) {
    console.error('Error al notificar por email:', e);
  }
  // Fallback a Google Sheets solo si ENABLE_SHEETS está activado
  if (process.env.ENABLE_SHEETS === 'true') {
    try {
      // Ajustar rango según nombre real de la hoja (por ejemplo 'Sheet1' o 'Hoja1')
      const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E';
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetRange,
        valueInputOption: 'RAW',
        resource: { values: [[new Date().toISOString(), formData.name, formData.email, formData.subject, formData.message]] }
      });
      console.log('👍 Datos guardados en Google Sheets correctamente');
    } catch (e) {
      console.error('Error al guardar en Google Sheets:', e);
    }
  } else {
    console.log('⚠️ Omisión de fallback a Google Sheets (ENABLE_SHEETS != true)');
  }
}

// Endpoint para recibir el formulario
app.post('/api/send-whatsapp', async (req, res) => {
  console.log('📨 POST /api/send-whatsapp recibido');
  console.log('Datos recibidos:', req.body);
  const { name, email, subject, message } = req.body;

  // Si WhatsApp está deshabilitado, usar directamente el fallback
  if (whatsappDisabled) {
    console.log('WhatsApp deshabilitado, usando fallback directamente');
    fallback(new Error('WhatsApp Web deshabilitado en este entorno'), req.body);
    return res.json({ ok: true, message: 'Datos guardados vía fallback (WhatsApp deshabilitado)' });
  }

  // Leer ID de grupo desde .env
  const chatId = process.env.GROUP_CHAT_ID;
  if (!chatId) {
    const errMsg = 'GROUP_CHAT_ID no configurado en .env';
    console.error('Error:', errMsg);
    return res.status(500).json({ ok: false, error: errMsg });
  }

  const text =
    `📥 *Nuevo formulario recibido* 📥\n\n` +
    `*Nombre:* ${name}\n` +
    `*Email:* ${email}\n` +
    `*Asunto:* ${subject}\n` +
    `*Mensaje:* ${message}`;

  try {
    console.log(`Enviando mensaje al chatId=${chatId}`);
    await client.sendMessage(chatId, text);
    console.log('Mensaje enviado con éxito');
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error al enviar WhatsApp:', err.message);
    fallback(err, req.body);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Ruta para probar solo el fallback de email
app.get('/admin/test-email', async (req, res) => {
  console.log('🔧 Ruta de prueba /admin/test-email invocada');
  const fakeData = { name: 'Test Fallback', email: 'test@example.com', subject: 'Prueba de fallback', message: 'Este es un mensaje de prueba' };
  try {
    await fallback(new Error('Fallo intencional para test'), fakeData);
    return res.send('Fallback de correo ejecutado correctamente. Revisa tu bandeja de entrada.');
  } catch (e) {
    console.error('Error al ejecutar fallback de test:', e);
    return res.status(500).send('Error ejecutando fallback.');
  }
});

// Endpoint principal de chat conversacional
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    // Llamada al clasificador de intenciones
    const classifyRes = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: classificationPrompt },
        { role: 'assistant', content: 'Historial:\n' + (history || []).join('\n') },
        { role: 'assistant', content: 'Mensaje: ' + message }
      ],
      max_tokens: 10,
      temperature: 0
    });
    const category = classifyRes.choices[0].message.content.trim();
    // Construcción del prompt del modelo principal
    let systemPrompt = baseSystemPrompt;
    const extra = getKnowledgeForCategory(category);
    if (extra) {
      systemPrompt += "\n\nContexto adicional:\n" + extra;
    }
    // Llamada a GPT-4 para generar la respuesta
    const chatRes = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []).map(h => ({ role: 'user', content: h })),
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    const answer = chatRes.choices[0].message.content;
    return res.json({ category, answer });
  } catch (err) {
    console.error('Error en /api/chat:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Sirvo frontend estático generado en 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback: para cualquier otra ruta que no sea API o admin, sirvo index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Manejador de rutas API no encontradas (especialmente importante para rutas de servicios)
app.all('/api/users/services/:serviceId/:action', (req, res) => {
  console.log(`⚠️ Intento de acceder a ruta no manejada: ${req.method} ${req.originalUrl}`);
  console.log(`📋 Parámetros disponibles:`, req.params);

  // Obtener el controlador correcto para el caso de servicios/detalles
  if (req.params.serviceId && req.params.action === 'details') {
    console.log(`🔄 Redirigiendo manualmente a la función updateServiceDetails`);
    return userServicesController.updateServiceDetails(req, res);
  }

  res.status(200).json({
    message: 'Ruta interceptada por el manejador de fallback',
    serviceId: req.params.serviceId,
    action: req.params.action,
    method: req.method,
    url: req.originalUrl,
    info: 'Intenta de nuevo mientras arreglamos este problema'
  });
});

// Configuración de JWT para autenticación
const JWT_SECRET = process.env.JWT_SECRET || 'secreto-desarrollo-cambiar-en-produccion';

// Endpoint para login con credenciales
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // En un caso real, verificaríamos contra una base de datos
    // Este es un ejemplo simplificado
    if (email && password && password.length >= 6) {
      // Generar información del usuario
      const user = {
        id: 'user-' + Math.floor(Math.random() * 1000),
        name: email.split('@')[0],
        email
      };

      // Crear token JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        user,
        token
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Credenciales inválidas'
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

// Endpoint para registro de usuarios
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // En un caso real, verificaríamos si el usuario ya existe y guardaríamos en BD
    if (name && email && password && password.length >= 6) {
      // Generar información del usuario
      const user = {
        id: 'user-' + Math.floor(Math.random() * 1000),
        name,
        email
      };

      // Crear token JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      return res.json({
        success: true,
        user,
        token
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Datos de registro inválidos'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

// Endpoint para autenticación con Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    // En un caso real, verificaríamos el token con Google
    // https://developers.google.com/identity/sign-in/web/backend-auth

    // Para fines de demostración, simulamos la verificación
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    // Aquí normalmente llamaríamos a la API de Google para validar el token
    // const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    // const data = await response.json();

    // Simulación de respuesta exitosa
    const googleUser = {
      id: 'google-' + Math.floor(Math.random() * 1000),
      name: 'Usuario de Google',
      email: 'usuario@gmail.com',
      provider: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/default-user'
    };

    // Crear token JWT para nuestra aplicación
    const appToken = jwt.sign({
      userId: googleUser.id,
      provider: 'google'
    }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      user: googleUser,
      token: appToken
    });

  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en autenticación con Google'
    });
  }
});

// Nuevo endpoint para iniciar el flujo de autenticación con Google usando ventana emergente
app.get('/api/auth/google/login', (req, res) => {
  try {
    // Obtener la URL de callback del parámetro de la consulta
    const callbackUrl = req.query.callback || `${process.env.CORS_FRONT || 'http://localhost:3001'}/html/auth-callback.html`;
    console.log('🔄 Iniciando flujo OAuth de Google con callback:', callbackUrl);

    // Configurar URL de redireccionamiento a la autenticación de Google (autenticación real)
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.VITE_API_URL + '/auth/google/callback')}&response_type=code&scope=email profile&state=${encodeURIComponent(callbackUrl)}`;

    console.log('🔄 Redirigiendo a autenticación de Google:', googleAuthUrl);
    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error('❌ Error iniciando flujo OAuth de Google:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h2>Error de autenticación</h2>
          <p>Lo sentimos, ocurrió un error al iniciar la autenticación con Google.</p>
          <p>Detalles: ${error.message}</p>
          <p><a href="${process.env.CORS_FRONT || 'http://localhost:3001'}/login">Volver al inicio de sesión</a></p>
        </body>
      </html>
    `);
  }
});

// Endpoint para manejar el callback de Google (implementación real)
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log('🔄 Callback de Google recibido con código:', code?.substring(0, 10) + '...');

    if (!code) {
      throw new Error('No se recibió código de autorización de Google');
    }

    // Intercambiar el código por un token de acceso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.VITE_API_URL}/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('❌ Error al obtener token de acceso:', tokenData);
      throw new Error('Error al obtener token de acceso de Google');
    }

    console.log('✅ Token de acceso obtenido correctamente');

    // Obtener información del usuario con el token de acceso
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userData = await userResponse.json();
    console.log('✅ Datos de usuario obtenidos:', userData.email);

    if (!userData.id) {
      throw new Error('No se pudo obtener la información del usuario de Google');
    }

    // Crear token JWT para nuestra aplicación
    const userId = `google-${userData.id}`;
    const token = jwt.sign({
      userId,
      provider: 'google',
      email: userData.email
    }, process.env.JWT_SECRET || 'secret-jwt-key', { expiresIn: '7d' });

    // Recuperar la URL de callback del estado
    const callbackUrl = state || `${process.env.CORS_FRONT || 'http://localhost:3001'}/html/auth-callback.html`;

    // Construir URL de redirección con parámetros del usuario real
    const redirectUrl = `${callbackUrl}?token=${token}&userid=${userId}&name=${encodeURIComponent(userData.name)}&email=${encodeURIComponent(userData.email)}&provider=google&avatar=${encodeURIComponent(userData.picture || '')}`;

    console.log('✅ Redirigiendo a callback con datos autenticados:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error en callback de Google:', error);
    const errorMessage = encodeURIComponent(error.message || 'Error en la autenticación de Google');
    res.redirect(`${process.env.CORS_FRONT || 'http://localhost:3001'}/html/auth-callback.html?error=${errorMessage}`);
  }
});

// Endpoint para autenticación con GitHub
app.post('/api/auth/github', async (req, res) => {
  try {
    const { code } = req.body;

    // En un caso real, intercambiaríamos este código por un token de acceso
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de autorización no proporcionado'
      });
    }

    // Paso 1: Intercambiar el código por un token de acceso (en un caso real)
    // const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     client_id: process.env.GITHUB_CLIENT_ID,
    //     client_secret: process.env.GITHUB_CLIENT_SECRET,
    //     code
    //   })
    // });
    // const tokenData = await tokenResponse.json();
    // const accessToken = tokenData.access_token;

    // Paso 2: Usar el token para obtener información del usuario (en un caso real)
    // const userResponse = await fetch('https://api.github.com/user', {
    //   headers: {
    //     'Authorization': `token ${accessToken}`
    //   }
    // });
    // const userData = await userResponse.json();

    // Simulación de respuesta exitosa
    const githubUser = {
      id: 'github-' + Math.floor(Math.random() * 1000),
      name: 'Usuario de GitHub',
      email: 'usuario@github.com',
      provider: 'github',
      avatar: 'https://avatars.githubusercontent.com/u/default'
    };

    // Crear token JWT para nuestra aplicación
    const appToken = jwt.sign({
      userId: githubUser.id,
      provider: 'github'
    }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      user: githubUser,
      token: appToken
    });

  } catch (error) {
    console.error('Error en autenticación GitHub:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en la autenticación: ' + error.message
    });
  }
});

// Añadir endpoint GET para el callback de GitHub
app.get('/api/auth/github', async (req, res) => {
  try {
    console.log('📥 Callback de GitHub recibido (GET):', req.query);
    const { code, error } = req.query;

    // Si hay un error en la respuesta de GitHub
    if (error) {
      console.error(`❌ Error devuelto por GitHub: ${error}`);
      return res.redirect(`${process.env.CORS_FRONT || 'http://localhost:3001'}/login?error=github_${error}`);
    }

    if (!code) {
      console.error('❌ No se proporcionó código de autorización');
      return res.redirect(`${process.env.CORS_FRONT || 'http://localhost:3001'}/login?error=no_code`);
    }

    // Simulación de proceso real de autenticación
    console.log('🔑 Procesando código de autorización de GitHub:', code);

    try {
      // Intercambiar el código por un token de acceso
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Error al solicitar token a GitHub:', errorText);
        throw new Error(`Error al obtener token: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error('❌ Error en respuesta de GitHub:', tokenData.error);
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Obtener el token de acceso
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('No se recibió token de acceso de GitHub');
      }

      // Obtener información del usuario
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'Portfolio-App'
        }
      });

      if (!userResponse.ok) {
        throw new Error(`Error al obtener datos de usuario: ${userResponse.status}`);
      }

      const githubUser = await userResponse.json();

      // Si no tenemos email, intentar obtenerlo
      if (!githubUser.email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'User-Agent': 'Portfolio-App'
          }
        });

        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();
          const primaryEmail = emails.find(email => email.primary);

          if (primaryEmail) {
            githubUser.email = primaryEmail.email;
          } else if (emails.length > 0) {
            githubUser.email = emails[0].email;
          }
        }
      }

      // Crear token JWT para nuestra aplicación
      const appToken = jwt.sign({
        userId: `github-${githubUser.id}`,
        provider: 'github'
      }, JWT_SECRET, { expiresIn: '7d' });

      console.log('✅ Autenticación exitosa, redirigiendo al frontend');

      // Redirigir al frontend con el token
      return res.redirect(`${process.env.CORS_FRONT || 'http://localhost:3001'}/?token=${appToken}&userId=github-${githubUser.id}`);
    } catch (error) {
      console.error('❌ Error procesando autenticación GitHub:', error);
      return res.redirect(`${process.env.CORS_FRONT || 'http://localhost:3001'}/login?error=${encodeURIComponent(error.message)}`);
    }
  } catch (error) {
    console.error('❌ Error general en callback de GitHub:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h2>Error de autenticación</h2>
          <p>Lo sentimos, ocurrió un error al procesar la autenticación de GitHub.</p>
          <p>Detalles: ${error.message}</p>
          <p><a href="${process.env.CORS_FRONT || 'http://localhost:3001'}/login">Volver al inicio de sesión</a></p>
        </body>
      </html>
    `);
  }
});

// Endpoint para imprimir información de GitHub (solo para desarrollo)
app.get('/api/auth/github-debug', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'Secret no disponible';
  const frontendUrl = process.env.CORS_FRONT || 'http://localhost:3001';
  const backendUrl = process.env.CORS_BACK || 'http://localhost:5001';
  const expectedCallback = `${backendUrl}/api/auth/github`;

  res.json({
    config: {
      clientId: clientId ? `${clientId.substring(0, 5)}...` : 'No configurado',
      clientSecret: clientSecret ? 'Configurado (secreto)' : 'No configurado',
      frontendUrl,
      backendUrl,
      expectedCallback
    },
    info: `
      Para configurar correctamente GitHub OAuth, debes registrar exactamente esta URL de callback en la consola de desarrolladores de GitHub:
      ${expectedCallback}
      
      Pasos:
      1. Ve a https://github.com/settings/developers
      2. Selecciona tu aplicación OAuth
      3. En "Authorization callback URL", asegúrate de que coincida exactamente con ${expectedCallback}
      4. Guarda los cambios
    `
  });
});

// Middleware para verificar autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
};

// Middleware para configurar cabeceras de seguridad
app.use((req, res, next) => {
  // Configurar cabeceras de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Configurar Content Security Policy permitiendo los dominios necesarios para Mercado Pago
  res.setHeader(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );

  next();
});

// Ruta para el health check (útil para monitoreo)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', time: new Date().toISOString() });
});

// Servir archivos estáticos del frontend (build de Vite)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log(`✅ Sirviendo archivos estáticos desde: ${distPath}`);
  app.use(express.static(distPath));

  // Ruta para todas las solicitudes que no son de la API (siempre al final)
  app.get('/*', function (req, res, next) {
    // Evita redirigir solicitudes a la API
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
} else {
  console.warn(`⚠️ Directorio 'dist' no encontrado. El frontend no será servido.`);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
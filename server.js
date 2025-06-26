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
// Importar rutas de promociones
import promocionesRoutes from './routes/promocionesRoutes.js';
// Importar rutas de valoraciones
import ratingsRoutes from './routes/ratingsRoutes.js';
// Importar rutas de stock
import stockRoutes from './routes/stockRoutes.js';
// Importar rutas de analytics
import analyticsRoutes from './routes/analyticsRoutes.js';
// Importar rutas de contexto de IA
import aiContextRoutes from './routes/aiContextRoutes.js';
// Importar rutas de cotizaciones
import quotationRoutes from './routes/quotationRoutes.js';
// Importar rutas de email sequences
import emailSequenceRoutes from './routes/emailSequenceRoutes.js';
// Importar rutas de métricas
import metricsRoutes from './routes/metricsRoutes.js';
// Importar rutas de notificaciones
import notificationRoutes from './routes/notificationRoutes.js';
// Importar rutas de chat híbrido
import hybridChatRoutes from './routes/hybridChatRoutes.js';

// Importar controladores de pago
import { processPayment, createPreference, handleWebhook, processApiPayment } from './controllers/paymentController.js';

// Importar controladores de servicios de usuario
import { registerUserService, getUserServices, updateServiceProgress, updateServiceDetails } from './controllers/userServicesController.js';

// Importar middleware de autenticación
import { authenticateToken } from './middleware/auth.js';

// Inicializar notificaciones de prueba al arrancar el servidor
import { createTestNotifications } from './controllers/notificationController.js';

dotenv.config(); // Cargar variables de entorno

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// Llamamos a la inicialización de la base de datos PostgreSQL (Sequelize)
connectDB().then(async (sequelizeInstance) => {
  if (sequelizeInstance || process.env.DISABLE_DB === 'true' || process.env.ENABLE_FILE_FALLBACK === 'true') {
    console.log('✅ Inicialización de base de datos (PostgreSQL/Sequelize o fallback) completada.');
    
    // Ejecutar migraciones si la base de datos está disponible
    if (sequelizeInstance && process.env.NODE_ENV === 'production') {
      try {
        console.log('🔄 Ejecutando migraciones de base de datos...');
        // Importar dinámicamente el script de migraciones
        const { default: runMigrations } = await import('./scripts/run-migration.js');
        await runMigrations();
        console.log('✅ Migraciones completadas exitosamente');
      } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
        // No detener el servidor, continuar con fallback
      }
    }

    // Inicializar notificaciones de prueba
    try {
      await createTestNotifications();
    } catch (error) {
      console.error('❌ Error inicializando notificaciones de prueba:', error);
    }
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

// Lista de endpoints que pueden recibir solicitudes sin origen
const allowedNoOriginPaths = [
  '/api/payments/webhook',
  '/api/ratings/submit',
  '/health'
];

console.log('📍 Configuración CORS - Orígenes permitidos:', corsOrigins);

// Opciones de CORS dinámicas y flexibles
const corsOptions = {
  origin: (origin, callback) => {
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV !== 'production') {
      console.log(`CORS: Petición desde ${origin} permitida (entorno de desarrollo)`);
      return callback(null, true);
    }

    // En producción, verificar origen
    if (!origin) {
      console.log('CORS: Petición sin origen detectada');
      return callback(null, true); // Permitir todas las solicitudes sin origen en producción
    }

    // Verificar si el origen está en la lista blanca
    const isAllowed = corsOrigins.some(allowedOrigin => {
      // Manejar wildcards como '*.mercadopago.com'
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        return origin.endsWith(`.${domain}`) || origin === domain;
      }
      return origin === allowedOrigin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error(`CORS: Petición desde origen "${origin}" RECHAZADA.`);
      console.error(`CORS: Orígenes permitidos en producción: [${corsOrigins.join(', ')}]`);
      callback(new Error('Este origen no está permitido por la política de CORS.'));
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
};

// Aplicar middleware de CORS
app.use(cors(corsOptions));

// Middleware para manejar las solicitudes OPTIONS (pre-flight)
app.options('*', cors(corsOptions));

// Middleware para forzar encabezados CORS en cada respuesta
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // En desarrollo, reflejar cualquier origen
  if (process.env.NODE_ENV !== 'production') {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    // En producción, verificar origen
    if (origin && corsOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Para solicitudes sin origen, verificar si es un endpoint permitido
      const isAllowedPath = allowedNoOriginPaths.some(p => req.path.startsWith(p));
      if (isAllowedPath) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
    }
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
app.use('/admin', (req, res, next) => {
  // Excluir rutas de autenticación y login
  if (req.path.startsWith('/api/auth/') ||
    req.path === '/login' ||
    req.path.includes('/verify/') ||
    req.path.startsWith('/api/')) {
    return next();
  }

  // Verificar autenticación básica
  const auth = basicAuth({
    users: {
      [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'password'
    },
    challenge: true,
    unauthorizedResponse: (req) => {
      // Si es una petición AJAX, devolver JSON
      if (req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.headers['content-type'] === 'application/json') {
        return { error: 'Unauthorized' };
      }
      // Si es una petición normal, redirigir al login
      return 'Redirecting to login...';
    }
  });

  auth(req, res, (err) => {
    if (err) {
      // Redirigir a login en lugar de mostrar popup de autenticación básica
      return res.redirect('/admin/login');
    }
    next();
  });
});

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

// Rutas de promociones
app.use('/api/promociones', promocionesRoutes);

// Usar las rutas de valoraciones
app.use('/api/ratings', ratingsRoutes);

// Usar las rutas de stock
app.use('/api/stock', stockRoutes);

// Usar las rutas de analytics
app.use('/api/analytics', analyticsRoutes);

// Usar las rutas de contexto de IA
app.use('/api/ai', aiContextRoutes);

// Usar las rutas de cotizaciones
app.use('/api/quotations', quotationRoutes);

// Usar las rutas de email sequences
app.use('/api/email-sequences', emailSequenceRoutes);

// Usar las rutas de métricas
app.use('/api/metrics', metricsRoutes);

// Usar las rutas de notificaciones
app.use('/api/notifications', notificationRoutes);

// Usar las rutas de chat híbrido
app.use('/api/hybrid-chat', hybridChatRoutes);

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

// Rutas de servicios de usuario
app.post('/api/user-services', authenticateToken, registerUserService);
app.get('/api/user-services', authenticateToken, getUserServices);
app.put('/api/user-services/:serviceId/progress', authenticateToken, updateServiceProgress);
app.put('/api/user-services/:serviceId/details', authenticateToken, updateServiceDetails);

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
const whatsappDisabled = process.env.WHATSAPP_DISABLE_WEB === 'true' || true; // Forzar deshabilitación para ahorrar recursos

if (!whatsappDisabled) {
  // Configuración de Puppeteer que sabemos que funciona
  const puppeteerOptions = {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-software-rasterizer',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--remote-debugging-port=9222'
    ]
  };

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "contact-bot",
      dataPath: process.env.WHATSAPP_DATA_PATH || './.wwebjs_auth'
    }),
    puppeteer: puppeteerOptions
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
  // Verificar si está en desarrollo y WhatsApp está deshabilitado
  if (process.env.NODE_ENV !== 'production' && process.env.WHATSAPP_DISABLE_WEB === 'true') {
    res.send(`
      <html>
        <head>
          <title>Admin Panel - Desarrollo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔧 Panel de Administración - Modo Desarrollo</h1>
            
            <div class="warning">
              <strong>⚠️ Entorno de Desarrollo Detectado</strong><br>
              WhatsApp Web está deshabilitado en este entorno para evitar conflictos.
            </div>
            
            <div class="info">
              <strong>📋 Opciones Disponibles:</strong><br>
              • <a href="/admin/test-email">Probar sistema de email</a><br>
              • <a href="/">Volver al sitio principal</a><br>
              • <a href="/api/health">Ver estado del servidor</a>
            </div>
            
            <h3>🌐 Variables de Entorno Detectadas:</h3>
            <ul>
              <li><strong>NODE_ENV:</strong> ${process.env.NODE_ENV || 'no definido'}</li>
              <li><strong>WHATSAPP_DISABLE_WEB:</strong> ${process.env.WHATSAPP_DISABLE_WEB || 'no definido'}</li>
              <li><strong>PORT:</strong> ${process.env.PORT || 'no definido'}</li>
              <li><strong>DATABASE_URL:</strong> ${process.env.DATABASE_URL ? 'configurado' : 'no configurado'}</li>
            </ul>
            
            <p><em>Para acceder al panel completo de WhatsApp, despliega en producción.</em></p>
          </div>
        </body>
      </html>
    `);
  } else {
    // En producción o con WhatsApp habilitado, redirigir al panel de WhatsApp
    res.redirect('/admin/whatsapp');
  }
});

// Configuración de Email (SMTP) para notificaciones de error con DonWeb
const transporter = nodemailer.createTransport({
  host: 'c2830653.ferozo.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
    pass: process.env.EMAIL_PASS
  }
});

// Verifico la conexión SMTP y muestro resultado, ignorando errores de DNS temporales
transporter.verify((err, success) => {
  if (err) {
    // Ignorar error DNS temporal
    if (err.code === 'EDNS') {
      console.warn('⚠️ DNS lookup fallido para c2830653.ferozo.com, omitiendo verificación SMTP inicial');
    } else {
      console.error('❌ Error en verificación SMTP:', err);
    }
  } else {
    console.log('✅ SMTP verificado correctamente con DonWeb');
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
      from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
      to: process.env.Email, // Tu correo personal como destinatario
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

// Endpoint para descargar la guía gratuita
app.get('/api/download/web-development-guide', async (req, res) => {
  try {
    // Crear PDF dinámicamente o servir un archivo estático
    const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Guía: Cómo Elegir el Desarrollo Web Perfecto</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #FF00FF; text-align: center; }
            h2 { color: #00FFFF; border-bottom: 2px solid #00FFFF; padding-bottom: 5px; }
            .checklist { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .tip { background: #e8f4fd; padding: 15px; border-left: 4px solid #00FFFF; margin: 15px 0; }
        </style>
    </head>
    <body>
        <h1>🚀 Guía Completa: Cómo Elegir el Desarrollo Web Perfecto</h1>
        
        <h2>📋 Checklist de Tecnologías</h2>
        <div class="checklist">
            <h3>Frontend:</h3>
            <ul>
                <li>✅ React.js - Para aplicaciones interactivas</li>
                <li>✅ Next.js - Para SEO y performance</li>
                <li>✅ TypeScript - Para código más seguro</li>
                <li>✅ Styled Components - Para diseño moderno</li>
            </ul>
            
            <h3>Backend:</h3>
            <ul>
                <li>✅ Node.js + Express - Rápido y escalable</li>
                <li>✅ PostgreSQL - Base de datos robusta</li>
                <li>✅ JWT - Autenticación segura</li>
                <li>✅ Docker - Deploy confiable</li>
            </ul>
        </div>

        <h2>💰 Calculadora de Presupuesto</h2>
        <div class="tip">
            <h3>Factores que afectan el precio:</h3>
            <ul>
                <li><strong>Landing Page:</strong> $800 - $2,000</li>
                <li><strong>E-commerce:</strong> $2,500 - $8,000</li>
                <li><strong>App Web Completa:</strong> $5,000 - $15,000</li>
                <li><strong>Sistema Empresarial:</strong> $10,000+</li>
            </ul>
        </div>

        <h2>📝 Template de Briefing</h2>
        <div class="checklist">
            <h3>Preguntas esenciales para tu proyecto:</h3>
            <ol>
                <li>¿Cuál es el objetivo principal de tu sitio web?</li>
                <li>¿Quién es tu público objetivo?</li>
                <li>¿Qué funcionalidades necesitas?</li>
                <li>¿Tienes referencias de diseño?</li>
                <li>¿Cuál es tu presupuesto disponible?</li>
                <li>¿Cuándo necesitas el proyecto terminado?</li>
            </ol>
        </div>

        <h2>🎯 Casos de Éxito Reales</h2>
        <div class="tip">
            <h3>Proyecto: E-commerce Tech Store</h3>
            <p><strong>Desafío:</strong> Tienda online con carrito inteligente</p>
            <p><strong>Solución:</strong> React + Node.js + PostgreSQL</p>
            <p><strong>Resultado:</strong> +200% conversiones en 3 meses</p>
        </div>

        <div class="tip">
            <h3>Proyecto: Sistema de IA Empresarial</h3>
            <p><strong>Desafío:</strong> Automatizar atención al cliente</p>
            <p><strong>Solución:</strong> IA conversacional + Dashboard</p>
            <p><strong>Resultado:</strong> -80% tiempo de respuesta</p>
        </div>

        <hr style="margin: 40px 0;">
        <p style="text-align: center; color: #666;">
            <strong>¿Listo para tu proyecto?</strong><br>
            Contacta a Circuit Prompt: https://circuitprompt.com.ar
        </p>
    </body>
    </html>
    `;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="guia-desarrollo-web-circuit-prompt.html"');
    res.send(pdfContent);

  } catch (error) {
    console.error('Error generando guía:', error);
    res.status(500).json({ success: false, error: 'Error generando la guía' });
  }
});

// Mejorar el endpoint de captura de leads
app.post('/api/auth/leads', async (req, res) => {
  try {
    const { email, source, context, name, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email es requerido'
      });
    }

    // Crear notificación para el admin
    try {
      const { notify } = await import('./controllers/notificationController.js');
      await notify('NEW_LEAD', {
        email,
        name: name || 'No proporcionado',
        source: source || 'web',
        page: context || 'Captura general',
        phone: phone || 'No proporcionado'
      });
    } catch (notificationError) {
      console.error('Error creando notificación de lead:', notificationError);
    }

    // Iniciar secuencia de email automática
    try {
      const emailSequenceController = await import('./controllers/emailSequenceController.js');
      await emailSequenceController.startEmailSequence({
        body: {
          email,
          sequenceType: 'lead-nurturing',
          userData: { name: name || 'Usuario', source }
        }
      }, {
        json: () => {},
        status: () => ({ json: () => {} })
      });
    } catch (sequenceError) {
      console.error('Error iniciando secuencia de email:', sequenceError);
    }

    console.log('📧 Nuevo lead capturado:', {
      email,
      source,
      context,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Lead capturado exitosamente'
    });

  } catch (error) {
    console.error('Error capturando lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Configuración de fallback para SPA (Single Page Application)
// Esto debe ir DESPUÉS de todas las rutas de API pero ANTES del puerto
app.get('*', (req, res) => {
  // No aplicar fallback a rutas de API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Para todas las demás rutas, servir el index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));

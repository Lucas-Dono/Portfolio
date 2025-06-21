import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

// Sistema de notificaciones en memoria (en producción usar Redis)
let notifications = [];
let notificationId = 1;

// Configuración de email (usando la existente del proyecto)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'c2830653.ferozo.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
    pass: process.env.EMAIL_PASS || '@04LucasDono17/'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Tipos de notificaciones y sus configuraciones
const NOTIFICATION_TYPES = {
  NEW_LEAD: {
    priority: 'high',
    title: '🎯 Nuevo Lead Capturado',
    emailSubject: '🎯 NUEVO LEAD - Acción Inmediata Requerida',
    shouldEmail: true,
    shouldStore: true
  },
  NEW_QUOTATION: {
    priority: 'high',
    title: '💰 Nueva Cotización Generada',
    emailSubject: '💰 NUEVA COTIZACIÓN - Cliente Interesado',
    shouldEmail: true,
    shouldStore: true
  },
  CART_ABANDONED: {
    priority: 'medium',
    title: '🛒 Carrito Abandonado',
    emailSubject: '🛒 CARRITO ABANDONADO - Oportunidad de Recuperación',
    shouldEmail: true,
    shouldStore: true
  },
  PAYMENT_SUCCESS: {
    priority: 'high',
    title: '💳 Pago Exitoso',
    emailSubject: '💳 PAGO RECIBIDO - Nuevo Cliente',
    shouldEmail: true,
    shouldStore: true
  },
  HIGH_VALUE_LEAD: {
    priority: 'critical',
    title: '⭐ Lead de Alto Valor',
    emailSubject: '⭐ LEAD PREMIUM - Respuesta Urgente',
    shouldEmail: true,
    shouldStore: true
  },
  DAILY_REPORT: {
    priority: 'low',
    title: '📊 Reporte Diario',
    emailSubject: '📊 REPORTE DIARIO - Métricas del Negocio',
    shouldEmail: true,
    shouldStore: false
  },
  SYSTEM_ALERT: {
    priority: 'critical',
    title: '⚠️ Alerta del Sistema',
    emailSubject: '⚠️ ALERTA CRÍTICA - Revisar Sistema',
    shouldEmail: true,
    shouldStore: true
  }
};

// Crear notificación
const createNotification = async (type, data) => {
  try {
    const config = NOTIFICATION_TYPES[type];
    if (!config) {
      throw new Error(`Tipo de notificación no válido: ${type}`);
    }

    const notification = {
      id: notificationId++,
      type,
      title: config.title,
      message: generateMessage(type, data),
      data,
      priority: config.priority,
      timestamp: new Date(),
      read: false,
      emailSent: false
    };

    // Almacenar notificación si está configurado
    if (config.shouldStore) {
      notifications.unshift(notification);
      // Mantener solo las últimas 100 notificaciones
      if (notifications.length > 100) {
        notifications = notifications.slice(0, 100);
      }
    }

    // Enviar email si está configurado
    if (config.shouldEmail && process.env.ADMIN_EMAIL) {
      await sendNotificationEmail(type, notification, data);
      notification.emailSent = true;
    }

    // Log para debugging
    console.log(`📢 Notificación creada: ${type}`, {
      id: notification.id,
      priority: config.priority,
      emailSent: notification.emailSent
    });

    return notification;
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
};

// Generar mensaje personalizado según el tipo
const generateMessage = (type, data) => {
  switch (type) {
    case 'NEW_LEAD':
      return `Nuevo lead capturado desde ${data.source}: ${data.email}${data.name ? ` (${data.name})` : ''}`;
    
    case 'NEW_QUOTATION':
      return `Cotización generada: ${data.serviceType} por $${data.finalPrice} - Cliente: ${data.email}`;
    
    case 'CART_ABANDONED':
      return `Carrito abandonado: ${data.services?.join(', ') || 'Servicios'} - Total: $${data.total || 'N/A'}`;
    
    case 'PAYMENT_SUCCESS':
      return `Pago exitoso: $${data.amount} - Cliente: ${data.email} - Método: ${data.paymentMethod}`;
    
    case 'HIGH_VALUE_LEAD':
      return `Lead premium detectado: ${data.email} - Valor estimado: $${data.estimatedValue}`;
    
    case 'DAILY_REPORT':
      return `Leads: ${data.leads || 0} | Cotizaciones: ${data.quotations || 0} | Ingresos: $${data.revenue || 0}`;
    
    case 'SYSTEM_ALERT':
      return data.message || 'Alerta del sistema detectada';
    
    default:
      return 'Nueva notificación disponible';
  }
};

// Enviar email de notificación
const sendNotificationEmail = async (type, notification, data) => {
  try {
    const config = NOTIFICATION_TYPES[type];
    const emailHtml = await generateEmailTemplate(type, notification, data);
    
    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
      to: process.env.ADMIN_EMAIL,
      subject: config.emailSubject,
      html: emailHtml,
      priority: config.priority === 'critical' ? 'high' : 'normal'
    });

    console.log(`📧 Email de notificación enviado: ${type}`);
  } catch (error) {
    console.error('Error enviando email de notificación:', error);
  }
};

// Generar template HTML para emails
const generateEmailTemplate = async (type, notification, data) => {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .priority-critical { border-left: 4px solid #e53e3e; }
            .priority-high { border-left: 4px solid #dd6b20; }
            .priority-medium { border-left: 4px solid #3182ce; }
            .priority-low { border-left: 4px solid #38a169; }
            .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .data-table th { background-color: #f7fafc; font-weight: 600; }
            .action-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${notification.title}</h1>
                <p>Notificación del Portfolio - ${new Date(notification.timestamp).toLocaleString('es-AR')}</p>
            </div>
            <div class="content priority-${notification.priority}">
                <h2>Detalles de la Notificación</h2>
                <p><strong>Mensaje:</strong> ${notification.message}</p>
                <p><strong>Prioridad:</strong> ${notification.priority.toUpperCase()}</p>
                
                ${generateDataSection(type, data)}
                
                <a href="${process.env.FRONTEND_URL}/admin" class="action-button">
                    Ver Panel de Administración
                </a>
            </div>
            <div class="footer">
                <p>Este es un email automático del sistema de notificaciones.</p>
                <p>Portfolio Profesional - Sistema de Gestión Inteligente</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return baseTemplate;
};

// Generar sección de datos específica por tipo
const generateDataSection = (type, data) => {
  if (!data) return '';

  let section = '<h3>Información Adicional</h3><table class="data-table">';
  
  switch (type) {
    case 'NEW_LEAD':
      section += `
        <tr><th>Email</th><td>${data.email}</td></tr>
        <tr><th>Nombre</th><td>${data.name || 'No proporcionado'}</td></tr>
        <tr><th>Fuente</th><td>${data.source}</td></tr>
        <tr><th>Página</th><td>${data.page || 'No especificada'}</td></tr>
      `;
      break;
    
    case 'NEW_QUOTATION':
      section += `
        <tr><th>Cliente</th><td>${data.email}</td></tr>
        <tr><th>Servicio</th><td>${data.serviceType}</td></tr>
        <tr><th>Precio Final</th><td>$${data.finalPrice}</td></tr>
        <tr><th>Descuento</th><td>${data.discount}%</td></tr>
        <tr><th>Urgencia</th><td>${data.urgency}</td></tr>
      `;
      break;
    
    case 'CART_ABANDONED':
      section += `
        <tr><th>Email</th><td>${data.email || 'No disponible'}</td></tr>
        <tr><th>Servicios</th><td>${data.services?.join(', ') || 'No especificados'}</td></tr>
        <tr><th>Total</th><td>$${data.total || 'N/A'}</td></tr>
        <tr><th>Tiempo en Página</th><td>${data.timeOnPage || 'N/A'}</td></tr>
      `;
      break;
    
    case 'PAYMENT_SUCCESS':
      section += `
        <tr><th>Cliente</th><td>${data.email}</td></tr>
        <tr><th>Monto</th><td>$${data.amount}</td></tr>
        <tr><th>Método de Pago</th><td>${data.paymentMethod}</td></tr>
        <tr><th>ID de Transacción</th><td>${data.transactionId}</td></tr>
      `;
      break;
  }
  
  section += '</table>';
  return section;
};

// Endpoints del controlador
const getNotifications = async (req, res) => {
  try {
    const { limit = 20, offset = 0, priority, unreadOnly } = req.query;
    
    let filteredNotifications = [...notifications];
    
    // Filtrar por prioridad
    if (priority) {
      filteredNotifications = filteredNotifications.filter(n => n.priority === priority);
    }
    
    // Filtrar solo no leídas
    if (unreadOnly === 'true') {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }
    
    // Paginación
    const paginatedNotifications = filteredNotifications.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      notifications: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === parseInt(id));
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }
    
    notification.read = true;
    
    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    notifications.forEach(n => n.read = true);
    
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const index = notifications.findIndex(n => n.id === parseInt(id));
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }
    
    notifications.splice(index, 1);
    
    res.json({ success: true, message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const todayNotifications = notifications.filter(n => new Date(n.timestamp) >= today);
    const weekNotifications = notifications.filter(n => new Date(n.timestamp) >= thisWeek);
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      today: todayNotifications.length,
      thisWeek: weekNotifications.length,
      byPriority: {
        critical: notifications.filter(n => n.priority === 'critical').length,
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length
      },
      byType: {}
    };
    
    // Contar por tipo
    Object.keys(NOTIFICATION_TYPES).forEach(type => {
      stats.byType[type] = notifications.filter(n => n.type === type).length;
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Función para crear notificación desde otros controladores
const notify = async (type, data) => {
  return await createNotification(type, data);
};

// Función para crear notificaciones de prueba (solo para desarrollo/testing)
const createTestNotifications = async () => {
  try {
    console.log('🧪 Creando notificaciones de prueba...');
    
    // Solo crear si no hay notificaciones existentes
    if (notifications.length === 0) {
      await createNotification('NEW_LEAD', {
        email: 'cliente@ejemplo.com',
        name: 'Juan Pérez',
        source: 'web',
        page: 'Landing Page'
      });

      await createNotification('NEW_QUOTATION', {
        serviceType: 'E-commerce Premium',
        finalPrice: 89997,
        email: 'empresa@ejemplo.com'
      });

      await createNotification('PAYMENT_SUCCESS', {
        amount: 29997,
        email: 'cliente@ejemplo.com',
        paymentMethod: 'MercadoPago'
      });

      await createNotification('SYSTEM_ALERT', {
        message: 'Sistema de notificaciones inicializado correctamente'
      });

      console.log('✅ Notificaciones de prueba creadas');
    }
  } catch (error) {
    console.error('Error creando notificaciones de prueba:', error);
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStats,
  notify,
  createTestNotifications,
  NOTIFICATION_TYPES
}; 
// Controller para email sequences automáticas
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../utils/emailManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo para almacenar sequences activas
const SEQUENCES_FILE = path.join(__dirname, '../data/emailSequences.json');

// Configuración de sequences de email
const EMAIL_SEQUENCES = {
  'lead-nurturing': {
    name: 'Nurturing de Leads',
    description: 'Secuencia para leads capturados en chat',
    emails: [
      {
        delay: 0, // Inmediato
        subject: '¡Hola! Hablemos de tu proyecto web 🚀',
        template: 'lead-welcome',
        data: {
          title: 'Bienvenido a nuestra comunidad',
          message: 'Gracias por tu interés en nuestros servicios. Te contactaremos pronto para conocer más sobre tu proyecto.',
          cta: 'Ver Nuestros Servicios',
          ctaLink: process.env.FRONTEND_URL || 'http://localhost:5173'
        }
      },
      {
        delay: 24 * 60 * 60 * 1000, // 24 horas
        subject: '¿Ya viste nuestros proyectos? 💡',
        template: 'portfolio-showcase',
        data: {
          title: 'Mira lo que hemos creado',
          message: 'Echa un vistazo a algunos de nuestros proyectos más exitosos. ¿Te imaginas tu negocio con una presencia web así?',
          cta: 'Ver Portfolio',
          ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#projects`
        }
      },
      {
        delay: 3 * 24 * 60 * 60 * 1000, // 3 días
        subject: '🎯 Oferta especial: 15% de descuento',
        template: 'special-offer',
        data: {
          title: 'Oferta limitada para ti',
          message: 'Como has mostrado interés en nuestros servicios, tenemos una oferta especial: 15% de descuento en tu primer proyecto.',
          cta: 'Obtener Descuento',
          ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment?discount=LEAD15`
        }
      }
    ]
  },
  'post-quotation': {
    name: 'Seguimiento Post-Cotización',
    description: 'Secuencia después de generar cotización',
    emails: [
      {
        delay: 60 * 60 * 1000, // 1 hora
        subject: 'Tu cotización está lista ✨',
        template: 'quotation-ready',
        data: {
          title: 'Cotización personalizada',
          message: 'Hemos preparado una cotización especial para tu proyecto. ¿Te gustaría revisarla juntos?',
          cta: 'Ver Cotización',
          ctaLink: process.env.FRONTEND_URL || 'http://localhost:5173'
        }
      },
      {
        delay: 2 * 24 * 60 * 60 * 1000, // 2 días
        subject: '¿Tienes preguntas sobre tu cotización? 🤔',
        template: 'quotation-questions',
        data: {
          title: 'Estamos aquí para ayudarte',
          message: 'Si tienes dudas sobre la cotización o necesitas ajustes, estaremos encantados de hablar contigo.',
          cta: 'Contactar Ahora',
          ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#contact`
        }
      }
    ]
  },
  'onboarding': {
    name: 'Onboarding Nuevos Clientes',
    description: 'Bienvenida para clientes que compraron',
    emails: [
      {
        delay: 0, // Inmediato
        subject: '🎉 ¡Bienvenido! Tu proyecto ha comenzado',
        template: 'welcome-client',
        data: {
          title: '¡Gracias por confiar en nosotros!',
          message: 'Tu proyecto ha sido iniciado. Te mantendremos informado de cada paso del proceso.',
          cta: 'Ver Dashboard',
          ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
        }
      },
      {
        delay: 24 * 60 * 60 * 1000, // 24 horas
        subject: 'Así trabajamos: tu proyecto paso a paso 📋',
        template: 'process-explanation',
        data: {
          title: 'Nuestro proceso de trabajo',
          message: 'Te explicamos cómo desarrollaremos tu proyecto y qué puedes esperar en cada etapa.',
          cta: 'Ver Proceso',
          ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
        }
      }
    ]
  }
};

// Plantillas de email HTML
const EMAIL_TEMPLATES = {
  'lead-welcome': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{title}}</h1>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">¡Hola!</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Saludos,<br>
          <strong>Equipo de Desarrollo Web</strong>
        </p>
      </div>
    </div>
  `,
  'portfolio-showcase': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{title}}</h1>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
        <p style="font-size: 14px; color: #666;">
          ¿Sabías que el 75% de los usuarios juzga la credibilidad de una empresa por su sitio web?
        </p>
      </div>
    </div>
  `,
  'special-offer': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{title}}</h1>
        <div style="background: white; color: #ff6b6b; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-top: 15px; font-weight: bold; font-size: 18px;">15% OFF</div>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Código:</strong> LEAD15</p>
          <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">Válido por 7 días</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
      </div>
    </div>
  `,
  'quotation-ready': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{title}}</h1>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
      </div>
    </div>
  `,
  'quotation-questions': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #333; margin: 0; font-size: 28px;">{{title}}</h1>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
      </div>
    </div>
  `,
  'welcome-client': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{title}}</h1>
        <div style="font-size: 48px; margin: 20px 0;">🎉</div>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
      </div>
    </div>
  `,
  'process-explanation': `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{{title}}</h1>
      </div>
      <div style="padding: 40px 20px; background: white;">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">{{message}}</p>
        <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">Nuestro proceso:</h3>
          <ul style="color: #333; line-height: 1.8;">
            <li>📋 Análisis de requerimientos</li>
            <li>🎨 Diseño y prototipado</li>
            <li>💻 Desarrollo</li>
            <li>🧪 Testing y optimización</li>
            <li>🚀 Lanzamiento</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ctaLink}}" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{cta}}</a>
        </div>
      </div>
    </div>
  `
};

// Asegurar que el directorio data existe
const ensureDataDirectory = async () => {
  const dataDir = path.dirname(SEQUENCES_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Iniciar sequence de email
export const startEmailSequence = async (req, res) => {
  try {
    const { email, sequenceType, userData = {} } = req.body;

    if (!email || !sequenceType) {
      return res.status(400).json({
        success: false,
        error: 'Email y tipo de secuencia son requeridos'
      });
    }

    if (!EMAIL_SEQUENCES[sequenceType]) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de secuencia no válido'
      });
    }

    const sequence = EMAIL_SEQUENCES[sequenceType];
    const sequenceId = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear registro de sequence
    const sequenceRecord = {
      id: sequenceId,
      email,
      sequenceType,
      userData,
      startedAt: new Date().toISOString(),
      status: 'active',
      emailsSent: 0,
      emails: sequence.emails.map((email, index) => ({
        ...email,
        index,
        scheduled: new Date(Date.now() + email.delay).toISOString(),
        sent: false,
        sentAt: null
      }))
    };

    // Guardar sequence
    await saveSequence(sequenceRecord);

    // Programar envío de emails
    sequence.emails.forEach((email, index) => {
      setTimeout(async () => {
        await sendSequenceEmail(sequenceId, index);
      }, email.delay);
    });

    console.log('📧 Email sequence iniciada:', {
      sequenceId,
      email,
      sequenceType,
      emailCount: sequence.emails.length
    });

    return res.json({
      success: true,
      sequenceId,
      message: 'Secuencia de email iniciada exitosamente'
    });

  } catch (error) {
    console.error('Error iniciando email sequence:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Enviar email específico de sequence
const sendSequenceEmail = async (sequenceId, emailIndex) => {
  try {
    const sequences = await loadSequences();
    const sequence = sequences.find(s => s.id === sequenceId);

    if (!sequence || sequence.status !== 'active') {
      console.log('Sequence no encontrada o inactiva:', sequenceId);
      return;
    }

    const emailConfig = sequence.emails[emailIndex];
    if (!emailConfig || emailConfig.sent) {
      console.log('Email ya enviado o no encontrado:', sequenceId, emailIndex);
      return;
    }

    // Preparar datos del email
    const templateData = {
      ...emailConfig.data,
      userName: sequence.userData.name || 'Usuario',
      userEmail: sequence.email
    };

    // Generar HTML del email
    let htmlContent = EMAIL_TEMPLATES[emailConfig.template] || EMAIL_TEMPLATES['lead-welcome'];
    
    // Reemplazar variables en la plantilla
    Object.entries(templateData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
    });

    // Enviar email usando el sistema existente
    await sendEmail({
      to: sequence.email,
      subject: emailConfig.subject,
      html: htmlContent,
      text: templateData.message
    });

    // Marcar como enviado
    emailConfig.sent = true;
    emailConfig.sentAt = new Date().toISOString();
    sequence.emailsSent += 1;

    // Actualizar sequence
    const updatedSequences = sequences.map(s => 
      s.id === sequenceId ? sequence : s
    );
    await saveSequences(updatedSequences);

    console.log('📧 Email de sequence enviado:', {
      sequenceId,
      emailIndex,
      to: sequence.email,
      subject: emailConfig.subject
    });

  } catch (error) {
    console.error('Error enviando email de sequence:', error);
  }
};

// Detener sequence
export const stopEmailSequence = async (req, res) => {
  try {
    const { sequenceId } = req.params;

    const sequences = await loadSequences();
    const sequenceIndex = sequences.findIndex(s => s.id === sequenceId);

    if (sequenceIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Secuencia no encontrada'
      });
    }

    sequences[sequenceIndex].status = 'stopped';
    sequences[sequenceIndex].stoppedAt = new Date().toISOString();

    await saveSequences(sequences);

    return res.json({
      success: true,
      message: 'Secuencia detenida exitosamente'
    });

  } catch (error) {
    console.error('Error deteniendo sequence:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de sequences
export const getSequenceStats = async (req, res) => {
  try {
    const sequences = await loadSequences();
    
    const stats = {
      total: sequences.length,
      active: sequences.filter(s => s.status === 'active').length,
      completed: sequences.filter(s => s.status === 'completed').length,
      stopped: sequences.filter(s => s.status === 'stopped').length,
      emailsSent: sequences.reduce((sum, s) => sum + s.emailsSent, 0),
      byType: {}
    };

    // Estadísticas por tipo
    Object.keys(EMAIL_SEQUENCES).forEach(type => {
      const typeSequences = sequences.filter(s => s.sequenceType === type);
      stats.byType[type] = {
        total: typeSequences.length,
        active: typeSequences.filter(s => s.status === 'active').length,
        emailsSent: typeSequences.reduce((sum, s) => sum + s.emailsSent, 0)
      };
    });

    return res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error obteniendo stats de sequences:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Funciones auxiliares
const loadSequences = async () => {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(SEQUENCES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveSequence = async (sequence) => {
  const sequences = await loadSequences();
  sequences.push(sequence);
  await saveSequences(sequences);
};

const saveSequences = async (sequences) => {
  try {
    await ensureDataDirectory();
    await fs.writeFile(SEQUENCES_FILE, JSON.stringify(sequences, null, 2));
  } catch (error) {
    console.error('Error guardando sequences:', error);
  }
};

export default {
  startEmailSequence,
  stopEmailSequence,
  getSequenceStats
}; 
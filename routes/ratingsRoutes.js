import express from 'express';
import { createTransport } from 'nodemailer';
import { authenticateToken, isAdmin } from '/app/middleware/auth.js';

const router = express.Router();

// Configuración del transportador de email
const transporter = createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'no_reply@circuitprompt.com.ar',
    pass: process.env.SMTP_PASS
  }
});

// Simulación de base de datos en memoria (en producción usar una base de datos real)
let ratings = [];
let ratingIdCounter = 1;

// POST /api/ratings/submit - Enviar una nueva valoración
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { serviceId, rating, comment, projectName, userEmail, userName } = req.body;
    const userId = req.user.id;

    // Validaciones
    if (!serviceId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Datos de valoración inválidos. La calificación debe estar entre 1 y 5.'
      });
    }

    // Verificar si ya existe una valoración para este servicio del usuario
    const existingRating = ratings.find(r => r.serviceId === serviceId && r.userId === userId);
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Ya has valorado este proyecto anteriormente.'
      });
    }

    // Crear nueva valoración
    const newRating = {
      id: ratingIdCounter++,
      userId,
      serviceId,
      rating: parseFloat(rating),
      comment: comment || '',
      projectName,
      userEmail,
      userName,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    ratings.push(newRating);

    console.log('Nueva valoración recibida:', newRating);

    // Enviar email de agradecimiento al usuario
    try {
      await sendThankYouEmail(userEmail, userName, projectName, rating);
    } catch (emailError) {
      console.error('Error al enviar email de agradecimiento:', emailError);
      // No fallar la request si el email falla
    }

    // Enviar notificación al admin
    try {
      await sendAdminNotification(newRating);
    } catch (emailError) {
      console.error('Error al enviar notificación al admin:', emailError);
    }

    res.json({
      success: true,
      message: 'Valoración enviada exitosamente',
      rating: {
        id: newRating.id,
        rating: newRating.rating,
        comment: newRating.comment,
        createdAt: newRating.createdAt
      }
    });

  } catch (error) {
    console.error('Error al procesar valoración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar la valoración'
    });
  }
});

// GET /api/ratings/user - Obtener valoraciones del usuario autenticado
router.get('/user', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const userRatings = ratings.filter(r => r.userId === userId && r.status === 'active');

    res.json({
      success: true,
      ratings: userRatings.map(r => ({
        id: r.id,
        serviceId: r.serviceId,
        rating: r.rating,
        comment: r.comment,
        projectName: r.projectName,
        createdAt: r.createdAt
      }))
    });

  } catch (error) {
    console.error('Error al obtener valoraciones del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las valoraciones'
    });
  }
});

// GET /api/ratings/admin - Obtener todas las valoraciones (solo admin)
router.get('/admin', authenticateToken, isAdmin, (req, res) => {
  try {
    const { page = 1, limit = 10, minRating, maxRating } = req.query;

    let filteredRatings = ratings.filter(r => r.status === 'active');

    // Filtros opcionales
    if (minRating) {
      filteredRatings = filteredRatings.filter(r => r.rating >= parseFloat(minRating));
    }
    if (maxRating) {
      filteredRatings = filteredRatings.filter(r => r.rating <= parseFloat(maxRating));
    }

    // Ordenar por fecha (más recientes primero)
    filteredRatings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRatings = filteredRatings.slice(startIndex, endIndex);

    // Calcular estadísticas
    const totalRatings = filteredRatings.length;
    const averageRating = totalRatings > 0
      ? filteredRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    const ratingDistribution = {
      1: filteredRatings.filter(r => r.rating === 1).length,
      2: filteredRatings.filter(r => r.rating === 2).length,
      3: filteredRatings.filter(r => r.rating === 3).length,
      4: filteredRatings.filter(r => r.rating === 4).length,
      5: filteredRatings.filter(r => r.rating === 5).length
    };

    res.json({
      success: true,
      ratings: paginatedRatings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRatings / limit),
        totalRatings,
        limit: parseInt(limit)
      },
      statistics: {
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings,
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Error al obtener valoraciones para admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las valoraciones'
    });
  }
});

// POST /api/ratings/request-email - Enviar email de solicitud de valoración
router.post('/request-email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userEmail, userName, projectName, serviceId } = req.body;

    if (!userEmail || !userName || !projectName) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos para enviar el email'
      });
    }

    await sendRatingRequestEmail(userEmail, userName, projectName, serviceId);

    res.json({
      success: true,
      message: 'Email de solicitud de valoración enviado exitosamente'
    });

  } catch (error) {
    console.error('Error al enviar email de solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar el email de solicitud'
    });
  }
});

// Función para enviar email de agradecimiento
async function sendThankYouEmail(userEmail, userName, projectName, rating) {
  const starsDisplay = '⭐'.repeat(rating);

  const mailOptions = {
    from: '"Circuit Prompt" <no_reply@circuitprompt.com.ar>',
    to: userEmail,
    subject: '¡Gracias por tu valoración! - Circuit Prompt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">¡Gracias por tu valoración!</h1>
            <div style="font-size: 2rem; margin: 20px 0;">${starsDisplay}</div>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Hola <strong>${userName}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Muchas gracias por tomarte el tiempo de valorar nuestro trabajo en el proyecto 
            <strong>"${projectName}"</strong>. Tu opinión es muy valiosa para nosotros y nos ayuda a mejorar continuamente nuestros servicios.
          </p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d2ff;">
            <p style="color: #333; margin: 0; font-weight: 600;">
              Tu calificación: ${rating}/5 estrellas ${starsDisplay}
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Si tienes alguna consulta adicional o necesitas soporte, no dudes en contactarnos. 
            Estamos aquí para ayudarte en todo momento.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://wa.me/542324543762" style="background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Contactar Soporte
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 14px;">
            <p>Circuit Prompt - Desarrollo Web Profesional</p>
            <p>Este es un email automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Función para enviar email de solicitud de valoración
async function sendRatingRequestEmail(userEmail, userName, projectName, serviceId) {
  const ratingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?rate=${serviceId}`;

  const mailOptions = {
    from: '"Circuit Prompt" <no_reply@circuitprompt.com.ar>',
    to: userEmail,
    subject: '¡Tu proyecto está completo! Comparte tu experiencia - Circuit Prompt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
            <h1 style="color: #333; margin-bottom: 10px;">¡Tu proyecto está completo!</h1>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Hola <strong>${userName}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Nos complace informarte que tu proyecto <strong>"${projectName}"</strong> ha sido completado exitosamente. 
            Esperamos que estés satisfecho con el resultado final.
          </p>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d2ff;">
            <p style="color: #333; margin: 0; font-weight: 600;">
              Tu opinión es muy importante para nosotros. ¿Podrías tomarte un momento para valorar nuestro servicio?
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${ratingUrl}" style="background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
              Valorar mi experiencia
            </a>
          </div>
          
          <p style="color: #555; font-size: 14px; line-height: 1.6; text-align: center;">
            Tu valoración nos ayuda a mejorar nuestros servicios y a brindar una mejor experiencia a futuros clientes.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 14px;">
            <p>Circuit Prompt - Desarrollo Web Profesional</p>
            <p>Este es un email automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Función para enviar notificación al admin
async function sendAdminNotification(rating) {
  const adminEmail = process.env.ADMIN_EMAIL || 'lucasdono391@gmail.com';

  const mailOptions = {
    from: '"Circuit Prompt System" <no_reply@circuitprompt.com.ar>',
    to: adminEmail,
    subject: `Nueva valoración recibida - ${rating.rating}/5 estrellas`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Nueva Valoración Recibida</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${rating.userName} (${rating.userEmail})</p>
          <p><strong>Proyecto:</strong> ${rating.projectName}</p>
          <p><strong>Calificación:</strong> ${rating.rating}/5 estrellas ${'⭐'.repeat(rating.rating)}</p>
          <p><strong>Fecha:</strong> ${new Date(rating.createdAt).toLocaleString('es-ES')}</p>
          
          ${rating.comment ? `
            <div style="margin-top: 15px;">
              <strong>Comentario:</strong>
              <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 10px; border-left: 4px solid #00d2ff;">
                ${rating.comment}
              </div>
            </div>
          ` : ''}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Puedes ver todas las valoraciones en el panel de administración.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

export default router; 
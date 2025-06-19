// Controller para analytics y abandono de carrito

// Controller para tracking de abandono de carrito
export const trackCartAbandonment = async (req, res) => {
  try {
    const { 
      sessionId,
      serviceId,
      selectedAddOns,
      timestamp,
      abandonedAt,
      timeOnPage,
      userAgent,
      url
    } = req.body;

    // Validar datos requeridos
    if (!sessionId || !serviceId) {
      return res.status(400).json({
        success: false,
        error: 'SessionId y serviceId son requeridos'
      });
    }

    // Crear registro del abandono
    const abandonmentData = {
      sessionId,
      serviceId,
      selectedAddOns: selectedAddOns || [],
      timestamp,
      abandonedAt: abandonedAt || new Date().toISOString(),
      timeOnPage: timeOnPage || 0,
      userAgent: userAgent || 'unknown',
      url: url || 'unknown',
      ip: req.ip || req.connection.remoteAddress,
      recoveryEmailSent: false
    };

    // Log para auditoría
    console.log('🛒 Abandono de carrito trackeado:', {
      sessionId: abandonmentData.sessionId,
      serviceId: abandonmentData.serviceId,
      timeOnPage: Math.round(abandonmentData.timeOnPage / 1000) + 's',
      ip: abandonmentData.ip
    });

    // TODO: Guardar en base de datos
    // Por ahora solo logueamos

    // Crear notificación inteligente para el admin
    try {
      const { notify } = require('./notificationController');
      await notify('CART_ABANDONED', {
        sessionId: abandonmentData.sessionId,
        services: [abandonmentData.serviceId], // Convertir a array para consistencia
        total: null, // No tenemos el total aquí
        timeOnPage: Math.round(abandonmentData.timeOnPage / 1000) + 's',
        ip: abandonmentData.ip,
        userAgent: abandonmentData.userAgent
      });
    } catch (notificationError) {
      console.error('Error creando notificación de carrito abandonado:', notificationError);
    }

    // Programar email de recuperación para 1 hora después
    setTimeout(async () => {
      try {
        await sendCartRecoveryEmail(abandonmentData);
      } catch (emailError) {
        console.error('Error enviando email de recuperación:', emailError);
      }
    }, 60 * 60 * 1000); // 1 hora

    return res.json({
      success: true,
      message: 'Abandono de carrito trackeado exitosamente',
      sessionId: abandonmentData.sessionId
    });

  } catch (error) {
    console.error('Error tracking cart abandonment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Función para enviar email de recuperación de carrito
const sendCartRecoveryEmail = async (abandonmentData) => {
  try {
    const emailManager = (await import('../utils/emailManager.js')).default;
    
    // Obtener información del servicio
    let serviceName = 'el servicio seleccionado';
    try {
      // TODO: Obtener nombre real del servicio desde la base de datos
      serviceName = `Servicio ID: ${abandonmentData.serviceId}`;
    } catch (error) {
      console.error('Error obteniendo nombre del servicio:', error);
    }

    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">¡No pierdas la oportunidad! 🚀</h2>
      
      <p>Hola,</p>
      
      <p>Notamos que estuviste interesado en <strong>${serviceName}</strong> pero no completaste tu compra.</p>
      
      <p>¿Necesitas ayuda para decidirte? Aquí tienes algunas razones para elegir nuestros servicios:</p>
      
      <ul>
        <li>✅ Desarrollo profesional y moderno</li>
        <li>✅ Soporte técnico incluido</li>
        <li>✅ Entrega garantizada en tiempo</li>
        <li>✅ Satisfacción del cliente al 100%</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://tu-dominio.com/payment/${abandonmentData.serviceId}" 
           style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Completar mi compra ahora
        </a>
      </div>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos. Estamos aquí para ayudarte.</p>
      
      <p>¡Esperamos verte pronto!</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #666;">
        Este email se envió porque comenzaste el proceso de compra pero no lo completaste. 
        Si no deseas recibir estos recordatorios, puedes ignorar este mensaje.
      </p>
    </div>
    `;

    // Enviar a un email genérico ya que no tenemos el email del usuario
    // En producción, deberías tener el email del usuario en el sessionId
    await emailManager.sendEmail(
      'lucasdono391@gmail.com',
      '🛒 Carrito Abandonado - Oportunidad de Recuperación',
      `
      Carrito abandonado detectado:
      
      Session ID: ${abandonmentData.sessionId}
      Servicio: ${abandonmentData.serviceId}
      Add-ons: ${abandonmentData.selectedAddOns.join(', ') || 'Ninguno'}
      Tiempo en página: ${Math.round(abandonmentData.timeOnPage / 1000)} segundos
      URL: ${abandonmentData.url}
      IP: ${abandonmentData.ip}
      
      Contacta al usuario para recuperar la venta.
      `,
      emailContent
    );

    console.log('📧 Email de recuperación de carrito enviado para session:', abandonmentData.sessionId);
    
  } catch (error) {
    console.error('Error enviando email de recuperación:', error);
    throw error;
  }
};

export default {
  trackCartAbandonment
}; 
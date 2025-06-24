import { ChatConversation, ChatMessage, ChatNotification } from '../models/ChatConversation.js';
import { sendEmail } from '../utils/emailManager.js';
import { Op } from 'sequelize';
import axios from 'axios';

// Configuración de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Obtener conversaciones del usuario
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { projectId } = req.query;
    
    const conversations = await ChatConversation.findByUser(userId, projectId);
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error getting user conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones',
      error: error.message
    });
  }
};

// Obtener o crear conversación
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId, projectId, type } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }
    
    const { conversation, created } = await ChatConversation.findOrCreateConversation(
      userId, 
      projectId, 
      type || 'ai'
    );
    
    // Obtener mensajes de la conversación
    const messages = await ChatMessage.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 50
    });
    
    res.json({
      success: true,
      conversation: {
        ...conversation.toJSON(),
        messages
      },
      created
    });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversación',
      error: error.message
    });
  }
};

// Enviar mensaje
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, senderType, message, senderId, messageType } = req.body;
    
    if (!conversationId || !senderType || !message) {
      return res.status(400).json({
        success: false,
        message: 'conversationId, senderType y message son requeridos'
      });
    }
    
    // Crear el mensaje
    const newMessage = await ChatMessage.createMessage(
      conversationId,
      senderType,
      message,
      senderId,
      messageType || 'text'
    );
    
    // Obtener información de la conversación para notificaciones
    const conversation = await ChatConversation.findByPk(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }
    
    // Crear notificación para el destinatario
    let notificationUserId = null;
    if (senderType === 'user') {
      // Si el usuario envía mensaje, notificar al desarrollador
      notificationUserId = 'developer'; // ID especial para desarrollador
    } else if (senderType === 'developer') {
      // Si el desarrollador envía mensaje, notificar al usuario
      notificationUserId = conversation.userId;
    }
    
    if (notificationUserId) {
      await ChatNotification.createNotification(
        notificationUserId,
        conversationId,
        newMessage.id,
        'message'
      );
      
      // Enviar email de notificación
      await sendChatNotificationEmail(conversation, newMessage, senderType);
    }
    
    // Si el mensaje es del usuario y la conversación es de tipo AI, generar respuesta automática
    if (senderType === 'user' && conversation.type === 'ai') {
      try {
        const aiResponse = await generateAIResponse(conversationId, message);
        if (aiResponse) {
          await ChatMessage.createMessage(
            conversationId,
            'ai',
            aiResponse,
            'ai-assistant',
            'text'
          );
        }
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        // No fallar si la IA no responde
      }
    }
    
    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
};

// Cambiar tipo de conversación (AI <-> Developer)
export const switchConversationType = async (req, res) => {
  try {
    const { conversationId, newType } = req.body;
    
    if (!conversationId || !newType) {
      return res.status(400).json({
        success: false,
        message: 'conversationId y newType son requeridos'
      });
    }
    
    const conversation = await ChatConversation.findByPk(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }
    
    // Actualizar tipo de conversación
    conversation.type = newType;
    await conversation.save();
    
    // Crear mensaje del sistema informando el cambio
    const systemMessage = newType === 'ai' 
      ? 'Ahora estás hablando con la IA. Te ayudaré con tus consultas.'
      : 'Te has conectado con el desarrollador. Responderé personalmente a tus mensajes.';
    
    await ChatMessage.createMessage(
      conversationId,
      'system',
      systemMessage,
      'system',
      'system'
    );
    
    res.json({
      success: true,
      conversation,
      message: 'Tipo de conversación cambiado exitosamente'
    });
  } catch (error) {
    console.error('Error switching conversation type:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar tipo de conversación',
      error: error.message
    });
  }
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId es requerido'
      });
    }
    
    // Marcar mensajes como leídos
    await ChatMessage.update(
      { isRead: true },
      {
        where: {
          conversationId,
          senderType: { [Op.ne]: 'user' } // No marcar mensajes propios
        }
      }
    );
    
    // Marcar notificaciones como leídas
    if (userId) {
      await ChatNotification.update(
        { isRead: true },
        {
          where: {
            conversationId,
            userId
          }
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Mensajes marcados como leídos'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar mensajes como leídos',
      error: error.message
    });
  }
};

// Obtener notificaciones no leídas
export const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await ChatNotification.findAll({
      where: {
        userId,
        isRead: false
      },
      include: [
        {
          model: ChatConversation,
          as: 'conversation'
        },
        {
          model: ChatMessage,
          as: 'message'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// Obtener conversaciones para el panel admin (ordenadas por actividad)
export const getAdminConversations = async (req, res) => {
  try {
    const { orderBy = 'lastMessage' } = req.query; // 'lastMessage' o 'deliveryDate'
    
    let orderField = 'last_message_at';
    if (orderBy === 'deliveryDate') {
      orderField = 'created_at'; // Placeholder - en producción sería fecha de entrega del proyecto
    }
    
    const conversations = await ChatConversation.findAll({
      where: {
        type: 'developer' // Solo conversaciones con desarrollador
      },
      include: [
        {
          model: ChatMessage,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']]
        },
        {
          model: ChatNotification,
          as: 'notifications',
          where: {
            userId: 'developer',
            isRead: false
          },
          required: false
        }
      ],
      order: [[orderField, 'DESC']],
      limit: 50
    });
    
    res.json({
      success: true,
      conversations,
      orderBy
    });
  } catch (error) {
    console.error('Error getting admin conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones del admin',
      error: error.message
    });
  }
};

// Generar respuesta de IA
const generateAIResponse = async (conversationId, userMessage) => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Obtener contexto de la conversación
    const recentMessages = await ChatMessage.findAll({
      where: { conversationId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Preparar mensajes para OpenAI
    const messages = [
      {
        role: 'system',
        content: `Eres Chloe, asistente virtual de CircuitPrompt, una agencia de desarrollo web argentina. 
        Ayudas a los clientes con consultas sobre sus proyectos web, servicios y desarrollo. 
        Eres profesional, amigable y siempre buscas resolver sus dudas de manera clara.
        Si no puedes resolver algo, sugiere que se conecten con el desarrollador.`
      },
      ...recentMessages.reverse().map(msg => ({
        role: msg.senderType === 'user' ? 'user' : 'assistant',
        content: msg.message
      }))
    ];
    
    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4',
      messages,
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
};

// Enviar email de notificación
const sendChatNotificationEmail = async (conversation, message, senderType) => {
  try {
    let recipientEmail = null;
    let subject = '';
    let content = '';
    
    if (senderType === 'user') {
      // Notificar al desarrollador
      recipientEmail = process.env.DEVELOPER_EMAIL || 'lucascircuitprompt@gmail.com';
      subject = `💬 Nuevo mensaje de cliente - Proyecto ${conversation.projectId || 'General'}`;
      content = `
        <h3>Nuevo mensaje de cliente</h3>
        <p><strong>Usuario:</strong> ${conversation.userId}</p>
        <p><strong>Proyecto:</strong> ${conversation.projectId || 'General'}</p>
        <p><strong>Mensaje:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${message.message}
        </div>
        <p><a href="https://circuitprompt.com.ar/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Responder en Panel Admin</a></p>
      `;
    } else if (senderType === 'developer') {
      // Notificar al usuario (aquí necesitaríamos obtener el email del usuario)
      // Por ahora solo logeamos
      console.log(`Notificación para usuario ${conversation.userId}: ${message.message}`);
      return;
    }
    
    if (recipientEmail) {
      await sendEmail(recipientEmail, subject, content);
    }
  } catch (error) {
    console.error('Error sending chat notification email:', error);
  }
}; 
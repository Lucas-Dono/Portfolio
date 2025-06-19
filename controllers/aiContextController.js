// Controller para memoria contextual de IA
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo para almacenar contextos de usuario
const CONTEXT_FILE = path.join(__dirname, '../data/userContexts.json');

// Asegurar que el directorio data existe
const ensureDataDirectory = async () => {
  const dataDir = path.dirname(CONTEXT_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Cargar contextos existentes
const loadContexts = async () => {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(CONTEXT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe, crear estructura inicial
    const initialData = {};
    await saveContexts(initialData);
    return initialData;
  }
};

// Guardar contextos
const saveContexts = async (contexts) => {
  try {
    await ensureDataDirectory();
    await fs.writeFile(CONTEXT_FILE, JSON.stringify(contexts, null, 2));
  } catch (error) {
    console.error('Error guardando contextos:', error);
  }
};

// Obtener contexto de usuario
export const getUserContext = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'UserId es requerido'
      });
    }

    const contexts = await loadContexts();
    const userContext = contexts[userId] || {
      preferences: {},
      conversationHistory: [],
      services: [],
      lastInteraction: null,
      personalizedData: {
        interests: [],
        budget: null,
        businessType: null,
        urgency: null
      }
    };

    return res.json({
      success: true,
      context: userContext
    });

  } catch (error) {
    console.error('Error obteniendo contexto:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Actualizar contexto de usuario
export const updateUserContext = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      message, 
      response, 
      preferences, 
      services, 
      personalizedData 
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'UserId es requerido'
      });
    }

    const contexts = await loadContexts();
    
    // Inicializar contexto si no existe
    if (!contexts[userId]) {
      contexts[userId] = {
        preferences: {},
        conversationHistory: [],
        services: [],
        lastInteraction: null,
        personalizedData: {
          interests: [],
          budget: null,
          businessType: null,
          urgency: null
        }
      };
    }

    const userContext = contexts[userId];

    // Actualizar historial de conversación
    if (message && response) {
      userContext.conversationHistory.push({
        timestamp: new Date().toISOString(),
        message,
        response,
        source: req.body.source || 'chat'
      });

      // Mantener solo los últimos 50 mensajes para no sobrecargar
      if (userContext.conversationHistory.length > 50) {
        userContext.conversationHistory = userContext.conversationHistory.slice(-50);
      }
    }

    // Actualizar preferencias
    if (preferences) {
      userContext.preferences = { ...userContext.preferences, ...preferences };
    }

    // Actualizar servicios
    if (services) {
      userContext.services = [...new Set([...userContext.services, ...services])];
    }

    // Actualizar datos personalizados
    if (personalizedData) {
      userContext.personalizedData = { 
        ...userContext.personalizedData, 
        ...personalizedData 
      };
    }

    // Actualizar timestamp de última interacción
    userContext.lastInteraction = new Date().toISOString();

    // Guardar contextos actualizados
    contexts[userId] = userContext;
    await saveContexts(contexts);

    console.log('📝 Contexto actualizado para usuario:', userId);

    return res.json({
      success: true,
      message: 'Contexto actualizado exitosamente',
      context: userContext
    });

  } catch (error) {
    console.error('Error actualizando contexto:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Generar recomendaciones personalizadas
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const contexts = await loadContexts();
    const userContext = contexts[userId];

    if (!userContext) {
      return res.json({
        success: true,
        recommendations: getDefaultRecommendations()
      });
    }

    const recommendations = generateSmartRecommendations(userContext);

    return res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Función para generar recomendaciones inteligentes
const generateSmartRecommendations = (userContext) => {
  const { personalizedData, services, conversationHistory } = userContext;
  const recommendations = [];

  // Análisis de intereses basado en conversaciones
  const interests = extractInterestsFromHistory(conversationHistory);
  
  // Recomendaciones basadas en tipo de negocio
  if (personalizedData.businessType) {
    switch (personalizedData.businessType.toLowerCase()) {
      case 'ecommerce':
      case 'tienda':
        recommendations.push({
          type: 'service',
          title: 'Tienda Online Completa',
          description: 'Basado en tu interés en e-commerce, te recomendamos nuestro servicio completo de tienda online',
          priority: 'high',
          serviceId: 'ecommerce-complete'
        });
        break;
      case 'portfolio':
      case 'personal':
        recommendations.push({
          type: 'service',
          title: 'Portfolio Profesional',
          description: 'Perfecto para mostrar tu trabajo y atraer nuevos clientes',
          priority: 'high',
          serviceId: 'portfolio-pro'
        });
        break;
      case 'empresa':
      case 'corporativo':
        recommendations.push({
          type: 'service',
          title: 'Sitio Web Corporativo',
          description: 'Ideal para empresas que buscan presencia profesional online',
          priority: 'high',
          serviceId: 'corporate-website'
        });
        break;
    }
  }

  // Recomendaciones basadas en presupuesto
  if (personalizedData.budget) {
    if (personalizedData.budget < 500) {
      recommendations.push({
        type: 'service',
        title: 'Landing Page Optimizada',
        description: 'Solución económica y efectiva para comenzar online',
        priority: 'medium',
        serviceId: 'landing-basic'
      });
    } else if (personalizedData.budget > 1000) {
      recommendations.push({
        type: 'service',
        title: 'Desarrollo Personalizado',
        description: 'Solución a medida con todas las funcionalidades que necesitas',
        priority: 'high',
        serviceId: 'custom-development'
      });
    }
  }

  // Recomendaciones basadas en urgencia
  if (personalizedData.urgency === 'high') {
    recommendations.push({
      type: 'addon',
      title: 'Desarrollo Express',
      description: 'Entrega en tiempo récord para tu proyecto urgente',
      priority: 'urgent',
      serviceId: 'express-delivery'
    });
  }

  // Recomendaciones basadas en intereses detectados
  interests.forEach(interest => {
    switch (interest) {
      case 'seo':
        recommendations.push({
          type: 'addon',
          title: 'Optimización SEO Avanzada',
          description: 'Mejora tu posicionamiento en Google',
          priority: 'medium',
          serviceId: 'seo-advanced'
        });
        break;
      case 'mobile':
        recommendations.push({
          type: 'addon',
          title: 'Optimización Móvil Premium',
          description: 'Experiencia perfecta en dispositivos móviles',
          priority: 'medium',
          serviceId: 'mobile-optimization'
        });
        break;
    }
  });

  // Si no hay recomendaciones específicas, usar por defecto
  if (recommendations.length === 0) {
    return getDefaultRecommendations();
  }

  // Ordenar por prioridad
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  return recommendations.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  ).slice(0, 3); // Máximo 3 recomendaciones
};

// Extraer intereses del historial de conversación
const extractInterestsFromHistory = (history) => {
  const interests = new Set();
  const keywords = {
    seo: ['seo', 'google', 'posicionamiento', 'busqueda'],
    mobile: ['móvil', 'mobile', 'celular', 'responsive'],
    ecommerce: ['tienda', 'venta', 'producto', 'carrito'],
    design: ['diseño', 'visual', 'estético', 'bonito']
  };

  history.forEach(item => {
    const text = (item.message + ' ' + item.response).toLowerCase();
    Object.entries(keywords).forEach(([interest, words]) => {
      if (words.some(word => text.includes(word))) {
        interests.add(interest);
      }
    });
  });

  return Array.from(interests);
};

// Recomendaciones por defecto
const getDefaultRecommendations = () => [
  {
    type: 'service',
    title: 'Landing Page Profesional',
    description: 'Ideal para comenzar tu presencia online',
    priority: 'high',
    serviceId: 'landing-professional'
  },
  {
    type: 'service',
    title: 'Sitio Web Completo',
    description: 'Solución integral para tu negocio',
    priority: 'medium',
    serviceId: 'website-complete'
  },
  {
    type: 'addon',
    title: 'Consultoría Gratuita',
    description: 'Te ayudamos a definir la mejor estrategia',
    priority: 'medium',
    serviceId: 'free-consultation'
  }
];

export default {
  getUserContext,
  updateUserContext,
  getPersonalizedRecommendations
}; 
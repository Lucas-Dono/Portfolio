// Controller para cotizaciones automáticas inteligentes
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo para almacenar cotizaciones
const QUOTATIONS_FILE = path.join(__dirname, '../data/quotations.json');

// Base de precios y configuraciones
const PRICING_CONFIG = {
  baseServices: {
    'landing-page': {
      name: 'Landing Page',
      basePrice: 300,
      description: 'Página única optimizada para conversión',
      timeDelivery: '3-5 días',
      features: ['Diseño responsive', 'Optimización SEO básica', 'Formulario de contacto']
    },
    'website-complete': {
      name: 'Sitio Web Completo',
      basePrice: 800,
      description: 'Sitio web multi-página con funcionalidades avanzadas',
      timeDelivery: '7-14 días',
      features: ['Hasta 10 páginas', 'Panel de administración', 'Optimización SEO', 'Integración analytics']
    },
    'ecommerce': {
      name: 'Tienda Online',
      basePrice: 1200,
      description: 'Plataforma e-commerce completa',
      timeDelivery: '14-21 días',
      features: ['Catálogo de productos', 'Carrito de compras', 'Pagos online', 'Panel de administración']
    },
    'portfolio': {
      name: 'Portfolio Profesional',
      basePrice: 500,
      description: 'Sitio web para mostrar trabajos y proyectos',
      timeDelivery: '5-7 días',
      features: ['Galería de proyectos', 'CV integrado', 'Blog opcional', 'Optimización SEO']
    }
  },
  addons: {
    'seo-advanced': { name: 'SEO Avanzado', price: 200, description: 'Optimización completa para buscadores' },
    'mobile-app': { name: 'App Móvil', price: 800, description: 'Aplicación móvil complementaria' },
    'cms-advanced': { name: 'CMS Avanzado', price: 300, description: 'Sistema de gestión de contenido robusto' },
    'analytics-pro': { name: 'Analytics Pro', price: 150, description: 'Dashboards y reportes avanzados' },
    'express-delivery': { name: 'Entrega Express', price: 400, description: 'Reducir tiempo de entrega a la mitad' },
    'maintenance': { name: 'Mantenimiento Anual', price: 600, description: 'Soporte y actualizaciones por 12 meses' },
    'hosting-premium': { name: 'Hosting Premium', price: 300, description: 'Hosting optimizado por 12 meses' }
  },
  multipliers: {
    urgency: {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      urgent: 2.0
    },
    complexity: {
      simple: 1.0,
      medium: 1.3,
      complex: 1.6,
      enterprise: 2.2
    },
    customization: {
      template: 1.0,
      semi_custom: 1.4,
      full_custom: 1.8
    }
  }
};

// Asegurar que el directorio data existe
const ensureDataDirectory = async () => {
  const dataDir = path.dirname(QUOTATIONS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Generar cotización inteligente
export const generateQuotation = async (req, res) => {
  try {
    const {
      serviceType,
      requirements,
      urgency = 'medium',
      customization = 'semi_custom',
      additionalFeatures = [],
      userContext
    } = req.body;

    // Validar servicio base
    if (!serviceType || !PRICING_CONFIG.baseServices[serviceType]) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de servicio no válido'
      });
    }

    const baseService = PRICING_CONFIG.baseServices[serviceType];
    let totalPrice = baseService.basePrice;
    let features = [...baseService.features];
    let estimatedTime = baseService.timeDelivery;

    // Calcular complejidad basada en requerimientos
    const complexity = calculateComplexity(requirements, additionalFeatures);

    // Aplicar multiplicadores
    totalPrice *= PRICING_CONFIG.multipliers.urgency[urgency] || 1.2;
    totalPrice *= PRICING_CONFIG.multipliers.complexity[complexity] || 1.3;
    totalPrice *= PRICING_CONFIG.multipliers.customization[customization] || 1.4;

    // Agregar add-ons seleccionados
    const selectedAddons = [];
    additionalFeatures.forEach(feature => {
      if (PRICING_CONFIG.addons[feature]) {
        const addon = PRICING_CONFIG.addons[feature];
        totalPrice += addon.price;
        selectedAddons.push(addon);
        features.push(addon.name);
      }
    });

    // Aplicar descuentos inteligentes basados en contexto del usuario
    const discount = calculateIntelligentDiscount(userContext, totalPrice);
    const finalPrice = Math.round(totalPrice * (1 - discount.percentage));

    // Ajustar tiempo de entrega basado en urgencia
    if (urgency === 'urgent') {
      estimatedTime = adjustDeliveryTime(estimatedTime, 0.5);
    } else if (urgency === 'high') {
      estimatedTime = adjustDeliveryTime(estimatedTime, 0.7);
    }

    // Generar recomendaciones adicionales
    const recommendations = generateRecommendations(serviceType, requirements, userContext);

    // Crear objeto de cotización
    const quotation = {
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      service: {
        type: serviceType,
        name: baseService.name,
        description: baseService.description
      },
      pricing: {
        basePrice: baseService.basePrice,
        totalBeforeDiscounts: Math.round(totalPrice),
        discount: discount,
        finalPrice: finalPrice,
        currency: 'USD'
      },
      features: features,
      addons: selectedAddons,
      delivery: {
        estimated: estimatedTime,
        urgency: urgency
      },
      complexity: complexity,
      customization: customization,
      recommendations: recommendations,
      userContext: userContext ? {
        businessType: userContext.personalizedData?.businessType,
        budget: userContext.personalizedData?.budget
      } : null,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
    };

    // Guardar cotización
    await saveQuotation(quotation);

    console.log('💰 Cotización generada:', {
      id: quotation.id,
      service: quotation.service.name,
      finalPrice: quotation.pricing.finalPrice,
      discount: quotation.pricing.discount.percentage
    });

    // Crear notificación inteligente para el admin
    try {
      const { notify } = require('./notificationController');
      await notify('NEW_QUOTATION', {
        email: customerData.email,
        serviceType: quotation.service.name,
        finalPrice: quotation.pricing.finalPrice,
        discount: quotation.pricing.discount.percentage,
        urgency: quotation.urgency,
        quotationId: quotation.id
      });
    } catch (notificationError) {
      console.error('Error creando notificación de cotización:', notificationError);
    }

    // Iniciar secuencia post-cotización automáticamente
    try {
      await fetch(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/email-sequences/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerData.email,
          sequenceType: 'post-quotation',
          userData: { 
            quotationId: quotation.id,
            projectType: quotation.service.name,
            finalPrice: quotation.pricing.finalPrice,
            savings: quotation.pricing.basePrice - quotation.pricing.finalPrice
          }
        })
      });
      console.log('📧 Secuencia post-cotización iniciada para:', customerData.email);
    } catch (error) {
      console.error('Error iniciando secuencia post-cotización:', error);
    }

    return res.json({
      success: true,
      quotation: quotation
    });

  } catch (error) {
    console.error('Error generando cotización:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Calcular complejidad basada en requerimientos
const calculateComplexity = (requirements, additionalFeatures) => {
  let complexityScore = 0;

  // Analizar requerimientos de texto
  if (requirements) {
    const text = requirements.toLowerCase();
    
    // Palabras que indican complejidad
    const complexityIndicators = {
      simple: ['básico', 'simple', 'sencillo', 'mínimo'],
      medium: ['estándar', 'normal', 'común', 'típico'],
      complex: ['avanzado', 'personalizado', 'específico', 'integración'],
      enterprise: ['empresarial', 'corporativo', 'escalable', 'múltiples usuarios']
    };

    Object.entries(complexityIndicators).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          switch (level) {
            case 'simple': complexityScore += 1; break;
            case 'medium': complexityScore += 2; break;
            case 'complex': complexityScore += 3; break;
            case 'enterprise': complexityScore += 4; break;
          }
        }
      });
    });
  }

  // Analizar add-ons
  complexityScore += additionalFeatures.length;

  // Determinar nivel de complejidad
  if (complexityScore <= 2) return 'simple';
  if (complexityScore <= 5) return 'medium';
  if (complexityScore <= 8) return 'complex';
  return 'enterprise';
};

// Calcular descuento inteligente
const calculateIntelligentDiscount = (userContext, totalPrice) => {
  let discountPercentage = 0;
  let reason = '';

  if (!userContext) {
    return { percentage: 0, reason: 'Sin descuento aplicable' };
  }

  // Descuento por cliente recurrente
  if (userContext.conversationHistory && userContext.conversationHistory.length > 10) {
    discountPercentage += 0.1; // 10%
    reason += 'Cliente frecuente (+10%), ';
  }

  // Descuento por presupuesto limitado
  if (userContext.personalizedData?.budget && userContext.personalizedData.budget < totalPrice * 0.8) {
    discountPercentage += 0.15; // 15%
    reason += 'Ajuste por presupuesto (+15%), ';
  }

  // Descuento por referencia o primera compra
  if (userContext.conversationHistory && userContext.conversationHistory.length === 0) {
    discountPercentage += 0.05; // 5%
    reason += 'Primera cotización (+5%), ';
  }

  // Límite máximo de descuento
  discountPercentage = Math.min(discountPercentage, 0.25); // Máximo 25%

  return {
    percentage: discountPercentage,
    reason: reason.slice(0, -2) || 'Sin descuento aplicable'
  };
};

// Ajustar tiempo de entrega
const adjustDeliveryTime = (timeString, multiplier) => {
  const match = timeString.match(/(\d+)-(\d+)\s*días/);
  if (match) {
    const min = Math.ceil(parseInt(match[1]) * multiplier);
    const max = Math.ceil(parseInt(match[2]) * multiplier);
    return `${min}-${max} días`;
  }
  return timeString;
};

// Generar recomendaciones adicionales
const generateRecommendations = (serviceType, requirements, userContext) => {
  const recommendations = [];

  // Recomendaciones basadas en tipo de servicio
  switch (serviceType) {
    case 'landing-page':
      recommendations.push({
        type: 'addon',
        id: 'seo-advanced',
        reason: 'Mejora la visibilidad en buscadores'
      });
      break;
    case 'ecommerce':
      recommendations.push({
        type: 'addon',
        id: 'analytics-pro',
        reason: 'Esencial para analizar ventas y comportamiento'
      });
      break;
  }

  // Recomendaciones basadas en contexto del usuario
  if (userContext?.personalizedData?.urgency === 'high') {
    recommendations.push({
      type: 'addon',
      id: 'express-delivery',
      reason: 'Basado en tu necesidad de entrega rápida'
    });
  }

  return recommendations;
};

// Guardar cotización
const saveQuotation = async (quotation) => {
  try {
    await ensureDataDirectory();
    
    let quotations = [];
    try {
      const data = await fs.readFile(QUOTATIONS_FILE, 'utf8');
      quotations = JSON.parse(data);
    } catch {
      // Archivo no existe, usar array vacío
    }

    quotations.push(quotation);
    
    // Mantener solo las últimas 100 cotizaciones
    if (quotations.length > 100) {
      quotations = quotations.slice(-100);
    }

    await fs.writeFile(QUOTATIONS_FILE, JSON.stringify(quotations, null, 2));
  } catch (error) {
    console.error('Error guardando cotización:', error);
  }
};

// Obtener cotización por ID
export const getQuotation = async (req, res) => {
  try {
    const { quotationId } = req.params;
    
    const data = await fs.readFile(QUOTATIONS_FILE, 'utf8');
    const quotations = JSON.parse(data);
    
    const quotation = quotations.find(q => q.id === quotationId);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    return res.json({
      success: true,
      quotation
    });

  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export default {
  generateQuotation,
  getQuotation
}; 
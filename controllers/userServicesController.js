// Controlador para manejar los servicios contratados por el usuario
import jwt from 'jsonwebtoken';
import { UserService } from '../models/UserService.js';

// Lista de servicios soportados
const availableServices = {
  'landing': {
    type: 'landing',
    title: 'Landing Page',
    description: 'Página de aterrizaje profesional para mostrar tu negocio',
    initialProgress: 15
  },
  'web5': {
    type: 'business',
    title: 'Página Web 5 Rutas',
    description: 'Sitio web completo con hasta 5 páginas para tu empresa',
    initialProgress: 10
  },
  'web7': {
    type: 'business',
    title: 'Página Web Premium',
    description: 'Sitio web profesional completo con más de 7 páginas',
    initialProgress: 5
  },
  'blog': {
    type: 'blog',
    title: 'Blog Profesional',
    description: 'Blog para compartir contenido y atraer visitantes',
    initialProgress: 12
  },
  'ecommerce': {
    type: 'ecommerce',
    title: 'Tienda en Línea',
    description: 'Tienda online completa para vender tus productos',
    initialProgress: 8
  },
  'portfolio': {
    type: 'portfolio',
    title: 'Portfolio Profesional',
    description: 'Portfolio para mostrar tus trabajos y habilidades',
    initialProgress: 15
  }
};

// Datos de prueba para desarrollo
const mockServices = [
  {
    id: 'service-001',
    user_id: 'user-dev',
    service_type: 'landing',
    payment_id: 'mock-payment-001',
    payment_status: 'approved',
    amount: 29900,
    details: { domain: 'midominio.com', hosting: true },
    full_name: 'Usuario Desarrollador',
    contact_name: 'Usuario Desarrollador',
    email: 'desarrollador@test.com',
    phone: '123456789',
    company: 'Empresa de Prueba',
    status: 'in_progress',
    progress: 45,
    stage: 'design',
    next_task: 'Revisión de diseño',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'service-002',
    user_id: 'user-dev',
    service_type: 'ecommerce',
    payment_id: 'mock-payment-002',
    payment_status: 'approved',
    amount: 89900,
    details: { products: 50, payment_gateway: 'stripe' },
    full_name: 'Usuario Desarrollador',
    contact_name: 'Usuario Desarrollador',
    email: 'desarrollador@test.com',
    phone: '123456789',
    company: 'Empresa de Prueba',
    status: 'in_progress',
    progress: 30,
    stage: 'development',
    next_task: 'Integración de pagos',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Función para determinar si usar datos de prueba
const shouldUseMockData = () => {
  return process.env.NODE_ENV === 'development' ||
    process.env.DISABLE_DB === 'true' ||
    process.env.ENABLE_FILE_FALLBACK === 'true';
};

// Obtener servicios del usuario autenticado
export const getUserServices = async (req, res) => {
  try {
    // Verificar el token de autenticación
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    // Decodificar el token para obtener el ID del usuario
    const secretKey = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, secretKey);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    let userServices;

    // Usar datos de prueba en desarrollo o si falla la base de datos
    if (shouldUseMockData()) {
      console.log('📋 Usando datos de prueba para servicios de usuario');
      userServices = mockServices;
    } else {
      // Obtener los servicios del usuario desde la base de datos
      try {
        userServices = await UserService.getByUserId(userId);
      } catch (dbError) {
        console.error('Error de base de datos, usando datos de prueba:', dbError);
        userServices = mockServices;
      }
    }

    // Devolver los servicios
    res.status(200).json({
      success: true,
      services: userServices
    });

  } catch (error) {
    console.error('Error al obtener servicios del usuario:', error);

    // Si el error es de verificación de token, devolver un error de autenticación
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // En caso de error, devolver datos de prueba en desarrollo
    if (shouldUseMockData()) {
      console.log('🔄 Fallback a datos de prueba debido a error');
      return res.status(200).json({
        success: true,
        services: mockServices
      });
    }

    res.status(500).json({ error: 'Error al obtener servicios del usuario' });
  }
};

// Registrar un nuevo servicio para el usuario
export const registerUserService = async (req, res) => {
  try {
    // Verificar el token de autenticación
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
    }

    // Decodificar el token para obtener el ID del usuario
    const secretKey = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, secretKey);
    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Obtener datos del servicio del cuerpo de la petición
    const {
      serviceId,
      serviceType,
      paymentId,
      paymentStatus,
      userEmail,
      amount,
      details,
      fullName,
      contactName,
      email,
      phone = "",
      company = "",
      payerInfo
    } = req.body;

    // Registrar todos los datos recibidos para depuración
    console.log('🧩 Datos recibidos en registerUserService:', {
      serviceId,
      serviceType,
      userId,
      email: email || userEmail,
      fullName,
      contactName,
      details,
      payerInfo
    });

    // Validar datos necesarios
    if (!serviceId || !paymentId) {
      return res.status(400).json({ error: 'Faltan datos requeridos (serviceId, paymentId)' });
    }

    // Verificar si el servicio existe
    const serviceInfo = availableServices[serviceType || serviceId];
    if (!serviceInfo) {
      return res.status(400).json({ error: 'Tipo de servicio no válido' });
    }

    // Crear el servicio en la base de datos
    const newService = await UserService.create({
      userId,
      serviceType: serviceType || serviceId,
      paymentId,
      paymentStatus,
      amount,
      details,
      fullName: fullName || details?.fullName || contactName || details?.contactName || 'Usuario',
      contactName: contactName || details?.contactName || fullName || details?.fullName || 'Usuario',
      email: email || userEmail || details?.email || details?.userEmail || '',
      phone: phone || details?.phone || details?.telefono || '',
      company: company || details?.company || details?.empresa || '',
      status: 'pending',
      progress: serviceInfo.initialProgress || 0
    });

    res.status(201).json({
      success: true,
      message: 'Servicio registrado exitosamente',
      service: newService
    });

  } catch (error) {
    console.error('Error al registrar servicio:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    res.status(500).json({ error: 'Error al registrar el servicio' });
  }
};

// Actualizar el progreso de un servicio
export const updateServiceProgress = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { progress, stage, nextTask } = req.body;

    // Validar datos
    if (progress === undefined || !stage) {
      return res.status(400).json({ error: 'Faltan datos requeridos (progress, stage)' });
    }

    // Actualizar el progreso en la base de datos
    const updatedService = await UserService.updateProgress(serviceId, progress, stage, nextTask);

    if (!updatedService) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Progreso actualizado exitosamente',
      service: updatedService
    });

  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    res.status(500).json({ error: 'Error al actualizar el progreso del servicio' });
  }
};

// Actualizar los detalles de un servicio
export const updateServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { details } = req.body;

    if (!details) {
      return res.status(400).json({ error: 'Faltan datos requeridos (details)' });
    }

    // Actualizar los detalles en la base de datos
    const updatedService = await UserService.updateDetails(serviceId, details);

    if (!updatedService) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Detalles actualizados exitosamente',
      service: updatedService
    });

  } catch (error) {
    console.error('Error al actualizar detalles:', error);
    res.status(500).json({ error: 'Error al actualizar los detalles del servicio' });
  }
}; 
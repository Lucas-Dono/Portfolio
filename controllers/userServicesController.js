// Controlador para manejar los servicios contratados por el usuario
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo JSON que almacenará los servicios de usuario
const USER_SERVICES_FILE = path.join(__dirname, '../data/userServices.json');

// Función auxiliar para cargar los servicios desde el archivo JSON
async function loadUserServices() {
  try {
    const data = await fs.readFile(USER_SERVICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe o hay otro error, devolver un array vacío
    console.log('Error al cargar servicios de usuario:', error.message);
    return { services: [] };
  }
}

// Función auxiliar para guardar los servicios en el archivo JSON
async function saveUserServices(services) {
  try {
    // Crear directorio si no existe
    const dir = path.dirname(USER_SERVICES_FILE);
    await fs.mkdir(dir, { recursive: true });
    
    // Guardar datos
    await fs.writeFile(USER_SERVICES_FILE, JSON.stringify(services, null, 2));
    return true;
  } catch (error) {
    console.error('Error al guardar servicios de usuario:', error);
    return false;
  }
}

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
    
    // Cargar los servicios desde el archivo
    const servicesData = await loadUserServices();
    
    // Filtrar solo los servicios del usuario actual
    const userServices = servicesData.services.filter(service => service.userId === userId);
    
    // Devolver los servicios filtrados
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
      // Capturar explícitamente datos del cliente
      fullName,
      contactName,
      email,
      // Datos adicionales opcionales que podrían no estar presentes
      phone = "",
      company = "",
      // Datos adicionales del pago
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
    
    // Generar un ID único para el servicio
    const serviceUniqueId = `service_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Construir un objeto de detalles completo
    const completeDetails = {
      ...(details || {}),
      // Asegurar que se incluyan estos campos críticos
      fullName: fullName || details?.fullName || contactName || details?.contactName || 'Usuario',
      contactName: contactName || details?.contactName || fullName || details?.fullName || 'Usuario',
      email: email || userEmail || details?.email || details?.userEmail || '',
      // Campos opcionales
      phone: phone || details?.phone || details?.telefono || '',
      company: company || details?.company || details?.empresa || ''
    };
    
    // Construir datos de pago completos
    const paymentDetails = {
      id: paymentId,
      status: paymentStatus,
      amount: amount || 0,
      date: new Date().toISOString(),
      // Capturar información adicional del pagador si está disponible
      payer: payerInfo || {
        name: fullName || completeDetails.fullName,
        email: email || userEmail || completeDetails.email
      }
    };
    
    // Crear el nuevo servicio con datos por defecto
    const newService = {
      id: serviceUniqueId,
      userId,
      serviceId,
      type: serviceInfo.type,
      name: serviceInfo.title,
      description: serviceInfo.description,
      status: 'development',
      domain: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: serviceInfo.initialProgress,
      stage: 'Planificación',
      nextTask: 'Diseño inicial',
      payment: paymentDetails,
      details: completeDetails,
      // Incluir email directamente para facilitar búsquedas
      email: email || userEmail || completeDetails.email,
      // Incluir nombre directamente para facilitar búsquedas
      clientName: fullName || completeDetails.fullName,
      milestones: [
        { id: 'planning', name: 'Planificación', completed: true },
        { id: 'design', name: 'Diseño', completed: false },
        { id: 'content', name: 'Contenido', completed: false },
        { id: 'development', name: 'Desarrollo', completed: false },
        { id: 'responsive', name: 'Responsive', completed: false },
        { id: 'testing', name: 'Pruebas', completed: false },
        { id: 'launch', name: 'Lanzamiento', completed: false }
      ],
      previews: [
        {
          id: 1,
          url: 'https://placehold.co/600x400/00FFFF/1e1e1e?text=Design+Preview',
          title: 'Diseño Inicial',
          description: 'Vista previa del diseño inicial'
        }
      ]
    };
    
    // Cargar los servicios actuales
    const servicesData = await loadUserServices();
    
    // Añadir el nuevo servicio
    servicesData.services.push(newService);
    
    // Guardar los servicios actualizados
    const saved = await saveUserServices(servicesData);
    
    if (!saved) {
      throw new Error('Error al guardar el servicio');
    }
    
    // Devolver respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Servicio registrado correctamente',
      service: newService
    });
    
  } catch (error) {
    console.error('Error al registrar servicio:', error);
    
    // Si el error es de verificación de token, devolver un error de autenticación
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    res.status(500).json({ 
      error: 'Error al registrar el servicio',
      message: error.message
    });
  }
};

// Actualizar el progreso de un servicio
export const updateServiceProgress = async (req, res) => {
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
    
    // Obtener el ID del servicio y datos actualizados
    const { serviceId } = req.params;
    const { progress, stage, nextTask, milestones } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({ error: 'Debe proporcionar el ID del servicio' });
    }
    
    // Cargar los servicios
    const servicesData = await loadUserServices();
    
    // Encontrar el servicio específico del usuario
    const serviceIndex = servicesData.services.findIndex(
      service => service.id === serviceId && service.userId === userId
    );
    
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    // Actualizar los campos proporcionados
    if (progress !== undefined) {
      servicesData.services[serviceIndex].progress = progress;
    }
    if (stage) {
      servicesData.services[serviceIndex].stage = stage;
    }
    if (nextTask) {
      servicesData.services[serviceIndex].nextTask = nextTask;
    }
    if (milestones) {
      servicesData.services[serviceIndex].milestones = milestones;
    }
    
    // Actualizar la fecha de modificación
    servicesData.services[serviceIndex].updatedAt = new Date().toISOString();
    
    // Guardar los cambios
    const saved = await saveUserServices(servicesData);
    
    if (!saved) {
      throw new Error('Error al guardar la actualización del servicio');
    }
    
    // Devolver el servicio actualizado
    res.status(200).json({
      success: true,
      message: 'Progreso actualizado correctamente',
      service: servicesData.services[serviceIndex]
    });
    
  } catch (error) {
    console.error('Error al actualizar progreso del servicio:', error);
    
    // Si el error es de verificación de token, devolver un error de autenticación
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    res.status(500).json({ 
      error: 'Error al actualizar el progreso del servicio',
      message: error.message
    });
  }
};

// Actualizar los detalles de un servicio específico
export async function updateServiceDetails(req, res) {
  try {
    console.log(`⏳ Actualizando detalles para el servicio: ${req.params.serviceId} [Método: ${req.method}]`);
    console.log('📝 Headers:', JSON.stringify(req.headers, null, 2));
    
    // Verificar autenticación
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ Error: No se proporcionó token de autenticación');
      return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }

    // Verificar el token
    let decoded;
    try {
      const secretKey = process.env.JWT_SECRET || 'your_jwt_secret';
      console.log('🔑 Usando clave secreta JWT:', secretKey.substring(0, 3) + '...');
      
      decoded = jwt.verify(token, secretKey);
      console.log('✅ Token verificado correctamente');
    } catch (error) {
      console.log('❌ Error al verificar token:', error.message);
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    // Obtener el ID del usuario autenticado
    const userId = decoded.userId;
    if (!userId) {
      console.log('❌ Error: ID de usuario no encontrado en el token');
      return res.status(401).json({ message: 'ID de usuario no encontrado en el token' });
    }

    // Obtener el ID del servicio desde los parámetros
    const { serviceId } = req.params;
    if (!serviceId) {
      console.log('❌ Error: Se requiere el ID del servicio');
      return res.status(400).json({ message: 'Se requiere el ID del servicio' });
    }

    console.log(`🔍 Buscando servicio con ID: ${serviceId} para usuario: ${userId}`);
    console.log('📦 Cuerpo de la solicitud:', JSON.stringify(req.body, null, 2));

    // Obtener los detalles del proyecto desde el cuerpo de la solicitud
    const { projectDetails } = req.body;
    if (!projectDetails) {
      console.log('❌ Error: Se requieren los detalles del proyecto');
      return res.status(400).json({ message: 'Se requieren los detalles del proyecto' });
    }

    // Cargar los servicios existentes
    let userServices = await loadUserServices();
    console.log(`📋 Total de servicios cargados: ${userServices.services.length}`);

    // Listar todos los IDs de servicios para debugging
    const serviceIds = userServices.services.map(s => s.id);
    console.log(`🔢 IDs de servicios disponibles: ${serviceIds.join(', ')}`);

    // Encontrar el servicio específico
    const serviceIndex = userServices.services.findIndex(
      service => service.id === serviceId && service.userId === userId
    );

    if (serviceIndex === -1) {
      console.log(`❌ Error: Servicio con ID ${serviceId} no encontrado para usuario ${userId}`);
      // Buscar cualquier servicio del usuario para debugging
      const userAnyService = userServices.services.find(s => s.userId === userId);
      console.log(`🔎 Primer servicio encontrado para el usuario: ${userAnyService ? userAnyService.id : 'ninguno'}`);
      
      return res.status(404).json({ 
        message: 'Servicio no encontrado o no pertenece al usuario',
        serviceId,
        userId,
        availableIds: serviceIds,
        userServices: userServices.services.filter(s => s.userId === userId).map(s => ({ id: s.id, name: s.name }))
      });
    }

    console.log(`✅ Servicio encontrado en el índice: ${serviceIndex}`);

    // Actualizar los detalles del proyecto
    userServices.services[serviceIndex].projectDetails = projectDetails;
    userServices.services[serviceIndex].updatedAt = new Date().toISOString();

    // Guardar los cambios
    const saved = await saveUserServices(userServices);
    if (!saved) {
      throw new Error('Error al guardar los cambios en el archivo de servicios');
    }

    console.log(`✅ Detalles actualizados para el servicio: ${serviceId}`);

    // Responder con el servicio actualizado
    res.status(200).json({ 
      message: 'Detalles del proyecto actualizados correctamente',
      service: userServices.services[serviceIndex]
    });

  } catch (error) {
    console.error('❌ Error al actualizar detalles del servicio:', error);
    res.status(500).json({ 
      message: 'Error al actualizar detalles del servicio', 
      error: error.message 
    });
  }
} 
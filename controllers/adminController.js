import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import crypto from 'crypto';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo JSON que almacena los servicios de usuario
const USER_SERVICES_FILE = path.join(__dirname, '../data/userServices.json');

// Función auxiliar para cargar los servicios desde el archivo JSON
async function loadUserServices() {
  try {
    const data = await fs.readFile(USER_SERVICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Error al cargar servicios de usuario:', error.message);
    return { services: [] };
  }
}

// Función auxiliar para guardar los servicios en el archivo JSON
async function saveUserServices(services) {
  try {
    const dir = path.dirname(USER_SERVICES_FILE);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(USER_SERVICES_FILE, JSON.stringify(services, null, 2));
    return true;
  } catch (error) {
    console.error('Error al guardar servicios de usuario:', error);
    return false;
  }
}

// Verificar que el usuario tiene permisos de administrador
function verifyAdminToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  
  // Mostrar información de depuración
  console.log('Token de autorización recibido:', token ? `${token.substring(0, 15)}...` : 'No hay token');
  console.log('Headers completos:', req.headers);
  
  // Verificación especial para token de desarrollo
  if (token && (
    token === 'admin-dev-token-local' || 
    token.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
  )) {
    console.log('🔐 Modo desarrollo: Token de administrador aceptado');
    return { 
      userId: 'admin-user',
      role: 'admin'
    };
  }
  
  if (!token) {
    throw new Error('No se proporcionó token de autenticación');
  }
  
  try {
    const secretKey = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, secretKey);
    
    console.log('Token decodificado:', decoded);
    
    if (!decoded.userId || !decoded.role || decoded.role !== 'admin') {
      throw new Error('Acceso denegado: Se requieren permisos de administrador');
    }
    
    return decoded;
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    throw new Error('Token inválido o sin permisos suficientes');
  }
}

// Obtener todos los proyectos para el panel de administración
export const getAdminProjects = async (req, res) => {
  try {
    // Verificación de autenticación ya realizada por el middleware en server.js
    console.log('🔍 Usuario en la solicitud:', req.user);
    
    // Cargar todos los servicios
    const servicesData = await loadUserServices();
    
    // Transformar los datos para adaptarlos al formato necesario para el panel admin
    const projects = servicesData.services.map(service => {
      // Extraer los datos del usuario de diferentes campos posibles
      // Datos del cliente
      const userName = extractClientName(service);
      const email = extractClientEmail(service);
      
      console.log(`Procesando servicio ID ${service.id}:`, {
        datosOriginales: {
          details: service.details,
          payment: service.payment
        },
        datosExtraidos: {
          userName,
          email
        }
      });
      
      return {
        id: service.id,
        userId: service.userId,
        userName: userName,
        email: email,
        serviceName: service.name,
        serviceType: service.type,
        progress: service.progress || 0,
        status: service.status === 'active' ? 'activo' : 
                service.status === 'pending' ? 'pendiente' : 'en desarrollo',
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        previewImages: service.previews?.map(preview => ({
          id: preview.id,
          url: preview.url,
          title: preview.title || '',
          description: preview.description || '',
          device: preview.device || 'desktop'
        })) || [],
        tempLink: service.tempLink || null,
        tempLinkExpiry: service.tempLinkExpiry || null
      };
    });
    
    res.status(200).json(projects);
    
  } catch (error) {
    console.error('Error al obtener proyectos para administración:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

// Función para extraer el nombre del cliente de diversas ubicaciones posibles
function extractClientName(service) {
  // Primero buscar en los campos más específicos
  if (service.details) {
    if (service.details.fullName) return service.details.fullName;
    if (service.details.contactName) return service.details.contactName;
    if (service.details.clientName) return service.details.clientName;
    if (service.details.name) return service.details.name;
    if (service.details.nombre) return service.details.nombre;
    if (service.details.nombreCompleto) return service.details.nombreCompleto;
  }
  
  // Buscar en datos de pago
  if (service.payment && service.payment.payer) {
    if (service.payment.payer.name) return service.payment.payer.name;
    if (service.payment.payer.nombre) return service.payment.payer.nombre;
  }
  
  // Buscar en campos básicos de propietario
  if (service.owner) return service.owner;
  if (service.client) return service.client;
  if (service.clientName) return service.clientName;
  if (service.userName) return service.userName;
  
  // Valor por defecto si no encontramos nada
  return 'Usuario';
}

// Función para extraer el email del cliente de diversas ubicaciones posibles
function extractClientEmail(service) {
  // Primero buscar en los campos más específicos
  if (service.details) {
    if (service.details.email) return service.details.email;
    if (service.details.contactEmail) return service.details.contactEmail;
    if (service.details.clientEmail) return service.details.clientEmail;
    if (service.details.correo) return service.details.correo;
  }
  
  // Buscar en datos de pago
  if (service.payment && service.payment.payer) {
    if (service.payment.payer.email) return service.payment.payer.email;
    if (service.payment.payer.correo) return service.payment.payer.correo;
  }
  
  // Buscar en campos básicos
  if (service.email) return service.email;
  if (service.clientEmail) return service.clientEmail;
  if (service.userEmail) return service.userEmail;
  
  // Valor por defecto si no encontramos nada
  return '';
}

// Configuración para subir imágenes
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../uploads/previews');
      fs.mkdir(uploadDir, { recursive: true })
        .then(() => cb(null, uploadDir))
        .catch(err => cb(err));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Subir una imagen de vista previa para un proyecto
export const uploadProjectImage = async (req, res) => {
  try {
    // Verificar permisos de administrador
    verifyAdminToken(req);
    
    // Usar multer para procesar un archivo único
    upload.single('image')(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
      }
      
      const { projectId } = req.params;
      const { title, description, device } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: 'El ID del proyecto es obligatorio' });
      }
      
      // Crear URL para la imagen (en producción, esto sería una URL completa al CDN/servidor de archivos)
      const imageUrl = `/uploads/previews/${req.file.filename}`;
      
      // Cargar los servicios actuales
      const servicesData = await loadUserServices();
      
      // Encontrar el proyecto específico
      const projectIndex = servicesData.services.findIndex(s => s.id === projectId);
      
      if (projectIndex === -1) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      
      // Añadir la nueva imagen al proyecto
      const newImageId = Date.now();
      const newImage = {
        id: newImageId,
        url: imageUrl,
        title: title || 'Vista previa',
        description: description || '',
        device: device || 'desktop'
      };
      
      // Verificar si ya existe previews, si no, crear el array
      if (!servicesData.services[projectIndex].previews) {
        servicesData.services[projectIndex].previews = [];
      }
      
      // Añadir la nueva imagen
      servicesData.services[projectIndex].previews.push(newImage);
      
      // Actualizar la fecha de última modificación
      servicesData.services[projectIndex].updatedAt = new Date().toISOString();
      
      // Guardar los servicios actualizados
      const saved = await saveUserServices(servicesData);
      
      if (!saved) {
        throw new Error('Error al guardar la imagen');
      }
      
      // Devolver la imagen recién creada
      res.status(201).json(newImage);
    });
    
  } catch (error) {
    console.error('Error al subir imagen de proyecto:', error);
    
    if (error.message.includes('Acceso denegado') || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }
    
    res.status(500).json({ error: 'Error al subir imagen de proyecto' });
  }
};

// Actualizar el progreso de un proyecto
export const updateProjectProgress = async (req, res) => {
  try {
    // Verificar permisos de administrador
    verifyAdminToken(req);
    
    const { projectId } = req.params;
    const { progress } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'El ID del proyecto es obligatorio' });
    }
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'El progreso debe ser un número entre 0 y 100' });
    }
    
    // Cargar los servicios actuales
    const servicesData = await loadUserServices();
    
    // Encontrar el proyecto específico
    const projectIndex = servicesData.services.findIndex(s => s.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Actualizar el progreso del proyecto
    servicesData.services[projectIndex].progress = parseInt(progress);
    
    // También actualizar miliestones según el progreso
    if (progress >= 100) {
      // Si el progreso es 100%, todos los milestones están completos
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: true
      }));
    } else if (progress >= 85) {
      // Actualizar milestones relevantes según el progreso
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: m.id !== 'launch'
      }));
    } else if (progress >= 70) {
      // Casi en la etapa final
      const updateMilestones = ['planning', 'design', 'content', 'development', 'responsive'];
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: updateMilestones.includes(m.id)
      }));
    } else if (progress >= 50) {
      // Mitad del proyecto
      const updateMilestones = ['planning', 'design', 'content', 'development'];
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: updateMilestones.includes(m.id)
      }));
    } else if (progress >= 30) {
      // Etapas iniciales
      const updateMilestones = ['planning', 'design', 'content'];
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: updateMilestones.includes(m.id)
      }));
    } else if (progress >= 15) {
      // Muy al inicio
      const updateMilestones = ['planning', 'design'];
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: updateMilestones.includes(m.id)
      }));
    } else {
      // Solo planificación
      servicesData.services[projectIndex].milestones = servicesData.services[projectIndex].milestones.map(m => ({
        ...m,
        completed: m.id === 'planning'
      }));
    }
    
    // Actualizar la fecha de última modificación
    servicesData.services[projectIndex].updatedAt = new Date().toISOString();
    
    // Guardar los servicios actualizados
    const saved = await saveUserServices(servicesData);
    
    if (!saved) {
      throw new Error('Error al actualizar el progreso');
    }
    
    // Devolver el proyecto actualizado
    res.status(200).json({
      id: servicesData.services[projectIndex].id,
      progress: servicesData.services[projectIndex].progress,
      milestones: servicesData.services[projectIndex].milestones,
      updatedAt: servicesData.services[projectIndex].updatedAt
    });
    
  } catch (error) {
    console.error('Error al actualizar progreso de proyecto:', error);
    
    if (error.message.includes('Acceso denegado') || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }
    
    res.status(500).json({ error: 'Error al actualizar progreso de proyecto' });
  }
};

// Crear un enlace temporal para que un cliente pueda ver su proyecto
export const createProjectTempLink = async (req, res) => {
  try {
    // Verificar permisos de administrador
    verifyAdminToken(req);
    
    const { projectId } = req.params;
    const { link, expiryDays } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'El ID del proyecto es obligatorio' });
    }
    
    if (!link) {
      return res.status(400).json({ error: 'El enlace es obligatorio' });
    }
    
    // Cargar los servicios actuales
    const servicesData = await loadUserServices();
    
    // Encontrar el proyecto específico
    const projectIndex = servicesData.services.findIndex(s => s.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Generar un token para el enlace temporal
    const token = crypto.randomBytes(16).toString('hex');
    
    // Calcular fecha de expiración
    const days = parseInt(expiryDays) || 7; // Default: 7 días
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + days);
    
    // Actualizar los datos del proyecto con el enlace temporal
    servicesData.services[projectIndex].tempLink = link;
    servicesData.services[projectIndex].tempLinkToken = token;
    servicesData.services[projectIndex].tempLinkExpiry = expiryDate.toISOString().split('T')[0];
    servicesData.services[projectIndex].updatedAt = new Date().toISOString();
    
    // Guardar los servicios actualizados
    const saved = await saveUserServices(servicesData);
    
    if (!saved) {
      throw new Error('Error al crear el enlace temporal');
    }
    
    // Devolver la información del enlace temporal
    res.status(201).json({
      tempLink: servicesData.services[projectIndex].tempLink,
      tempLinkToken: token,
      tempLinkExpiry: servicesData.services[projectIndex].tempLinkExpiry,
      updatedAt: servicesData.services[projectIndex].updatedAt
    });
    
  } catch (error) {
    console.error('Error al crear enlace temporal:', error);
    
    if (error.message.includes('Acceso denegado') || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }
    
    res.status(500).json({ error: 'Error al crear enlace temporal' });
  }
};

// Eliminar una imagen de vista previa
export const deleteProjectImage = async (req, res) => {
  try {
    // Verificar permisos de administrador
    verifyAdminToken(req);
    
    const { projectId, imageId } = req.params;
    
    if (!projectId || !imageId) {
      return res.status(400).json({ error: 'El ID del proyecto y de la imagen son obligatorios' });
    }
    
    // Cargar los servicios actuales
    const servicesData = await loadUserServices();
    
    // Encontrar el proyecto específico
    const projectIndex = servicesData.services.findIndex(s => s.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Verificar que el proyecto tiene imágenes
    if (!servicesData.services[projectIndex].previews) {
      return res.status(404).json({ error: 'El proyecto no tiene imágenes' });
    }
    
    // Encontrar la imagen específica
    const imageIndex = servicesData.services[projectIndex].previews.findIndex(img => img.id === parseInt(imageId));
    
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }
    
    // Obtener la URL de la imagen para eliminarla del sistema de archivos
    const imageUrl = servicesData.services[projectIndex].previews[imageIndex].url;
    
    // Eliminar la imagen del array de imágenes
    servicesData.services[projectIndex].previews.splice(imageIndex, 1);
    
    // Actualizar la fecha de última modificación
    servicesData.services[projectIndex].updatedAt = new Date().toISOString();
    
    // Guardar los servicios actualizados
    const saved = await saveUserServices(servicesData);
    
    if (!saved) {
      throw new Error('Error al eliminar la imagen');
    }
    
    // Intentar eliminar el archivo físico de imagen (si es posible)
    try {
      if (imageUrl && imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', imageUrl);
        await fs.unlink(filePath);
      }
    } catch (fileError) {
      console.warn('No se pudo eliminar el archivo físico de la imagen:', fileError.message);
      // No detenemos el proceso si falla la eliminación del archivo físico
    }
    
    // Devolver respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Imagen eliminada correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar imagen de proyecto:', error);
    
    if (error.message.includes('Acceso denegado') || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }
    
    res.status(500).json({ error: 'Error al eliminar imagen de proyecto' });
  }
}; 
import dotenv from 'dotenv';
import initializeDatabase, { sequelize } from './database.js';
import Servicio from '../models/Servicio.js';
import AddonServicio from '../models/AddonServicio.js';
import FileStorage from '../utils/fileStorage.js';

dotenv.config();

// Datos iniciales para servicios
const serviciosIniciales = [
  {
    id: 'landing-page',
    title: 'Landing Page',
    description: 'Una página web de aterrizaje para tu negocio',
    features: [
      'Diseño profesional',
      'Responsive design',
      'Optimización SEO básica',
      '1 formulario de contacto'
    ],
    isPaquete: false,
    price: 25000,
    originalPrice: 35000
  },
  {
    id: 'basic-website',
    title: 'Sitio Web Básico',
    description: 'Un sitio web completo para tu negocio',
    features: [
      'Hasta 5 páginas',
      'Diseño personalizado',
      'Responsive design',
      'Optimización SEO',
      'Formulario de contacto'
    ],
    isPaquete: false,
    price: 45000,
    originalPrice: 60000
  },
  {
    id: 'premium-website',
    title: 'Sitio Web Premium',
    description: 'Sitio web avanzado con todas las funcionalidades',
    features: [
      'Hasta 10 páginas',
      'Diseño personalizado premium',
      'Responsive design',
      'SEO avanzado',
      'Blog integrado',
      'Integración con redes sociales',
      'Sistema de newsletter'
    ],
    isPaquete: false,
    price: 85000,
    originalPrice: 110000
  },
  {
    id: 'paquete-emprendedor',
    title: 'Paquete Emprendedor',
    description: 'Todo lo que necesitas para empezar tu negocio online',
    features: [
      'Landing page',
      'Configuración de dominio',
      'Email profesional',
      'Integración con redes sociales',
      'Google My Business'
    ],
    isPaquete: true,
    price: 35000,
    originalPrice: 50000
  },
  {
    id: 'paquete-profesional',
    title: 'Paquete Profesional',
    description: 'Solución completa para negocios establecidos',
    features: [
      'Sitio web hasta 8 páginas',
      'Blog integrado',
      'SEO avanzado',
      'Email marketing',
      'Posicionamiento en Google',
      'Mantenimiento por 3 meses'
    ],
    isPaquete: true,
    price: 95000,
    originalPrice: 120000
  }
];

// Datos iniciales para addons
const addonsIniciales = [
  {
    id: 'seo-basico',
    name: 'SEO Básico',
    description: 'Optimización básica para motores de búsqueda',
    price: 12000,
    oneTime: true
  },
  {
    id: 'seo-avanzado',
    name: 'SEO Avanzado',
    description: 'Optimización completa para motores de búsqueda y seguimiento',
    price: 25000,
    oneTime: true
  },
  {
    id: 'mantenimiento-mensual',
    name: 'Mantenimiento Mensual',
    description: 'Mantenimiento y actualización de tu sitio web',
    price: 8000,
    oneTime: false,
    duration: 'mes'
  },
  {
    id: 'blog-basico',
    name: 'Blog Básico',
    description: 'Integración de un blog básico en tu sitio web',
    price: 15000,
    oneTime: true
  },
  {
    id: 'blog-avanzado',
    name: 'Blog Avanzado',
    description: 'Blog completo con categorías, etiquetas y búsqueda',
    price: 25000,
    oneTime: true
  }
];

// Función para cargar datos de prueba en archivos JSON (respaldo)
const cargarDatosEnArchivos = async () => {
  try {
    console.log('🌱 Inicializando almacenamiento de archivos para respaldo...');
    
    // Crear instancia de FileStorage para servicios
    const serviciosStorage = new FileStorage('servicios');
    
    // Verificar si ya hay datos en el archivo
    const serviciosExistentes = await serviciosStorage.findAll();
    
    if (serviciosExistentes.length === 0) {
      // Cargar cada servicio inicial
      for (const servicio of serviciosIniciales) {
        await serviciosStorage.create(servicio);
      }
      console.log(`✅ Cargados ${serviciosIniciales.length} servicios en almacenamiento de archivos`);
    } else {
      console.log(`⏩ Ya existen ${serviciosExistentes.length} servicios en almacenamiento de archivos`);
    }
    
    // Crear instancia de FileStorage para addons
    const addonsStorage = new FileStorage('addons');
    
    // Verificar si ya hay datos en el archivo
    const addonsExistentes = await addonsStorage.findAll();
    
    if (addonsExistentes.length === 0) {
      // Cargar cada addon inicial
      for (const addon of addonsIniciales) {
        await addonsStorage.create(addon);
      }
      console.log(`✅ Cargados ${addonsIniciales.length} addons en almacenamiento de archivos`);
    } else {
      console.log(`⏩ Ya existen ${addonsExistentes.length} addons en almacenamiento de archivos`);
    }
    
    console.log('✅ Inicialización de almacenamiento de archivos completada');
  } catch (error) {
    console.error('❌ Error al cargar datos en archivos:', error.message);
  }
};

/**
 * Función para inicializar la base de datos y cargar datos iniciales
 */
const initializeDb = async () => {
  try {
    // Inicializar la conexión a la base de datos
    const db = await initializeDatabase();
    
    // Si no hay conexión a la base de datos o está deshabilitada, cargar datos en archivos
    if (!db) {
      console.log('ℹ️ Base de datos deshabilitada o no disponible. Usando sistema de archivos.');
      await cargarDatosEnArchivos();
      return;
    }
    
    // Sincronizar modelos con la base de datos
    console.log('🔄 Sincronizando modelos con la base de datos...');
    
    // Modo seguro: no elimina tablas existentes
    await sequelize.sync({ alter: true });
    
    console.log('✅ Modelos sincronizados correctamente');
    
    // Verificar si ya existen servicios
    const serviciosCount = await Servicio.count();
    
    if (serviciosCount === 0) {
      console.log('🌱 Cargando servicios iniciales en la base de datos...');
      
      // Usar una transacción para asegurar la integridad
      const transaction = await sequelize.transaction();
      
      try {
        // Insertar cada servicio
        for (const servicio of serviciosIniciales) {
          await Servicio.create(servicio, { transaction });
        }
        
        await transaction.commit();
        console.log(`✅ ${serviciosIniciales.length} servicios cargados correctamente en la base de datos`);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      console.log(`⏩ Ya existen ${serviciosCount} servicios en la base de datos`);
    }
    
    // Verificar si ya existen addons
    const addonsCount = await AddonServicio.count();
    
    if (addonsCount === 0) {
      console.log('🌱 Cargando addons iniciales en la base de datos...');
      
      // Usar una transacción para asegurar la integridad
      const transaction = await sequelize.transaction();
      
      try {
        // Insertar cada addon
        for (const addon of addonsIniciales) {
          await AddonServicio.create(addon, { transaction });
        }
        
        await transaction.commit();
        console.log(`✅ ${addonsIniciales.length} addons cargados correctamente en la base de datos`);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      console.log(`⏩ Ya existen ${addonsCount} addons en la base de datos`);
    }
    
    // Cargar datos en archivos para respaldo
    if (process.env.ENABLE_FILE_FALLBACK === 'true') {
      await cargarDatosEnArchivos();
    }
    
    console.log('🎉 Inicialización de la base de datos completada correctamente');
    
    // Cerrar la conexión
    await sequelize.close();
    console.log('👋 Conexión a la base de datos cerrada');
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    
    // Si hay un error, intentar cargar los datos en archivos
    console.log('🔄 Intentando cargar datos en el sistema de archivos como respaldo...');
    await cargarDatosEnArchivos();
    
    // Si estamos en producción, detener el proceso
    if (process.env.NODE_ENV === 'production') {
      console.error('⛔ Error crítico en entorno de producción. Abortando.');
      process.exit(1);
    }
  }
};

// Ejecutar la inicialización
initializeDb(); 
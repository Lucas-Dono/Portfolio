import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Obtener parámetros de conexión desde .env
const DB_NAME = process.env.DB_NAME || 'portfolio';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_SSL = process.env.DB_SSL === 'true';
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DISABLE_DB = process.env.DISABLE_DB === 'true';

// Opciones SSL seguras para producción
const sslOptions = {
  require: true,
  rejectUnauthorized: false // Para conexiones seguras a Heroku u otros proveedores
};

// Configuración de SSL cuando está habilitado
const dialectOptions = DB_SSL ? {
  ssl: sslOptions
} : {};

// Opciones de conexión
const sequelizeOptions = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  dialectOptions,
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Crear instancia de Sequelize global
let sequelize;

if (DISABLE_DB) {
  console.log('⚠️ Base de datos deshabilitada por configuración.');
  sequelize = null;
} else {
  sequelize = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    sequelizeOptions
  );
}

// Función para sincronizar modelos con la base de datos
const syncModels = async () => {
  if (!sequelize) {
    console.log('⚠️ Sequelize no disponible, saltando sincronización de modelos');
    return;
  }

  try {
    console.log('🔄 Sincronizando modelos con la base de datos...');

    // Importar modelos (como UserSql) dinámicamente para evitar dependencias circulares
    const UserSql = (await import('../models/UserSql.js')).default;

    // Sincronizar modelos (alter:true actualiza la estructura si ya existe)
    await sequelize.sync({ alter: true });

    console.log('✅ Modelos sincronizados correctamente con la base de datos.');
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error);
  }
};

// Función para inicializar la base de datos
const initializeDatabase = async () => {
  if (DISABLE_DB) {
    console.log('⚠️ Base de datos deshabilitada por configuración. Usando modo sin base de datos.');
    setupFileFallback();
    return null;
  }

  try {
    // Verificar la conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente.');

    // Sincronizar modelos con la base de datos
    await syncModels();

    // Crear directorio de datos si no existe para el modo sin DB
    if (NODE_ENV === 'development') {
      const dataDir = path.join(process.cwd(), 'data');
      try {
        await fs.promises.mkdir(dataDir, { recursive: true });
        console.log(`✅ Directorio de datos creado en: ${dataDir}`);
      } catch (err) {
        console.warn(`⚠️ No se pudo crear el directorio de datos: ${err.message}`);
      }
    }

    return sequelize;
  } catch (error) {
    console.error(`❌ Error al conectar a PostgreSQL: ${error.message}`);
    if (NODE_ENV === 'production') {
      console.error('Error crítico en entorno de producción, abortando.');
      process.exit(1);
    } else {
      console.warn('⚠️ Continuando sin base de datos en modo desarrollo');
      // Configurar sistema de fallback basado en archivos para desarrollo
      setupFileFallback();
      sequelize = null;
      return null;
    }
  }
};

// Configurar sistema de fallback basado en archivos para modo desarrollo
const setupFileFallback = () => {
  console.log('🔧 Configurando sistema de fallback basado en archivos JSON');
  // Crear directorio de datos si no existe
  const dataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`✅ Directorio de datos creado en: ${dataDir}`);
    }
  } catch (err) {
    console.warn(`⚠️ No se pudo crear el directorio de datos: ${err.message}`);
  }
};

// Manejar cierre de conexión al finalizar la aplicación
process.on('SIGINT', async () => {
  if (sequelize) {
    try {
      await sequelize.close();
      console.log('Conexión a PostgreSQL cerrada correctamente.');
      process.exit(0);
    } catch (error) {
      console.error('Error al cerrar la conexión a PostgreSQL:', error);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
});

export default initializeDatabase;
export { sequelize }; 
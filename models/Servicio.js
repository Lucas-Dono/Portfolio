import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import FileStorage from '../utils/fileStorage.js';
import dotenv from 'dotenv';

dotenv.config();

// Determinar si debe usar el sistema de archivos como respaldo
const ENABLE_FILE_FALLBACK = process.env.ENABLE_FILE_FALLBACK === 'true';
const DISABLE_DB = process.env.DISABLE_DB === 'true';

// Clase para el modelo de Servicio
class Servicio extends Model {
  static async findByIdSafe(id) {
    try {
      // Si la base de datos está deshabilitada o falla, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.findById(id);
      } 
      
      // Intentar buscar en la base de datos
      const servicio = await this.findOne({ where: { id } });
      return servicio ? servicio.toJSON() : null;
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para buscar servicio con ID ${id}`);
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.findById(id);
      }
      throw error;
    }
  }
  
  // Método seguro para listar servicios con fallback
  static async findAllSafe() {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.findAll();
      }
      
      // Intentar buscar en la base de datos
      const servicios = await this.findAll();
      return servicios.map(servicio => servicio.toJSON());
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log('ℹ️ Usando respaldo de archivos para listar servicios');
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.findAll();
      }
      throw error;
    }
  }
  
  // Método seguro para crear servicios con fallback
  static async createSafe(data) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.create(data);
      }
      
      // Intentar crear en la base de datos
      const servicio = await this.create(data);
      return servicio.toJSON();
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log('ℹ️ Usando respaldo de archivos para crear servicio');
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.create(data);
      }
      throw error;
    }
  }
  
  // Método seguro para actualizar servicios con fallback
  static async updateSafe(id, data) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.update(id, data);
      }
      
      // Intentar actualizar en la base de datos
      await this.update(data, { where: { id } });
      return await this.findByIdSafe(id);
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para actualizar servicio con ID ${id}`);
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.update(id, data);
      }
      throw error;
    }
  }
  
  // Método seguro para encontrar por tipo
  static async findByTipoSafe(isPaquete) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.findBy({ isPaquete });
      }
      
      // Intentar buscar en la base de datos
      const servicios = await this.findAll({ where: { isPaquete } });
      return servicios.map(servicio => servicio.toJSON());
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para buscar servicios por tipo`);
        const fileStorage = new FileStorage('servicios');
        return await fileStorage.findBy({ isPaquete });
      }
      throw error;
    }
  }
}

// Inicializar el modelo de Sequelize
Servicio.init({
  // ID único del servicio
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  // Título del servicio
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Descripción detallada
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Características del servicio (array de strings)
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Indicador de si es un paquete o un plan individual
  isPaquete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Precio actual
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isGreaterThanZero(value) {
        if (parseFloat(value) <= 0) {
          throw new Error('El precio debe ser mayor que cero');
        }
      }
    }
  },
  // Precio original (para mostrar descuentos)
  originalPrice: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: null,
    validate: {
      isValidOriginalPrice(value) {
        if (value !== null && (parseFloat(value) <= 0 || parseFloat(value) <= parseFloat(this.price))) {
          throw new Error('El precio original debe ser mayor que el precio actual');
        }
      }
    }
  }
}, {
  sequelize,
  modelName: 'Servicio',
  tableName: 'servicios',
  timestamps: true, // Habilitar createdAt y updatedAt
  paranoid: true,   // Habilitar softDelete (deletedAt)
  // Hooks
  hooks: {
    // Guardar en el sistema de archivos si está habilitado
    afterCreate: async (servicio, options) => {
      if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
        try {
          const fileStorage = new FileStorage('servicios');
          await fileStorage.create(servicio.toJSON());
          console.log(`✅ Servicio ${servicio.id} sincronizado con sistema de archivos`);
        } catch (error) {
          console.error(`❌ Error al sincronizar servicio con archivos:`, error);
        }
      }
    },
    afterUpdate: async (servicio, options) => {
      if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
        try {
          const fileStorage = new FileStorage('servicios');
          await fileStorage.update(servicio.id, servicio.toJSON());
          console.log(`✅ Servicio ${servicio.id} actualizado en sistema de archivos`);
        } catch (error) {
          console.error(`❌ Error al actualizar servicio en archivos:`, error);
        }
      }
    },
    afterDestroy: async (servicio, options) => {
      if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
        try {
          const fileStorage = new FileStorage('servicios');
          await fileStorage.delete(servicio.id);
          console.log(`✅ Servicio ${servicio.id} eliminado de sistema de archivos`);
        } catch (error) {
          console.error(`❌ Error al eliminar servicio de archivos:`, error);
        }
      }
    }
  }
});

export default Servicio; 
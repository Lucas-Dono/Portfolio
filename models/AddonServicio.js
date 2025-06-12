import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import FileStorage from '../utils/fileStorage.js';
import dotenv from 'dotenv';

dotenv.config();

// Determinar si debe usar el sistema de archivos como respaldo
const ENABLE_FILE_FALLBACK = process.env.ENABLE_FILE_FALLBACK === 'true';
const DISABLE_DB = process.env.DISABLE_DB === 'true';

// Clase para el modelo de AddonServicio
class AddonServicio extends Model {
  static async findByIdSafe(id) {
    try {
      // Si la base de datos está deshabilitada o falla, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('addons');
        return await fileStorage.findById(id);
      }

      // Intentar buscar en la base de datos
      const addon = await this.findOne({ where: { id } });
      return addon ? addon.toJSON() : null;
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para buscar addon con ID ${id}`);
        const fileStorage = new FileStorage('addons');
        return await fileStorage.findById(id);
      }
      throw error;
    }
  }

  // Método seguro para listar addons con fallback
  static async findAllSafe() {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('addons');
        return await fileStorage.findAll();
      }

      // Intentar buscar en la base de datos
      const addons = await this.findAll();
      return addons.map(addon => addon.toJSON());
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log('ℹ️ Usando respaldo de archivos para listar addons');
        const fileStorage = new FileStorage('addons');
        return await fileStorage.findAll();
      }
      throw error;
    }
  }

  // Método seguro para crear addons con fallback
  static async createSafe(data) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('addons');
        return await fileStorage.create(data);
      }

      // Intentar crear en la base de datos
      const addon = await this.create(data);
      return addon.toJSON();
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log('ℹ️ Usando respaldo de archivos para crear addon');
        const fileStorage = new FileStorage('addons');
        return await fileStorage.create(data);
      }
      throw error;
    }
  }

  // Método seguro para actualizar addons con fallback
  static async updateSafe(id, data) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('addons');
        return await fileStorage.update(id, data);
      }

      // Intentar actualizar en la base de datos
      await this.update(data, { where: { id } });
      return await this.findByIdSafe(id);
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para actualizar addon con ID ${id}`);
        const fileStorage = new FileStorage('addons');
        return await fileStorage.update(id, data);
      }
      throw error;
    }
  }
}

// Inicializar el modelo de Sequelize solo si está disponible
if (sequelize) {
  AddonServicio.init({
    // ID único del addon
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    // Nombre del addon
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Descripción detallada
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Precio del addon
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
    // Indica si es un pago único o recurrente
    oneTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Duración para pagos recurrentes (mes, año, etc.)
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AddonServicio',
    tableName: 'addons',
    timestamps: true, // Habilitar createdAt y updatedAt
    paranoid: true,   // Habilitar softDelete (deletedAt)
    // Hooks
    hooks: {
      // Guardar en el sistema de archivos si está habilitado
      afterCreate: async (addon, options) => {
        if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
          try {
            const fileStorage = new FileStorage('addons');
            await fileStorage.create(addon.toJSON());
            console.log(`✅ Addon ${addon.id} sincronizado con sistema de archivos`);
          } catch (error) {
            console.error(`❌ Error al sincronizar addon con archivos:`, error);
          }
        }
      },
      afterUpdate: async (addon, options) => {
        if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
          try {
            const fileStorage = new FileStorage('addons');
            await fileStorage.update(addon.id, addon.toJSON());
            console.log(`✅ Addon ${addon.id} actualizado en sistema de archivos`);
          } catch (error) {
            console.error(`❌ Error al actualizar addon en archivos:`, error);
          }
        }
      },
      afterDestroy: async (addon, options) => {
        if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
          try {
            const fileStorage = new FileStorage('addons');
            await fileStorage.delete(addon.id);
            console.log(`✅ Addon ${addon.id} eliminado de sistema de archivos`);
          } catch (error) {
            console.error(`❌ Error al eliminar addon de archivos:`, error);
          }
        }
      }
    }
  });
} else {
  console.log('⚠️ Sequelize no disponible, modelo AddonServicio funcionará en modo limitado');
}

export default AddonServicio; 
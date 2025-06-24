import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import FileStorage from '../utils/fileStorage.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Determinar si debe usar el sistema de archivos como respaldo
const ENABLE_FILE_FALLBACK = process.env.ENABLE_FILE_FALLBACK === 'true';
const DISABLE_DB = process.env.DISABLE_DB === 'true';

// Clase para el modelo de Promocion
class Promocion extends Model {
  static async findByIdSafe(id) {
    try {
      // Si la base de datos está deshabilitada o falla, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.findById(id);
      }

      // Intentar buscar en la base de datos
      const promocion = await this.findOne({ where: { id } });
      return promocion ? promocion.toJSON() : null;
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para buscar promoción con ID ${id}`);
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.findById(id);
      }
      throw error;
    }
  }

  // Método seguro para listar promociones con fallback
  static async findAllSafe() {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.findAll();
      }

      // Intentar buscar en la base de datos
      const promociones = await this.findAll({
        order: [['created_at', 'DESC']]
      });
      return promociones.map(promocion => {
        const data = promocion.toJSON();
        // Convertir fechas de strings a Date objects para compatibilidad
        if (data.fecha_creacion) data.fechaCreacion = new Date(data.fecha_creacion);
        if (data.fecha_expiracion) data.fechaExpiracion = new Date(data.fecha_expiracion);
        // Mapear nombres de campos snake_case a camelCase
        return {
          id: data.id,
          servicioId: data.servicio_id,
          tipo: data.tipo,
          valorDescuento: data.valor_descuento,
          cantidadLimite: data.cantidad_limite,
          cantidadUsada: data.cantidad_usada,
          activa: data.activa,
          fechaCreacion: data.fechaCreacion || new Date(data.created_at),
          fechaExpiracion: data.fechaExpiracion || null
        };
      });
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log('ℹ️ Usando respaldo de archivos para listar promociones');
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.findAll();
      }
      throw error;
    }
  }

  // Método seguro para crear promociones con fallback
  static async createSafe(data) {
    try {
      // Generar ID si no se proporciona
      if (!data.id) {
        data.id = `promo-${uuidv4()}`;
      }

      // Convertir camelCase a snake_case para la base de datos
      const dbData = {
        id: data.id,
        servicio_id: data.servicioId,
        tipo: data.tipo,
        valor_descuento: data.valorDescuento || null,
        cantidad_limite: data.cantidadLimite || 1,
        cantidad_usada: 0,
        activa: data.activa !== undefined ? data.activa : true,
        fecha_expiracion: data.fechaExpiracion || null
      };

      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.create(data);
      }

      // Intentar crear en la base de datos
      const promocion = await this.create(dbData);
      const result = promocion.toJSON();
      
      // Convertir a formato camelCase para el frontend
      return {
        id: result.id,
        servicioId: result.servicio_id,
        tipo: result.tipo,
        valorDescuento: result.valor_descuento,
        cantidadLimite: result.cantidad_limite,
        cantidadUsada: result.cantidad_usada,
        activa: result.activa,
        fechaCreacion: new Date(result.created_at),
        fechaExpiracion: result.fecha_expiracion ? new Date(result.fecha_expiracion) : null
      };
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log('ℹ️ Usando respaldo de archivos para crear promoción');
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.create(data);
      }
      throw error;
    }
  }

  // Método seguro para actualizar promociones con fallback
  static async updateSafe(id, data) {
    try {
      // Convertir camelCase a snake_case para la base de datos
      const dbData = {};
      if (data.servicioId !== undefined) dbData.servicio_id = data.servicioId;
      if (data.tipo !== undefined) dbData.tipo = data.tipo;
      if (data.valorDescuento !== undefined) dbData.valor_descuento = data.valorDescuento;
      if (data.cantidadLimite !== undefined) dbData.cantidad_limite = data.cantidadLimite;
      if (data.cantidadUsada !== undefined) dbData.cantidad_usada = data.cantidadUsada;
      if (data.activa !== undefined) dbData.activa = data.activa;
      if (data.fechaExpiracion !== undefined) dbData.fecha_expiracion = data.fechaExpiracion;

      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.update(id, data);
      }

      // Intentar actualizar en la base de datos
      await this.update(dbData, { where: { id } });
      return await this.findByIdSafe(id);
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para actualizar promoción con ID ${id}`);
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.update(id, data);
      }
      throw error;
    }
  }

  // Método seguro para eliminar promociones
  static async deleteSafe(id) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.delete(id);
      }

      // Intentar eliminar en la base de datos (soft delete)
      const promocion = await this.findOne({ where: { id } });
      if (!promocion) {
        return false;
      }

      await promocion.destroy();
      return true;
    } catch (error) {
      // Si falla y el respaldo está habilitado, intentar con archivos
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para eliminar promoción con ID ${id}`);
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.delete(id);
      }
      throw error;
    }
  }

  // Método para encontrar promoción activa por servicio
  static async findActiveByServiceSafe(servicioId) {
    try {
      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        const promociones = await fileStorage.findAll();
        return promociones.find(p => 
          p.servicioId === servicioId && 
          p.activa && 
          p.cantidadUsada < p.cantidadLimite &&
          (!p.fechaExpiracion || new Date(p.fechaExpiracion) > new Date())
        );
      }

      // Buscar en la base de datos
      const promocion = await this.findOne({
        where: {
          servicio_id: servicioId,
          activa: true
        }
      });

      if (!promocion) return null;

      const data = promocion.toJSON();
      
      // Verificar límites y expiración
      if (data.cantidad_usada >= data.cantidad_limite) return null;
      if (data.fecha_expiracion && new Date(data.fecha_expiracion) <= new Date()) return null;

      // Convertir a formato camelCase
      return {
        id: data.id,
        servicioId: data.servicio_id,
        tipo: data.tipo,
        valorDescuento: data.valor_descuento,
        cantidadLimite: data.cantidad_limite,
        cantidadUsada: data.cantidad_usada,
        activa: data.activa,
        fechaCreacion: new Date(data.created_at),
        fechaExpiracion: data.fecha_expiracion ? new Date(data.fecha_expiracion) : null
      };
    } catch (error) {
      if (ENABLE_FILE_FALLBACK) {
        console.log(`ℹ️ Usando respaldo de archivos para buscar promoción del servicio ${servicioId}`);
        const fileStorage = new FileStorage('promociones');
        const promociones = await fileStorage.findAll();
        return promociones.find(p => 
          p.servicioId === servicioId && 
          p.activa && 
          p.cantidadUsada < p.cantidadLimite &&
          (!p.fechaExpiracion || new Date(p.fechaExpiracion) > new Date())
        );
      }
      throw error;
    }
  }
}

// Inicializar el modelo de Sequelize solo si está disponible
if (sequelize) {
  Promocion.init({
    // ID único de la promoción
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    // ID del servicio al que aplica
    servicio_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Tipo de promoción
    tipo: {
      type: DataTypes.ENUM('GRATIS', 'DESCUENTO'),
      allowNull: false
    },
    // Valor del descuento (porcentaje, solo para tipo DESCUENTO)
    valor_descuento: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 100
      }
    },
    // Cantidad límite de usos
    cantidad_limite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    // Cantidad usada actualmente
    cantidad_usada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    // Si la promoción está activa
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // Fecha de expiración (opcional)
    fecha_expiracion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Promocion',
    tableName: 'promociones',
    timestamps: true, // Habilitar createdAt y updatedAt
    paranoid: true,   // Habilitar softDelete (deletedAt)
    // Hooks
    hooks: {
      // Guardar en el sistema de archivos si está habilitado
      afterCreate: async (promocion, options) => {
        if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
          try {
            const fileStorage = new FileStorage('promociones');
            const data = promocion.toJSON();
            const camelCaseData = {
              id: data.id,
              servicioId: data.servicio_id,
              tipo: data.tipo,
              valorDescuento: data.valor_descuento,
              cantidadLimite: data.cantidad_limite,
              cantidadUsada: data.cantidad_usada,
              activa: data.activa,
              fechaCreacion: new Date(data.created_at),
              fechaExpiracion: data.fecha_expiracion ? new Date(data.fecha_expiracion) : null
            };
            await fileStorage.create(camelCaseData);
            console.log(`✅ Promoción ${promocion.id} sincronizada con sistema de archivos`);
          } catch (error) {
            console.error(`❌ Error al sincronizar promoción con archivos:`, error);
          }
        }
      },
      // Sincronizar actualizaciones
      afterUpdate: async (promocion, options) => {
        if (ENABLE_FILE_FALLBACK && !DISABLE_DB) {
          try {
            const fileStorage = new FileStorage('promociones');
            const data = promocion.toJSON();
            const camelCaseData = {
              id: data.id,
              servicioId: data.servicio_id,
              tipo: data.tipo,
              valorDescuento: data.valor_descuento,
              cantidadLimite: data.cantidad_limite,
              cantidadUsada: data.cantidad_usada,
              activa: data.activa,
              fechaCreacion: new Date(data.created_at),
              fechaExpiracion: data.fecha_expiracion ? new Date(data.fecha_expiracion) : null
            };
            await fileStorage.update(promocion.id, camelCaseData);
            console.log(`✅ Promoción ${promocion.id} actualizada en sistema de archivos`);
          } catch (error) {
            console.error(`❌ Error al sincronizar actualización de promoción con archivos:`, error);
          }
        }
      }
    },
    // Validaciones a nivel de modelo
    validate: {
      // Validar que si es descuento, tenga valor de descuento
      validateDiscountValue() {
        if (this.tipo === 'DESCUENTO' && !this.valor_descuento) {
          throw new Error('Las promociones de tipo DESCUENTO deben tener un valor de descuento');
        }
        if (this.tipo === 'GRATIS' && this.valor_descuento) {
          throw new Error('Las promociones de tipo GRATIS no deben tener valor de descuento');
        }
      },
      // Validar que cantidad usada no exceda el límite
      validateUsageLimit() {
        if (this.cantidad_usada > this.cantidad_limite) {
          throw new Error('La cantidad usada no puede exceder el límite');
        }
      }
    }
  });
}

export default Promocion; 
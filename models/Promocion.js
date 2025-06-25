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
        order: [['createdAt', 'DESC']]
      });
      return promociones.map(promocion => {
        const data = promocion.toJSON();
        // Convertir fechas de strings a Date objects para compatibilidad
        if (data.fecha_creacion) data.fechaCreacion = new Date(data.fecha_creacion);
        if (data.fecha_expiracion) data.fechaExpiracion = new Date(data.fecha_expiracion);
        // Los datos ya están en formato correcto de la BD
        return {
          id: data.id,
          servicioId: data.servicioId,
          tipo: data.tipo,
          valorDescuento: data.valorDescuento,
          cantidadLimite: data.cantidadLimite,
          cantidadUsada: data.cantidadUsada,
          activa: data.activa,
          fechaCreacion: new Date(data.createdAt),
          fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
          fechaFin: data.fechaFin ? new Date(data.fechaFin) : null
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

      // Los datos ya están en el formato correcto para la BD
      const dbData = {
        id: data.id,
        servicioId: data.servicioId,
        tipo: data.tipo,
        valorDescuento: data.valorDescuento || null,
        cantidadLimite: data.cantidadLimite || 1,
        cantidadUsada: 0,
        activa: data.activa !== undefined ? data.activa : true,
        fechaInicio: data.fechaInicio || null,
        fechaFin: data.fechaFin || null
      };

      // Si la base de datos está deshabilitada, usar el respaldo de archivos
      if (DISABLE_DB) {
        const fileStorage = new FileStorage('promociones');
        return await fileStorage.create(data);
      }

      // Intentar crear en la base de datos
      const promocion = await this.create(dbData);
      const result = promocion.toJSON();
      
      // Los datos ya están en formato correcto
      return {
        id: result.id,
        servicioId: result.servicioId,
        tipo: result.tipo,
        valorDescuento: result.valorDescuento,
        cantidadLimite: result.cantidadLimite,
        cantidadUsada: result.cantidadUsada,
        activa: result.activa,
        fechaCreacion: new Date(result.createdAt),
        fechaInicio: result.fechaInicio ? new Date(result.fechaInicio) : null,
        fechaFin: result.fechaFin ? new Date(result.fechaFin) : null
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
      // Los datos ya están en el formato correcto para la BD
      const dbData = {};
      if (data.servicioId !== undefined) dbData.servicioId = data.servicioId;
      if (data.tipo !== undefined) dbData.tipo = data.tipo;
      if (data.valorDescuento !== undefined) dbData.valorDescuento = data.valorDescuento;
      if (data.cantidadLimite !== undefined) dbData.cantidadLimite = data.cantidadLimite;
      if (data.cantidadUsada !== undefined) dbData.cantidadUsada = data.cantidadUsada;
      if (data.activa !== undefined) dbData.activa = data.activa;
      if (data.fechaInicio !== undefined) dbData.fechaInicio = data.fechaInicio;
      if (data.fechaFin !== undefined) dbData.fechaFin = data.fechaFin;

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
          servicioId: servicioId,
          activa: true
        }
      });

      if (!promocion) return null;

      const data = promocion.toJSON();
      
      // Verificar límites y expiración
      if (data.cantidadUsada >= data.cantidadLimite) return null;
      if (data.fechaFin && new Date(data.fechaFin) <= new Date()) return null;

      // Los datos ya están en formato correcto
      return {
        id: data.id,
        servicioId: data.servicioId,
        tipo: data.tipo,
        valorDescuento: data.valorDescuento,
        cantidadLimite: data.cantidadLimite,
        cantidadUsada: data.cantidadUsada,
        activa: data.activa,
        fechaCreacion: new Date(data.createdAt),
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null
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
    // ID único de la promoción (auto-incremental)
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // ID del servicio al que aplica (coincide con la BD existente)
    servicioId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'servicioId' // Mapear explícitamente al nombre de columna
    },
    // Tipo de promoción
    tipo: {
      type: DataTypes.ENUM('GRATIS', 'DESCUENTO'),
      allowNull: false
    },
    // Valor del descuento (coincide con la BD existente)
    valorDescuento: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'valorDescuento',
      validate: {
        min: 1,
        max: 100
      }
    },
    // Cantidad límite de usos (coincide con la BD existente)
    cantidadLimite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'cantidadLimite',
      validate: {
        min: 1
      }
    },
    // Cantidad usada actualmente (coincide con la BD existente)
    cantidadUsada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'cantidadUsada',
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
    // Fecha de inicio (coincide con la BD existente)
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'fechaInicio'
    },
    // Fecha de fin (coincide con la BD existente)
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'fechaFin'
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
              servicioId: data.servicioId,
              tipo: data.tipo,
              valorDescuento: data.valorDescuento,
              cantidadLimite: data.cantidadLimite,
              cantidadUsada: data.cantidadUsada,
              activa: data.activa,
              fechaCreacion: new Date(data.createdAt),
              fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
              fechaFin: data.fechaFin ? new Date(data.fechaFin) : null
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
              servicioId: data.servicioId,
              tipo: data.tipo,
              valorDescuento: data.valorDescuento,
              cantidadLimite: data.cantidadLimite,
              cantidadUsada: data.cantidadUsada,
              activa: data.activa,
              fechaCreacion: new Date(data.createdAt),
              fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
              fechaFin: data.fechaFin ? new Date(data.fechaFin) : null
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
        if (this.tipo === 'DESCUENTO' && !this.valorDescuento) {
          throw new Error('Las promociones de tipo DESCUENTO deben tener un valor de descuento');
        }
        if (this.tipo === 'GRATIS' && this.valorDescuento) {
          throw new Error('Las promociones de tipo GRATIS no deben tener valor de descuento');
        }
      },
      // Validar que cantidad usada no exceda el límite
      validateUsageLimit() {
        if (this.cantidadUsada > this.cantidadLimite) {
          throw new Error('La cantidad usada no puede exceder el límite');
        }
      }
    }
  });
}

export default Promocion; 
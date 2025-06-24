import Promocion from '../models/Promocion.js';
import { sequelize } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Obtener todas las promociones
export const obtenerPromociones = async (req, res) => {
  try {
    const promociones = await Promocion.findAllSafe();
    res.status(200).json(promociones);
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    res.status(500).json({ 
      error: 'Error al obtener promociones', 
      details: error.message 
    });
  }
};

// Obtener una promoción por ID
export const obtenerPromocionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const promocion = await Promocion.findByIdSafe(id);

    if (!promocion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    res.status(200).json(promocion);
  } catch (error) {
    console.error(`Error al obtener promoción con ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error al obtener promoción', 
      details: error.message 
    });
  }
};

// Obtener promoción activa por servicio
export const obtenerPromocionPorServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const promocion = await Promocion.findActiveByServiceSafe(servicioId);

    if (!promocion) {
      return res.status(404).json({ error: 'No hay promoción activa para este servicio' });
    }

    res.status(200).json(promocion);
  } catch (error) {
    console.error(`Error al obtener promoción del servicio ${req.params.servicioId}:`, error);
    res.status(500).json({ 
      error: 'Error al obtener promoción del servicio', 
      details: error.message 
    });
  }
};

// Obtener estado de promociones para frontend (similar al promocionesService.ts)
export const obtenerEstadoPromociones = async (req, res) => {
  try {
    const promociones = await Promocion.findAllSafe();
    const estado = {};

    // Solo devolver promociones activas y disponibles
    promociones.forEach(promo => {
      if (promo.activa && promo.cantidadUsada < promo.cantidadLimite) {
        // Verificar si no ha expirado
        if (!promo.fechaExpiracion || promo.fechaExpiracion > new Date()) {
          estado[promo.servicioId] = promo;
        }
      }
    });

    res.status(200).json(estado);
  } catch (error) {
    console.error('Error al obtener estado de promociones:', error);
    res.status(500).json({ 
      error: 'Error al obtener estado de promociones', 
      details: error.message 
    });
  }
};

// Crear nueva promoción
export const crearPromocion = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { servicioId, tipo, valorDescuento, cantidadLimite, fechaExpiracion, activa } = req.body;

    // Validaciones básicas
    if (!servicioId || !tipo) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'servicioId y tipo son campos requeridos' 
      });
    }

    if (!['GRATIS', 'DESCUENTO'].includes(tipo)) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'tipo debe ser GRATIS o DESCUENTO' 
      });
    }

    if (tipo === 'DESCUENTO' && (!valorDescuento || valorDescuento < 1 || valorDescuento > 100)) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'valorDescuento debe ser un número entre 1 y 100 para promociones de tipo DESCUENTO' 
      });
    }

    if (tipo === 'GRATIS' && valorDescuento) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'Las promociones GRATIS no deben tener valorDescuento' 
      });
    }

    if (cantidadLimite && cantidadLimite < 1) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'cantidadLimite debe ser mayor que 0' 
      });
    }

    // Verificar si ya existe una promoción activa para este servicio
    const promocionExistente = await Promocion.findActiveByServiceSafe(servicioId);
    if (promocionExistente) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: `Ya existe una promoción activa para el servicio ${servicioId}. Desactívala primero.` 
      });
    }

    // Preparar datos para crear
    const datosPromocion = {
      servicioId,
      tipo,
      valorDescuento: tipo === 'DESCUENTO' ? valorDescuento : null,
      cantidadLimite: cantidadLimite || 1,
      fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : null,
      activa: activa !== undefined ? activa : true
    };

    // Crear la promoción
    const nuevaPromocion = await Promocion.createSafe(datosPromocion);

    if (transaction) await transaction.commit();

    res.status(201).json(nuevaPromocion);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error al crear promoción:', error);
    res.status(500).json({ 
      error: 'Error al crear promoción', 
      details: error.message 
    });
  }
};

// Actualizar promoción existente
export const actualizarPromocion = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;
    const { servicioId, tipo, valorDescuento, cantidadLimite, cantidadUsada, fechaExpiracion, activa } = req.body;

    // Verificar que la promoción existe
    const promocionExistente = await Promocion.findByIdSafe(id);
    if (!promocionExistente) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    // Validaciones
    if (tipo && !['GRATIS', 'DESCUENTO'].includes(tipo)) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'tipo debe ser GRATIS o DESCUENTO' 
      });
    }

    if (tipo === 'DESCUENTO' && valorDescuento && (valorDescuento < 1 || valorDescuento > 100)) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'valorDescuento debe ser un número entre 1 y 100' 
      });
    }

    if (cantidadLimite && cantidadLimite < 1) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'cantidadLimite debe ser mayor que 0' 
      });
    }

    if (cantidadUsada !== undefined && cantidadUsada < 0) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'cantidadUsada no puede ser negativa' 
      });
    }

    // Verificar que cantidad usada no exceda el límite
    const nuevoLimite = cantidadLimite || promocionExistente.cantidadLimite;
    const nuevaUsada = cantidadUsada !== undefined ? cantidadUsada : promocionExistente.cantidadUsada;
    
    if (nuevaUsada > nuevoLimite) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: 'cantidadUsada no puede exceder cantidadLimite' 
      });
    }

    // Si se cambia el servicio, verificar que no haya conflictos
    if (servicioId && servicioId !== promocionExistente.servicioId) {
      const promocionConflicto = await Promocion.findActiveByServiceSafe(servicioId);
      if (promocionConflicto && promocionConflicto.id !== id) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ 
          error: `Ya existe una promoción activa para el servicio ${servicioId}` 
        });
      }
    }

    // Preparar datos para actualizar (solo campos que se proporcionaron)
    const datosActualizacion = {};
    if (servicioId !== undefined) datosActualizacion.servicioId = servicioId;
    if (tipo !== undefined) datosActualizacion.tipo = tipo;
    if (valorDescuento !== undefined) datosActualizacion.valorDescuento = valorDescuento;
    if (cantidadLimite !== undefined) datosActualizacion.cantidadLimite = cantidadLimite;
    if (cantidadUsada !== undefined) datosActualizacion.cantidadUsada = cantidadUsada;
    if (fechaExpiracion !== undefined) {
      datosActualizacion.fechaExpiracion = fechaExpiracion ? new Date(fechaExpiracion) : null;
    }
    if (activa !== undefined) datosActualizacion.activa = activa;

    // Actualizar la promoción
    const promocionActualizada = await Promocion.updateSafe(id, datosActualizacion);

    if (transaction) await transaction.commit();

    res.status(200).json(promocionActualizada);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al actualizar promoción ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error al actualizar promoción', 
      details: error.message 
    });
  }
};

// Eliminar promoción
export const eliminarPromocion = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;

    // Verificar que la promoción existe
    const promocionExistente = await Promocion.findByIdSafe(id);
    if (!promocionExistente) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    // Eliminar la promoción (soft delete)
    const eliminada = await Promocion.deleteSafe(id);

    if (!eliminada) {
      if (transaction) await transaction.rollback();
      return res.status(500).json({ error: 'No se pudo eliminar la promoción' });
    }

    if (transaction) await transaction.commit();

    res.status(200).json({ 
      success: true, 
      message: 'Promoción eliminada exitosamente' 
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al eliminar promoción ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error al eliminar promoción', 
      details: error.message 
    });
  }
};

// Usar promoción (incrementar cantidad usada)
export const usarPromocion = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;

    // Verificar que la promoción existe y está activa
    const promocion = await Promocion.findByIdSafe(id);
    if (!promocion) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    if (!promocion.activa) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'La promoción no está activa' });
    }

    if (promocion.cantidadUsada >= promocion.cantidadLimite) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'La promoción ha alcanzado su límite de usos' });
    }

    // Verificar expiración
    if (promocion.fechaExpiracion && new Date(promocion.fechaExpiracion) <= new Date()) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'La promoción ha expirado' });
    }

    // Incrementar cantidad usada
    const nuevaCantidadUsada = promocion.cantidadUsada + 1;
    const nuevaActividad = nuevaCantidadUsada < promocion.cantidadLimite;

    const promocionActualizada = await Promocion.updateSafe(id, {
      cantidadUsada: nuevaCantidadUsada,
      activa: nuevaActividad
    });

    if (transaction) await transaction.commit();

    res.status(200).json(promocionActualizada);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al usar promoción ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error al usar promoción', 
      details: error.message 
    });
  }
};

// Reactivar promoción (para casos especiales)
export const reactivarPromocion = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;

    // Verificar que la promoción existe
    const promocion = await Promocion.findByIdSafe(id);
    if (!promocion) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    // Verificar que no haya otra promoción activa para el mismo servicio
    const promocionConflicto = await Promocion.findActiveByServiceSafe(promocion.servicioId);
    if (promocionConflicto && promocionConflicto.id !== id) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ 
        error: `Ya existe una promoción activa para el servicio ${promocion.servicioId}` 
      });
    }

    // Reactivar la promoción
    const promocionReactivada = await Promocion.updateSafe(id, {
      activa: true
    });

    if (transaction) await transaction.commit();

    res.status(200).json(promocionReactivada);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al reactivar promoción ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Error al reactivar promoción', 
      details: error.message 
    });
  }
}; 
import Servicio from '../models/Servicio.js';
import AddonServicio from '../models/AddonServicio.js';
import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';

dotenv.config();

// Obtener todos los servicios
export const obtenerServicios = async (req, res) => {
  try {
    const servicios = await Servicio.findAllSafe();
    res.status(200).json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios', details: error.message });
  }
};

// Obtener servicios por tipo (planes o paquetes)
export const obtenerServiciosPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const isPaquete = tipo === 'paquete';

    const servicios = await Servicio.findByTipoSafe(isPaquete);
    res.status(200).json(servicios);
  } catch (error) {
    console.error(`Error al obtener servicios de tipo ${req.params.tipo}:`, error);
    res.status(500).json({ error: 'Error al obtener servicios por tipo', details: error.message });
  }
};

// Obtener un servicio por ID
export const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const servicio = await Servicio.findByIdSafe(id);

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.status(200).json(servicio);
  } catch (error) {
    console.error(`Error al obtener servicio con ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al obtener servicio', details: error.message });
  }
};

// Actualizar el precio de un servicio
export const actualizarPrecioServicio = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;
    const { precio } = req.body;

    // Validar el precio
    if (precio === undefined || isNaN(precio) || precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor que cero' });
    }

    // Intentar buscar el servicio primero
    const servicioExistente = await Servicio.findByIdSafe(id);

    if (!servicioExistente) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Actualizar solo el precio
    const servicioActualizado = await Servicio.updateSafe(id, { price: precio });

    if (transaction) await transaction.commit();

    res.status(200).json(servicioActualizado);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al actualizar precio del servicio ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al actualizar precio del servicio', details: error.message });
  }
};

// Actualizar precio y precio original de un servicio
export const actualizarPreciosServicio = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;
    const { precio, precioOriginal } = req.body;

    // Validar el precio
    if (precio === undefined || isNaN(precio) || precio <= 0) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'El precio debe ser un número mayor que cero' });
    }

    // Validar el precio original (si está presente)
    if (precioOriginal !== null && precioOriginal !== undefined) {
      if (isNaN(precioOriginal) || precioOriginal <= 0) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ error: 'El precio original debe ser un número mayor que cero' });
      }
      if (precioOriginal <= precio) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ error: 'El precio original debe ser mayor que el precio actual' });
      }
    }

    // Intentar buscar el servicio primero
    const servicioExistente = await Servicio.findByIdSafe(id);

    if (!servicioExistente) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Actualizar precios
    const servicioActualizado = await Servicio.updateSafe(id, {
      price: precio,
      originalPrice: precioOriginal
    });

    if (transaction) await transaction.commit();

    res.status(200).json(servicioActualizado);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al actualizar precios del servicio ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al actualizar precios del servicio', details: error.message });
  }
};

// Obtener todos los addons
export const obtenerAddons = async (req, res) => {
  try {
    const addons = await AddonServicio.findAllSafe();
    res.status(200).json(addons);
  } catch (error) {
    console.error('Error al obtener addons:', error);
    res.status(500).json({ error: 'Error al obtener addons', details: error.message });
  }
};

// Obtener un addon por ID
export const obtenerAddonPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const addon = await AddonServicio.findByIdSafe(id);

    if (!addon) {
      return res.status(404).json({ error: 'Addon no encontrado' });
    }

    res.status(200).json(addon);
  } catch (error) {
    console.error(`Error al obtener addon con ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al obtener addon', details: error.message });
  }
};

// Actualizar el precio de un addon
export const actualizarPrecioAddon = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;
    const { precio } = req.body;

    // Validar el precio
    if (precio === undefined || isNaN(precio) || precio <= 0) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'El precio debe ser un número mayor que cero' });
    }

    // Intentar buscar el addon primero
    const addonExistente = await AddonServicio.findByIdSafe(id);

    if (!addonExistente) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Addon no encontrado' });
    }

    // Actualizar el precio
    const addonActualizado = await AddonServicio.updateSafe(id, { price: precio });

    if (transaction) await transaction.commit();

    res.status(200).json(addonActualizado);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al actualizar precio del addon ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al actualizar precio del addon', details: error.message });
  }
};

// Crear un nuevo servicio
export const crearServicio = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { title, description, features, isPaquete, price, originalPrice } = req.body;

    // Validaciones básicas
    if (!title || !description) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'Título y descripción son obligatorios' });
    }

    if (price === undefined || isNaN(price) || price <= 0) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'El precio debe ser un número mayor que cero' });
    }

    // Validar precio original si está presente
    if (originalPrice !== null && originalPrice !== undefined) {
      if (isNaN(originalPrice) || originalPrice <= 0) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ error: 'El precio original debe ser un número mayor que cero' });
      }

      if (originalPrice <= price) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ error: 'El precio original debe ser mayor que el precio actual' });
      }
    }

    // Generar un ID basado en el título
    const id = title.toLowerCase()
      .replace(/[^\w\s]/gi, '')  // Eliminar caracteres especiales
      .replace(/\s+/g, '-')      // Reemplazar espacios con guiones
      .replace(/-+/g, '-');      // Eliminar guiones duplicados

    // Verificar si ya existe un servicio con ese ID
    const servicioExistente = await Servicio.findByIdSafe(id);

    if (servicioExistente) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: `Ya existe un servicio con un título similar (ID: ${id})` });
    }

    // Crear el nuevo servicio
    const nuevoServicio = await Servicio.createSafe({
      id,
      title,
      description,
      features: features || [],
      isPaquete: isPaquete || false,
      price,
      originalPrice: originalPrice || null
    });

    if (transaction) await transaction.commit();

    res.status(201).json(nuevoServicio);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio', details: error.message });
  }
};

// Actualizar un servicio completo
export const actualizarServicio = async (req, res) => {
  const transaction = await sequelize?.transaction().catch(() => null);

  try {
    const { id } = req.params;
    const { title, description, features, isPaquete, price, originalPrice } = req.body;

    // Validaciones básicas para campos proporcionados
    if (title === '') {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'El título no puede estar vacío' });
    }

    if (description === '') {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'La descripción no puede estar vacía' });
    }

    if (price !== undefined && (isNaN(price) || price <= 0)) {
      if (transaction) await transaction.rollback();
      return res.status(400).json({ error: 'El precio debe ser un número mayor que cero' });
    }

    // Validar precio original si está presente
    if (originalPrice !== null && originalPrice !== undefined) {
      if (isNaN(originalPrice) || originalPrice <= 0) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ error: 'El precio original debe ser un número mayor que cero' });
      }

      const precioFinal = price !== undefined ? price : (await Servicio.findByIdSafe(id))?.price;

      if (precioFinal && originalPrice <= precioFinal) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ error: 'El precio original debe ser mayor que el precio actual' });
      }
    }

    // Verificar si existe el servicio
    const servicioExistente = await Servicio.findByIdSafe(id);

    if (!servicioExistente) {
      if (transaction) await transaction.rollback();
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Actualizar solo los campos proporcionados
    const datosActualizados = {};
    if (title !== undefined) datosActualizados.title = title;
    if (description !== undefined) datosActualizados.description = description;
    if (features !== undefined) datosActualizados.features = features;
    if (isPaquete !== undefined) datosActualizados.isPaquete = isPaquete;
    if (price !== undefined) datosActualizados.price = price;
    if (originalPrice !== undefined) datosActualizados.originalPrice = originalPrice;

    // Actualizar el servicio
    const servicioActualizado = await Servicio.updateSafe(id, datosActualizados);

    if (transaction) await transaction.commit();

    res.status(200).json(servicioActualizado);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error al actualizar servicio ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al actualizar servicio', details: error.message });
  }
}; 
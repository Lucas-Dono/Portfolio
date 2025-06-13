import { Promocion, PromocionesState, ReservaPromocion } from '../types/promo';
import * as promocionesService from '../services/promocionesService';

// Simular retraso de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API para obtener promociones disponibles para un servicio
export const obtenerPromocionServicio = async (servicioId: string): Promise<Promocion | null> => {
  await delay(300); // Simular latencia de red

  try {
    const promocion = promocionesService.obtenerPromocionPorServicio(servicioId);
    return promocion || null;
  } catch (error) {
    console.error('Error al obtener promoción:', error);
    throw new Error('Error al obtener promoción');
  }
};

// API para obtener todas las promociones disponibles
export const obtenerTodasPromociones = async (): Promise<PromocionesState> => {
  await delay(500); // Simular latencia de red

  try {
    return promocionesService.obtenerPromocionesState();
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    throw new Error('Error al obtener promociones');
  }
};

// API para reservar una promoción
export const reservarPromocion = async (promocionId: string): Promise<ReservaPromocion> => {
  await delay(500); // Simular latencia de red

  try {
    const reserva = promocionesService.reservarPromocion(promocionId);

    if (!reserva) {
      throw new Error('No se pudo reservar la promoción');
    }

    return reserva;
  } catch (error) {
    console.error('Error al reservar promoción:', error);
    throw new Error('Error al reservar promoción');
  }
};

// API para confirmar uso de una promoción
export const confirmarPromocion = async (reservaId: string): Promise<boolean> => {
  await delay(300); // Simular latencia de red

  try {
    const resultado = promocionesService.confirmarPromocion(reservaId);
    return resultado;
  } catch (error) {
    console.error('Error al confirmar promoción:', error);
    throw new Error('Error al confirmar promoción');
  }
};

// API para crear una nueva promoción (admin)
export const crearPromocion = async (promocion: Omit<Promocion, 'id' | 'fechaCreacion' | 'cantidadUsada'>): Promise<Promocion> => {
  await delay(500); // Simular latencia de red

  try {
    return promocionesService.crearPromocion(promocion);
  } catch (error) {
    console.error('Error al crear promoción:', error);
    throw new Error('Error al crear promoción');
  }
};

// API para actualizar una promoción (admin)
export const actualizarPromocion = async (id: string, datos: Partial<Promocion>): Promise<Promocion> => {
  await delay(500); // Simular latencia de red

  try {
    const promocionActualizada = promocionesService.actualizarPromocion(id, datos);

    if (!promocionActualizada) {
      throw new Error('Promoción no encontrada');
    }

    return promocionActualizada;
  } catch (error) {
    console.error('Error al actualizar promoción:', error);
    throw new Error('Error al actualizar promoción');
  }
};

// API para eliminar una promoción (admin)
export const eliminarPromocion = async (id: string): Promise<boolean> => {
  await delay(500); // Simular latencia de red

  try {
    return promocionesService.eliminarPromocion(id);
  } catch (error) {
    console.error('Error al eliminar promoción:', error);
    throw new Error('Error al eliminar promoción');
  }
};

// API para obtener todas las promociones (admin)
export const obtenerPromociones = async (): Promise<Promocion[]> => {
  await delay(500); // Simular latencia de red

  try {
    return promocionesService.obtenerPromociones();
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    throw new Error('Error al obtener promociones');
  }
}; 
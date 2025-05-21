import { v4 as uuidv4 } from 'uuid';
import { Promocion, ReservaPromocion } from '../types/promo';

// Simulación de base de datos en memoria
let promocionesDB: Promocion[] = [
  {
    id: 'promo-basic-gratis',
    servicioId: 'landing-page',
    tipo: 'GRATIS',
    cantidadLimite: 3,
    cantidadUsada: 1,
    activa: true,
    fechaCreacion: new Date(),
  },
  {
    id: 'promo-standard-descuento',
    servicioId: 'basic-website',
    tipo: 'DESCUENTO',
    valorDescuento: 20,
    cantidadLimite: 5,
    cantidadUsada: 2,
    activa: true,
    fechaCreacion: new Date(),
  },
];

let reservasPromocionesDB: ReservaPromocion[] = [];

// Función para obtener todas las promociones
export const obtenerPromociones = (): Promocion[] => {
  return [...promocionesDB];
};

// Función para obtener promoción por ID
export const obtenerPromocionPorId = (id: string): Promocion | undefined => {
  return promocionesDB.find(promo => promo.id === id);
};

// Función para obtener promoción por servicio
export const obtenerPromocionPorServicio = (servicioId: string): Promocion | undefined => {
  return promocionesDB.find(promo => promo.servicioId === servicioId && promo.activa);
};

// Función para crear una nueva promoción
export const crearPromocion = (promocion: Omit<Promocion, 'id' | 'fechaCreacion' | 'cantidadUsada'>): Promocion => {
  const nuevaPromocion: Promocion = {
    ...promocion,
    id: `promo-${uuidv4()}`,
    cantidadUsada: 0,
    fechaCreacion: new Date()
  };

  promocionesDB.push(nuevaPromocion);
  return nuevaPromocion;
};

// Función para actualizar una promoción
export const actualizarPromocion = (id: string, datos: Partial<Promocion>): Promocion | null => {
  const index = promocionesDB.findIndex(promo => promo.id === id);

  if (index === -1) return null;

  promocionesDB[index] = {
    ...promocionesDB[index],
    ...datos
  };

  return promocionesDB[index];
};

// Función para eliminar una promoción
export const eliminarPromocion = (id: string): boolean => {
  const longitudInicial = promocionesDB.length;
  promocionesDB = promocionesDB.filter(promo => promo.id !== id);
  return promocionesDB.length < longitudInicial;
};

// Función para reservar una promoción (durante 10 minutos)
export const reservarPromocion = (promocionId: string): ReservaPromocion | null => {
  // Verificar si la promoción existe y está disponible
  const promocion = obtenerPromocionPorId(promocionId);

  if (!promocion || !promocion.activa || promocion.cantidadUsada >= promocion.cantidadLimite) {
    return null;
  }

  // Crear la reserva (válida por 10 minutos)
  const fechaExpiracion = new Date();
  fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 10);

  const reserva: ReservaPromocion = {
    id: `reserva-${uuidv4()}`,
    promocionId,
    fechaExpiracion
  };

  // Guardar en la "base de datos"
  reservasPromocionesDB.push(reserva);

  return reserva;
};

// Función para confirmar uso de una promoción
export const confirmarPromocion = (reservaId: string): boolean => {
  // Verificar si la reserva existe y no ha expirado
  const ahora = new Date();
  const reserva = reservasPromocionesDB.find(
    r => r.id === reservaId && r.fechaExpiracion > ahora
  );

  if (!reserva) return false;

  // Obtener la promoción
  const promocion = obtenerPromocionPorId(reserva.promocionId);

  if (!promocion) return false;

  // Incrementar el contador de uso
  promocion.cantidadUsada += 1;

  // Si se alcanzó el límite, desactivar la promoción
  if (promocion.cantidadUsada >= promocion.cantidadLimite) {
    promocion.activa = false;
  }

  // Eliminar la reserva
  reservasPromocionesDB = reservasPromocionesDB.filter(r => r.id !== reservaId);

  return true;
};

// Función para limpiar reservas expiradas (podría ejecutarse periódicamente)
export const limpiarReservasExpiradas = (): number => {
  const ahora = new Date();
  const longitudInicial = reservasPromocionesDB.length;

  reservasPromocionesDB = reservasPromocionesDB.filter(
    reserva => reserva.fechaExpiracion > ahora
  );

  return longitudInicial - reservasPromocionesDB.length;
};

// Función para obtener el estado actual de promociones para el frontend
export const obtenerPromocionesState = (): Record<string, Promocion | null> => {
  const todasLasPromociones = obtenerPromociones();
  const resultado: Record<string, Promocion | null> = {};

  // Solo devolver promociones activas
  todasLasPromociones.forEach(promo => {
    if (promo.activa) {
      resultado[promo.servicioId] = promo;
    }
  });

  return resultado;
}; 
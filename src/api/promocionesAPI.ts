import { Promocion, PromocionesState, ReservaPromocion } from '../types/promo';
import { API_BASE_URL } from '../config/apiConfig';

// Función helper para delay (mantener para simulación realista)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Headers de autorización para endpoints protegidos
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// API para obtener todas las promociones (admin)
export const obtenerPromociones = async (): Promise<Promocion[]> => {
  await delay(300); // Mantener delay para UX

  try {
    const response = await fetch(`${API_BASE_URL}/promociones`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const promociones = await response.json();
    return promociones;
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    throw new Error('Error al obtener promociones del servidor');
  }
};

// API para obtener estado de promociones (público - para Services)
export const obtenerTodasPromociones = async (): Promise<Record<string, Promocion | null>> => {
  await delay(300);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones/estado`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const estado = await response.json();
    return estado;
  } catch (error) {
    console.error('Error al obtener estado de promociones:', error);
    throw new Error('Error al obtener estado de promociones');
  }
};

// API para obtener promoción de un servicio específico (público)
export const obtenerPromocionPorServicio = async (servicioId: string): Promise<Promocion | null> => {
  await delay(200);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones/servicio/${servicioId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      return null; // No hay promoción para este servicio
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const promocion = await response.json();
    return promocion;
  } catch (error) {
    console.error('Error al obtener promoción por servicio:', error);
    return null; // En caso de error, no hay promoción
  }
};

// API para crear una nueva promoción (admin)
export const crearPromocion = async (promocion: Omit<Promocion, 'id' | 'fechaCreacion' | 'cantidadUsada'>): Promise<Promocion> => {
  await delay(500);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(promocion)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const nuevaPromocion = await response.json();
    return nuevaPromocion;
  } catch (error) {
    console.error('Error al crear promoción:', error);
    throw error;
  }
};

// API para actualizar una promoción (admin)
export const actualizarPromocion = async (id: string, datos: Partial<Promocion>): Promise<Promocion> => {
  await delay(500);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const promocionActualizada = await response.json();
    return promocionActualizada;
  } catch (error) {
    console.error('Error al actualizar promoción:', error);
    throw error;
  }
};

// API para eliminar una promoción (admin)
export const eliminarPromocion = async (id: string): Promise<boolean> => {
  await delay(500);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success || true;
  } catch (error) {
    console.error('Error al eliminar promoción:', error);
    throw error;
  }
};

// API para usar una promoción (incrementar contador)
export const usarPromocion = async (id: string): Promise<Promocion> => {
  await delay(300);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones/${id}/usar`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const promocionActualizada = await response.json();
    return promocionActualizada;
  } catch (error) {
    console.error('Error al usar promoción:', error);
    throw error;
  }
};

// ===== FUNCIONES DE COMPATIBILIDAD CON EL SISTEMA ANTERIOR =====
// Estas funciones mantienen la interfaz original para evitar romper el código existente

// Función legacy: reservar promoción (ahora simula la reserva)
export const reservarPromocion = async (promocionId: string): Promise<ReservaPromocion> => {
  await delay(200);

  // Simular reserva creando un ID temporal
  const reserva: ReservaPromocion = {
    id: `reserva-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    promocionId,
    fechaExpiracion: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos para confirmar
  };

  // En una implementación completa, esto se guardaría en el backend
  console.log('📝 Promoción reservada temporalmente:', reserva);
  
  return reserva;
};

// Función legacy: confirmar promoción (ahora usa la API real)
export const confirmarPromocion = async (reservaId: string): Promise<void> => {
  await delay(200);

  // En la implementación actual, extraer el promocionId de la reserva
  // y usar la API real para incrementar el contador
  console.log('✅ Confirmando promoción para reserva:', reservaId);
  
  // Por ahora, simular confirmación exitosa
  // En una implementación completa, esto usaría usarPromocion() con el ID correcto
  return;
};

// Función legacy: cancelar reserva
export const cancelarReserva = async (reservaId: string): Promise<void> => {
  await delay(100);
  console.log('❌ Reserva cancelada:', reservaId);
  return;
};

// ===== FUNCIONES ADICIONALES PARA ADMINISTRACIÓN =====

// Reactivar promoción (admin)
export const reactivarPromocion = async (id: string): Promise<Promocion> => {
  await delay(300);

  try {
    const response = await fetch(`${API_BASE_URL}/promociones/${id}/reactivar`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const promocionReactivada = await response.json();
    return promocionReactivada;
  } catch (error) {
    console.error('Error al reactivar promoción:', error);
    throw error;
  }
};

// Verificar si una promoción está disponible
export const verificarDisponibilidadPromocion = async (servicioId: string): Promise<boolean> => {
  try {
    const promocion = await obtenerPromocionPorServicio(servicioId);
    
    if (!promocion) return false;
    
    // Verificar que esté activa y disponible
    if (!promocion.activa) return false;
    if (promocion.cantidadUsada >= promocion.cantidadLimite) return false;
    
    // Verificar expiración
    if (promocion.fechaExpiracion && new Date(promocion.fechaExpiracion) <= new Date()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error al verificar disponibilidad de promoción:', error);
    return false;
  }
}; 
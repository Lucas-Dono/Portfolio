import { Servicio, AddonServicio } from '../services/preciosService';

// Obtener la URL base desde variables de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Función auxiliar para evitar duplicar '/api' en las rutas
function getApiUrl(endpoint: string): string {
  // Si API_URL ya termina en '/api', no añadir '/api' al principio del endpoint
  if (API_URL.endsWith('/api')) {
    // Eliminar '/api' del inicio del endpoint si existe
    const cleanEndpoint = endpoint.startsWith('/api/')
      ? endpoint.substring(4) // Quitar '/api' dejando la barra inicial del resto
      : endpoint;
    return `${API_URL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
  }
  // Si API_URL no termina en '/api', usamos el endpoint tal cual
  return `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

// API para obtener todos los servicios
export const obtenerServicios = async (): Promise<Servicio[]> => {
  try {
    const response = await fetch(getApiUrl('/servicios'));

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    throw new Error('Error al obtener servicios');
  }
};

// API para obtener servicios por tipo (planes o paquetes)
export const obtenerServiciosPorTipo = async (esPaquete: boolean): Promise<Servicio[]> => {
  try {
    const response = await fetch(getApiUrl(`/servicios/tipo/${esPaquete ? 'paquete' : 'plan'}`));

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener servicios por tipo:', error);
    throw new Error('Error al obtener servicios por tipo');
  }
};

// API para obtener un servicio por ID
export const obtenerServicioPorId = async (id: string): Promise<Servicio | null> => {
  try {
    const response = await fetch(getApiUrl(`/servicios/${id}`));

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener servicio:', error);
    throw new Error('Error al obtener servicio');
  }
};

// API para actualizar el precio de un servicio
export const actualizarPrecioServicio = async (id: string, nuevoPrecio: number): Promise<Servicio> => {
  try {
    const response = await fetch(getApiUrl(`/servicios/${id}/precio`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ precio: nuevoPrecio })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar precio del servicio:', error);
    throw error;
  }
};

// API para actualizar precio y precio original de un servicio
export const actualizarPreciosServicio = async (
  id: string,
  datos: { price?: number; originalPrice?: number | null }
): Promise<Servicio> => {
  try {
    const response = await fetch(getApiUrl(`/servicios/${id}/precios`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        precio: datos.price,
        precioOriginal: datos.originalPrice
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar precios del servicio:', error);
    throw error;
  }
};

// API para obtener todos los addons
export const obtenerAddons = async (): Promise<AddonServicio[]> => {
  try {
    const response = await fetch(getApiUrl('/addons'));

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener addons:', error);
    throw new Error('Error al obtener addons');
  }
};

// API para obtener un addon por ID
export const obtenerAddonPorId = async (id: string): Promise<AddonServicio | null> => {
  try {
    const response = await fetch(getApiUrl(`/addons/${id}`));

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener addon:', error);
    throw new Error('Error al obtener addon');
  }
};

// API para actualizar el precio de un addon
export const actualizarPrecioAddon = async (id: string, nuevoPrecio: number): Promise<AddonServicio> => {
  try {
    const response = await fetch(getApiUrl(`/addons/${id}/precio`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ precio: nuevoPrecio })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar precio del addon:', error);
    throw error;
  }
};

// API para crear un nuevo servicio
export const crearServicio = async (servicio: Omit<Servicio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Servicio> => {
  try {
    const response = await fetch(getApiUrl('/servicios'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(servicio)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al crear servicio:', error);
    throw error;
  }
};

// API para actualizar todos los datos de un servicio
export const actualizarServicio = async (id: string, datos: Partial<Servicio>): Promise<Servicio> => {
  try {
    const response = await fetch(getApiUrl(`/servicios/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    throw error;
  }
}; 
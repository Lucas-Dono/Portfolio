/**
 * Configuración central para las URLs de la API
 */

// Función para determinar la URL base de la API
export const getApiBaseUrl = (): string => {
    // Siempre preferir la variable de entorno si está disponible
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // En producción, construir la URL desde la ubicación actual como fallback
    if (import.meta.env.PROD) {
        // Si no hay variable de entorno, construir la URL desde la ubicación actual
        if (typeof window !== 'undefined') {
            const { protocol, hostname } = window.location;
            return `${protocol}//${hostname}/api`;
        }
    }

    // En desarrollo, usar un fallback seguro (esto solo se usará si VITE_API_URL no está definida)
    // Usar la ubicación actual con el puerto configurado en el .env
    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        const port = window.location.port || '4000'; // Usar el puerto actual o 4000 como fallback
        return `${protocol}//${hostname}:${port}/api`;
    }

    // Último recurso (nunca debería llegar aquí)
    console.warn('No se pudo determinar la URL de la API, usando localhost:4000 como fallback');
    return 'http://localhost:4000/api';
};

// Exportar la URL base para uso en toda la aplicación
export const API_BASE_URL = getApiBaseUrl();

// Función auxiliar para crear rutas de API completas
export const getApiUrl = (endpoint: string): string => {
    // Si API_BASE_URL ya termina en '/api', no añadir '/api' al principio del endpoint
    if (API_BASE_URL.endsWith('/api')) {
        // Eliminar '/api' del inicio del endpoint si existe
        const cleanEndpoint = endpoint.startsWith('/api/')
            ? endpoint.substring(4) // Quitar '/api' dejando la barra inicial del resto
            : endpoint;
        return `${API_BASE_URL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;
    }

    // Si API_BASE_URL no termina en '/api', usamos el endpoint tal cual
    return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}; 
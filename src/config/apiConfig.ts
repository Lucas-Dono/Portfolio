/**
 * Configuración central para las URLs de la API
 */

// Función para determinar la URL base de la API
export const getApiBaseUrl = (): string => {
    // En producción, siempre usar la variable de entorno VITE_API_URL
    if (import.meta.env.PROD) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
            console.log('Usando URL de API desde VITE_API_URL:', apiUrl);
            return apiUrl;
        }

        // Si no hay variable de entorno, construir la URL desde la ubicación actual
        if (typeof window !== 'undefined') {
            const { protocol, hostname, port } = window.location;
            const apiBaseUrl = `${protocol}//${hostname}:${port}/api`;
            console.log('Construyendo URL de API desde window.location:', apiBaseUrl);
            return apiBaseUrl;
        }
    }

    // En desarrollo, usar la variable de entorno o construir la URL
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        console.log('Usando URL de API desde VITE_API_URL (desarrollo):', apiUrl);
        return apiUrl;
    }

    // Fallback para desarrollo
    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        const port = import.meta.env.VITE_API_PORT || '5001';
        const apiBaseUrl = `${protocol}//${hostname}:${port}/api`;
        console.log('Construyendo URL de API para desarrollo:', apiBaseUrl);
        return apiBaseUrl;
    }

    // Último recurso (nunca debería llegar aquí)
    console.warn('No se pudo determinar la URL de la API, usando localhost:5001 como fallback');
    return 'http://localhost:5001/api';
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
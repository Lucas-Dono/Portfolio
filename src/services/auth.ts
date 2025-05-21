import { oauthConfig } from '../config/oauth';
import { API_BASE_URL, getApiUrl } from '../config/apiConfig';

// URL base para la API
const API_URL = API_BASE_URL;

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Debug info - Usar oauthConfig para evitar warnings
console.debug('OAuth config loaded:', oauthConfig.github.clientId ? 'GitHub OK' : 'GitHub missing',
  oauthConfig.google.clientId ? 'Google OK' : 'Google missing');

// Tipos para los usuarios autenticados
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
  providerId?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
}

// Interfaz para respuestas de autenticación
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
}

// Guardar token en localStorage
export const saveToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Obtener token desde localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Eliminar token del localStorage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Guardar información del usuario en localStorage
export const saveUser = (user: AuthUser): void => {
  try {
    if (!user) {
      console.error('❌ Error al guardar usuario: Objeto de usuario no válido');
      return;
    }

    if (!user.email) {
      console.warn('⚠️ Guardando usuario sin email en localStorage');
    }

    console.log('✅ Guardando usuario en localStorage:', {
      id: user.id,
      name: user.name,
      email: user.email || 'Sin email',
      provider: user.provider || 'No especificado'
    });

    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Verificar que se guardó correctamente
    const savedUser = localStorage.getItem(USER_KEY);
    if (!savedUser) {
      console.error('❌ Error: No se pudo verificar el usuario guardado en localStorage');
    }
  } catch (e) {
    console.error('❌ Error al guardar usuario en localStorage:', e);
  }
};

// Obtener información del usuario desde localStorage
export const getUser = (): AuthUser | null => {
  const userStr = localStorage.getItem(USER_KEY);
  console.log('🔍 getUser - Usuario en localStorage:', !!userStr);

  if (!userStr) return null;

  try {
    const user = JSON.parse(userStr);
    console.log('📧 getUser - Email del usuario en localStorage:', user?.email || 'Sin email');
    return user;
  } catch (err) {
    console.error('❌ Error al parsear usuario del localStorage:', err);
    return null;
  }
};

// Eliminar información del usuario del localStorage
export const removeUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Función utilitaria para hacer peticiones autenticadas
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();

  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Cerrar sesión - eliminar token y usuario del localStorage
export const logout = (): void => {
  removeToken();
  removeUser();
};

// Verificar si el usuario está autenticado
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Autenticación con email/password
export const loginWithCredentials = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Guardar token y usuario en localStorage
    if (data.success && data.token) {
      saveToken(data.token);
      saveUser(data.user);
    }

    return data;
  } catch (error) {
    console.error('Error en loginWithCredentials:', error);
    throw error;
  }
};

// Registro de usuarios
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  termsAccepted: boolean = false
): Promise<AuthResponse> => {
  try {
    const response = await fetch(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, termsAccepted })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al registrar usuario');
    }

    // Guardar token y usuario en localStorage
    if (data.success && data.token) {
      saveToken(data.token);
      saveUser(data.user);
    }

    return data;
  } catch (error) {
    console.error('Error en registerUser:', error);
    throw error;
  }
};

// Autenticación con Google
export const loginWithGoogle = async (tokenResponse: any, termsAccepted: boolean = false): Promise<AuthResponse> => {
  try {
    console.log('🔄 Iniciando autenticación con Google...');
    console.log('🔍 Token disponible:', !!tokenResponse);
    console.log('🔍 Términos aceptados:', termsAccepted);

    // Si no hay token y no es una solicitud con termsAccepted
    if (!tokenResponse || !tokenResponse.access_token) {
      // En este caso es un flujo normal de inicio de sesión con Google (no una respuesta a términos)
      const googleAuthUrl = getApiUrl('/auth/google/login?callback=' + encodeURIComponent(window.location.origin + '/html/auth-callback.html'));
      console.log('🔗 Abriendo URL de autenticación:', googleAuthUrl);

      // Crear una promesa que se resolverá cuando la ventana de autenticación se complete
      return new Promise<AuthResponse>((resolve, reject) => {
        // Abrir la ventana de autenticación
        const authWindow = window.open(googleAuthUrl, 'GoogleAuth', 'width=600,height=700');

        // Escuchar mensajes de la ventana emergente
        const handleMessage = (event: MessageEvent) => {
          console.log('📨 Mensaje recibido en ventana principal:', event.origin, event.data);

          // Procesar la respuesta de autenticación
          if (event.data && typeof event.data === 'object') {
            // Cerrar la ventana emergente si aún está abierta
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }

            // Eliminar el event listener
            window.removeEventListener('message', handleMessage);

            if (event.data.success && event.data.token && event.data.user) {
              // Guardar token y usuario
              saveToken(event.data.token);
              saveUser(event.data.user);

              console.log('✅ Autenticación con Google exitosa:', event.data.user.email);

              // Si no se ha especificado que los términos están aceptados, enviar el token para reintentarlo
              if (!termsAccepted) {
                event.data.tokenResponse = {
                  access_token: event.data.token
                };
                resolve({
                  ...event.data,
                  requiresTermsAcceptance: true
                });
              } else {
                resolve(event.data);
              }
            } else if (event.data.requiresTermsAcceptance) {
              // Si se requiere aceptación de términos, enviar el error con el token para reintentarlo
              const error = new Error('terms_acceptance_required');
              // Adjuntar el token para el reintento después de aceptar términos
              (error as any).tokenResponse = event.data.tokenResponse || {};
              reject(error);
            } else {
              console.error('❌ Error en respuesta de Google Auth:', event.data.error);
              reject(new Error(event.data.error || 'Error en autenticación con Google'));
            }
          }
        };

        // Agregar listener para mensajes
        window.addEventListener('message', handleMessage);

        // Timeout para cerrar la ventana si no hay respuesta después de 2 minutos
        setTimeout(() => {
          if (authWindow && !authWindow.closed) {
            authWindow.close();
            window.removeEventListener('message', handleMessage);
            reject(new Error('Tiempo de espera agotado en autenticación con Google'));
          }
        }, 120000);
      });
    }

    // Si llegamos aquí, es porque tenemos un token (ya sea en la llamada original o después de aceptar términos)
    console.log('🔄 Enviando token a API con termsAccepted:', termsAccepted);
    const response = await fetch(getApiUrl('/auth/google'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: tokenResponse.access_token,
        termsAccepted
      })
    });

    const data = await response.json();

    console.log('🔄 Respuesta de autenticación Google:', {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user?.email || 'No disponible',
      requiresTermsAcceptance: data.requiresTermsAcceptance
    });

    if (!response.ok) {
      console.error('❌ Error en la respuesta de Google Auth:', data.error || 'Error desconocido');
      throw new Error(data.error || 'Error al autenticar con Google');
    }

    // Si el usuario es nuevo y necesita aceptar los términos, pero no los ha aceptado
    if (data.requiresTermsAcceptance && !termsAccepted) {
      const error = new Error('terms_acceptance_required');
      // Adjuntar el token para el reintento después de aceptar términos
      (error as any).tokenResponse = tokenResponse;
      throw error;
    }

    // Forzar la bandera de términos aceptados en el objeto de usuario si no existe
    if (data.success && data.user && (typeof data.user.termsAccepted === 'undefined' || data.user.termsAccepted === false)) {
      data.user.termsAccepted = true;
      data.user.termsAcceptedAt = new Date().toISOString();
    }

    // Guardar token y usuario en localStorage
    if (data.success && data.token) {
      saveToken(data.token);
      saveUser(data.user);
      console.log('✅ Usuario de Google guardado correctamente con email:', data.user?.email || 'No disponible');
    }

    return data;
  } catch (error) {
    console.error('❌ Error en loginWithGoogle:', error);
    throw error;
  }
};

// Autenticación con GitHub
export const loginWithGithub = async (code: string, termsAccepted: boolean = false): Promise<AuthResponse> => {
  try {
    const response = await fetch(getApiUrl('/auth/github'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, termsAccepted })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al autenticar con GitHub');
    }

    // Si el usuario es nuevo y necesita aceptar los términos
    if (data.requiresTermsAcceptance) {
      throw new Error('terms_acceptance_required');
    }

    // Guardar token y usuario en localStorage
    if (data.success && data.token) {
      saveToken(data.token);
      saveUser(data.user);
    }

    return data;
  } catch (error) {
    console.error('Error en loginWithGithub:', error);
    throw error;
  }
};

// Obtener información del usuario autenticado del servidor
export const getCurrentUser = async (): Promise<AuthUser> => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Intentar usar el usuario del localStorage primero si existe
    const cachedUser = getUser();

    const response = await fetch(getApiUrl('/auth/me'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Si la respuesta no es correcta
    if (!response.ok) {
      // Si el token expiró o es inválido (401), hacer logout
      if (response.status === 401) {
        console.error(`❌ Error 401 en getCurrentUser: Token inválido o expirado`);
        logout();
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }

      // Si el usuario está en caché, usar ese en lugar de fallar
      if (cachedUser && cachedUser.id && cachedUser.email) {
        console.warn(`⚠️ Error ${response.status} al obtener usuario del servidor, usando caché local.`);
        return cachedUser;
      }

      // Si no hay caché o es inválida, mostrar el error real
      const data = await response.json();
      throw new Error(data.error || `Error ${response.status} al obtener usuario`);
    }

    const data = await response.json();

    if (!data.success || !data.user) {
      // Si la respuesta no contiene un usuario, usar el caché si existe
      if (cachedUser && cachedUser.id && cachedUser.email) {
        console.warn('⚠️ Respuesta del servidor sin datos de usuario válidos, usando caché local.');
        return cachedUser;
      }
      throw new Error('Respuesta del servidor sin datos de usuario válidos');
    }

    // Actualizar el usuario en localStorage
    saveUser(data.user);

    return data.user;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);

    // Intentar usar el usuario del localStorage como último recurso
    const cachedUser = getUser();
    if (cachedUser && cachedUser.id && cachedUser.email) {
      console.warn('⚠️ Usando usuario en caché como último recurso tras error:', error);
      return cachedUser;
    }

    throw error;
  }
}; 
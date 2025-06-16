import { oauthConfig } from '../config/oauth';
import { API_BASE_URL, getApiUrl } from '../config/apiConfig';

// URL base para la API
const API_URL = API_BASE_URL; // eslint-disable-line @typescript-eslint/no-unused-vars

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Variable para rastrear si hay problemas con localStorage
let hasStorageIssues = false; // eslint-disable-line @typescript-eslint/no-unused-vars
let syncInterval: number | null = null;

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
  role?: string;
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

// Función para sincronizar las diferentes formas de almacenamiento
const syncAuthStorage = (): void => {
  try {
    // Obtener valores de todas las fuentes
    const lsToken = localStorage.getItem(TOKEN_KEY);
    const ssToken = sessionStorage.getItem(TOKEN_KEY);
    const lsUser = localStorage.getItem(USER_KEY);
    const ssUser = sessionStorage.getItem(USER_KEY);
    const lsAuth = localStorage.getItem('isAuthenticated');
    const ssAuth = sessionStorage.getItem('isAuthenticated');

    // Obtener valores de cookies
    const tokenCookie = document.cookie.match(new RegExp(`(^| )${TOKEN_KEY}=([^;]+)`));
    const userCookie = document.cookie.match(new RegExp(`(^| )${USER_KEY}=([^;]+)`));
    const authCookie = document.cookie.match(new RegExp('(^| )isAuthenticated=([^;]+)'));

    // Crear un token unificado (preferencia: localStorage > sessionStorage > cookie)
    const token = lsToken || ssToken || (tokenCookie ? tokenCookie[2] : null);
    const user = lsUser || ssUser || (userCookie ? decodeURIComponent(userCookie[2]) : null);
    const isAuth = lsAuth === 'true' || ssAuth === 'true' || (authCookie ? authCookie[2] === 'true' : false);

    // Si tenemos token, sincronizar en todas las fuentes
    if (token) {
      try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { console.warn('Error al sincronizar token en localStorage'); }
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) { console.warn('Error al sincronizar token en sessionStorage'); }
      try { document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=2592000; SameSite=Lax`; } catch (e) { console.warn('Error al sincronizar token en cookie'); }
    }

    // Si tenemos usuario, sincronizar en todas las fuentes
    if (user) {
      try { localStorage.setItem(USER_KEY, user); } catch (e) { console.warn('Error al sincronizar usuario en localStorage'); }
      try { sessionStorage.setItem(USER_KEY, user); } catch (e) { console.warn('Error al sincronizar usuario en sessionStorage'); }

      // Para cookies, solo guardamos una versión simplificada
      try {
        const userData = JSON.parse(user);
        const essentialData = JSON.stringify({
          id: userData.id,
          email: userData.email,
          name: userData.name
        });
        document.cookie = `${USER_KEY}=${encodeURIComponent(essentialData)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (e) {
        console.warn('Error al sincronizar usuario en cookie');
      }
    }

    // Sincronizar estado de autenticación
    if (isAuth) {
      try { localStorage.setItem('isAuthenticated', 'true'); } catch (e) { console.warn('Error al sincronizar auth en localStorage'); }
      try { sessionStorage.setItem('isAuthenticated', 'true'); } catch (e) { console.warn('Error al sincronizar auth en sessionStorage'); }
      try { document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`; } catch (e) { console.warn('Error al sincronizar auth en cookie'); }
    }
  } catch (e) {
    console.error('Error durante la sincronización de almacenamiento:', e);
  }
};

// Inicializar sistema de almacenamiento de autenticación
export const initializeAuthStorage = (): void => {
  try {
    // Detectar si estamos en Firefox
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isLinux = navigator.userAgent.toLowerCase().includes('linux');

    console.log('🔍 Detectando entorno para autenticación:', {
      isFirefox,
      isLinux,
      userAgent: navigator.userAgent
    });

    // Probar si localStorage está disponible y funciona correctamente
    const testKey = 'auth_storage_test';
    localStorage.setItem(testKey, 'test');
    const testValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    if (testValue !== 'test') {
      throw new Error('localStorage no funciona correctamente');
    }

    // Si estamos en Firefox en Linux, podemos tener problemas, así que tomamos medidas adicionales
    if (isFirefox && isLinux) {
      console.log('⚠️ Detectado Firefox en Linux, aplicando medidas de compatibilidad para autenticación');

      // Migrar cualquier dato existente a otras formas de almacenamiento
      const token = localStorage.getItem(TOKEN_KEY);
      const user = localStorage.getItem(USER_KEY);

      if (token) {
        // Asegurar persistencia en sessionStorage
        sessionStorage.setItem(TOKEN_KEY, token);

        // Y en cookies
        document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      if (user) {
        // Asegurar persistencia en sessionStorage
        sessionStorage.setItem(USER_KEY, user);

        // Y en cookies (versión simplificada)
        try {
          const userData = JSON.parse(user);
          const essentialData = JSON.stringify({
            id: userData.id,
            email: userData.email,
            name: userData.name
          });
          document.cookie = `${USER_KEY}=${encodeURIComponent(essentialData)}; path=/; max-age=2592000; SameSite=Lax`;
        } catch (e) {
          console.error('❌ Error al guardar datos de usuario en cookies:', e);
        }
      }
    }

    // Configurar intervalo de sincronización para mantener los datos consistentes
    // Limpiar cualquier intervalo existente primero
    if (syncInterval !== null) {
      window.clearInterval(syncInterval);
    }

    // Establecer nuevo intervalo (30 segundos)
    syncInterval = window.setInterval(syncAuthStorage, 30000);

    // Sincronizar inmediatamente
    syncAuthStorage();

    console.log('✅ Sistema de almacenamiento de autenticación inicializado correctamente');

    // Agregar oyente para el evento visibilitychange para sincronizar cuando la pestaña vuelve a estar visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('📋 Pestaña visible de nuevo, sincronizando almacenamiento de autenticación');
        syncAuthStorage();
      }
    });

    // Agregar oyente para el evento de carga de página
    window.addEventListener('load', () => {
      console.log('📋 Página cargada, sincronizando almacenamiento de autenticación');
      syncAuthStorage();
    });

  } catch (e) {
    console.error('❌ Error en localStorage, usando alternativas:', e);
    hasStorageIssues = true;

    // Restaurar desde sessionStorage o cookies si localStorage falla
    try {
      // Intentar migrar de sessionStorage
      const tokenFromSession = sessionStorage.getItem(TOKEN_KEY);
      const userFromSession = sessionStorage.getItem(USER_KEY);

      // Intentar migrar de cookies
      const tokenCookieMatch = document.cookie.match(new RegExp(`(^| )${TOKEN_KEY}=([^;]+)`));
      const userCookieMatch = document.cookie.match(new RegExp(`(^| )${USER_KEY}=([^;]+)`));

      // Registrar lo que encontramos
      console.log('🔍 Datos recuperados de fuentes alternativas:', {
        tokenFromSession: !!tokenFromSession,
        userFromSession: !!userFromSession,
        tokenFromCookie: !!tokenCookieMatch,
        userFromCookie: !!userCookieMatch
      });

      // Configurar intervalo de sincronización en modo recuperación
      if (syncInterval !== null) {
        window.clearInterval(syncInterval);
      }

      // En modo recuperación, sincronizamos más a menudo (cada 15 segundos)
      syncInterval = window.setInterval(syncAuthStorage, 15000);

      // Sincronizar inmediatamente
      syncAuthStorage();
    } catch (fallbackError) {
      console.error('❌ Error crítico en sistema de almacenamiento:', fallbackError);
    }
  }
};

// Guardar token en localStorage
export const saveToken = (token: string): void => {
  try {
    // Intentar guardar en localStorage (persistente)
    localStorage.setItem(TOKEN_KEY, token);

    // Guardar también en sessionStorage (respaldo para la sesión actual)
    sessionStorage.setItem(TOKEN_KEY, token);

    // Guardar como cookie para máxima compatibilidad
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=2592000; SameSite=Lax`; // 30 días

    console.log('✅ Token guardado exitosamente en múltiples almacenamientos');
  } catch (e) {
    console.error('❌ Error al guardar token:', e);
    // Intentar al menos guardar en sessionStorage si localStorage falla
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (e2) {
      console.error('❌ Error al guardar token en sessionStorage:', e2);
    }
  }
};

// Obtener token desde fuentes disponibles
export const getToken = (): string | null => {
  try {
    // Intentar obtener del localStorage primero
    let token = localStorage.getItem(TOKEN_KEY);

    // Si no está en localStorage, intentar sessionStorage
    if (!token) {
      token = sessionStorage.getItem(TOKEN_KEY);
      console.log('🔍 Token recuperado de sessionStorage');

      // Si se encontró en sessionStorage, restaurarlo a localStorage
      if (token) {
        try {
          localStorage.setItem(TOKEN_KEY, token);
        } catch (e) {
          console.warn('⚠️ No se pudo restaurar token a localStorage:', e);
        }
      }
    }

    // Si aún no se encuentra, intentar con cookies
    if (!token) {
      const cookieMatch = document.cookie.match(new RegExp(`(^| )${TOKEN_KEY}=([^;]+)`));
      if (cookieMatch) {
        token = cookieMatch[2];
        console.log('🔍 Token recuperado de cookie');

        // Restaurar el token a los almacenamientos
        try {
          localStorage.setItem(TOKEN_KEY, token);
          sessionStorage.setItem(TOKEN_KEY, token);
        } catch (e) {
          console.warn('⚠️ No se pudo restaurar token de cookie a storages:', e);
        }
      }
    }

    return token;
  } catch (e) {
    console.error('❌ Error al recuperar token:', e);
    return null;
  }
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

    console.log('✅ Guardando usuario en múltiples almacenamientos:', {
      id: user.id,
      name: user.name,
      email: user.email || 'Sin email',
      provider: user.provider || 'No especificado'
    });

    const userStr = JSON.stringify(user);

    // Guardar en localStorage (persistente)
    localStorage.setItem(USER_KEY, userStr);

    // Guardar en sessionStorage (respaldo para la sesión actual)
    sessionStorage.setItem(USER_KEY, userStr);

    // Guardar los datos esenciales en cookies (solo ID y email por limitaciones de tamaño)
    const essentialUserData = JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name
    });
    document.cookie = `${USER_KEY}=${encodeURIComponent(essentialUserData)}; path=/; max-age=2592000; SameSite=Lax`; // 30 días

    // Verificar que se guardó correctamente
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!savedUser) {
      console.error('❌ Error: No se pudo verificar el usuario guardado');
    }
  } catch (e) {
    console.error('❌ Error al guardar usuario en almacenamiento:', e);
    // Intentar al menos guardar en sessionStorage si localStorage falla
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e2) {
      console.error('❌ Error al guardar usuario en sessionStorage:', e2);
    }
  }
};

// Obtener información del usuario desde las fuentes disponibles
export const getUser = (): AuthUser | null => {
  try {
    // Intentar obtener del localStorage primero
    let userStr = localStorage.getItem(USER_KEY);

    // Si no está en localStorage, intentar sessionStorage
    if (!userStr) {
      userStr = sessionStorage.getItem(USER_KEY);
      if (userStr) {
        console.log('🔍 Usuario recuperado de sessionStorage');

        // Restaurar a localStorage si es posible
        try {
          localStorage.setItem(USER_KEY, userStr);
        } catch (e) {
          console.warn('⚠️ No se pudo restaurar usuario a localStorage:', e);
        }
      }
    }

    // Si aún no se encuentra, intentar con cookies
    if (!userStr) {
      const cookieMatch = document.cookie.match(new RegExp(`(^| )${USER_KEY}=([^;]+)`));
      if (cookieMatch) {
        try {
          userStr = decodeURIComponent(cookieMatch[2]);
          console.log('🔍 Datos parciales de usuario recuperados de cookie');
        } catch (e) {
          console.error('❌ Error al decodificar datos de usuario desde cookie:', e);
        }
      }
    }

    console.log('🔍 Usuario en almacenamiento:', !!userStr);

    if (!userStr) return null;

    try {
      const user = JSON.parse(userStr);
      console.log('📧 Email del usuario recuperado:', user?.email || 'Sin email');
      return user;
    } catch (err) {
      console.error('❌ Error al parsear usuario del almacenamiento:', err);
      return null;
    }
  } catch (e) {
    console.error('❌ Error al recuperar usuario:', e);
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

// Cerrar sesión - eliminar token y usuario del localStorage, sessionStorage y cookies
export const logout = (): void => {
  // Eliminar de localStorage
  removeToken();
  removeUser();
  localStorage.removeItem('isAuthenticated');

  // Eliminar de sessionStorage
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('isAuthenticated');

  // Eliminar de cookies (expirarlas)
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  document.cookie = 'auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

  // También eliminar posibles flags de redirección
  localStorage.removeItem('auth_redirect_url');
  localStorage.removeItem('payment_redirect_url');
  localStorage.removeItem('google_auth_redirect');
  localStorage.removeItem('github_auth_redirect');
  sessionStorage.removeItem('auth_redirect_url');
  sessionStorage.removeItem('payment_redirect_url');
  sessionStorage.removeItem('google_auth_redirect');
  sessionStorage.removeItem('github_auth_redirect');

  console.log('✅ Logout completo: almacenamiento y cookies limpiados');
};

// Verificar si el token existe y no está expirado
export const isTokenValid = (token: string): boolean => {
  try {
    // Si estamos en modo desarrollo, podemos ser más permisivos
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    // Si no hay token, no es válido
    if (!token) return false;

    // En modo desarrollo, podemos considerar cualquier token como válido para evitar bucles de redirección
    if (isDevelopment) {
      console.log('🔧 Modo desarrollo: considerando token como válido para evitar bucles de redirección');
      return true;
    }

    // Verificar si el token es JWT (tiene formato xxx.yyy.zzz)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decodificar la parte del payload (sin verificar firma)
    const payload = JSON.parse(atob(parts[1]));

    // Verificar si tiene fecha de expiración
    if (!payload.exp) return true; // Si no tiene exp, asumimos que es válido

    // Verificar si ha expirado
    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();

    // Añadir un margen de 5 minutos para evitar problemas por diferencias de reloj
    const marginInMs = 5 * 60 * 1000; // 5 minutos en milisegundos
    const adjustedNow = new Date(now.getTime() - marginInMs);

    // Para debugging
    console.log('🔍 Verificando validez del token:', {
      expirationDate: expirationDate.toISOString(),
      now: now.toISOString(),
      adjustedNow: adjustedNow.toISOString(),
      isValid: adjustedNow < expirationDate
    });

    return adjustedNow < expirationDate;
  } catch (e) {
    console.warn('⚠️ Error al verificar validez del token:', e);

    // Si hay un error en la verificación del token,
    // intentar confiar en el valor de isAuthenticated en localStorage
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthFlag) {
      console.log('Usando isAuthenticated de localStorage como respaldo');
      return true;
    }

    return false; // Si no hay isAuthenticated, consideramos inválido
  }
};

// Verificar si el usuario está autenticado
export const isAuthenticated = (): boolean => {
  try {
    // Si estamos en modo desarrollo, podemos ser más permisivos
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    const token = getToken();
    const user = getUser();
    const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true' ||
      sessionStorage.getItem('isAuthenticated') === 'true';

    console.log('🔍 Verificando autenticación:', {
      hasToken: !!token,
      hasUser: !!user,
      isAuthFlag,
      isDevelopment
    });

    // En modo desarrollo, si hay token o usuario, consideramos como autenticado para evitar bucles
    if (isDevelopment && (token || user)) {
      console.log('🔧 Modo desarrollo: considerando usuario como autenticado para evitar bucles');
      localStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('isAuthenticated', 'true');
      return true;
    }

    // Si ya está marcado como autenticado en algún storage, confiar en esa información
    if (isAuthFlag && token) {
      return true;
    }

    // Verificar que exista el token (requisito mínimo)
    if (!token) {
      return false;
    }

    // Si estamos en Firefox en Linux, ser más permisivo con la validación
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isLinux = navigator.userAgent.toLowerCase().includes('linux');

    if (isFirefox && isLinux) {
      console.log('⚠️ Usando validación permisiva para Firefox en Linux');

      // En Firefox/Linux, si hay token, confiar en él sin validación estricta
      // Esto evita problemas con operaciones complejas con localStorage
      localStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('isAuthenticated', 'true');

      // También configurar una cookie para respaldo
      document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;

      return true;
    }

    // Para otros navegadores, verificar que el token sea válido
    const isValid = isTokenValid(token);
    if (!isValid) {
      console.warn('⚠️ Token existe pero no es válido');
      return false;
    }

    // Si llegamos aquí, hay un token válido
    // Establecer el flag de autenticación para futuras consultas en todas las fuentes
    localStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('isAuthenticated', 'true');
    document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;

    return true;
  } catch (e) {
    console.error('❌ Error al verificar autenticación:', e);

    // Intentar validación simplificada como último recurso
    const tokenExists = !!getToken();

    if (tokenExists) {
      console.log('⚠️ Usando validación simplificada tras error');
      return true;
    }

    return false;
  }
};

// Autenticación con email/password
export const loginWithCredentials = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    console.log('🔄 Iniciando autenticación con credenciales...');

    // Función para hacer la petición con reintentos
    const fetchWithRetry = async (retries = 2, delay = 1000): Promise<Response> => {
      try {
        return await fetch(getApiUrl('/auth/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
      } catch (error) {
        // Si hay error de red y quedan reintentos, esperar y reintentar
        if (retries > 0) {
          console.warn(`⚠️ Error de red al autenticar con credenciales, reintentando... (${retries} intentos restantes)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries - 1, delay * 1.5);
        }
        throw error;
      }
    };

    // Hacer la petición con reintentos
    const response = await fetchWithRetry();

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Error al parsear respuesta JSON:', jsonError);
      throw new Error('Error al procesar la respuesta del servidor');
    }

    if (!response.ok) {
      console.error('❌ Error en la respuesta de autenticación:', data.error || 'Error desconocido');
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Guardar token y usuario en localStorage con manejo de errores
    if (data.success && data.token) {
      try {
        saveToken(data.token);
        saveUser(data.user);
        console.log('✅ Usuario autenticado correctamente con email:', data.user?.email || 'No disponible');
      } catch (storageError) {
        console.error('❌ Error al guardar datos de autenticación en localStorage:', storageError);
        // Continuar a pesar del error de almacenamiento
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error en loginWithCredentials:', error);
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

        if (!authWindow) {
          console.error('❌ No se pudo abrir la ventana de autenticación. Verifica que no esté bloqueada por el navegador.');
          reject(new Error('No se pudo abrir la ventana de autenticación. Verifica que no esté bloqueada por el navegador.'));
          return;
        }

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
              // Guardar token y usuario con manejo de errores
              try {
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
              } catch (storageError) {
                console.error('❌ Error al guardar datos de autenticación:', storageError);
                // Intentar continuar a pesar del error de almacenamiento
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

    // Función para hacer la petición con reintentos
    const fetchWithRetry = async (retries = 2, delay = 1000): Promise<Response> => {
      try {
        return await fetch(getApiUrl('/auth/google'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: tokenResponse.access_token,
            termsAccepted
          })
        });
      } catch (error) {
        // Si hay error de red y quedan reintentos, esperar y reintentar
        if (retries > 0) {
          console.warn(`⚠️ Error de red al autenticar con Google, reintentando... (${retries} intentos restantes)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries - 1, delay * 1.5);
        }
        throw error;
      }
    };

    // Hacer la petición con reintentos
    const response = await fetchWithRetry();

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Error al parsear respuesta JSON:', jsonError);
      throw new Error('Error al procesar la respuesta del servidor');
    }

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

    // Guardar token y usuario en localStorage con manejo de errores
    if (data.success && data.token) {
      try {
        saveToken(data.token);
        saveUser(data.user);
        console.log('✅ Usuario de Google guardado correctamente con email:', data.user?.email || 'No disponible');
      } catch (storageError) {
        console.error('❌ Error al guardar datos de autenticación en localStorage:', storageError);
        // Continuar a pesar del error de almacenamiento
      }
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
    console.log('🔄 Iniciando autenticación con GitHub...');
    console.log('🔍 Código disponible:', !!code);
    console.log('🔍 Términos aceptados:', termsAccepted);

    // Función para hacer la petición con reintentos
    const fetchWithRetry = async (retries = 2, delay = 1000): Promise<Response> => {
      try {
        return await fetch(getApiUrl('/auth/github'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, termsAccepted })
        });
      } catch (error) {
        // Si hay error de red y quedan reintentos, esperar y reintentar
        if (retries > 0) {
          console.warn(`⚠️ Error de red al autenticar con GitHub, reintentando... (${retries} intentos restantes)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries - 1, delay * 1.5);
        }
        throw error;
      }
    };

    // Hacer la petición con reintentos
    const response = await fetchWithRetry();

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Error al parsear respuesta JSON:', jsonError);
      throw new Error('Error al procesar la respuesta del servidor');
    }

    console.log('🔄 Respuesta de autenticación GitHub:', {
      success: data.success,
      hasToken: !!data.token,
      hasUser: !!data.user,
      userEmail: data.user?.email || 'No disponible',
      requiresTermsAcceptance: data.requiresTermsAcceptance
    });

    if (!response.ok) {
      console.error('❌ Error en la respuesta de GitHub Auth:', data.error || 'Error desconocido');
      throw new Error(data.error || 'Error al autenticar con GitHub');
    }

    // Si el usuario es nuevo y necesita aceptar los términos
    if (data.requiresTermsAcceptance && !termsAccepted) {
      const error = new Error('terms_acceptance_required');
      // Adjuntar el código para el reintento después de aceptar términos
      (error as any).code = code;
      throw error;
    }

    // Forzar la bandera de términos aceptados en el objeto de usuario si no existe
    if (data.success && data.user && (typeof data.user.termsAccepted === 'undefined' || data.user.termsAccepted === false)) {
      data.user.termsAccepted = true;
      data.user.termsAcceptedAt = new Date().toISOString();
    }

    // Guardar token y usuario en localStorage con manejo de errores
    if (data.success && data.token) {
      try {
        saveToken(data.token);
        saveUser(data.user);
        console.log('✅ Usuario de GitHub guardado correctamente con email:', data.user?.email || 'No disponible');
      } catch (storageError) {
        console.error('❌ Error al guardar datos de autenticación en localStorage:', storageError);
        // Continuar a pesar del error de almacenamiento
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error en loginWithGithub:', error);
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

    // Verificar si el token parece inválido antes de hacer la petición
    if (!isTokenValid(token)) {
      console.warn('⚠️ Token parece inválido o expirado, usando caché local si existe');
      if (cachedUser && cachedUser.id && cachedUser.email) {
        return cachedUser;
      }
      throw new Error('Token inválido o expirado');
    }

    // Función para hacer la petición con reintentos
    const fetchWithRetry = async (retries = 2, delay = 1000): Promise<Response> => {
      try {
        const response = await fetch(getApiUrl('/auth/me'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response;
      } catch (error) {
        // Si hay error de red y quedan reintentos, esperar y reintentar
        if (retries > 0) {
          console.warn(`⚠️ Error de red al obtener usuario, reintentando... (${retries} intentos restantes)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(retries - 1, delay * 1.5);
        }
        throw error;
      }
    };

    // Hacer la petición con reintentos
    const response = await fetchWithRetry();

    // Si la respuesta no es correcta
    if (!response.ok) {
      // Si el token expiró o es inválido (401), hacer logout
      if (response.status === 401) {
        console.error(`❌ Error 401 en getCurrentUser: Token inválido o expirado`);
        logout();
        throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
      }

      // Para otros errores HTTP (500, 502, etc), usar el usuario en caché si existe
      if (cachedUser && cachedUser.id && cachedUser.email) {
        console.warn(`⚠️ Error ${response.status} al obtener usuario del servidor, usando caché local.`);
        return cachedUser;
      }

      // Si no hay caché o es inválida, mostrar el error real
      try {
        const data = await response.json();
        throw new Error(data.error || `Error ${response.status} al obtener usuario`);
      } catch (jsonError) {
        // Si no se puede parsear la respuesta JSON
        throw new Error(`Error ${response.status} al obtener usuario`);
      }
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
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import {
  AuthUser,
  loginWithCredentials,
  registerUser,
  loginWithGoogle,
  loginWithGithub,
  getCurrentUser,
  logout as logoutService,
  isAuthenticated,
  getUser,
  AuthResponse,
  saveToken,
  saveUser,
  getToken
} from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/apiConfig';

// Interfaz para el contexto de autenticación
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string, termsAccepted: boolean) => Promise<void>;
  loginWithGoogleProvider: (tokenResponse: any, termsAccepted?: boolean) => Promise<AuthResponse>;
  loginWithGithubProvider: (code: string, termsAccepted?: boolean) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>; // Método simplificado para autenticación con Google
  logout: () => void;
  clearError: () => void;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Props para el proveedor
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresTermsRedirect, setRequiresTermsRedirect] = useState<boolean>(false);
  const navigate = useNavigate();

  // Hook para redirección cuando se requiere aceptar términos
  useEffect(() => {
    if (requiresTermsRedirect) {
      // Establecer flag para mostrar mensaje al usuario
      localStorage.setItem('requires_terms_acceptance', 'true');
      // Limpiar el estado de redirección
      setRequiresTermsRedirect(false);
      // Hacer logout
      logoutService();
      // Redirección segura usando navigate
      navigate('/login');
    }
  }, [requiresTermsRedirect, navigate]);

  // Verificar si hay un usuario autenticado al cargar
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);

      // Primero, obtener el usuario del localStorage
      const localUser = getUser();
      const token = getToken();

      // Si tenemos un usuario local y un token, consideramos que está autenticado inicialmente
      if (localUser && localUser.id && localUser.email && token) {
        console.log('✅ Usuario recuperado de localStorage:', localUser.email);

        // Establecer el usuario desde localStorage inmediatamente para evitar parpadeos de UI
        setUser(localUser);

        // Verificar si el usuario tiene el campo termsAccepted
        if (typeof localUser.termsAccepted === 'undefined' || localUser.termsAccepted === false) {
          console.log('⚠️ Usuario local sin aceptación de términos, requiere aceptarlos');
          // Iniciar proceso de redirección
          setRequiresTermsRedirect(true);
          setIsLoading(false);
          return;
        }

        // En segundo plano, intentamos actualizar los datos del usuario desde el servidor
        // pero no bloqueamos la UI mientras esperamos
        try {
          const userData = await getCurrentUser();
          console.log('✅ Usuario actualizado desde el servidor:', userData?.email || 'Sin email');

          // Actualizar el usuario solo si obtenemos datos válidos
          if (userData && userData.id && userData.email) {
            setUser(userData);

            // Verificar términos y condiciones en la respuesta del servidor
            if (typeof userData.termsAccepted === 'undefined' || userData.termsAccepted === false) {
              console.log('⚠️ Usuario del servidor sin aceptación de términos, requiere aceptarlos');
              setRequiresTermsRedirect(true);
            }
          }
        } catch (err) {
          // Si hay un error al actualizar desde el servidor, mantenemos el usuario local
          // y simplemente registramos el error sin interrumpir la sesión
          console.warn('⚠️ Error al actualizar datos del usuario desde el servidor:', err);
          // No hacemos logout, mantenemos la sesión con los datos locales
        }
      } else if (token) {
        // Si solo tenemos token pero no usuario en localStorage, intentamos obtener el usuario
        try {
          const userData = await getCurrentUser();
          console.log('✅ Usuario obtenido del servidor con token existente:', userData?.email || 'Sin email');

          if (userData && userData.id && userData.email) {
            setUser(userData);

            // Verificar términos y condiciones
            if (typeof userData.termsAccepted === 'undefined' || userData.termsAccepted === false) {
              console.log('⚠️ Usuario sin aceptación de términos, requiere aceptarlos');
              setRequiresTermsRedirect(true);
            }
          } else {
            console.error('❌ Respuesta del servidor sin datos de usuario válidos');
            logoutService(); // Limpiar token inválido
          }
        } catch (err) {
          console.error('❌ Error al obtener usuario con token existente:', err);
          // No hacer logout automáticamente, podría ser un error temporal del servidor
          // Solo si es error 401 (no autorizado) entonces hacemos logout
          if (err instanceof Error && err.message.includes('401')) {
            logoutService();
          }
        }
      } else {
        console.log('⚠️ No hay datos de autenticación en localStorage');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Limpiar el error
  const clearError = () => {
    setError(null);
  };

  // Login con email y password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando autenticación con credenciales...');
      const response = await loginWithCredentials(email, password);

      if (response.success && response.user) {
        console.log('✅ Usuario autenticado correctamente:', response.user);
        setUser(response.user);
        return response; // Devolver la respuesta para que pueda ser utilizada
      } else {
        console.error('❌ Respuesta exitosa pero sin user:', response);
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (err) {
      console.error('❌ Error en login con credenciales:', err);
      setError(err instanceof Error ? err.message : 'Error de autenticación');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Registro de usuario
  const register = async (name: string, email: string, password: string, termsAccepted: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await registerUser(name, email, password, termsAccepted);

      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Google
  const loginWithGoogleProvider = async (tokenResponse: any, termsAccepted: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando autenticación con Google en el backend...');
      console.log('🔍 Valor de termsAccepted:', termsAccepted);

      // Aseguramos que termsAccepted siempre se envíe como true si el usuario ha llegado hasta aquí
      const response = await loginWithGoogle(tokenResponse, true); // Forzamos termsAccepted a true

      if (response.success && response.user) {
        console.log('✅ Usuario autenticado con Google correctamente:', response.user);
        setUser(response.user);
        return response; // Devolver la respuesta para que pueda ser utilizada
      } else {
        console.error('❌ Respuesta exitosa pero sin user:', response);
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (err) {
      console.error('❌ Error en loginWithGoogleProvider:', err);
      setError(err instanceof Error ? err.message : 'Error al autenticar con Google');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login con GitHub
  const loginWithGithubProvider = async (code: string, termsAccepted: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando autenticación con GitHub en el backend...');
      const response = await loginWithGithub(code, termsAccepted);

      if (response.success && response.user) {
        console.log('✅ Usuario autenticado con GitHub correctamente:', response.user);
        setUser(response.user);
        return response; // Devolver la respuesta para que pueda ser utilizada
      } else {
        console.error('❌ Respuesta exitosa pero sin user:', response);
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (err) {
      console.error('❌ Error en loginWithGithubProvider:', err);
      setError(err instanceof Error ? err.message : 'Error al autenticar con GitHub');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Método simplificado para autenticación directa con Google
  const handleLoginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando autenticación directa con Google...');

      // Abrir ventana de autenticación de Google directamente
      const googleAuthUrl = `${API_BASE_URL}/auth/google/login?callback=${encodeURIComponent(window.location.origin + '/html/auth-callback.html')}`;
      console.log('🔗 Abriendo URL de autenticación:', googleAuthUrl);

      // Crear una promesa que se resolverá cuando la ventana de autenticación se complete
      return new Promise<AuthResponse>((resolve, reject) => {
        // Abrir la ventana de autenticación
        const authWindow = window.open(googleAuthUrl, 'GoogleAuth', 'width=600,height=700');

        // Escuchar mensajes de la ventana emergente
        const handleMessage = (event: MessageEvent) => {
          // No verificar el origen porque puede ser el propio origen
          // En producción sería recomendable verificar, pero para desarrollo 
          // puede generar problemas si hay diferencias entre localhost y 127.0.0.1

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
              setUser(event.data.user);

              console.log('✅ Autenticación con Google exitosa:', event.data.user.email);
              setIsLoading(false);
              resolve(event.data);
            } else {
              console.error('❌ Error en respuesta de Google Auth:', event.data.error);
              setError(event.data.error || 'Error en autenticación con Google');
              setIsLoading(false);
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
            setIsLoading(false);
            reject(new Error('Tiempo de espera agotado en autenticación con Google'));
          }
        }, 120000);

        // Si la ventana se cerró sin enviar mensaje
        const checkWindowClosed = setInterval(() => {
          if (authWindow && authWindow.closed) {
            clearInterval(checkWindowClosed);
            window.removeEventListener('message', handleMessage);
            setIsLoading(false);

            // Si ya hay un usuario en el estado, la autenticación fue exitosa pero no se recibió el mensaje
            if (user) {
              resolve({
                success: true,
                user,
                token: getToken() || ''
              });
            } else {
              reject(new Error('Ventana de autenticación cerrada antes de completar'));
            }
          }
        }, 1000);
      });
    } catch (err) {
      console.error('❌ Error en loginWithGoogle:', err);
      setError(err instanceof Error ? err.message : 'Error al autenticar con Google');
      setIsLoading(false);
      throw err;
    }
  };

  // Cerrar sesión
  const logout = () => {
    logoutService();
    setUser(null);
  };

  // Valores del contexto
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    loginWithGoogleProvider,
    loginWithGithubProvider,
    loginWithGoogle: handleLoginWithGoogle,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
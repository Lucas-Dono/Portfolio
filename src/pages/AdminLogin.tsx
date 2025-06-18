import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

// URL de la API
const API_URL = import.meta.env.VITE_API_URL || 'https://circuitprompt.com.ar/api';

const AdminLoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #121212;
  color: #f5f5f5;
  padding: 2rem;
`;

const AdminLoginCard = styled.div`
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  padding: 2rem;
  width: 100%;
  max-width: 450px;
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #00FFFF;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const Input = styled.input`
  background-color: rgba(20, 20, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #00d2ff, #3a7bd5);
  color: white;
  border: none;
  padding: 0.85rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0, 255, 255, 0.3);
  }
  
  &:disabled {
    background: rgba(100, 100, 100, 0.5);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #FF5252;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #4CAF50;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
`;

const InfoText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
`;

// Interface para tipado de respuesta
interface AuthResponse {
  success: boolean;
  token: string;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  const navigate = useNavigate();

  // Verificar si hay un token en la URL (al regresar de la verificación por email)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      verifyToken(token);
    }
  }, []);

  // Función para verificar el token de la URL
  const verifyToken = async (token: string) => {
    try {
      setLoading(true);
      setError('');
      setTokenExpired(false);
      console.log('Verificando token:', token.substring(0, 10) + '...');

      // Limpiar el token de la URL inmediatamente para evitar reutilización
      window.history.replaceState({}, document.title, window.location.pathname);

      // Llamar a la API para verificar el token
      const response = await axios.get<AuthResponse>(`${API_URL}/auth/admin/verify/${token}`);
      console.log('Respuesta de verificación:', response.data);

      if (response.data.success && response.data.token) {
        // Almacenar token y datos de usuario
        const authToken = response.data.token;
        console.log('Token JWT recibido:', authToken.substring(0, 15) + '...');

        // Limpiar cualquier sesión anterior
        localStorage.clear();

        // Establecer nuevos datos de sesión
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('auth_user', JSON.stringify({
          name: response.data.user?.name || 'Administrador',
          role: 'admin',
          email: response.data.user?.email || 'admin@example.com'
        }));

        setSuccess('Verificación exitosa. Redirigiendo al panel de administración...');
        console.log('✅ Verificación exitosa, datos guardados en localStorage');

        // Limpiar credenciales temporales
        localStorage.removeItem('temp_admin_username');
        localStorage.removeItem('temp_admin_password');

        // Forzar una recarga completa para asegurar la correcta aplicación de la sesión
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1500);
      } else {
        throw new Error('Error en la verificación: Respuesta sin token o no exitosa');
      }
    } catch (error: any) {
      console.error('Error al verificar token:', error);

      // Información detallada de depuración
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
      }

      // Verificar si el error es por token expirado
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage.includes('expirado') || errorMessage.includes('expired')) {
        setTokenExpired(true);
        setError('El enlace de verificación ha expirado. Los enlaces de verificación son válidos por solo 10 minutos por razones de seguridad.');

        // Si tenemos credenciales guardadas, ofrecer regenerar automáticamente
        const savedUsername = localStorage.getItem('temp_admin_username');
        const savedPassword = localStorage.getItem('temp_admin_password');

        if (savedUsername && savedPassword) {
          console.log('🔄 Credenciales encontradas, ofreciendo regeneración automática');
          setUsername(savedUsername);
          setPassword(savedPassword);
        }
      } else if (errorMessage.includes('utilizado') || errorMessage.includes('used')) {
        setError('Este enlace de verificación ya fue utilizado. Por favor, solicita un nuevo enlace.');
        setTokenExpired(true);
      } else {
        setError(
          error.response?.data?.error ||
          'Error en la verificación. El enlace puede haber expirado o ya ha sido utilizado.'
        );
      }

      // Si el token es inválido, limpiar estados de verificación
      setVerificationSent(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para solicitar un nuevo token de verificación
  const requestNewToken = async () => {
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña primero');
      return;
    }

    setLoading(true);
    setError('');
    setTokenExpired(false);

    try {
      const response = await axios.post<{
        success: boolean;
        message?: string;
        requiresTwoFactor?: boolean;
        error?: string;
      }>(`${API_URL}/auth/admin/request-verification`, {
        username,
        password
      });

      if (response.data.success && response.data.requiresTwoFactor) {
        setVerificationSent(true);
        setSuccess(response.data.message || 'Se ha enviado un nuevo enlace de verificación a tu correo electrónico');

        // Actualizar credenciales temporales
        localStorage.setItem('temp_admin_username', username);
        localStorage.setItem('temp_admin_password', password);
      } else {
        throw new Error(response.data.error || 'Error al solicitar nuevo token');
      }
    } catch (error: any) {
      console.error('Error al solicitar nuevo token:', error);
      setError(error.response?.data?.error || 'Error al solicitar nuevo token de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Guardar credenciales temporalmente para auto-retry
    localStorage.setItem('temp_admin_username', username);
    localStorage.setItem('temp_admin_password', password);

    try {
      console.log('Intentando inicio de sesión como administrador...');

      // Solicitar verificación de dos pasos
      try {
        console.log('Solicitando verificación de dos pasos:', `${API_URL}/auth/admin/request-verification`);

        const response = await axios.post<{
          success: boolean;
          message?: string;
          requiresTwoFactor?: boolean;
          error?: string;
        }>(`${API_URL}/auth/admin/request-verification`, {
          username,
          password
        });

        console.log('Respuesta de solicitud de verificación:', response.data);

        if (response.data.success && response.data.requiresTwoFactor) {
          setVerificationSent(true);
          setSuccess(response.data.message || 'Se ha enviado un enlace de verificación a tu correo electrónico');
        } else {
          throw new Error(response.data.error || 'Error en la solicitud de verificación');
        }
      } catch (apiError: any) {
        // Si la API falla, usar el método de autenticación anterior como fallback durante el desarrollo
        console.warn('Error al solicitar verificación. Intentando método de autenticación de desarrollo:', apiError);

        // Autenticación directa para desarrollo (solo en entorno de desarrollo)
        const adminUser = import.meta.env.VITE_ADMIN_USER || 'admin';
        const adminPass = import.meta.env.VITE_ADMIN_PASS || 'admin123';
        
        if (import.meta.env.DEV && username === adminUser && password === adminPass) {
          console.log('Usando autenticación local para el administrador en desarrollo');

          // Token JWT falso para desarrollo
          const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi11c2VyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjg0ODQ1MzI4LCJleHAiOjE2ODU0NTAxMjh9.NBtLrLXHXDzCBnOZ7SfHba21Z8YEfiQHUEULXjRnj1k';

          // Establecer datos de administrador en localStorage
          localStorage.setItem('auth_token', mockToken);
          localStorage.setItem('user_role', 'admin');
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('auth_user', JSON.stringify({
            name: 'Administrador',
            role: 'admin',
            email: 'admin@example.com'
          }));

          // Limpiar credenciales temporales
          localStorage.removeItem('temp_admin_username');
          localStorage.removeItem('temp_admin_password');

          console.log('Autenticación local exitosa. Datos guardados:', {
            role: 'admin',
            token: mockToken.substring(0, 15) + '...',
            isAuthenticated: true
          });

          setSuccess('Login exitoso. Redirigiendo al panel de administración...');

          // Esperar un momento y redirigir
          setTimeout(() => {
            navigate('/admin');
          }, 1500);

          return;
        } else {
          setError(apiError.response?.data?.error || 'Credenciales incorrectas');
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setError('Ha ocurrido un error al iniciar sesión. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLoginContainer>
      <AdminLoginCard>
        <Title>Acceso Administrativo</Title>

        {verificationSent ? (
          <>
            <SuccessMessage>{success}</SuccessMessage>
            <InfoText>
              Se ha enviado un enlace de verificación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para completar el inicio de sesión.
            </InfoText>
            <InfoText style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              ⚠️ El enlace expirará en 10 minutos por razones de seguridad.
            </InfoText>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <SubmitButton onClick={() => setVerificationSent(false)}>
                Volver
              </SubmitButton>
            </div>
          </>
        ) : tokenExpired ? (
          <>
            <ErrorMessage>{error}</ErrorMessage>
            <InfoText>
              Puedes solicitar un nuevo enlace de verificación usando tus credenciales.
            </InfoText>
            <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <SubmitButton onClick={requestNewToken} disabled={loading}>
                {loading ? 'Enviando...' : 'Solicitar Nuevo Enlace'}
              </SubmitButton>
              <SubmitButton
                onClick={() => {
                  setTokenExpired(false);
                  setError('');
                }}
                style={{ background: 'rgba(100, 100, 100, 0.5)' }}
              >
                Volver al Login
              </SubmitButton>
            </div>
          </>
        ) : (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Usuario</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                disabled={loading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                disabled={loading}
              />
            </FormGroup>

            {error && !tokenExpired && <ErrorMessage>{error}</ErrorMessage>}
            {success && !verificationSent && <SuccessMessage>{success}</SuccessMessage>}

            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Iniciar sesión'}
            </SubmitButton>
          </Form>
        )}

        <InfoText>
          Solo para administradores autorizados. Este acceso está restringido.
        </InfoText>
      </AdminLoginCard>
    </AdminLoginContainer>
  );
};

export default AdminLogin; 
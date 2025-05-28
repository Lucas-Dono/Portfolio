import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GlobalBackground from '../components/ui/GlobalBackground';
import GoogleLoginButton from '../components/GoogleLoginButton';
import GithubLoginButton from '../components/GithubLoginButton';
import { useAuth } from '../context/AuthContext';

// Estilos - Similares a los de Register pero sin las pestañas
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1.5rem;
  z-index: 2;
`;

const Card = styled(motion.div)`
  background-color: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Form = styled.form`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.8rem 1rem;
  color: white;
  font-size: 1rem;
  
  &:focus {
    border-color: #00FFFF;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Button = styled(motion.button)`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
`;

const ErrorMessage = styled.p`
  color: #ff4d4d;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
`;

const SuccessMessage = styled.p`
  color: #4dff4d;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
`;

const Divider = styled.div`
  position: relative;
  margin: 1.5rem 0;
  text-align: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    z-index: 1;
  }
  
  span {
    position: relative;
    background: #0a0a0a;
    padding: 0 1rem;
    z-index: 2;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
  }
`;

const SocialLoginButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: inline-block;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: white;
    
    &::after {
      display: none;
    }
  }
`;

const RegisterLink = styled(Link)`
  display: inline-block;
  color: #00FFFF;
  text-decoration: none;
  font-size: 0.95rem;
  margin-top: 1rem;
  text-align: center;
  
  &:hover {
    text-decoration: underline;
    color: #FF00FF;
  }
`;

// Estilo para el mensaje de términos
const TermsMessage = styled.div`
  margin-bottom: 1rem;
  padding: 12px;
  background: rgba(255, 255, 100, 0.1);
  border: 1px solid rgba(255, 255, 100, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 150, 0.9);
  font-size: 0.9rem;
  
  a {
    color: #00FFFF;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showTermsMessage, setShowTermsMessage] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || '/dashboard';
  const serviceId = queryParams.get('service');

  const { login } = useAuth();

  // Verificar si hay una redirección de pago pendiente
  useEffect(() => {
    const pendingPaymentRedirect = localStorage.getItem('payment_redirect_url');
    const authRedirectUrl = localStorage.getItem('auth_redirect_url');

    if (pendingPaymentRedirect) {
      console.log('💰 Hay una redirección de pago pendiente:', pendingPaymentRedirect);
    }

    if (authRedirectUrl) {
      console.log('🔐 Hay una redirección de autenticación pendiente:', authRedirectUrl);
    }
  }, []);

  useEffect(() => {
    // Verificar si el usuario fue redirigido por necesidad de aceptar términos
    const requiresTerms = localStorage.getItem('requires_terms_acceptance');
    if (requiresTerms === 'true') {
      setShowTermsMessage(true);
      localStorage.removeItem('requires_terms_acceptance');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);

      if (!response.success || !response.user) {
        throw new Error('No se pudo autenticar al usuario');
      }

      console.log('✅ Login exitoso con usuario:', response.user.email);

      // Verificar que el token se haya guardado correctamente
      const savedToken = localStorage.getItem('auth_token');
      if (!savedToken) {
        console.warn('⚠️ Token no encontrado en localStorage después del login.');
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        } else {
          console.error('❌ No se recibió token del servidor. Error de autenticación.');
          throw new Error('No se recibió token de autenticación');
        }
      }

      // Asegurar que isAuthenticated esté establecido
      localStorage.setItem('isAuthenticated', 'true');

      // También verificar que los datos del usuario estén guardados
      const savedUser = localStorage.getItem('auth_user');
      if (!savedUser && response.user) {
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

      setSuccess('Inicio de sesión exitoso! Redirigiendo...');

      // Obtener todas las posibles URLs de redirección en orden de prioridad
      const pendingPaymentRedirect = localStorage.getItem('payment_redirect_url');
      const authRedirectUrl = localStorage.getItem('auth_redirect_url');
      const savedRedirectUrl = localStorage.getItem('google_auth_redirect');

      // Determinar la URL de redirección final con prioridad
      let redirectTarget = pendingPaymentRedirect || authRedirectUrl || savedRedirectUrl || redirectUrl;

      // Si hay un serviceId en la URL y no hay una redirección específica
      if (serviceId && !pendingPaymentRedirect && !authRedirectUrl && redirectUrl === '/dashboard') {
        redirectTarget = `/payment?service=${serviceId}`;
        console.log('✅ Redirigiendo a página de pago del servicio:', serviceId);
      }

      // Verificar si es una redirección circular a login
      if (redirectTarget.includes('/login')) {
        console.warn('⚠️ Redirección circular detectada, cambiando a /dashboard');
        redirectTarget = '/dashboard';
      }

      // Limpiar redirecciones guardadas
      if (pendingPaymentRedirect) {
        localStorage.removeItem('payment_redirect_url');
      }
      if (authRedirectUrl) {
        localStorage.removeItem('auth_redirect_url');
      }
      if (savedRedirectUrl) {
        localStorage.removeItem('google_auth_redirect');
      }

      console.log('✅ Redirigiendo después del login a:', redirectTarget);

      // Esperar un momento para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        navigate(redirectTarget);
      }, 1000);

    } catch (error) {
      console.error('❌ Error en login:', error);
      setError(error instanceof Error ? error.message : 'Error de autenticación');

      // Modo demo desactivado para poder depurar errores reales
      console.log('❌ Error de autenticación sin modo demo');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setSuccess('Inicio de sesión exitoso! Redirigiendo...');

    // Obtener todas las posibles URLs de redirección en orden de prioridad
    const pendingPaymentRedirect = localStorage.getItem('payment_redirect_url');
    const authRedirectUrl = localStorage.getItem('auth_redirect_url');
    const savedRedirectUrl = localStorage.getItem('google_auth_redirect');

    // Determinar la URL de redirección final con prioridad:
    // 1. URL de pago pendiente
    // 2. URL de redirección de autenticación
    // 3. URL guardada de Google auth
    // 4. redirectUrl de parámetros de consulta
    let finalRedirectUrl = pendingPaymentRedirect || authRedirectUrl || savedRedirectUrl || redirectUrl;

    // Si hay un serviceId en la URL y no hay otra redirección específica
    if (serviceId && finalRedirectUrl === '/dashboard') {
      finalRedirectUrl = `/payment?service=${serviceId}`;
    }

    // Limpiar redirecciones guardadas
    if (pendingPaymentRedirect) {
      localStorage.removeItem('payment_redirect_url');
    }
    if (authRedirectUrl) {
      localStorage.removeItem('auth_redirect_url');
    }
    if (savedRedirectUrl) {
      localStorage.removeItem('google_auth_redirect');
    }

    console.log('✅ Redirigiendo después del login a:', finalRedirectUrl);

    // Redireccionar al usuario
    setTimeout(() => {
      navigate(finalRedirectUrl);
    }, 1000);
  };

  const handleLoginError = (errorMsg: string) => {
    setError(errorMsg || 'Error al iniciar sesión. Por favor intenta nuevamente.');
  };

  return (
    <PageContainer>
      <GlobalBackground />

      <ContentContainer>
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Header>
            <BackButton to="/">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Volver a inicio
            </BackButton>
            <Title>Iniciar Sesión</Title>
          </Header>

          <Form onSubmit={handleSubmit}>
            {showTermsMessage && (
              <TermsMessage>
                Se requiere aceptar los nuevos términos y condiciones. Por favor, inicia sesión nuevamente para aceptarlos.
              </TermsMessage>
            )}

            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </FormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <Button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.03 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </Button>

            <Divider>
              <span>O continúa con</span>
            </Divider>

            <SocialLoginButtons>
              <GoogleLoginButton
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                disabled={loading}
                redirectUrl={redirectUrl}
              />

              <GithubLoginButton
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                disabled={loading}
                redirectUrl={redirectUrl}
              />
            </SocialLoginButtons>

            <RegisterLink to="/register">
              ¿No tienes cuenta? Regístrate aquí
            </RegisterLink>
          </Form>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default Login; 
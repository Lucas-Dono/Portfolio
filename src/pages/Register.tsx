import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GlobalBackground from '../components/ui/GlobalBackground';
import GoogleLoginButton from '../components/GoogleLoginButton';
import GithubLoginButton from '../components/GithubLoginButton';
import { useAuth } from '../context/AuthContext';

// Tipos e interfaces
interface RegisterProps {
  // Eliminar onSuccess ya que no se utiliza
  // onSuccess?: (userData: any) => void;
}

// Estilos
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

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: ${props => props.$isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 1rem;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    transform: scaleX(${props => props.$isActive ? 1 : 0});
    transition: transform 0.3s ease;
  }
  
  &:hover {
    color: white;
    &::after {
      transform: scaleX(1);
    }
  }
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

const ServiceInfo = styled.div`
  margin-top: 0;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ServiceTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: white;
`;

const ServicePrice = styled.p`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #FF00FF;
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

// Crear el estilo para el contenedor del checkbox
const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0.5rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  
  a {
    color: #00FFFF;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Register: React.FC<RegisterProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId: pathServiceId } = useParams<{ serviceId?: string }>();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [serviceInfo, setServiceInfo] = useState<any>(null);

  const { login, register: registerUser } = useAuth();

  // Obtener el serviceId de los query params si existe
  const queryParams = new URLSearchParams(location.search);
  const queryServiceId = queryParams.get('service');
  const redirectUrl = queryParams.get('redirect');

  // Usar serviceId del path o de query params
  const serviceId = pathServiceId || queryServiceId;

  // Obtener información del servicio
  useEffect(() => {
    if (!serviceId) return;

    // Simulación de obtención de datos del servicio
    const getServiceData = () => {
      switch (serviceId) {
        case 'landing':
          return {
            id: 'landing',
            title: 'Landing Page',
            price: 0,
            priceDisplay: 'Gratuito'
          };
        case 'web5':
          return {
            id: 'web5',
            title: 'Página Web 5 Rutas',
            price: 30000,
            priceDisplay: '$30.000'
          };
        case 'web7':
          return {
            id: 'web7',
            title: 'Página Web 7+ Rutas',
            price: 50000,
            priceDisplay: '$50.000'
          };
        default:
          return null;
      }
    };

    setServiceInfo(getServiceData());
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register' && !name) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    if (mode === 'register' && !termsAccepted) {
      setError('Debes aceptar los términos y condiciones para crear una cuenta');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await registerUser(name, email, password, termsAccepted);
      }

      setSuccess(mode === 'login'
        ? 'Inicio de sesión exitoso! Redirigiendo...'
        : 'Registro exitoso! Redirigiendo...'
      );

      // Simular redirección después de un éxito
      setTimeout(() => {
        // Si hay un redirectUrl en los parámetros, usarlo como primera opción
        if (redirectUrl) {
          navigate(redirectUrl);
          return;
        }

        // Si no hay redirectUrl pero hay serviceInfo, usar lógica basada en el servicio
        if (serviceInfo && serviceInfo.price > 0) {
          // Redireccionar a la página de pago usando navigate en lugar de recargar la página
          navigate(`/payment?service=${serviceId}`);
        } else {
          // Para servicios gratuitos, ir al dashboard usando navigate
          navigate('/dashboard');
        }
      }, 1500);

    } catch (err) {
      setError('Ocurrió un error. Por favor intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setSuccess(mode === 'login'
      ? 'Inicio de sesión exitoso! Redirigiendo...'
      : 'Registro exitoso con proveedor externo! Redirigiendo...'
    );

    setTimeout(() => {
      // Si hay un redirectUrl en los parámetros, usarlo como primera opción
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }

      // Si no hay redirectUrl pero hay serviceInfo, usar lógica basada en el servicio
      if (serviceInfo && serviceInfo.price > 0) {
        navigate(`/payment?service=${serviceId}`);
      } else {
        navigate('/dashboard');
      }
    }, 1500);
  };

  const handleLoginError = (errorMsg: string) => {
    setError(errorMsg || 'Error en la autenticación. Por favor intenta nuevamente.');
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
            <BackButton to="/#servicios">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Volver a servicios
            </BackButton>
            <Title>
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Title>
          </Header>

          <TabsContainer>
            <Tab
              $isActive={mode === 'login'}
              onClick={() => setMode('login')}
            >
              Iniciar Sesión
            </Tab>
            <Tab
              $isActive={mode === 'register'}
              onClick={() => setMode('register')}
            >
              Registrarse
            </Tab>
          </TabsContainer>

          <Form onSubmit={handleSubmit}>
            {serviceInfo && (
              <ServiceInfo>
                <ServiceTitle>Servicio: {serviceInfo.title}</ServiceTitle>
                <ServicePrice>{serviceInfo.priceDisplay}</ServicePrice>
              </ServiceInfo>
            )}

            {mode === 'register' && (
              <FormGroup>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </FormGroup>
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

            {mode === 'register' && (
              <CheckboxContainer>
                <Checkbox
                  id="termsAccepted"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                />
                <CheckboxLabel htmlFor="termsAccepted">
                  Acepto los <Link to="/terms" target="_blank">términos y condiciones</Link> del servicio
                </CheckboxLabel>
              </CheckboxContainer>
            )}

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <Button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.03 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading
                ? 'Procesando...'
                : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
              }
            </Button>

            <Divider>
              <span>O continúa con</span>
            </Divider>

            <SocialLoginButtons>
              <GoogleLoginButton
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                disabled={loading}
              />

              <GithubLoginButton
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                disabled={loading}
              />
            </SocialLoginButtons>
          </Form>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default Register; 
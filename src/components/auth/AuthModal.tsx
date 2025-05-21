import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleLoginButton from '../GoogleLoginButton';
import GithubLoginButton from '../GithubLoginButton';

// Interfaces y tipos
export type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: any) => void;
  initialMode?: AuthMode;
  serviceId?: string;
  servicePrice?: number;
}

interface TabProps {
  isActive: boolean;
}

// Estilos
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background-color: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: #0a0a0a;
  z-index: 10;
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  color: #aaa;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: ${props => props.isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 1rem;
  font-weight: ${props => props.isActive ? '600' : '400'};
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
    transform: scaleX(${props => props.isActive ? 1 : 0});
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
  margin-top: 1rem;
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

// Componente principal
const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
  serviceId,
  servicePrice
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Obtener información del servicio
  const getServiceInfo = () => {
    if (!serviceId) return null;
    
    // Aquí deberíamos obtener los datos del servicio desde la API 
    // o los datos pasados como prop
    return {
      id: serviceId,
      title: serviceId === 'landing' 
        ? 'Landing Page' 
        : serviceId === 'web5' 
          ? 'Página Web 5 Rutas' 
          : 'Página Web 7+ Rutas',
      price: servicePrice || 0
    };
  };
  
  const serviceInfo = getServiceInfo();
  
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
    
    setLoading(true);
    
    try {
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí iría la llamada real al backend para registrar/autenticar al usuario
      const userData = {
        id: '123',
        name: name || 'Usuario',
        email,
        serviceId,
      };
      
      setSuccess(mode === 'register' 
        ? 'Registro exitoso! Redirigiendo...' 
        : 'Inicio de sesión exitoso! Redirigiendo...'
      );
      
      // Simular redirección después de un éxito
      setTimeout(() => {
        onSuccess(userData);
      }, 1500);
      
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  
  const contentVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
  };
  
  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <ModalContent
            variants={contentVariants}
            onClick={e => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </ModalTitle>
              <CloseButton onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>
            
            <TabsContainer>
              <Tab 
                isActive={mode === 'login'} 
                onClick={() => setMode('login')}
              >
                Iniciar Sesión
              </Tab>
              <Tab 
                isActive={mode === 'register'} 
                onClick={() => setMode('register')}
              >
                Registrarse
              </Tab>
            </TabsContainer>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Form onSubmit={handleSubmit}>
                  {serviceInfo && (
                    <ServiceInfo>
                      <ServiceTitle>Servicio: {serviceInfo.title}</ServiceTitle>
                      {serviceInfo.price > 0 && (
                        <ServicePrice>${serviceInfo.price.toLocaleString()}</ServicePrice>
                      )}
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
                      onSuccess={() => {
                        setSuccess('Inicio de sesión exitoso! Redirigiendo...');
                        setTimeout(() => onSuccess({ 
                          id: 'google-123', 
                          name: 'Usuario de Google', 
                          email: 'usuario@gmail.com',
                          provider: 'google'
                        }), 1500);
                      }}
                      onError={error => setError(error)}
                      disabled={loading}
                    />
                    
                    <GithubLoginButton
                      onSuccess={() => {
                        setSuccess('Inicio de sesión exitoso! Redirigiendo...');
                        setTimeout(() => onSuccess({ 
                          id: 'github-123', 
                          name: 'Usuario de GitHub', 
                          email: 'usuario@github.com',
                          provider: 'github'
                        }), 1500);
                      }}
                      onError={error => setError(error)}
                      disabled={loading}
                    />
                  </SocialLoginButtons>
                </Form>
              </motion.div>
            </AnimatePresence>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default AuthModal; 
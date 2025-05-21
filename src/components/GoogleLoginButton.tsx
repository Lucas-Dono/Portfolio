import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  redirectUrl?: string;
}

// Modal para términos y condiciones
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ModalBody = styled.div`
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  
  p {
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 12px;
    line-height: 1.5;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ModalButton = styled(motion.button) <{ primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: ${props => props.primary ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.primary ? 'linear-gradient(135deg, #FF33FF 0%, #33FFFF 100%)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const SocialButton = styled(motion.button)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transition: all 0.3s ease;
   width: 50%;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" />
    <path d="M3.15283 7.3455L6.43833 9.755C7.32733 7.554 9.48033 6 11.9998 6C13.5293 6 14.9208 6.577 15.9803 7.5195L18.8088 4.691C17.0228 3.0265 14.6338 2 11.9998 2C8.15883 2 4.82783 4.1685 3.15283 7.3455Z" fill="#FF3D00" />
    <path d="M12.0002 22C14.5832 22 16.9302 21.0115 18.7047 19.404L15.6097 16.785C14.5719 17.5742 13.3039 18.001 12.0002 18C9.39916 18 7.19066 16.3415 6.35866 14.027L3.09766 16.5395C4.75266 19.778 8.11366 22 12.0002 22Z" fill="#4CAF50" />
    <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2" />
  </svg>
);

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  redirectUrl
}) => {
  const { loginWithGoogle, loginWithGoogleProvider } = useAuth();
  const navigate = useNavigate();

  // Estados para el modal de términos
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingTokenResponse, setPendingTokenResponse] = useState<any>(null);

  const handleGoogleLogin = async () => {
    try {
      // Guardar la URL de redirección antes de iniciar el proceso de autenticación
      if (redirectUrl) {
        localStorage.setItem('google_auth_redirect', redirectUrl);
        console.log('🔄 Guardando URL de redirección para Google Auth:', redirectUrl);
      } else {
        // Si no hay redirectUrl específico, capturar cualquier parámetro service de la URL actual
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const serviceParam = url.searchParams.get('service');

        if (serviceParam) {
          const serviceRedirectUrl = `/payment?service=${serviceParam}`;
          localStorage.setItem('google_auth_redirect', serviceRedirectUrl);
          console.log('🔄 Guardando URL de redirección de servicio:', serviceRedirectUrl);
        }
      }

      // En lugar de autenticar inmediatamente, primero mostrar el modal de términos
      setShowTermsModal(true);

      // Intentamos obtener el token para usarlo después
      console.log('🔄 Preparando autenticación con Google (mostrando términos primero)...');
      try {
        // Abrir ventana de autenticación de Google directamente
        const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/google/login?callback=${encodeURIComponent(window.location.origin + '/html/auth-callback.html')}`;
        console.log('🔗 Abriendo URL de autenticación:', googleAuthUrl);

        const authWindow = window.open(googleAuthUrl, 'GoogleAuth', 'width=600,height=700');

        // Escuchar mensajes de la ventana emergente
        const handleMessage = (event: MessageEvent) => {
          console.log('📨 Mensaje recibido en ventana principal:', event.origin, event.data);

          // Procesar la respuesta de autenticación
          if (event.data && typeof event.data === 'object' && event.data.tokenResponse) {
            // Cerrar la ventana emergente si aún está abierta
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }

            // Guardar el token para usarlo después de que el usuario acepte los términos
            setPendingTokenResponse(event.data.tokenResponse);

            // Asegurarnos de que se muestre el modal de términos
            setShowTermsModal(true);

            // Eliminar el event listener
            window.removeEventListener('message', handleMessage);
          }
        };

        // Agregar listener para mensajes
        window.addEventListener('message', handleMessage);
      } catch (tokenError) {
        console.error('Error al obtener token de Google:', tokenError);
        // Aún así mostramos el modal de términos
      }

      return; // Detenemos aquí para que el usuario deba aceptar los términos primero
    } catch (error: any) {
      console.error('❌ Error en login con Google:', error);

      // Manejar múltiples tipos de errores comunes
      let errorMessage = 'Error al iniciar sesión con Google';

      // Detectar errores específicos
      if (error.message && error.message.includes('NetworkError')) {
        errorMessage = 'Error de conexión con el servidor de autenticación. Verificar si el backend está en ejecución y el puerto es correcto.';
        console.error('🔴 Error CORS detectado:', errorMessage);
      } else if (error.message && error.message.includes('cerrada antes')) {
        errorMessage = 'La ventana de autenticación se cerró antes de completar el proceso.';
      } else if (error.message && error.message.includes('agotado')) {
        errorMessage = 'El tiempo de espera para la autenticación se ha agotado. Intente nuevamente.';
      }

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Manejar la aceptación de términos
  const handleAcceptTerms = async () => {
    try {
      setShowTermsModal(false);

      if (pendingTokenResponse) {
        // Si tenemos un token pendiente, usar ese
        console.log('🔄 Completando autenticación con Google después de aceptar términos...');
        const response = await loginWithGoogleProvider(pendingTokenResponse, true);

        if (response.success) {
          console.log('✅ Login con Google exitoso después de aceptar términos:', response.user?.email || 'email desconocido');

          if (onSuccess) {
            onSuccess();
          } else {
            // Obtener la URL de redirección guardada o usar dashboard como fallback
            const savedRedirectUrl = localStorage.getItem('google_auth_redirect') || '/dashboard';
            localStorage.removeItem('google_auth_redirect'); // Limpiar después de usar

            console.log('🔄 Redirigiendo a:', savedRedirectUrl);
            navigate(savedRedirectUrl);
          }
        }
      } else {
        // Si no tenemos token pendiente, iniciar autenticación normal
        console.log('🔄 Iniciando autenticación con Google con términos aceptados...');
        const result = await loginWithGoogle();

        if (result.success) {
          console.log('✅ Login con Google exitoso:', result.user?.email || 'email desconocido');

          if (onSuccess) {
            onSuccess();
          } else {
            // Obtener la URL de redirección guardada o usar dashboard como fallback
            const savedRedirectUrl = localStorage.getItem('google_auth_redirect') || '/dashboard';
            localStorage.removeItem('google_auth_redirect'); // Limpiar después de usar

            console.log('🔄 Redirigiendo a:', savedRedirectUrl);
            setTimeout(() => {
              navigate(savedRedirectUrl);
            }, 1000);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error al completar login con Google después de aceptar términos:', error);

      if (onError) {
        onError('Error al iniciar sesión con Google después de aceptar términos');
      }
    }
  };

  // Manejar el rechazo de términos
  const handleRejectTerms = () => {
    setShowTermsModal(false);
    setPendingTokenResponse(null);

    if (onError) {
      onError('Debe aceptar los términos y condiciones para continuar');
    }
  };

  return (
    <>
      <SocialButton
        onClick={handleGoogleLogin}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <GoogleIcon />
        Google
      </SocialButton>

      {showTermsModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Términos y Condiciones</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <p>Para continuar con el registro, debes aceptar nuestros términos y condiciones.</p>

              <p>Al utilizar nuestros servicios, aceptas cumplir con nuestros términos y políticas de privacidad. Te recomendamos leer detenidamente estos documentos antes de continuar.</p>

              <p>Los términos incluyen información sobre tus derechos y responsabilidades, así como detalles sobre cómo procesamos tus datos personales.</p>

              <p>Para leer los términos completos, <a href="/terms" target="_blank" style={{ color: '#00FFFF' }}>haz clic aquí</a>.</p>
            </ModalBody>
            <ModalFooter>
              <ModalButton onClick={handleRejectTerms}>
                Rechazar
              </ModalButton>
              <ModalButton primary onClick={handleAcceptTerms}>
                Aceptar
              </ModalButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default GoogleLoginButton; 
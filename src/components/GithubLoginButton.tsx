import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { oauthConfig } from '../config/oauth';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Estilos del botón, similares a los de los archivos Register/Login
const GithubButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 50%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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

// Estilo para mensaje de error
const ErrorMessage = styled.div`
  color: #ff5555;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  text-align: center;
`;

interface GithubLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  redirectUrl?: string;
}

const GithubLoginButton: React.FC<GithubLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  redirectUrl
}) => {
  const location = useLocation();
  const { loginWithGithubProvider } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para el modal de términos
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // Si no se proporciona redirectUrl, intentar obtenerla de la URL actual
  const queryParams = new URLSearchParams(location.search);
  const redirect = redirectUrl || queryParams.get('redirect') || '/dashboard';

  // Verificar si hay un código de autorización en la URL (callback de GitHub)
  const checkForGithubCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      return code;
    }
    return null;
  };

  // Procesar código de GitHub si existe
  React.useEffect(() => {
    const code = checkForGithubCode();
    if (code) {
      handleGithubCallback(code);
    }
  }, []);

  // Manejar la respuesta de GitHub
  const handleGithubCallback = async (code: string) => {
    try {
      setErrorMsg('');
      const response = await loginWithGithubProvider(code);

      if (response.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Obtener todas las posibles URLs de redirección en orden de prioridad
          const authRedirectUrl = localStorage.getItem('auth_redirect_url');
          const githubRedirectUrl = localStorage.getItem('github_auth_redirect');

          // Determinar la URL de redirección final con prioridad
          const finalRedirectUrl = authRedirectUrl || githubRedirectUrl || '/dashboard';

          // Limpiar redirecciones guardadas
          if (authRedirectUrl) {
            localStorage.removeItem('auth_redirect_url');
          }
          if (githubRedirectUrl) {
            localStorage.removeItem('github_auth_redirect');
          }

          console.log('✅ Redirigiendo después del login con GitHub a:', finalRedirectUrl);
          window.location.href = finalRedirectUrl;
        }
      }
    } catch (error: any) {
      console.error('❌ Error procesando respuesta de GitHub:', error);

      // Verificar si se requiere aceptación de términos
      if (error.message === 'terms_acceptance_required') {
        console.log('⚠️ Se requiere aceptación de términos');
        setPendingCode(code);
        setShowTermsModal(true);
        return;
      }

      setErrorMsg(error instanceof Error ? error.message : 'Error desconocido');
      if (onError) {
        onError(error instanceof Error ? error.message : 'Error procesando respuesta de GitHub');
      }
    }
  };

  const handleLogin = async () => {
    try {
      setErrorMsg('');

      // Verificar que el client ID esté configurado
      if (!oauthConfig.github.clientId || oauthConfig.github.clientId === "SIMULADO_CLIENTE_ID_GITHUB") {
        throw new Error("Client ID de GitHub no configurado correctamente");
      }

      // Verificar las posibles URLs de redirección en orden de prioridad
      const authRedirectUrl = localStorage.getItem('auth_redirect_url');
      const pendingPaymentUrl = localStorage.getItem('payment_redirect_url');

      // Determinar la URL de redirección a guardar con prioridad
      // 1. URL de autenticación (auth_redirect_url)
      // 2. URL de pago pendiente (payment_redirect_url)
      // 3. URL proporcionada en redirectUrl (o redirección por defecto)
      const redirectUrlToStore = authRedirectUrl || pendingPaymentUrl || redirect;

      // Guardar la URL de redirección para GitHub
      localStorage.setItem('github_auth_redirect', redirectUrlToStore);
      console.log('🔐 Guardando URL de redirección para GitHub Auth:', redirectUrlToStore);

      // Obtener la URL base para la redirección
      const baseUrl = window.location.origin;
      // Si estamos en desarrollo usando el puerto 3001, reemplazarlo por 5001 para el backend
      const apiUrl = baseUrl.includes('3001')
        ? baseUrl.replace('3001', '5001')
        : baseUrl;

      // Configuración para la autenticación con GitHub
      const redirectUri = `${apiUrl}/api/auth/github`;
      const scope = 'user:email';

      console.log('🔐 Iniciando autenticación con GitHub');
      console.log('- URL de redirección:', redirectUri);
      console.log('- Client ID:', oauthConfig.github.clientId);

      // Redirigir a GitHub para autenticación
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${oauthConfig.github.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
      console.log('- URL de autorización:', authUrl);

      // Opcional: Obtener información de depuración
      try {
        const debugResponse = await fetch(`${apiUrl}/api/auth/github-debug`);
        const debugInfo = await debugResponse.json();
        console.log('ℹ️ Información de debug:', debugInfo);
      } catch (debugErr) {
        console.warn('No se pudo obtener información de debug:', debugErr);
      }

      // Redirigir a GitHub
      window.location.href = authUrl;

    } catch (error) {
      console.error('Error en login con GitHub:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Error desconocido');
      if (onError) onError(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  // Manejar la aceptación de términos
  const handleAcceptTerms = async () => {
    if (!pendingCode) return;

    try {
      // Reenviar la solicitud con termsAccepted=true
      const response = await loginWithGithubProvider(pendingCode, true);

      if (response.success) {
        // Limpiar el estado del modal
        setShowTermsModal(false);
        setPendingCode(null);

        if (onSuccess) {
          onSuccess();
        } else {
          // Obtener todas las posibles URLs de redirección en orden de prioridad
          const authRedirectUrl = localStorage.getItem('auth_redirect_url');
          const githubRedirectUrl = localStorage.getItem('github_auth_redirect');

          // Determinar la URL de redirección final con prioridad
          const finalRedirectUrl = authRedirectUrl || githubRedirectUrl || '/dashboard';

          // Limpiar redirecciones guardadas
          if (authRedirectUrl) {
            localStorage.removeItem('auth_redirect_url');
          }
          if (githubRedirectUrl) {
            localStorage.removeItem('github_auth_redirect');
          }

          console.log('✅ Redirigiendo después de aceptar términos a:', finalRedirectUrl);
          window.location.href = finalRedirectUrl;
        }
      }
    } catch (error: any) {
      console.error('❌ Error al reintentar login con GitHub después de aceptar términos:', error);
      setShowTermsModal(false);

      if (onError) {
        onError('Error al iniciar sesión con GitHub después de aceptar términos');
      }
    }
  };

  // Manejar el rechazo de términos
  const handleRejectTerms = () => {
    setShowTermsModal(false);
    setPendingCode(null);

    if (onError) {
      onError('Debe aceptar los términos y condiciones para continuar');
    }
  };

  return (
    <>
      <GithubButton
        type="button"
        onClick={handleLogin}
        whileHover={!disabled ? { y: -2 } : {}}
        whileTap={!disabled ? { y: 0 } : {}}
        disabled={disabled}
      >
        <img src="/images/github.svg" alt="GitHub" width="24" height="24" />
        GitHub
      </GithubButton>
      {errorMsg && <ErrorMessage>{errorMsg}</ErrorMessage>}

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

export default GithubLoginButton; 
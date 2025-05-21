import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';
import GlobalBackground from '../components/ui/GlobalBackground';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: white;
`;

const Message = styled.p`
  font-size: 1.2rem;
  margin-bottom: 1rem;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid #00ffff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const GithubCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithGithubProvider } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Obtener la URL de redirección guardada en localStorage (prioridad a payment_redirect_url)
        const paymentRedirectUrl = localStorage.getItem('payment_redirect_url');
        const githubAuthRedirect = localStorage.getItem('github_auth_redirect');
        
        // Usar la URL de pago pendiente si existe, de lo contrario usar github_auth_redirect
        const redirectUrl = paymentRedirectUrl || githubAuthRedirect || '/dashboard';
        
        console.log('📦 Estado de redirecciones:');
        console.log('- URL de pago pendiente:', paymentRedirectUrl || 'No disponible');
        console.log('- URL guardada de GitHub:', githubAuthRedirect || 'No disponible');
        console.log('- URL final de redirección:', redirectUrl);
        
        const query = new URLSearchParams(location.search);
        const code = query.get('code');
        const errorParam = query.get('error');
        
        if (errorParam) {
          setError(`Error de autenticación: ${errorParam}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!code) {
          setError('No se recibió código de autorización');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Intentar iniciar sesión con GitHub
        const authResponse = await loginWithGithubProvider(code);
        
        if (!authResponse.success || !authResponse.user) {
          throw new Error('Autenticación fallida');
        }
        
        console.log('✅ Autenticación con GitHub completada:', authResponse.user.email);
        
        // Limpiar localStorage después de autenticar
        // NO remover payment_redirect_url aquí, lo gestionaremos en App.tsx
        localStorage.removeItem('github_auth_redirect');
        
        // Para asegurar que el token se haya guardado correctamente antes de redirigir
        setTimeout(() => {
          // Forzar una recarga completa para asegurar que el estado de autenticación se actualice
          window.location.href = redirectUrl;
        }, 500);
        
      } catch (err) {
        console.error('Error procesando callback de GitHub:', err);
        setError('Error al procesar la autenticación. Por favor, intenta nuevamente.');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [location, loginWithGithubProvider, navigate]);
  
  return (
    <>
      <GlobalBackground />
      <CallbackContainer>
        {error ? (
          <Message>{error}</Message>
        ) : (
          <>
            <Message>Autenticando con GitHub...</Message>
            <Spinner />
          </>
        )}
      </CallbackContainer>
    </>
  );
};

export default GithubCallback; 
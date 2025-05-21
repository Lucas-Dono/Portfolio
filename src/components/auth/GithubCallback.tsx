import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styled from 'styled-components';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #0d1117;
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

  useEffect(() => {
    const handleCallback = async () => {
      const query = new URLSearchParams(location.search);
      const code = query.get('code');
      const error = query.get('error');
      
      if (error) {
        setError(`Error de autenticación: ${error}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      if (!code) {
        setError('No se recibió código de autorización');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      
      try {
        await loginWithGithubProvider(code);
        navigate('/dashboard');
      } catch (err) {
        console.error('Error procesando callback de GitHub:', err);
        setError('Error al procesar la autenticación. Por favor, intenta nuevamente.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    handleCallback();
  }, [location, loginWithGithubProvider, navigate]);
  
  return (
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
  );
};

export default GithubCallback; 
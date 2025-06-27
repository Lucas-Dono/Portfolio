import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const DevButton = styled(motion.button)`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
  width: 100%;
  justify-content: center;
  font-size: 14px;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const DevIcon = styled.span`
  font-size: 18px;
`;

const DevBadge = styled.div`
  background: #FF00FF;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
`;

interface DevLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const DevLoginButton: React.FC<DevLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);

  // Solo mostrar en modo desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  const handleDevLogin = async () => {
    if (disabled || loading) return;

    setLoading(true);
    
    try {
      console.log('🔧 Iniciando login como usuario dev...');

      // Llamar al endpoint de login dev
      const response = await fetch('/api/dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        console.log('✅ Login dev exitoso:', data.user.email);

        // Guardar token y datos de autenticación
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // También en sessionStorage
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('isAuthenticated', 'true');

        // Simular callback OAuth para compatibilidad
        window.dispatchEvent(new CustomEvent('devLoginSuccess', {
          detail: {
            success: true,
            user: data.user,
            token: data.token
          }
        }));

        if (onSuccess) {
          onSuccess();
        } else {
          // Recargar la página para que el contexto de autenticación se actualice
          window.location.reload();
        }

      } else {
        throw new Error(data.error || 'Error en login dev');
      }

    } catch (error) {
      console.error('❌ Error en login dev:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al hacer login como dev';
      
      if (onError) {
        onError(errorMessage);
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DevButton
      onClick={handleDevLogin}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DevIcon>🔧</DevIcon>
      {loading ? 'Conectando...' : 'Login Dev'}
      <DevBadge>DEV</DevBadge>
    </DevButton>
  );
};

export default DevLoginButton; 
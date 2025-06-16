import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  SettingsSection,
  SettingsTitle,
  SettingsRow,
  SettingsLabel,
  SettingsValue,
  SaveButton
} from './Settings';

// Componentes específicos para la configuración de seguridad
const SecurityContainer = styled.div`
  margin-bottom: 1rem;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: var(--primary-color, #3b82f6);
  }

  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--button-bg, #4b5563);
  transition: .4s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const StatusBadge = styled.span<{ $enabled: boolean }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 1rem;
  background-color: ${props => props.$enabled ? 'rgba(4, 120, 87, 0.2)' : 'rgba(220, 38, 38, 0.2)'};
  color: ${props => props.$enabled ? '#10b981' : '#ef4444'};
`;

const QRCodeContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--input-bg, #374151);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const QRCode = styled.img`
  width: 200px;
  height: 200px;
  margin: 1rem 0;
`;

const VerificationInput = styled.input`
  background-color: var(--input-bg, #374151);
  border: 1px solid var(--border-color, #4b5563);
  color: var(--text-primary, #e5e7eb);
  padding: 0.65rem 0.8rem;
  border-radius: 4px;
  font-size: 0.95rem;
  width: 100%;
  max-width: 300px;
  margin: 1rem 0;
  text-align: center;
  letter-spacing: 2px;
`;

const Button = styled.button`
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--primary-hover, #2563eb);
  }

  &:disabled {
    background-color: var(--button-bg, #4b5563);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  margin-top: 0.5rem;
  font-size: 0.85rem;
`;

const SuccessMessage = styled.div`
  color: #10b981;
  margin-top: 0.5rem;
  font-size: 0.85rem;
`;

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const SecuritySettings: React.FC = () => {
  // Estado para manejar la configuración de 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const userData = localStorage.getItem('auth_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Si el usuario ya tiene 2FA habilitado, actualizar el estado
        setTwoFactorEnabled(parsedUser.twoFactorEnabled || false);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Función para generar un nuevo código QR para configurar 2FA
  const generateQrCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Aquí generaríamos el código QR desde el servidor
      // En una implementación real, esto haría una llamada a la API
      // const token = localStorage.getItem('auth_token');

      // Simulación de respuesta para el propósito de la solución
      // En un entorno real, aquí se haría la petición al backend
      // const response = await axios.post('/api/auth/2fa/setup', {}, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // Simulación de respuesta
      const mockQrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/Portfolio:user@example.com?secret=ABCDEFGHIJKLMNOP&issuer=Portfolio&algorithm=SHA1&digits=6&period=30';

      setQrCodeUrl(mockQrCodeUrl);
      setSetupMode(true);
    } catch (error) {
      setError('No se pudo generar el código QR. Inténtalo de nuevo más tarde.');
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar el código y activar 2FA
  const verifyAndEnable = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Por favor ingresa un código de verificación válido de 6 dígitos.');
      setLoading(false);
      return;
    }

    try {
      // En una implementación real, aquí verificaríamos el código con el backend
      // const response = await axios.post('/api/auth/2fa/verify', {
      //   code: verificationCode
      // }, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      // });

      // Simulación de éxito (para propósitos de demostración)
      const isValid = verificationCode === '123456'; // Código de prueba

      if (isValid) {
        setTwoFactorEnabled(true);
        setSetupMode(false);
        setSuccess('La autenticación de dos factores ha sido activada correctamente.');

        // Actualizar datos del usuario en localStorage
        if (user) {
          const updatedUser = { ...user, twoFactorEnabled: true };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        setError('El código de verificación no es válido. Inténtalo de nuevo.');
      }
    } catch (error) {
      setError('Error al verificar el código. Inténtalo de nuevo más tarde.');
      console.error('Error verifying 2FA code:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para desactivar 2FA
  const disable2FA = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // En una implementación real, aquí desactivaríamos 2FA con el backend
      // const response = await axios.post('/api/auth/2fa/disable', {}, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      // });

      // Simulación de éxito
      setTwoFactorEnabled(false);
      setSuccess('La autenticación de dos factores ha sido desactivada.');

      // Actualizar datos del usuario en localStorage
      if (user) {
        const updatedUser = { ...user, twoFactorEnabled: false };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      setError('No se pudo desactivar la autenticación de dos factores. Inténtalo de nuevo más tarde.');
      console.error('Error disabling 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection>
      <SettingsTitle>Seguridad de la Cuenta</SettingsTitle>

      <SecurityContainer>
        <SettingsRow>
          <SettingsLabel>Contraseña</SettingsLabel>
          <div>
            <SaveButton onClick={() => alert('Esta funcionalidad no está implementada en esta demostración.')}>
              Cambiar Contraseña
            </SaveButton>
          </div>
        </SettingsRow>
      </SecurityContainer>

      <SecurityContainer>
        <SettingsRow>
          <SettingsLabel>
            Autenticación de Dos Factores
            <StatusBadge $enabled={twoFactorEnabled}>
              {twoFactorEnabled ? 'Activado' : 'Desactivado'}
            </StatusBadge>
          </SettingsLabel>
          <ToggleSwitch>
            <ToggleInput
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={() => {
                if (twoFactorEnabled) {
                  disable2FA();
                } else {
                  generateQrCode();
                }
              }}
              disabled={loading || setupMode}
            />
            <Slider />
          </ToggleSwitch>
        </SettingsRow>

        {setupMode && (
          <QRCodeContainer>
            <SettingsValue>Escanea este código QR con tu aplicación de autenticación</SettingsValue>
            <QRCode src={qrCodeUrl} alt="QR Code para autenticación de dos factores" />
            <SettingsValue>Ingresa el código de verificación de tu aplicación</SettingsValue>
            <VerificationInput
              type="text"
              placeholder="Código de 6 dígitos"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            <Button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verificando...' : 'Verificar y Activar'}
            </Button>
          </QRCodeContainer>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </SecurityContainer>

      <SecurityContainer>
        <SettingsRow>
          <SettingsLabel>Dispositivos Conectados</SettingsLabel>
          <SaveButton onClick={() => alert('Esta funcionalidad no está implementada en esta demostración.')}>
            Gestionar Dispositivos
          </SaveButton>
        </SettingsRow>
      </SecurityContainer>
    </SettingsSection>
  );
};

export default SecuritySettings; 
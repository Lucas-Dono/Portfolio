import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { useAuth } from '../../context/AuthContext';

// Interfaces y tipos
interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  userName: string;
}

interface PaymentResponse {
  status: string;
  id: string;
  detail?: string;
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
  max-width: 600px;
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
  background: linear-gradient(135deg, #009ee3 0%, #32bcad 100%);
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

const CardPaymentContainer = styled.div`
  padding: 1.5rem;
  background: #111;
  border-radius: 12px;
  margin: 1.5rem;
  
  .mp-card-form {
    font-family: 'Inter', sans-serif;
    color: white;
  }
  
  .mp-card-form__input {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border-radius: 8px !important;
  }
  
  .mp-card-form__label {
    color: rgba(255, 255, 255, 0.8) !important;
  }
  
  .mp-card-form__btn {
    background: linear-gradient(135deg, #009ee3 0%, #32bcad 100%) !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
  }
`;

const OrderSummary = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 1.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  
  &:last-child {
    margin-bottom: 0;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const OrderLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const OrderValue = styled.span`
  color: white;
  font-weight: 500;
`;

const OrderTotal = styled.span`
  color: #009ee3;
  font-weight: 600;
  font-size: 1.2rem;
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin: 0 1.5rem 1.5rem;
  background: rgba(0, 158, 227, 0.1);
  border-radius: 8px;
  
  img {
    width: 24px;
    height: 24px;
  }
  
  span {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
  }
`;

const MercadoPagoLogo = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 1.5rem 1.5rem;
  
  img {
    height: 32px;
  }
`;

const StatusContainer = styled.div`
  padding: 2rem;
  text-align: center;
`;

const StatusIcon = styled.div<{ isSuccess: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.isSuccess ? 'rgba(0, 200, 83, 0.2)' : 'rgba(255, 77, 77, 0.2)'};
  color: ${props => props.isSuccess ? '#00C853' : '#FF4D4D'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
`;

const StatusTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: white;
`;

const StatusMessage = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(135deg, #009ee3 0%, #32bcad 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

// Componente principal
const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serviceId,
  serviceTitle,
  servicePrice,
  userName
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth(); // Obtener información del usuario autenticado
  const [userEmail, setUserEmail] = useState<string>('');

  // Depuración del usuario autenticado y obtención del email
  useEffect(() => {
    if (isOpen) {
      // Intentar obtener el email del usuario de varias fuentes
      let email = '';

      // 1. Primero intentar del contexto de autenticación
      if (user && user.email) {
        email = user.email;
        console.log('✅ Email obtenido del contexto de autenticación:', email);
      } else {
        console.log('❌ No hay email disponible en el contexto de autenticación');

        // 2. Intentar obtener del localStorage
        try {
          const storedUserStr = localStorage.getItem('auth_user');
          if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            if (storedUser && storedUser.email) {
              email = storedUser.email;
              console.log('✅ Email obtenido del localStorage:', email);
            } else {
              console.log('❌ No hay email en el usuario almacenado en localStorage');
            }
          } else {
            console.log('❌ No hay usuario en localStorage');
          }
        } catch (e) {
          console.error('Error al obtener email de localStorage:', e);
        }
      }

      // Guardar el email encontrado
      setUserEmail(email);
      console.log('📧 Email final que se usará:', email || 'No disponible');

      // Si no hay email después de todos los intentos, mostrar error
      if (!email) {
        setPaymentStatus({
          status: 'rejected',
          id: '',
          detail: 'Para realizar el pago es necesario iniciar sesión. Por favor, cierra esta ventana e inicia sesión primero.'
        });
      }
    }
  }, [isOpen, user]);

  // Inicializar Mercado Pago SDK
  useEffect(() => {
    if (isOpen) {
      try {
        const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
        console.log('Clave pública de MercadoPago (Modal):', mpPublicKey);

        if (mpPublicKey) {
          // Primero comprobar si ya está inicializado
          if (typeof window.MercadoPago === 'function') {
            console.log('✅ MercadoPago SDK ya estaba disponible en window (Modal)');
          } else {
            console.log('🔄 Inicializando MercadoPago mediante SDK React (Modal)');
            initMercadoPago(mpPublicKey);
          }
        } else {
          console.error('Error: Mercado Pago Public Key no disponible (Modal)');
          setPaymentStatus({
            status: 'rejected',
            id: '',
            detail: 'Error al cargar el sistema de pagos. Inténtalo más tarde o contacta con soporte.'
          });
        }
      } catch (error) {
        console.error('Error al inicializar MercadoPago (Modal):', error);
        setPaymentStatus({
          status: 'rejected',
          id: '',
          detail: 'Error al cargar el sistema de pagos. Inténtalo más tarde o contacta con soporte.'
        });
      }
    }
  }, [isOpen]);

  // Función para manejar el pago
  const handlePaymentSubmit = async (formData: any) => {
    setIsLoading(true);

    try {
      // Envío los datos de pago al backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          serviceId,
          servicePrice,
          userName,
          email: userEmail
        }),
      });

      const result = await response.json();

      setIsLoading(false);
      setPaymentStatus(result);

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setIsLoading(false);
      setPaymentStatus({
        status: 'rejected',
        id: '',
        detail: 'Ha ocurrido un error al procesar el pago. Por favor, intenta nuevamente.'
      });
    }
  };

  // Cerrar y reiniciar
  const handleClose = () => {
    setPaymentStatus(null);
    onClose();
  };

  // Finalizar proceso exitoso
  const handleSuccess = () => {
    setPaymentStatus(null);
    onSuccess();
  };

  // Variantes para animaciones
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

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <ModalContent
            variants={contentVariants}
            onClick={e => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {paymentStatus ? 'Estado del Pago' : 'Realizar Pago'}
              </ModalTitle>
              <CloseButton onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>

            {!paymentStatus ? (
              <>
                <OrderSummary>
                  <OrderItem>
                    <OrderLabel>Servicio:</OrderLabel>
                    <OrderValue>{serviceTitle}</OrderValue>
                  </OrderItem>
                  <OrderItem>
                    <OrderLabel>Cliente:</OrderLabel>
                    <OrderValue>{userName}</OrderValue>
                  </OrderItem>
                  <OrderItem>
                    <OrderLabel>Total:</OrderLabel>
                    <OrderTotal>${servicePrice.toLocaleString()}</OrderTotal>
                  </OrderItem>
                </OrderSummary>

                <CardPaymentContainer>
                  <CardPayment
                    initialization={{
                      amount: servicePrice,
                      payer: {
                        email: userEmail && userEmail.includes('@') ? userEmail : undefined
                      }
                    }}
                    onSubmit={handlePaymentSubmit}
                    onError={(error) => {
                      console.error('Error en CardPayment:', error);
                    }}
                    onReady={() => {
                      console.log('CardPayment listo');
                      console.log('📧 Email de usuario autenticado:', userEmail || 'No hay usuario autenticado');
                      console.log('📧 Email configurado en payer:', userEmail && userEmail.includes('@') ? userEmail : 'No configurado (se mostrará el campo)');
                    }}
                    customization={{
                      visual: {
                        style: {
                          theme: 'dark'
                        }
                      }
                    }}
                  />
                </CardPaymentContainer>

                <SecurityBadge>
                  <img src="/images/shield-check.svg" alt="Seguridad" />
                  <span>Tus datos están protegidos con encriptación de nivel bancario.</span>
                </SecurityBadge>

                <MercadoPagoLogo>
                  <img src="/images/mercadopago-logo.svg" alt="Mercado Pago" />
                </MercadoPagoLogo>
              </>
            ) : (
              <StatusContainer>
                <StatusIcon isSuccess={paymentStatus.status === 'approved'}>
                  {paymentStatus.status === 'approved' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  )}
                </StatusIcon>

                <StatusTitle>
                  {paymentStatus.status === 'approved'
                    ? '¡Pago realizado con éxito!'
                    : 'El pago no pudo ser procesado'}
                </StatusTitle>

                <StatusMessage>
                  {paymentStatus.status === 'approved'
                    ? `Tu pago por $${servicePrice.toLocaleString()} ha sido procesado correctamente.`
                    : paymentStatus.detail || 'Ha ocurrido un error al procesar el pago. Por favor, intenta nuevamente.'}
                </StatusMessage>

                <ActionButton
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={paymentStatus.status === 'approved' ? handleSuccess : handleClose}
                >
                  {paymentStatus.status === 'approved' ? 'Continuar' : 'Volver a intentar'}
                </ActionButton>
              </StatusContainer>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default MercadoPagoModal; 
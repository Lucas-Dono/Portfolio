import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  userName: string;
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
  max-width: 500px;
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

const CardDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const PaymentButton = styled(motion.button)`
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

const OrderSummary = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
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
  color: #FF00FF;
  font-weight: 600;
  font-size: 1.2rem;
`;

const PaymentMethods = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PaymentMethod = styled.button<{ isSelected: boolean }>`
  flex: 1;
  padding: 0.8rem;
  border-radius: 8px;
  background: ${props => props.isSelected ? 'rgba(255, 0, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.isSelected ? '#FF00FF' : 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 0, 255, 0.1);
  }
  
  img {
    height: 30px;
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

const ProgressSteps = styled.div`
  display: flex;
  margin-bottom: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 20px;
    right: 20px;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    z-index: 1;
  }
`;

const Step = styled.div<{ isActive: boolean; isCompleted: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  
  .step-number {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: ${props => 
      props.isCompleted 
        ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)'
        : props.isActive
          ? 'rgba(255, 0, 255, 0.3)'
          : 'rgba(255, 255, 255, 0.05)'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
  
  .step-label {
    font-size: 0.75rem;
    color: ${props => 
      props.isActive || props.isCompleted
        ? 'white'
        : 'rgba(255, 255, 255, 0.4)'};
    text-align: center;
    max-width: 80px;
  }
`;

// Componente principal
const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  serviceId,
  serviceTitle,
  servicePrice,
  userName
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [currentStep, setCurrentStep] = useState(1);
  
  // Formato para el número de tarjeta
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Formato para la fecha de expiración
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCardNumber(formatCardNumber(value));
  };
  
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 5) {
      setCardExpiry(formatExpiry(value.replace(/[^0-9]/g, '')));
    }
  };
  
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 3) {
      setCardCvc(value.replace(/[^0-9]/g, ''));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validación básica
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s+/g, '').length < 16) {
        setError('Por favor ingresa un número de tarjeta válido');
        return;
      }
      
      if (!cardName) {
        setError('Por favor ingresa el nombre que figura en la tarjeta');
        return;
      }
      
      if (!cardExpiry || cardExpiry.length < 5) {
        setError('Por favor ingresa una fecha de expiración válida');
        return;
      }
      
      if (!cardCvc || cardCvc.length < 3) {
        setError('Por favor ingresa un código de seguridad válido');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Simulación de proceso de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Usar serviceId para log o en la lógica de procesamiento
      console.debug(`Procesando pago para el servicio ID: ${serviceId}`);
      
      setSuccess('¡Pago procesado con éxito! Redirigiendo...');
      setCurrentStep(3);
      
      // Simular redirección a la página de éxito
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err) {
      setError('Error al procesar el pago. Por favor intenta nuevamente.');
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
              <ModalTitle>Finalizar Compra</ModalTitle>
              <CloseButton onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>
            
            <Form onSubmit={handleSubmit}>
              <ProgressSteps>
                <Step isActive={currentStep === 1} isCompleted={currentStep > 1}>
                  <div className="step-number">
                    {currentStep > 1 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : 1}
                  </div>
                  <div className="step-label">Detalle de compra</div>
                </Step>
                <Step isActive={currentStep === 2} isCompleted={currentStep > 2}>
                  <div className="step-number">
                    {currentStep > 2 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : 2}
                  </div>
                  <div className="step-label">Pago</div>
                </Step>
                <Step isActive={currentStep === 3} isCompleted={false}>
                  <div className="step-number">3</div>
                  <div className="step-label">Confirmación</div>
                </Step>
              </ProgressSteps>
              
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
                  <OrderLabel>ID de Orden:</OrderLabel>
                  <OrderValue>{`ORD-${Date.now().toString().slice(-6)}`}</OrderValue>
                </OrderItem>
                <OrderItem>
                  <OrderLabel>Total:</OrderLabel>
                  <OrderTotal>${servicePrice.toLocaleString()}</OrderTotal>
                </OrderItem>
              </OrderSummary>
              
              <PaymentMethods>
                <PaymentMethod 
                  isSelected={paymentMethod === 'card'}
                  onClick={() => setPaymentMethod('card')}
                  type="button"
                >
                  <img src="/images/credit-card.svg" alt="Tarjeta de crédito" />
                </PaymentMethod>
                <PaymentMethod 
                  isSelected={paymentMethod === 'paypal'}
                  onClick={() => setPaymentMethod('paypal')}
                  type="button"
                >
                  <img src="/images/paypal.svg" alt="PayPal" />
                </PaymentMethod>
              </PaymentMethods>
              
              {paymentMethod === 'card' && (
                <>
                  <FormGroup>
                    <Label htmlFor="cardNumber">Número de tarjeta</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="NOMBRE APELLIDO"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                    />
                  </FormGroup>
                  
                  <CardDetailsGrid>
                    <FormGroup>
                      <Label htmlFor="cardExpiry">Fecha de expiración</Label>
                      <Input
                        id="cardExpiry"
                        type="text"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                      />
                    </FormGroup>
                    
                    <FormGroup>
                      <Label htmlFor="cardCvc">CVC / CVV</Label>
                      <Input
                        id="cardCvc"
                        type="text"
                        placeholder="123"
                        value={cardCvc}
                        onChange={handleCvcChange}
                      />
                    </FormGroup>
                  </CardDetailsGrid>
                </>
              )}
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}
              
              <PaymentButton
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.03 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? 'Procesando...' : `Pagar $${servicePrice.toLocaleString()}`}
              </PaymentButton>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal; 
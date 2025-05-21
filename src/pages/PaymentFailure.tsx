import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GlobalBackground from '../components/ui/GlobalBackground';

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
  max-width: 600px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const ErrorIcon = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 78, 78, 0.2);
  border: 2px solid #FF4E4E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem auto;
  
  svg {
    width: 40px;
    height: 40px;
    color: #FF4E4E;
  }
`;

const Content = styled.div`
  padding: 3rem 2rem;
  text-align: center;
  
  h3 {
    font-size: 1.5rem;
    color: white;
    margin-bottom: 1rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const ActionButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(255, 0, 255, 0.3);
  }
`;

const ErrorDetails = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
`;

const ErrorItem = styled.div`
  margin-bottom: 0.8rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ErrorLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
`;

const ErrorValue = styled.span`
  color: white;
  font-weight: 500;
  display: block;
`;

const HelpSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const HelpTitle = styled.h4`
  font-size: 1.1rem;
  color: white;
  margin-bottom: 1rem;
`;

const HelpItem = styled.div`
  margin-bottom: 1rem;
  text-align: left;
  padding: 0.8rem 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  
  h5 {
    font-size: 0.95rem;
    color: white;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    font-size: 0.9rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
  }
`;

// Componente principal
const PaymentFailure: React.FC = () => {
  const location = useLocation();
  const [errorInfo, setErrorInfo] = useState({
    status: '',
    detail: '',
    paymentId: '',
    service: 'Servicio',
    serviceTitle: ''
  });
  
  // Extraer información del error desde los query params y localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Parámetros de Mercado Pago
    const status = params.get('status') || 'rejected';
    const paymentId = params.get('payment_id') || '';
    const externalReference = params.get('external_reference') || '';
    
    console.log('Parámetros de redirección de error recibidos:', {
      payment_id: paymentId,
      status,
      external_reference: externalReference
    });
    
    // Datos de localStorage
    const serviceId = localStorage.getItem('last_payment_service') || '';
    const serviceTitle = localStorage.getItem('last_payment_service_title') || 'Servicio';
    
    // Determinar el mensaje de error basado en el código de error
    const errorDetail = getErrorMessage(status);
    
    setErrorInfo({
      status,
      detail: errorDetail,
      paymentId,
      service: serviceId,
      serviceTitle
    });
  }, [location]);
  
  // Determinar el mensaje de error según el estado
  const getErrorMessage = (status: string) => {
    switch (status) {
      case 'cc_rejected_insufficient_amount':
        return 'La tarjeta no tiene fondos suficientes para completar el pago.';
      case 'cc_rejected_high_risk':
        return 'El pago fue rechazado por razones de seguridad.';
      case 'cc_rejected_card_disabled':
        return 'La tarjeta está desactivada. Por favor, contacta a tu banco.';
      case 'cc_rejected_bad_filled_security_code':
        return 'El código de seguridad es incorrecto.';
      case 'cc_rejected_bad_filled_date':
        return 'La fecha de expiración es incorrecta.';
      case 'cc_rejected_other_reason':
      default:
        return 'El pago no pudo ser procesado. Por favor, intenta con otro método de pago.';
    }
  };
  
  return (
    <PageContainer>
      <GlobalBackground />
      
      <ContentContainer>
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Header>
            <Title>Pago Rechazado</Title>
          </Header>
          
          <Content>
            <ErrorIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
              </svg>
            </ErrorIcon>
            
            <h3>No pudimos procesar tu pago</h3>
            <p>{errorInfo.detail}</p>
            
            <ErrorDetails>
              <ErrorItem>
                <ErrorLabel>Estado:</ErrorLabel>
                <ErrorValue>{errorInfo.status}</ErrorValue>
              </ErrorItem>
              {errorInfo.paymentId && (
                <ErrorItem>
                  <ErrorLabel>ID de operación:</ErrorLabel>
                  <ErrorValue>{errorInfo.paymentId}</ErrorValue>
                </ErrorItem>
              )}
              <ErrorItem>
                <ErrorLabel>Servicio:</ErrorLabel>
                <ErrorValue>{errorInfo.serviceTitle || errorInfo.service}</ErrorValue>
              </ErrorItem>
            </ErrorDetails>
            
            <p>Por favor, revisa la información de tu método de pago e intenta nuevamente.</p>
            
            <ActionButton to={`/payment/${errorInfo.service}`}>
              Intentar nuevamente
            </ActionButton>
            
            <HelpSection>
              <HelpTitle>Consejos para resolver problemas de pago</HelpTitle>
              
              <HelpItem>
                <h5>Verificar fondos</h5>
                <p>Asegúrate de tener saldo disponible en tu tarjeta o cuenta de Mercado Pago.</p>
              </HelpItem>
              
              <HelpItem>
                <h5>Contactar a tu banco</h5>
                <p>Algunas tarjetas requieren autorización para compras online o internacionales.</p>
              </HelpItem>
              
              <HelpItem>
                <h5>Probar con otro método de pago</h5>
                <p>Si sigues teniendo problemas, intenta con otra tarjeta o usando el saldo de tu cuenta de Mercado Pago.</p>
              </HelpItem>
            </HelpSection>
          </Content>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default PaymentFailure; 
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

const PendingIcon = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 200, 0, 0.2);
  border: 2px solid #FFC800;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem auto;
  
  svg {
    width: 40px;
    height: 40px;
    color: #FFC800;
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

const OrderDetails = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
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

const InstructionsBox = styled.div`
  background: rgba(255, 200, 0, 0.1);
  border: 1px solid rgba(255, 200, 0, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
  text-align: left;
  
  h4 {
    color: #FFC800;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

// Componente principal
const PaymentPending: React.FC = () => {
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState({
    id: '',
    amount: 0,
    service: '',
    serviceTitle: '',
    date: new Date().toLocaleDateString()
  });
  
  // Extraer información del pago desde los query params y localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Obtener datos de la redirección de Mercado Pago
    const paymentId = params.get('payment_id') || '';
    const status = params.get('status') || 'pending';
    const externalReference = params.get('external_reference') || '';
    
    console.log('Parámetros de redirección recibidos:', {
      payment_id: paymentId,
      status,
      external_reference: externalReference
    });
    
    // Obtener datos almacenados en localStorage
    const serviceId = localStorage.getItem('last_payment_service') || '';
    const amount = Number(localStorage.getItem('last_payment_amount') || 0);
    const serviceTitle = localStorage.getItem('last_payment_service_title') || 'Servicio';
    
    // Si tenemos un payment_id de la redirección, lo usamos
    const finalPaymentId = paymentId || localStorage.getItem('last_payment_id') || '';
    
    setPaymentInfo({
      id: finalPaymentId,
      amount,
      service: serviceId,
      serviceTitle,
      date: new Date().toLocaleDateString()
    });
  }, [location]);
  
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
            <Title>Pago Pendiente</Title>
          </Header>
          
          <Content>
            <PendingIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
            </PendingIcon>
            
            <h3>Tu pago está pendiente de confirmación</h3>
            <p>Hemos registrado tu operación, pero el pago aún está en proceso. Esto puede tardar entre unos minutos y 24 horas dependiendo del método de pago utilizado.</p>
            
            <OrderDetails>
              <OrderItem>
                <OrderLabel>Servicio:</OrderLabel>
                <OrderValue>{paymentInfo.serviceTitle || paymentInfo.service}</OrderValue>
              </OrderItem>
              <OrderItem>
                <OrderLabel>Fecha:</OrderLabel>
                <OrderValue>{paymentInfo.date}</OrderValue>
              </OrderItem>
              {paymentInfo.id && (
                <OrderItem>
                  <OrderLabel>ID de pago:</OrderLabel>
                  <OrderValue>{paymentInfo.id}</OrderValue>
                </OrderItem>
              )}
              <OrderItem>
                <OrderLabel>Total a pagar:</OrderLabel>
                <OrderValue>${paymentInfo.amount.toLocaleString()}</OrderValue>
              </OrderItem>
            </OrderDetails>
            
            <InstructionsBox>
              <h4>Instrucciones:</h4>
              <ul>
                <li>Si pagaste con transferencia bancaria, tu pago podría demorar hasta 24 horas en acreditarse.</li>
                <li>Si elegiste pago en efectivo, recuerda completar el pago en el establecimiento seleccionado.</li>
                <li>Una vez confirmado el pago, recibirás un correo electrónico con los detalles.</li>
                <li>Si tienes alguna pregunta, puedes contactar a nuestro soporte indicando el ID de pago.</li>
              </ul>
            </InstructionsBox>
            
            <p style={{ marginTop: '2rem' }}>Te notificaremos por correo electrónico cuando el pago sea confirmado.</p>
            
            <ActionButton to="/">
              Volver al inicio
            </ActionButton>
          </Content>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default PaymentPending; 
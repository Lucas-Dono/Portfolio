import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  background: rgba(0, 0, 0, 0.2);
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

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem auto;
  box-shadow: 0 5px 20px rgba(255, 0, 255, 0.4);
  
  svg {
    width: 40px;
    height: 40px;
    color: white;
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
  padding: 1rem 2.5rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(255, 0, 255, 0.4);
  }
`;

const RedirectMessage = styled.div`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
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

// Componente principal
const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState({
    id: '',
    amount: 0,
    service: '',
    serviceTitle: '',
    date: new Date().toLocaleDateString()
  });
  const [redirectSeconds, setRedirectSeconds] = useState(5);
  
  // Extraer información del pago desde los query params y localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Obtener datos de la redirección de Mercado Pago
    const paymentId = params.get('payment_id') || '';
    const status = params.get('status') || '';
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
    
    // Almacenar información importante que necesitará el dashboard
    localStorage.setItem('project_service_type', serviceId);
    localStorage.setItem('project_payment_completed', 'true');
    
    // Configurar redirección automática
    const timer = setInterval(() => {
      setRedirectSeconds(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(timer);
          navigate('/dashboard');
        }
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location, navigate]);
  
  // Manejar clic en el botón para ir al dashboard
  const handleDashboardClick = () => {
    // Asegurar que marcamos el pago como completado antes de redirigir
    localStorage.setItem('project_payment_completed', 'true');
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
            <Title>Pago Completado</Title>
          </Header>
          
          <Content>
            <SuccessIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            </SuccessIcon>
            
            <h3>¡Hemos recibido tu pago!</h3>
            <p>Tu pago ha sido procesado exitosamente. Recibirás un correo electrónico con los detalles de la compra y los próximos pasos a seguir.</p>
            
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
                <OrderLabel>Total pagado:</OrderLabel>
                <OrderValue>${paymentInfo.amount.toLocaleString()}</OrderValue>
              </OrderItem>
            </OrderDetails>
            
            <p>Nos pondremos en contacto contigo en breve para comenzar con el desarrollo de tu proyecto.</p>
            
            <ActionButton 
              to="/dashboard" 
              onClick={handleDashboardClick}
            >
              Ir a mi Dashboard
            </ActionButton>
            
            <RedirectMessage>
              Serás redirigido automáticamente en {redirectSeconds} segundos...
            </RedirectMessage>
          </Content>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default PaymentSuccess; 
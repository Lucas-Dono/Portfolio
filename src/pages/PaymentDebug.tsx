import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
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

const Card = styled.div`
  background-color: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  padding: 2rem;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1.5rem;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #00FFFF;
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  width: 180px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const InfoValue = styled.div`
  flex: 1;
  color: white;
  font-size: 0.9rem;
  word-break: break-all;
`;

const TestButton = styled.button`
  background: rgba(0, 158, 227, 0.2);
  border: 1px solid #009ee3;
  border-radius: 4px;
  color: white;
  padding: 0.75rem 1.25rem;
  margin: 0.5rem 0.5rem 0.5rem 0;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 158, 227, 0.3);
  }
`;

const ResultBox = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-wrap;
`;

const PaymentDebug: React.FC = () => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [mpConfig, setMpConfig] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  // Verificar si el SDK de MercadoPago está cargado
  useEffect(() => {
    const checkMercadoPagoSDK = () => {
      if (typeof window.MercadoPago === 'function') {
        setSdkLoaded(true);
        
        // Obtener información de configuración
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'No configurado';
        
        setMpConfig({
          publicKey: typeof publicKey === 'string' ? publicKey.substring(0, 10) + '...' : 'No disponible',
          sdkVersion: window.MercadoPago.version || 'Desconocida',
          origin: window.location.origin,
          env: import.meta.env.MODE || 'development'
        });
      } else {
        setTimeout(checkMercadoPagoSDK, 500);
      }
    };
    
    checkMercadoPagoSDK();
  }, []);
  
  // Probar la carga del SDK
  const testSDKLoading = () => {
    setTestResult('Probando carga del SDK...');
    
    if (typeof window.MercadoPago === 'function') {
      setTestResult(`✅ SDK cargado correctamente.
Versión: ${window.MercadoPago.version || 'Desconocida'}
Objeto: ${Object.keys(window.MercadoPago.prototype || {}).join(', ')}`);
    } else {
      setTestResult('❌ El SDK de MercadoPago no está disponible en window.MercadoPago');
    }
  };
  
  // Probar la inicialización de MercadoPago
  const testMPInitialization = () => {
    setTestResult('Probando inicialización de MercadoPago...');
    
    try {
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc';
      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-AR',
        advancedConfiguration: {
          siteId: 'MLA'
        }
      });
      
      setTestResult(`✅ MercadoPago inicializado correctamente.
Métodos disponibles: ${Object.keys(mp || {}).join(', ')}
Bricks disponible: ${typeof mp.bricks === 'function' ? 'Sí' : 'No'}`);
    } catch (error) {
      setTestResult(`❌ Error al inicializar MercadoPago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  // Probar la creación de Bricks
  const testBricksCreation = () => {
    setTestResult('Probando creación de Bricks...');
    
    try {
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc';
      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-AR',
        advancedConfiguration: {
          siteId: 'MLA'
        }
      });
      
      // Verificar si bricks está disponible
      if (typeof mp.bricks !== 'function') {
        setTestResult('❌ mp.bricks no es una función');
        return;
      }
      
      const bricksBuilder = mp.bricks();
      
      setTestResult(`✅ Bricks inicializado correctamente.
Métodos disponibles: ${Object.keys(bricksBuilder || {}).join(', ')}
Create disponible: ${typeof bricksBuilder.create === 'function' ? 'Sí' : 'No'}`);
    } catch (error) {
      setTestResult(`❌ Error al inicializar Bricks: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  // Ejecutar un test simple con MercadoPago
  const testPaymentMethods = async () => {
    setTestResult('Obteniendo métodos de pago disponibles...');
    
    try {
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc';
      const mp = new window.MercadoPago(publicKey);
      
      // Intentar obtener métodos de pago disponibles
      const response = await fetch(`https://api.mercadopago.com/v1/payment_methods?access_token=${publicKey}`);
      const data = await response.json();
      
      if (data.error) {
        setTestResult(`❌ Error al obtener métodos de pago: ${data.message || 'Error desconocido'}`);
        return;
      }
      
      // Filtrar solo algunos datos relevantes
      const paymentMethods = data.map((method: any) => ({
        id: method.id,
        name: method.name,
        payment_type_id: method.payment_type_id,
        status: method.status
      }));
      
      setTestResult(`✅ Métodos de pago obtenidos correctamente:\n${JSON.stringify(paymentMethods, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Error al obtener métodos de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
  
  return (
    <PageContainer>
      <GlobalBackground />
      
      <ContentContainer>
        <Card>
          <Title>MercadoPago Debug</Title>
          
          <Section>
            <SectionTitle>Estado de MercadoPago SDK</SectionTitle>
            <InfoRow>
              <InfoLabel>SDK cargado:</InfoLabel>
              <InfoValue>{sdkLoaded ? '✅ Sí' : '❌ No'}</InfoValue>
            </InfoRow>
            {mpConfig && (
              <>
                <InfoRow>
                  <InfoLabel>Public Key:</InfoLabel>
                  <InfoValue>{mpConfig.publicKey}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Versión SDK:</InfoLabel>
                  <InfoValue>{mpConfig.sdkVersion}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Origen:</InfoLabel>
                  <InfoValue>{mpConfig.origin}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Entorno:</InfoLabel>
                  <InfoValue>{mpConfig.env}</InfoValue>
                </InfoRow>
              </>
            )}
          </Section>
          
          <Section>
            <SectionTitle>Pruebas</SectionTitle>
            <TestButton onClick={testSDKLoading}>Probar SDK</TestButton>
            <TestButton onClick={testMPInitialization}>Probar Inicialización</TestButton>
            <TestButton onClick={testBricksCreation}>Probar Bricks</TestButton>
            <TestButton onClick={testPaymentMethods}>Probar Métodos de Pago</TestButton>
            
            {testResult && (
              <ResultBox>{testResult}</ResultBox>
            )}
          </Section>
          
          <Section>
            <SectionTitle>Instrucciones</SectionTitle>
            <p style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Para simular un pago exitoso sin realizar una transacción real:
            </p>
            <ol style={{ paddingLeft: '1.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              <li>Ve a la página de pago</li>
              <li>Abre la consola del navegador (F12)</li>
              <li>Ejecuta el comando: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>window.simulatePayment()</code></li>
              <li>Observa cómo se simula el proceso de pago y la redirección</li>
            </ol>
            
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/payment/web5" style={{ color: '#00FFFF', textDecoration: 'none' }}>
                → Ir a página de pago de prueba (Servicio Web 5 Rutas)
              </Link>
            </div>
          </Section>
        </Card>
      </ContentContainer>
    </PageContainer>
  );
};

export default PaymentDebug; 
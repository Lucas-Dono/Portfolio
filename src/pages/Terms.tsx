import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlobalBackground from '../components/ui/GlobalBackground';

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
  padding: 4rem 1.5rem;
  z-index: 2;
`;

const Card = styled(motion.div)`
  background-color: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
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

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    color: white;
  }
`;

const Content = styled.div`
  padding: 2rem;
  color: rgba(255, 255, 255, 0.9);
  
  h2 {
    color: white;
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  h3 {
    color: white;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
    font-size: 1.2rem;
  }
  
  p {
    margin: 1rem 0;
    line-height: 1.6;
  }
  
  a {
    color: #00FFFF;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const UpdatedDate = styled.p`
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
`;

const TermsPage: React.FC = () => {
    // Fecha actual formateada
    const currentDate = new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <PageContainer>
            <GlobalBackground />

            <ContentContainer>
                <Card
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Header>
                        <Title>Términos y Condiciones</Title>
                        <BackButton to="/">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Volver al inicio
                        </BackButton>
                    </Header>

                    <Content>
                        <UpdatedDate>Última actualización: {currentDate}</UpdatedDate>

                        <h2>1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar este servicio, usted acepta estar sujeto a estos Términos y
                            Condiciones de Uso. Si no está de acuerdo con alguno de los términos establecidos
                            aquí, no deberá usar este servicio.
                        </p>

                        <h2>2. Descripción del Servicio</h2>
                        <p>
                            Nuestra plataforma proporciona servicios de desarrollo web y marketing digital
                            a usuarios registrados. Los servicios pueden incluir funcionalidades gratuitas
                            y de pago según se describe en nuestra plataforma.
                        </p>

                        <h2>3. Registro de Usuario</h2>
                        <p>
                            Para utilizar ciertas funciones de nuestra plataforma, debe registrarse proporcionando
                            información precisa, actual y completa. Usted es responsable de mantener la confidencialidad
                            de su contraseña y cuenta, y de todas las actividades que ocurran bajo su cuenta.
                        </p>

                        <h2>4. Pagos y Facturación</h2>

                        <h3>4.1 Planes de Suscripción</h3>
                        <p>
                            Ofrecemos varios planes de suscripción con diferentes características y precios.
                            Los detalles actualizados de cada plan están disponibles en nuestra página de precios.
                        </p>

                        <h3>4.2 Ciclos de Facturación</h3>
                        <p>
                            Las suscripciones se facturan por adelantado según el período seleccionado
                            (mensual, anual, etc.).
                        </p>

                        <h3>4.3 Reembolsos</h3>
                        <p>
                            Los reembolsos se procesan según nuestra política de reembolsos vigente al
                            momento de la solicitud.
                        </p>

                        <h2>5. Privacidad y Datos del Usuario</h2>

                        <h3>5.1 Recopilación de Datos</h3>
                        <p>
                            Recopilamos y procesamos datos personales como se describe en nuestra Política
                            de Privacidad.
                        </p>

                        <h3>5.2 Uso de Datos</h3>
                        <p>
                            Utilizamos sus datos para proporcionar, mantener y mejorar nuestros servicios,
                            así como para comunicarnos con usted.
                        </p>

                        <h3>5.3 Seguridad de Datos</h3>
                        <p>
                            Implementamos medidas de seguridad razonables para proteger sus datos personales.
                        </p>

                        <h2>6. Contenido del Usuario</h2>

                        <h3>6.1 Propiedad</h3>
                        <p>
                            Usted mantiene todos los derechos sobre el contenido que carga a nuestra plataforma.
                        </p>

                        <h3>6.2 Licencia</h3>
                        <p>
                            Al cargar contenido, nos otorga una licencia mundial, no exclusiva y libre de
                            regalías para usar, mostrar y distribuir dicho contenido en relación con
                            nuestros servicios.
                        </p>

                        <h3>6.3 Contenido Prohibido</h3>
                        <p>
                            No debe cargar contenido ilegal, ofensivo, difamatorio o que viole derechos de
                            propiedad intelectual de terceros.
                        </p>

                        <h2>7. Limitación de Responsabilidad</h2>
                        <p>
                            En ningún caso seremos responsables por daños indirectos, incidentales, especiales,
                            consecuentes o punitivos que resulten del uso o la imposibilidad de uso de
                            nuestros servicios.
                        </p>

                        <h2>8. Modificaciones al Servicio y a los Términos</h2>
                        <p>
                            Nos reservamos el derecho de modificar, suspender o discontinuar partes de nuestro
                            servicio en cualquier momento. También podemos modificar estos Términos y
                            Condiciones con previo aviso.
                        </p>

                        <h2>9. Terminación</h2>
                        <p>
                            Podemos terminar o suspender su acceso a nuestros servicios inmediatamente,
                            sin previo aviso ni responsabilidad, por cualquier razón, incluyendo, sin
                            limitación, si usted incumple estos Términos y Condiciones.
                        </p>

                        <h2>10. Ley Aplicable</h2>
                        <p>
                            Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes
                            de Argentina, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                        </p>

                        <h2>11. Contacto</h2>
                        <p>
                            Si tiene alguna pregunta sobre estos Términos y Condiciones, por favor contáctenos en:
                            <br />
                            <a href="mailto:contacto@example.com">contacto@example.com</a>
                        </p>
                    </Content>
                </Card>
            </ContentContainer>
        </PageContainer>
    );
};

export default TermsPage; 
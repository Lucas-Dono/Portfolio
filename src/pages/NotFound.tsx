import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #0d1117;
  color: #fff;
  text-align: center;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 8rem;
  margin: 0;
  background: linear-gradient(90deg, #61dafb, #06d6a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 6rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 2rem;
  margin: 1rem 0;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 1.2rem;
  max-width: 600px;
  margin: 1rem auto 2rem;
  opacity: 0.8;
  line-height: 1.6;
`;

const HomeButton = styled(Link)`
  display: inline-block;
  padding: 0.8rem 2rem;
  background: linear-gradient(90deg, #61dafb, #06d6a0);
  color: #0d1117;
  font-weight: bold;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const NotFound: React.FC = () => {
    return (
        <NotFoundContainer>
            <Title>404</Title>
            <Subtitle>Página no encontrada</Subtitle>
            <Description>
                Lo sentimos, la página que estás buscando no existe o ha sido movida.
                Por favor, regresa a la página de inicio.
            </Description>
            <HomeButton to="/">Volver al Inicio</HomeButton>
        </NotFoundContainer>
    );
};

export default NotFound; 
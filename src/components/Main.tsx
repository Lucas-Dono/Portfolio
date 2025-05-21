import React from 'react';
import styled from 'styled-components';
// Eliminar imports MUI

// Importar las secciones rediseñadas
// import Hero from './sections/Hero'; // Descomentar si existe y se usa
import About from './sections/About';
import Projects from './sections/Projects'; // Asumiendo que Projects renderiza las tarjetas y el modal
import Contact from './sections/Contact';
// import ProjectLoader from './ProjectLoader'; // Ya no se necesita aquí si Projects lo maneja

// Interfaz de props
interface MainProps {
  isChatOpen: boolean;
}

// Interfaz para props de StyledMain
interface StyledMainProps {
  $isChatOpen: boolean;
  children?: React.ReactNode; // Añadir children
}

// Contenedor principal estilizado
const StyledMain = styled.main<StyledMainProps>` // Usar la interfaz explícita
  flex-grow: 1;
  /* Ajustar margen derecho cuando el chat está abierto */
  /* Podríamos necesitar ajustar esto basado en el ancho real del chat */
  margin-right: ${props => props.$isChatOpen ? '380px' : '0'}; 
  transition: margin-right 0.3s ease;

  /* Asegurar que el contenido no se solape con el Header fijo */
  /* El padding-top debe coincidir o ser mayor que la altura del Navbar */
  padding-top: 70px; // Ajustar si la altura del Navbar es diferente

  @media (max-width: 768px) {
    margin-right: 0; // No ajustar margen en móvil si el chat es overlay
    padding-top: 60px; // Altura del Navbar en móvil
  }
`;

const Main = ({ isChatOpen }: MainProps) => {
  return (
    <StyledMain $isChatOpen={isChatOpen}>
      {/* Renderizar las secciones importadas en orden */}
      {/* <Hero /> */}
      <About />
      <Projects /> 
      <Contact />
    </StyledMain>
  );
};

export default Main;

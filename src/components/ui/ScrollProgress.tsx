import React from 'react';
import styled from 'styled-components';
import { motion, useSpring } from 'framer-motion';
import { useScroll } from '../../contexts/ScrollContext';

interface ProgressBarProps {
  isVertical?: boolean;
}

// Mantener fondo base, es sutil
const VerticalProgressBar = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 10px; // Más cerca del borde
  width: 4px; // Más delgado
  height: 100vh;
  background: rgba(255, 255, 255, 0.07); // Un poco más sutil
  z-index: 1000;
  pointer-events: none;

  @media (max-width: 768px) {
    right: 5px;
    width: 3px;
  }
`;

// Indicador vertical con nuevo gradiente
const VerticalProgressIndicator = styled(motion.div)`
  width: 100%;
  background: linear-gradient(to bottom, #FF00FF, #00FFFF);
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.6); // Sombra cyan
  border-radius: 2px;
`;

// Mantener fondo base horizontal
const HorizontalProgressBar = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px; // Más delgada
  background: rgba(255, 255, 255, 0.07);
  z-index: 1000;
  pointer-events: none;
`;

// Indicador horizontal con nuevo gradiente
const HorizontalProgressIndicator = styled(motion.div)`
  height: 100%;
  background: linear-gradient(to right, #FF00FF, #00FFFF);
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.6); // Sombra cyan
  border-radius: 2px;
`;

// Indicadores de sección
const SectionMarkers = styled.div`
  position: absolute;
  top: 0;
  left: -3px; // Alinear al lado de la barra
  height: 100%;
  width: 10px; // Ancho suficiente para el marcador
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  pointer-events: none;
`;

// Marcadores con nuevos colores
const SectionMarker = styled.div<{ isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isActive ? '#00FFFF' : 'rgba(255, 255, 255, 0.2)'}; // Cyan activo
  box-shadow: ${props => props.isActive ? '0 0 10px rgba(0, 255, 255, 0.7)' : 'none'}; // Sombra cyan activa
  transform: ${props => props.isActive ? 'scale(1.3)' : 'scale(1)'}; // Escala activa
  transition: all 0.3s ease;
`;

const ScrollProgress: React.FC<ProgressBarProps> = ({ isVertical = true }) => {
  const { scrollPercent, currentSection } = useScroll();
  
  // TODO: Obtener secciones dinámicamente o definir en un lugar centralizado
  const sections = ['hero', 'sobre-mi', 'projects', 'contacto']; // Usar IDs correctos
  
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const smoothProgress = useSpring(scrollPercent, springConfig);
  
  const progressStyle = isVertical
    ? { scaleY: smoothProgress, originY: 0 } // Usar scaleY para animar altura
    : { scaleX: smoothProgress, originX: 0 }; // Usar scaleX para animar ancho
  
  // Cálculo aproximado de la posición de los marcadores
  // Esto asume que las secciones están distribuidas de manera uniforme
  // Una solución más precisa requeriría calcular la posición de cada sección
  const getMarkerPosition = (index: number) => {
      const percentage = (index + 0.5) / sections.length; // Posición central aproximada
      return `${percentage * 100}%`;
  };

  const renderSectionMarkers = () => {
    if (!isVertical) return null;
    
    // Renderizar marcadores solo si hay secciones definidas
    if (!sections || sections.length === 0) return null;
    
    return (
      <SectionMarkers>
        {sections.map((section, index) => (
          <div key={section} style={{ position: 'absolute', top: getMarkerPosition(index), transform: 'translateY(-50%)' }}>
          <SectionMarker 
            isActive={currentSection === section}
          />
          </div>
        ))}
      </SectionMarkers>
    );
  };
  
  if (isVertical) {
    return (
      <VerticalProgressBar>
        {/* Aplicar scaleY al indicador */} 
        <VerticalProgressIndicator style={progressStyle} />
        {renderSectionMarkers()}
      </VerticalProgressBar>
    );
  }
  
  return (
    <HorizontalProgressBar>
      {/* Aplicar scaleX al indicador */} 
      <HorizontalProgressIndicator style={progressStyle} />
    </HorizontalProgressBar>
  );
};

export default ScrollProgress; 
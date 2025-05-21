import React, { useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const GridContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  background-image:
    linear-gradient(rgba(200, 180, 255, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(200, 180, 255, 0.15) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 1;
  mix-blend-mode: overlay;
`;

const RevealGrid: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e;
    if (gridRef.current) {
      gridRef.current.style.maskImage = `radial-gradient(circle calc(20vw + 150px) at ${clientX}px ${clientY}px, white 10%, transparent 70%)`;
      gridRef.current.style.webkitMaskImage = `radial-gradient(circle calc(20vw + 150px) at ${clientX}px ${clientY}px, white 10%, transparent 70%)`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    
    // Inicialización con posición central
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    if (gridRef.current) {
      gridRef.current.style.maskImage = `radial-gradient(circle calc(20vw + 150px) at ${centerX}px ${centerY}px, white 10%, transparent 70%)`;
      gridRef.current.style.webkitMaskImage = `radial-gradient(circle calc(20vw + 150px) at ${centerX}px ${centerY}px, white 10%, transparent 70%)`;
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return <GridContainer ref={gridRef} />;
};

export default RevealGrid; 
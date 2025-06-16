import styled from 'styled-components';
import { motion } from 'framer-motion';
import { media } from '../../styles/breakpoints';

import React from 'react';

// Interfaz para HeroContainer
interface HeroContainerProps {
  id?: string;
  children?: React.ReactNode;
}

// Contenedor principal
const HeroContainer = styled.section<HeroContainerProps>`
  /* min-height: 100vh; */ /* Eliminamos la altura basada en vh como estilo base */
  padding: 150px 2rem; /* Añadimos padding vertical base */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${media.md} {
    /* min-height: 90vh; */
    padding: 120px 2rem; /* Reducimos padding en tablets */
  }

  ${media.sm} {
    /* min-height: 80vh; */
    padding: 100px 1.5rem; /* Reducimos padding y un poco el horizontal */
  }

  ${media.xs} {
    /* min-height: 75vh; */
    padding: 80px 1rem; /* Padding más conservador en móviles */
  }
`;

// Contenido
const ContentWrapper = styled(motion.div)`
  max-width: 1200px;
  width: 100%;
  z-index: 10;
  text-align: center;
  position: relative;
`;

const MainTitle = styled(motion.h1)`
  font-size: clamp(2rem, 8vw, 6rem);
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 4px;
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
    border-radius: 2px;

    ${media.xs} {
      width: 80px;
      bottom: -6px;
      height: 3px;
    }
  }
`;

const SubTitle = styled(motion.h2)`
  font-size: clamp(1.1rem, 3.5vw, 2rem);
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #00FFFF 0%, #FFFF00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  ${media.xs} {
    margin-bottom: 1.5rem;
  }
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }
`;

// Enlaces estilizados como botones
const PrimaryButtonLink = styled.a`
  min-width: 180px;
  padding: 0.8rem 1.8rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(135deg, #FF00FF 0%, #00DDFF 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  
  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 20px rgba(255, 0, 255, 0.4);
    transform: translateY(-3px);
  }
  
  &:focus {
    outline: 3px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }
  
  @media (max-width: 600px) {
    width: 100%;
    max-width: 250px;
  }
`;

const SecondaryButtonLink = styled.a`
  min-width: 180px;
  padding: 0.8rem 1.8rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(30, 30, 30, 0.9);
  border: 2px solid #00FFFF;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(50, 50, 50, 0.95);
    border-color: rgba(255, 255, 255, 0.8);
    color: white;
    box-shadow: 0 4px 15px rgba(0, 255, 255, 0.7);
    transform: translateY(-3px);
  }
  
  &:focus {
    outline: 3px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }
  
  @media (max-width: 600px) {
    width: 100%;
    max-width: 250px;
  }
  
  ${media.sm} {
    display: none;
  }
`;

// Indicador de scroll
const ScrollIndicator = styled(motion.div)`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  z-index: 10;

  ${media.sm} {
    display: none;
  }
`;

const ScrollText = styled.span`
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
    letter-spacing: 2px;
  font-size: 1rem;
  font-weight: 600;
  
  ${media.xs} {
    font-size: 1.1rem;
  }
`;

// Animaciones
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };
  
const staggerContainerVariants = {
  hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
      staggerChildren: 0.3,
      delayChildren: 0.2
      }
    }
  };
  
const Hero: React.FC = () => {
  return (
    <HeroContainer id="inicio">
      {/* Contenido principal */}
      <ContentWrapper
        variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
        <MainTitle variants={fadeInUpVariants}>
              Circuit Prompt
        </MainTitle>
        <SubTitle variants={fadeInUpVariants}>
              Desarrollo Full-Stack & Diseño UI/UX
        </SubTitle>
        <ButtonContainer variants={fadeInUpVariants}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <PrimaryButtonLink 
              href="#proyectos"
              aria-label="Explorar proyectos"
            >
              Explorar Proyectos
            </PrimaryButtonLink>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <SecondaryButtonLink 
              href="#contacto"
              aria-label="Contactar"
            >
              Contactar
            </SecondaryButtonLink>
          </motion.div>
        </ButtonContainer>
      </ContentWrapper>
      
      {/* Indicador de scroll */}
        <ScrollIndicator
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: [1, 0.7, 1],
          y: [0, 10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "mirror"
        }}
        >
        <ScrollText>SCROLL</ScrollText>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
        </ScrollIndicator>
    </HeroContainer>
  );
};

export default Hero; 
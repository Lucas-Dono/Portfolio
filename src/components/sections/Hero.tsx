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

// Botón principal con colores consistentes con servicios
const PrimaryButtonLink = styled.a`
  min-width: 200px;
  padding: 1rem 2rem;
  font-size: 1.25rem;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(135deg, #FF00FF 0%, #00DDFF 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(255, 0, 255, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(255, 0, 255, 0.6);
    background: linear-gradient(135deg, #FF33FF 0%, #33DDFF 100%);
    
    &::before {
      left: 100%;
    }
  }
  
  &:focus {
    outline: 3px solid rgba(255, 0, 255, 0.6);
    outline-offset: 2px;
  }
  
  @media (max-width: 600px) {
    width: 100%;
    max-width: 280px;
    font-size: 1.1rem;
  }
`;

// Botón secundario más sutil
const SecondaryButtonLink = styled.a`
  min-width: 180px;
  padding: 1rem 1.8rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.6);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
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

// Indicador de scroll mejorado
const ScrollIndicator = styled(motion.div)`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  z-index: 10;
  cursor: pointer;
  
  &:hover {
    color: #00FFFF;
  }

  ${media.sm} {
    bottom: 1.5rem;
  }
`;

const ScrollText = styled.span`
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2px;
  font-size: 0.9rem;
  font-weight: 600;
  
  ${media.xs} {
    font-size: 0.8rem;
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
  const scrollToServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

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
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                scrollToServices();
              }}
              aria-label="Ver nuestros servicios"
            >
              🚀 Ver Servicios
            </PrimaryButtonLink>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <SecondaryButtonLink 
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                const projectsSection = document.getElementById('projects');
                if (projectsSection) {
                  projectsSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
              aria-label="Ver proyectos realizados"
            >
              📂 Proyectos
            </SecondaryButtonLink>
          </motion.div>
        </ButtonContainer>
      </ContentWrapper>
      
      {/* Indicador de scroll mejorado */}
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
        onClick={scrollToServices}
      >
        <ScrollText>VER SERVICIOS</ScrollText>
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
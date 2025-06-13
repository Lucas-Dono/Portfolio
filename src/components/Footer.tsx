import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { media } from '../styles/breakpoints';

// Mantenemos otros iconos si los hay
const LinkedInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// Estilos con styled-components
const FooterContainer = styled.footer`
  background-color: #050505;
  color: rgba(255, 255, 255, 0.7);
  padding: 4rem 0 2rem; // Más padding arriba, menos abajo
  margin-top: auto; // Empuja el footer al final si el contenido es corto
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  ${media.md} {
    padding: 3rem 0 1.5rem; /* Menos padding en tablets */
  }
  
  ${media.xs} {
    padding: 2.5rem 0 1.5rem; /* Menos padding en móviles */
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  @media (max-width: 480px) {
    padding: 0 1rem; /* Reduced padding for very small screens */
  }
`;

const SocialLinksContainer = styled.div`
  display: flex;
  gap: 1.5rem; // Espacio entre iconos
  margin-bottom: 2rem;
  
  ${media.xs} {
    gap: 1.2rem; /* Menos espacio en móviles */
    margin-bottom: 1.5rem;
  }
`;

// Reutilizamos el estilo de SocialLink de Contact.tsx (ajustado si es necesario)
const SocialLink = styled(motion.a)`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 0, 255, 0.3) 0%, rgba(0, 255, 255, 0.3) 100%);
    color: #fff;
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  ${media.xs} {
    width: 40px; /* Más pequeño en móviles */
    height: 40px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const CopyrightText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 1rem;
  
  ${media.xs} {
    font-size: 0.8rem;
    margin-top: 0.8rem;
  }
`;

const TechInfo = styled.p`
 font-size: 0.8rem;
 color: rgba(255, 255, 255, 0.4);
 margin-bottom: 0.5rem;
 
 ${media.xs} {
   font-size: 0.75rem;
 }
`;

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <SocialLinksContainer>
          <SocialLink 
            href="https://github.com/lucashozo" // Actualizar con tu usuario real
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            whileHover={{ y: -5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/images/github.svg" alt="GitHub" width="20" height="20" />
          </SocialLink>
          <SocialLink 
            href="https://linkedin.com/in/lucas-hoz" // Actualizar con tu usuario real
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            whileHover={{ y: -5, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <LinkedInIcon />
          </SocialLink>
          {/* Agrega aquí otros enlaces sociales si los tienes */}
        </SocialLinksContainer>
        
        <TechInfo>
            Desarrollado con React, TypeScript, styled-components y Framer Motion.
        </TechInfo>

        <CopyrightText>
          &copy; {new Date().getFullYear()} Lucas Dono. Todos los derechos reservados.
        </CopyrightText>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;

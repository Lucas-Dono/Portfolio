import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll } from '../../contexts/ScrollContext';
import { media } from '../../styles/breakpoints'; // Asegurarse de importar media
import { Link } from 'react-router-dom';
// Eliminamos importaciones de iconos de tema y contexto
// import LightModeIcon from '@mui/icons-material/LightMode';
// import DarkModeIcon from '@mui/icons-material/DarkMode';
// import { useTheme } from '../../contexts/ThemeContext';

// --- Interfaces ---
interface NavbarProps {
  showAfterScroll?: number;
  onNavigate?: (section: string) => void;
  toggleChat?: () => void;
  toggleGame?: () => void;
}

interface NavContainerProps {
  $isScrolled: boolean;
  // Eliminamos la propiedad de tema
  // $isDarkMode: boolean;
}

interface NavLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  $isActive: boolean;
  // Eliminamos la propiedad de tema
  // $isDarkMode: boolean;
  children?: React.ReactNode;
}

interface MenuToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  $isOpen: boolean;
  children?: React.ReactNode;
}

interface LogoLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
}

// --- Iconos SVG --- (Alternativa a MUI Icons)
// Eliminamos completamente los iconos de sol y luna ya que no los necesitamos
// const SunIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <circle cx="12" cy="12" r="5"/>
//     <line x1="12" y1="1" x2="12" y2="3"/>
//     <line x1="12" y1="21" x2="12" y2="23"/>
//     <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
//     <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
//     <line x1="1" y1="12" x2="3" y2="12"/>
//     <line x1="21" y1="12" x2="23" y2="12"/>
//     <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
//     <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
//   </svg>
// );

// const MoonIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
//   </svg>
// );

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const GameIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 512 512"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0"
  >
    <path d="M469.344,266.664v-85.328h-42.656v-42.672H384v-21.328h42.688v-64h-64v42.656H320v42.672H192V95.992
      h-42.656V53.336h-64v64H128v21.328H85.344v42.672H42.688v85.328H0v149.328h64v-85.328h21.344v85.328H128v42.672h106.688v-64h-85.344
      v-21.328h213.344v21.328h-85.344v64H384v-42.672h42.688v-85.328H448v85.328h64V266.664H469.344z M192,245.336h-64v-64h64V245.336z
      M384,245.336h-64v-64h64V245.336z"/>
  </svg>
);

const DashboardIcon = () => (
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
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

// --- Componentes Estilizados ---
const NavContainer = styled(motion.nav) <NavContainerProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70px;
  z-index: 1000; // Asegurar que esté sobre otros elementos
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2.5rem;
  transition: background-color 0.3s ease, box-shadow 0.3s ease, height 0.3s ease, padding 0.3s ease;

  background-color: ${props =>
    props.$isScrolled
      ? 'rgba(5, 5, 5, 0.7)' // Siempre modo oscuro
      : 'transparent'};
  backdrop-filter: ${props => props.$isScrolled ? 'blur(10px)' : 'none'};
  box-shadow: ${props =>
    props.$isScrolled
      ? '0 2px 20px rgba(0, 0, 0, 0.4)' // Siempre modo oscuro
      : 'none'};
  
  ${media.lg} { // Usamos lg (992px) como breakpoint para menú hamburguesa
    padding: 0 1.5rem;
    height: 65px; // Incrementar altura en tablets/móviles
  }
`;

const LogoLink = styled.a<LogoLinkProps>`
  font-family: 'Poppins', sans-serif; // Tipografía más moderna
  font-weight: 700;
  font-size: 1.6rem;
  text-decoration: none;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2.5rem;
  
  @media (max-width: 992px) {
    display: none;
  }
`;

const NavLink = styled.button<NavLinkProps>`
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: #E1E5EA; // Corregido: usar valor literal en lugar de string con comillas
  cursor: pointer;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    transform: scaleX(0);
    transform-origin: bottom right;
    transition: transform 0.3s ease-out;
  }

  &:hover::after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }

  &:hover {
    color: #fff; // Corregido: usar valor literal en lugar de string con comillas
  }

  ${props => props.$isActive && css`
    color: #fff; // Corregido: usar valor literal en lugar de string con comillas
    font-weight: 600;
    &::after {
      transform: scaleX(1);
      transform-origin: bottom left;
    }
  `}
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  
  @media (max-width: 992px) {
    display: none; // Ocultar en NavContainer, se mostrarán en MobileMenu
  }
`;

const ControlButton = styled(motion.button)`
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  color: #E1E5EA; // Corregido: usar valor literal en lugar de string con comillas
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 50%;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: -1;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1); // Corregido: usar valor literal 
    color: #fff; // Corregido: usar valor literal
    transform: scale(1.05);
    
    &::before {
      opacity: 1;
      transform: scale(1.2);
    }
  }

  svg {
    transition: transform 0.3s ease;
  }
`;

const ChatButton = styled(ControlButton)`
  color: #00BFFF; // Corregido: usar valor literal
  
  &::before {
    background: radial-gradient(circle, rgba(0, 191, 255, 0.2) 0%, rgba(0, 191, 255, 0) 70%);
  }
  
  &:hover {
    color: #40C4FF;
    
    svg {
      filter: drop-shadow(0 0 3px rgba(0, 191, 255, 0.7));
      transform: translateY(-2px);
    }
  }
`;

const GameButton = styled(ControlButton)`
  position: relative;
  color: #AC92EC; // Corregido: usar valor literal
  
  &::before {
    background: radial-gradient(circle, rgba(172, 146, 236, 0.2) 0%, rgba(172, 146, 236, 0) 70%);
  }
  
  &:hover {
    color: #CBB5FF;
    
    svg {
      filter: drop-shadow(0 0 3px rgba(172, 146, 236, 0.7));
    }
  }
`;

const DashboardButton = styled(ControlButton)`
  position: relative;
  color: #4ADE80; // Verde para dashboard
  
  &::before {
    background: radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0) 70%);
  }
  
  &:hover {
    color: #6EE7A0;
    
    svg {
      filter: drop-shadow(0 0 3px rgba(74, 222, 128, 0.7));
    }
  }
`;

const DashboardLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
`;

// --- Componentes para Menú Móvil ---
const MenuToggle = styled.button<MenuToggleProps>`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1001; // Encima del NavContainer
  padding: 0;
  margin: 0;
  width: 30px;
  height: 30px;
  position: relative;
  color: #fff; // Corregido: usar valor literal

  span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: currentColor;
    border-radius: 1px;
    left: 0;
    transform-origin: center center;
    transition: transform 0.3s cubic-bezier(0.215, 0.61, 0.355, 1),
                opacity 0.3s ease;
  }

  span:nth-child(1) {
    top: ${props => props.$isOpen ? 'calc(50% - 1px)' : '25%'};
    transform: ${props => props.$isOpen ? 'rotate(45deg)' : 'rotate(0)'};
  }
  span:nth-child(2) {
    top: calc(50% - 1px);
    opacity: ${props => props.$isOpen ? 0 : 1};
    transform: ${props => props.$isOpen ? 'translateX(-100%)' : 'translateX(0)'};
  }
  span:nth-child(3) {
    bottom: ${props => props.$isOpen ? 'calc(50% - 1px)' : '25%'};
    transform: ${props => props.$isOpen ? 'rotate(-45deg)' : 'rotate(0)'};
  }

  @media (max-width: 992px) {
    display: block;
  }
`;

const MobileMenuContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(5, 5, 5, 0.95); // Corregido: usar valor literal
  backdrop-filter: blur(15px);
  z-index: 999; // Debajo del MenuToggle pero encima del resto
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const MobileControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1rem;
`;

// --- Componente Principal Navbar ---
const Navbar: React.FC<NavbarProps> = ({
  showAfterScroll = 50, // Mostrar antes
  onNavigate,
  toggleChat,
  toggleGame
}) => {
  const { currentSection, scrollTo } = useScroll();
  // const { isDarkMode, toggleTheme } = useTheme(); // Ya no se usa
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > showAfterScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll]);

  // Cerrar menú móvil si la pantalla se agranda
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Evitar scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
  }, [isMobileMenuOpen]);

  const menuItems = [
    { label: 'Inicio', section: 'inicio' },
    { label: 'Servicios', section: 'services' },
    { label: 'Proyectos', section: 'projects' },
    { label: 'Sobre Nosotros', section: 'sobre-nosotros' },
    { label: 'Contacto', section: 'contacto' }
  ];

  const handleNavigation = (section: string) => {
    setIsMobileMenuOpen(false); // Cerrar menú al navegar
    if (onNavigate) {
      onNavigate(section);
    } else {
      // Pequeño retraso para dar tiempo a cerrar el menú antes de scrollear
      setTimeout(() => scrollTo(section), 100);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: "-100%" },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } },
    exit: { opacity: 0, y: "-100%", transition: { duration: 0.3, ease: "easeInOut" } }
  };

  return (
    <>
      <NavContainer
        // $isDarkMode={isDarkMode} // Ya no es necesario
        $isScrolled={isScrolled}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Pasar href al LogoLink para que apunte al inicio */}
        <LogoLink href="#inicio" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); handleNavigation('inicio'); }}>
          Circuit Prompt
        </LogoLink>

        <NavLinks>
          {menuItems.map(item => (
            <NavLink
              key={item.section}
              onClick={() => handleNavigation(item.section)}
              $isActive={currentSection === item.section}
            // $isDarkMode={isDarkMode} // Ya no es necesario
            >
              {item.label}
            </NavLink>
          ))}
        </NavLinks>

        <Controls>
          {/* Botón de tema eliminado */}

          {toggleChat && (
            <ChatButton
              onClick={() => { setIsMobileMenuOpen(false); toggleChat(); }}
              aria-label="Abrir chat"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChatIcon />
            </ChatButton>
          )}

          {toggleGame && (
            <GameButton
              onClick={() => { setIsMobileMenuOpen(false); toggleGame(); }}
              aria-label="Abrir juego"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GameIcon />
            </GameButton>
          )}
          <DashboardLink to="/dashboard">
            <DashboardButton
              aria-label="Ir al dashboard"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DashboardIcon />
            </DashboardButton>
          </DashboardLink>
        </Controls>

        {/* Botón Hamburguesa */}
        <MenuToggle onClick={toggleMobileMenu} $isOpen={isMobileMenuOpen} >
          <span></span>
          <span></span>
          <span></span>
        </MenuToggle>

      </NavContainer>

      {/* Menú Móvil */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenuContainer
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <MobileNavLinks>
              {menuItems.map(item => (
                <NavLink
                  key={`${item.section}-mobile`}
                  onClick={() => handleNavigation(item.section)}
                  $isActive={currentSection === item.section}
                  // $isDarkMode={isDarkMode} // Ya no es necesario
                  style={{ fontSize: '1.5rem' }}
                >
                  {item.label}
                </NavLink>
              ))}
            </MobileNavLinks>
            <MobileControls>
              {/* Botón de tema eliminado */}

              {toggleChat && (
                <ChatButton
                  onClick={() => { setIsMobileMenuOpen(false); toggleChat(); }}
                  aria-label="Abrir chat"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChatIcon />
                </ChatButton>
              )}

              {toggleGame && (
                <GameButton
                  onClick={() => { setIsMobileMenuOpen(false); toggleGame(); }}
                  aria-label="Abrir juego"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GameIcon />
                </GameButton>
              )}

              <DashboardLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <DashboardButton
                  aria-label="Ir al dashboard"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <DashboardIcon />
                </DashboardButton>
              </DashboardLink>
            </MobileControls>
          </MobileMenuContainer>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar; 
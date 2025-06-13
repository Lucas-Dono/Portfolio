import { createGlobalStyle, DefaultTheme } from 'styled-components';
import { CustomTheme } from './theme';
import React from 'react';

// Importar las fuentes directamente en index.html o usar esto como componente adicional
// para cargar las fuentes con el método React Link
export const FontStyles: React.FC = () => (
  <>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" />
  </>
);

export const GlobalStyles = createGlobalStyle<{ theme: CustomTheme }>`
  /* Las importaciones de fuentes se han movido al componente FontStyles arriba */
  
  :root {
    /* Colores - Usar estructura definida en theme.ts */
    --primary: ${({ theme }) => theme.colors.primary.main}; /* Corregido: usar .main o .dark */
    --secondary: ${({ theme }) => theme.colors.secondary}; 
    --accent: ${({ theme }) => theme.colors.accent};
    --background: ${({ theme }) => theme.colors.background.dark}; /* Corregido: usar .dark o .light (asumiendo dark) */
    --surface: ${({ theme }) => theme.colors.surface};
    --elevatedSurface: ${({ theme }) => theme.colors.elevatedSurface};
    --text-primary: ${({ theme }) => theme.colors.textPrimary};
    --text-secondary: ${({ theme }) => theme.colors.textSecondary};
    --text-muted: ${({ theme }) => theme.colors.textMuted};
    --gradient-primary: ${({ theme }) => theme.colors.gradientPrimary};
    --gradient-secondary: ${({ theme }) => theme.colors.gradientSecondary};
    --gradient-accent: ${({ theme }) => theme.colors.gradientAccent};
    --glow-primary: ${({ theme }) => theme.colors.glowPrimary};
    --glow-secondary: ${({ theme }) => theme.colors.glowSecondary};
    --glow-accent: ${({ theme }) => theme.colors.glowAccent};
    
    /* Fonts */
    --font-primary: 'Space Grotesk', sans-serif;
    --font-secondary: 'Outfit', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    
    /* Spacing */
    --spacing-xs: ${({ theme }) => theme.spacing.xs};
    --spacing-sm: ${({ theme }) => theme.spacing.sm};
    --spacing-md: ${({ theme }) => theme.spacing.md};
    --spacing-lg: ${({ theme }) => theme.spacing.lg};
    --spacing-xl: ${({ theme }) => theme.spacing.xl};
    
    /* Transitions - Corregido: usar theme.transitions */
    --transition-fast: ${({ theme }) => theme.transitions.fast};
    --transition-medium: ${({ theme }) => theme.transitions.medium};
    --transition-slow: ${({ theme }) => theme.transitions.slow};

    /* Effects - Mantener los que existen */
    --hover-scale: ${({ theme }) => theme.effects.hoverScale}; 
    --hover-glow: ${({ theme }) => theme.effects.hoverGlow};
  }
  
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #050505;
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
    
    /* Eliminar fondos adicionales para usar solo GlobalBackground */
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
    background: var(--gradient-primary); /* Usar variable definida */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  h1 {
    font-size: 4rem;
    letter-spacing: -0.025em;
    text-shadow: 0 0 5px rgba(255, 0, 255, 0.2); /* Reducido shadow */
  }

  h2 {
    font-size: 3rem;
    letter-spacing: -0.025em;
  }
  
  h3 {
    font-size: 2rem;
  }

  p {
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }

  a {
    color: var(--secondary);
    text-decoration: none;
    position: relative;
    transition: all var(--transition-medium) ease; /* Usar variable de transición */
    
    &:hover {
      color: var(--primary);
      text-shadow: var(--glow-primary); /* Usar variable definida */
    }
    
    &::after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      bottom: -2px;
      left: 0;
      background: var(--gradient-primary); /* Usar variable definida */
      transition: width var(--transition-medium) ease; /* Usar variable de transición */
    }
    
    &:hover::after {
      width: 100%;
    }
  }

  button {
    font-family: var(--font-primary);
    border: none;
    cursor: pointer;
    transition: all var(--transition-medium) ease; /* Usar variable de transición */
    
    &:focus {
      outline: none;
    }
  }
  
  /* Personalización de la barra de scroll */
  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    background: var(--surface); /* Usar variable definida */
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, var(--primary), var(--secondary)); /* Puede usar --gradient-primary si encaja */
    border-radius: 5px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, var(--secondary), var(--accent)); /* Puede usar --gradient-secondary o --gradient-accent si encaja */
  }
  
  /* Clases de utilidad global */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  .section {
    padding: 100px 0;
    position: relative;
    }
    
  .text-gradient {
    background: var(--gradient-primary); /* Usar variable definida */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .glow-effect {
    text-shadow: var(--glow-primary); /* Usar variable definida */
  }
  
  .neon-border {
    border: 1px solid var(--primary);
    box-shadow: var(--glow-primary); /* Usar variable definida */
  }
  
  /* Estilos para texto highlight en about section */
  .text-paragraph.highlight {
    font-size: 1.5rem;
    color: var(--text-primary);
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 2rem;
    border-left: 4px solid var(--accent);
    padding-left: 1.5rem;
    background: rgba(0, 255, 255, 0.05);
    border-radius: 0 8px 8px 0;
  }
  
  /* Animación para el spinner de verificación */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default GlobalStyles; 
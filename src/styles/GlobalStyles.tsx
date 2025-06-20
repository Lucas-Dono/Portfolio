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
    font-family: 'Inter', 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: #FFFFFF;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    overflow-x: hidden;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: #FFFFFF;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    font-weight: 700;
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

  p, span, div {
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  }

  a {
    color: #4CAF50;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      color: #66BB6A;
      text-decoration: underline;
    }
    
    &:focus {
      outline: 3px solid #4CAF50;
      outline-offset: 2px;
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    
    &:focus {
      outline: 3px solid #4CAF50;
      outline-offset: 2px;
    }
  }

  input, textarea, select {
    font-family: inherit;
    
    &:focus {
      outline: 3px solid #4CAF50;
      outline-offset: 2px;
    }
  }

  .gradient-text {
    background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
    text-shadow: none;
  }

  .high-contrast-section {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .interactive-element {
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    }
    
    &:focus {
      outline: 3px solid #4CAF50;
      outline-offset: 2px;
    }
  }

  .text-on-light {
    color: #1a1a1a;
    text-shadow: none;
    font-weight: 600;
  }

  ::-webkit-scrollbar {
    width: 12px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4CAF50;
    border-radius: 6px;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #66BB6A;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  @media (prefers-contrast: high) {
    body {
      background: #000000;
      color: #FFFFFF;
    }
    
    .gradient-text {
      background: #FFFFFF;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    a {
      color: #00FF00;
    }
    
    button {
      border: 2px solid #FFFFFF;
    }
  }

  @media (max-width: 768px) {
    body {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    body {
      font-size: 13px;
    }
  }
`;

export default GlobalStyles; 
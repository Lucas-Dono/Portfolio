import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Las fuentes están importadas en el index.html para mejorar rendimiento */

  :root {
    /* Paleta de colores profesional */
    --color-bg-dark: #0a0b0e;
    --color-bg-light: #f8f9fa;
    --color-primary: #6a5cff;      /* Púrpura/azul más vibrante */
    --color-primary-light: #8c6cff; /* Púrpura más claro y saturado */
    --color-secondary: #ff5e41;    /* Naranja/rojo más vibrante */
    --color-secondary-light: #ff8a72;
    --color-accent: #01f2a0;      /* Verde neón más brillante */
    --color-text-dark: #f8f8f8;    /* Blanco más puro para mejor contraste */
    --color-text-light: #292929;
    --color-gray-100: #f8f9fa;
    --color-gray-200: #e9ecef;
    --color-gray-300: #dee2e6;
    --color-gray-400: #ced4da;
    --color-gray-500: #adb5bd;
    --color-gray-600: #6c757d;
    --color-gray-700: #495057;
    --color-gray-800: #343a40;
    --color-gray-900: #212529;
    
    /* Espaciado */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 2rem;
    --space-xl: 3rem;
    --space-xxl: 5rem;
    
    /* Bordes y sombras */
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 16px;
    --box-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    --box-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    --box-shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05);
    --box-shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    
    /* Transiciones */
    --transition-fast: 0.2s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;
    --transition-very-slow: 1s ease;
    
    /* Z-index */
    --z-background: -10;
    --z-below: -1;
    --z-normal: 1;
    --z-above: 10;
    --z-fixed: 100;
    --z-modal: 1000;
    
    /* Fuentes */
    --font-heading: 'Montserrat', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-code: 'Fira Code', monospace;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) var(--color-gray-800);
  }

  body {
    font-family: var(--font-body);
    line-height: 1.6;
    overflow-x: hidden;
    background-color: var(--color-bg-dark);
    color: var(--color-text-dark);
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: var(--space-md);
  }

  h1 {
    font-size: 3.5rem;
    
    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }

  h2 {
    font-size: 2.5rem;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  h3 {
    font-size: 2rem;
    
    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }

  h4 {
    font-size: 1.5rem;
  }

  p {
    margin-bottom: var(--space-md);
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
    
    &:hover {
      color: var(--color-primary-light);
    }
  }

  img, video {
    max-width: 100%;
    height: auto;
  }

  button {
    cursor: pointer;
    font-family: var(--font-body);
  }

  code {
    font-family: var(--font-code);
  }

  /* Estilizar scrollbar para navegadores webkit */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-gray-800);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: var(--border-radius-sm);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary-light);
  }

  /* Clases de utilidad para espaciado y márgenes */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-md);
  }

  .section {
    padding: var(--space-xxl) 0;
    position: relative;
    overflow: hidden;
  }

  /* Animaciones globales */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInLeft {
    from {
      transform: translateX(-30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Clases de animación reutilizables */
  .animate-fade-in {
    animation: fadeIn var(--transition-normal) forwards;
  }

  .animate-slide-up {
    animation: slideUp var(--transition-normal) forwards;
  }

  .animate-slide-left {
    animation: slideInLeft var(--transition-normal) forwards;
  }

  .animate-slide-right {
    animation: slideInRight var(--transition-normal) forwards;
  }

  .animate-pulse {
    animation: pulse 2s infinite;
  }

  /* Clases para retrasos en animaciones */
  .delay-100 {
    animation-delay: 0.1s;
  }

  .delay-200 {
    animation-delay: 0.2s;
  }

  .delay-300 {
    animation-delay: 0.3s;
  }

  .delay-400 {
    animation-delay: 0.4s;
  }

  .delay-500 {
    animation-delay: 0.5s;
  }

  /* Hide elements visually but keep them available for screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  /* Compatibilidad con MUI */
  .MuiButtonBase-root {
    font-family: 'Inter', sans-serif !important;
  }
  
  /* Fix para contenedores de styled-components */
  #root {
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
`;

export default GlobalStyles; 
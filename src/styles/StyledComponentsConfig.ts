import { createGlobalStyle } from 'styled-components';

/**
 * Configuración global para styled-components
 * Asegura que los estilos de MUI y styled-components no entren en conflicto
 */
export const GlobalStyle = createGlobalStyle`
  /* Estilos globales para todo el proyecto */
  html, body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Asegurar que todos los elementos respeten el box model */
  *, *::before, *::after {
    box-sizing: inherit;
  }

  /* Estilos específicos para asegurar la compatibilidad con MUI */
  /* Esto ayuda a que MUI y styled-components no entren en conflicto */
  .MuiButtonBase-root {
    font-family: 'Montserrat', sans-serif !important;
  }

  code {
    font-family: 'Fira Code', source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }
`; 
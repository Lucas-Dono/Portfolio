// Breakpoints estándar para media queries
export const breakpoints = {
  xs: '480px',    // Móviles pequeños
  sm: '600px',    // Móviles grandes  
  md: '768px',    // Tablets
  lg: '992px',    // Laptops/Desktops pequeños
  xl: '1200px'    // Desktops grandes
};

// Función helper para crear media queries en styled-components
export const media = {
  xs: `@media (max-width: ${breakpoints.xs})`,
  sm: `@media (max-width: ${breakpoints.sm})`,
  md: `@media (max-width: ${breakpoints.md})`,
  lg: `@media (max-width: ${breakpoints.lg})`,
  xl: `@media (max-width: ${breakpoints.xl})`
}; 
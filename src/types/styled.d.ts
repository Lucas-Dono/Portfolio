import 'styled-components';

declare module 'prop-types' {
  const PropTypes: any;
  export default PropTypes;
  // Para permitir imports con destructuring
  export const any: any;
  export const array: any;
  export const bool: any;
  export const func: any;
  export const number: any;
  export const object: any;
  export const string: any;
  export const node: any;
  export const element: any;
  export const symbol: any;
  export const elementType: any;
  export const instanceOf: any;
  export const oneOf: any;
  export const oneOfType: any;
  export const arrayOf: any;
  export const objectOf: any;
  export const shape: any;
  export const exact: any;
}

// Declaración personalizada para stylis
declare module 'stylis' {
  export default function stylis(selector: string, styles: string): string;
  export function set(options: object): void;
  export function use(useFn: (context: string, content: string, selectors: string[], parent: string[], line: number, column: number, length: number) => void): void;
}

// Extender la interfaz DefaultTheme de styled-components
declare module 'styled-components' {
  export interface DefaultTheme {
    $isDarkMode?: boolean;
    colors: {
      background: {
        dark: string;
        light: string;
      };
      primary: {
        main: string;
        dark: string;
      };
      secondary: string;
      text: {
        dark: string;
        light: string;
      };
      gray: {
        [key: string]: string;
      };
      // Propiedades adicionales usadas en GlobalStyles.tsx
      accent: string;
      surface: string;
      elevatedSurface: string;
      textPrimary: string;
      textSecondary: string;
      textMuted: string;
      success: string;
      error: string;
      warning: string;
      info: string;
      gradientPrimary: string;
      gradientSecondary: string;
      gradientAccent: string;
      glowPrimary: string;
      glowSecondary: string;
      glowAccent: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    transitions: {
      slow: string;
      medium: string;
      fast: string;
    };
    zIndex: {
      background: number;
      normal: number;
      menu: number;
      overlay: number;
      modal: number;
      toast: number;
    };
    breakpoints: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    // Propiedad effects faltante
    effects: {
      hoverScale: string;
      hoverGlow: string;
      transitionFast: string;
      transitionMedium: string;
      transitionSlow: string;
    };
  }
  
  // Asegurarse de que todos los componentes estilizados acepten children y propiedades HTML estándar
  export interface StyledComponentBase<C extends React.ComponentType, T extends object, O extends object = {}, A extends string = never> {
    attrs<U extends object, A extends string = never>(attrs: Attrs<C, T, U, A>): StyledComponent<C, T & U, O, A>;
    withConfig(config: StyledConfig<C, T, O, A>): StyledComponent<C, T, O, A>;
  }
} 
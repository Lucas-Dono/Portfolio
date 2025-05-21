// No extendemos de DefaultTheme ya que no lo necesitamos
// import { DefaultTheme } from 'styled-components';

// Definición del tema para TypeScript
export interface CustomTheme {
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
    accent: string;
    surface: string;
    elevatedSurface: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverted: string;
    textError: string;
    border: string;
    divider: string;
    disabled: string;
    focus: string;
    hover: string;
    glowPrimary: string;
    glowSecondary: string;
    glowAccent: string;
    // Propiedades adicionales requeridas por DefaultTheme
    textMuted: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    gradientPrimary: string;
    gradientSecondary: string;
    gradientAccent: string;
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
  effects: {
    boxShadow: string;
    textShadow: string;
    glowEffect: string;
    // Propiedades adicionales requeridas por DefaultTheme
    hoverScale: string;
    hoverGlow: string;
    transitionFast: string;
    transitionMedium: string;
    transitionSlow: string;
  };
}

// Tema predeterminado (modo oscuro)
export const theme: CustomTheme = {
  colors: {
    background: {
      dark: '#131726',
      light: '#232A3B',
    },
    primary: {
      main: '#4B9FE1',
      dark: '#0F4C75',
    },
    secondary: '#FF6B52',
    text: {
      dark: '#2D3748',
      light: '#FFFFFF',
    },
    gray: {
      '100': '#F7FAFC',
      '200': '#EDF2F7',
      '300': '#E2E8F0',
      '400': '#CBD5E0',
      '500': '#A0AEC0',
      '600': '#718096',
      '700': '#4A5568',
      '800': '#2D3748',
      '900': '#1A202C',
    },
    accent: '#FF6B52',
    surface: '#1E2538',
    elevatedSurface: '#2A3349',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E0',
    textTertiary: '#A0AEC0',
    textInverted: '#1A202C',
    textError: '#FF4D4D',
    border: '#2D3748',
    divider: '#2D3748',
    disabled: '#4A5568',
    focus: '#4B9FE1',
    hover: '#3D8BD0',
    glowPrimary: 'rgba(75, 159, 225, 0.4)',
    glowSecondary: 'rgba(255, 107, 82, 0.4)',
    glowAccent: 'rgba(255, 107, 82, 0.4)',
    // Propiedades adicionales requeridas
    textMuted: '#718096',
    success: '#48BB78',
    error: '#F56565',
    warning: '#ED8936',
    info: '#4299E1',
    gradientPrimary: 'linear-gradient(135deg, #4B9FE1 0%, #56CCF2 100%)',
    gradientSecondary: 'linear-gradient(135deg, #FF6B52 0%, #F2994A 100%)',
    gradientAccent: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '4rem',
  },
  transitions: {
    slow: '0.5s ease',
    medium: '0.3s ease',
    fast: '0.15s ease',
  },
  zIndex: {
    background: -10,
    normal: 1,
    menu: 100,
    overlay: 200,
    modal: 300,
    toast: 400,
  },
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
  effects: {
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    glowEffect: '0 0 15px',
    // Propiedades adicionales requeridas
    hoverScale: 'scale(1.05)',
    hoverGlow: '0 0 10px rgba(75, 159, 225, 0.6)',
    transitionFast: 'all 0.15s ease',
    transitionMedium: 'all 0.3s ease',
    transitionSlow: 'all 0.5s ease',
  },
};

// Exportamos el tema oscuro también con el nombre darkTheme para mantener compatibilidad
export const darkTheme = theme; 
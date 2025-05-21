/**
 * Componente contenedor para los componentes de MUI
 * Este wrapper proporciona el contexto necesario para que los componentes de MUI funcionen correctamente
 * con el caché de Emotion personalizado.
 */
import React from 'react';
import { CacheProvider } from '@emotion/react';
import emotionCache from './emotion-cache';

const MuiWrapper = ({ children }) => {
  return (
    <CacheProvider value={emotionCache}>
      {children}
    </CacheProvider>
  );
};

export default MuiWrapper; 
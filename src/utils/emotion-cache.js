/**
 * Configuración personalizada para Emotion Cache
 * Esta solución ayuda a resolver problemas de compatibilidad entre Emotion y styled-components
 */
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';

// Configuración básica del cache sin middleware personalizado
const emotionCache = createCache({
  key: 'mui-style',
  stylisPlugins: [prefixer],
  // No usar insertionPoint para evitar conflictos
  // No usar middleware personalizado para evitar errores
});

export default emotionCache; 
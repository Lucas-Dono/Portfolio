/**
 * Archivo de alias para importaciones problemáticas de MUI
 * Este archivo reexporta componentes y utilidades de MUI con importaciones corregidas
 * para evitar problemas de compatibilidad en el proyecto.
 */

// Importar PropTypes correctamente
import PropTypes from 'prop-types';

// Reexportar elementAcceptingRef personalizado
import elementAcceptingRef from './mui-elementAcceptingRef';

// Exportar todo lo que podríamos necesitar de Material UI
export {
  PropTypes,
  elementAcceptingRef
}; 
import React from 'react';
import Navbar from './ui/Navbar'; // Importar el Navbar rediseñado

// El componente Header ahora es mucho más simple
const Header: React.FC = () => {
  // Podrías pasar props a Navbar aquí si fueran necesarias,
  // por ejemplo, una función para toggleChat si la usaras fuera de Navbar.
  // const toggleChat = () => { /* lógica para abrir/cerrar chat */ };

  return (
    <header>
      <Navbar 
        // toggleChat={toggleChat} // Ejemplo de cómo pasar una prop
      />
    </header>
  );
};

export default Header;

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Interfaz para el contexto
interface ScrollContextType {
  scrollPercent: number;
  currentSection: string;
  scrollTo: (sectionId: string) => void;
}

// Crear el contexto con valores por defecto
const ScrollContext = createContext<ScrollContextType>({
  scrollPercent: 0,
  currentSection: '',
  scrollTo: () => {},
});

// Props para el proveedor
interface ScrollProviderProps {
  children: ReactNode;
  sections: string[];
}

// Proveedor del contexto de scroll
export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children, sections }) => {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentSection, setCurrentSection] = useState(sections[0] || '');

  // Calcular el porcentaje de scroll y la sección actual
  const calculateScrollPosition = useCallback(() => {
    // Calcular el porcentaje de scroll (asegurarse de que no exceda 1)
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = Math.min(window.scrollY / scrollHeight, 1);
    setScrollPercent(percent);

    // Determinar la sección visible actual, iterando de abajo hacia arriba para tomar la más profunda
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const element = document.getElementById(section);
      if (element) {
        // Calcular la posición relativa al viewport
        const rect = element.getBoundingClientRect();
        
        // Criterio de visibilidad: al menos parte del elemento está visible
        // (el top es menor que la mitad de la ventana y el bottom es mayor que 0)
        if (rect.top < window.innerHeight / 2 && rect.bottom > 0) {
          setCurrentSection(section);
          break;
        }
      }
    }
  }, [sections]);

  // Función para desplazarse a una sección
  const scrollTo = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Calcular la posición correcta para un scroll suave
      const headerOffset = 80; // Ajuste para el navbar si es necesario
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Efecto para configurar el listener de scroll
  useEffect(() => {
    // Listener para los eventos de scroll
    window.addEventListener('scroll', calculateScrollPosition, { passive: true });
    
    // Calcular la posición inicial después de un breve retraso
    // (permite que la página se renderice completamente)
    const timeout = setTimeout(() => {
      calculateScrollPosition();
    }, 100);
    
    // Limpieza al desmontar
    return () => {
      window.removeEventListener('scroll', calculateScrollPosition);
      clearTimeout(timeout);
    };
  }, [calculateScrollPosition]);

  // Pasar los valores al proveedor
  return (
    <ScrollContext.Provider value={{ scrollPercent, currentSection, scrollTo }}>
      {children}
    </ScrollContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useScroll = () => useContext(ScrollContext);

export default ScrollProvider; 
import React, { useEffect, useRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  threshold?: number;
  delay?: number;
  duration?: number;
  distance?: string;
  origin?: 'top' | 'right' | 'bottom' | 'left';
  reset?: boolean;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  threshold = 0.1,
  delay = 0,
  duration = 800,
  distance = '50px',
  origin = 'bottom',
  reset = false,
  className = '',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const section = sectionRef.current;
    
    if (!section) return;
    
    // Configurar estilos iniciales basados en la dirección
    const setInitialStyles = () => {
      if (section) {
        section.style.opacity = '0';
        section.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
        section.style.transitionDelay = `${delay}ms`;
        
        switch (origin) {
          case 'top':
            section.style.transform = `translateY(-${distance})`;
            break;
          case 'right':
            section.style.transform = `translateX(${distance})`;
            break;
          case 'bottom':
            section.style.transform = `translateY(${distance})`;
            break;
          case 'left':
            section.style.transform = `translateX(-${distance})`;
            break;
          default:
            section.style.transform = `translateY(${distance})`;
        }
      }
    };
    
    // Función para manejar la animación
    const handleReveal = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translate(0, 0)';
          
          if (!reset) {
            observer.unobserve(entry.target);
          }
        } else if (reset) {
          setInitialStyles();
        }
      });
    };
    
    // Crear el observer
    const observer = new IntersectionObserver(handleReveal, {
      threshold,
      rootMargin: '0px',
    });
    
    // Aplicar estilos iniciales y comenzar a observar
    setInitialStyles();
    observer.observe(section);
    
    // Limpieza
    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, [threshold, delay, duration, distance, origin, reset]);
  
  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal; 
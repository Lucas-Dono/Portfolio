import React, { useEffect, memo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import { media } from '../../styles/breakpoints';

// Contenedor fijo para el fondo global
const BackgroundWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  overflow: hidden;
  min-height: 100vh;
`;

// Capa de estrellas para añadir profundidad
const StarryBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-image: 
    radial-gradient(1px 1px at 25% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 100%),
    radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 100%),
    radial-gradient(2px 2px at 20% 70%, rgba(255, 255, 255, 0.15) 0%, transparent 100%),
    radial-gradient(2px 2px at 90% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  background-size: 550px 550px, 350px 350px, 250px 250px, 150px 150px, 100px 100px;
`;

// Overlay de grid del Home
const GridOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-image:
    linear-gradient(rgba(17, 17, 17, 1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(17, 17, 17, 1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.25;
`;

// Mantenemos un círculo principal de fondo para dar efecto de profundidad
const MainGlow = styled(motion.div)`
  position: absolute;
  width: 800px;
  height: 800px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  filter: blur(150px);
  opacity: 0.15;
  z-index: -1;
`;

// Contenedor específico para partículas con z-index adecuado
const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: auto;
  
  ${media.md} {
    display: none;
  }
`;

const GlobalBackgroundComponent: React.FC = () => {
  // Inicialización de partículas con manejo de errores mejorado
  const particlesInit = async (engine: any) => {
    try {
      console.log("Inicializando partículas...");
      await loadFull(engine);
      console.log("Partículas cargadas correctamente!");
    } catch (error) {
      console.error("Error al cargar partículas:", error);
    }
  };

  useEffect(() => {
    console.log("GlobalBackground montado");
    return () => console.log("GlobalBackground desmontado");
  }, []);

  return (
  <BackgroundWrapper>
      {/* Capa base de estrellas estáticas */}
    <StarryBackground />
      
      {/* Brillo central */}
      <MainGlow
        initial={{ opacity: 0.15, background: '#FF00FF' }}
      animate={{ 
          opacity: [0.1, 0.2, 0.1],
          background: ['#FF00FF', '#00FFFF', '#FF00FF'],
          scale: [1, 1.1, 1]
      }}
      transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
    />
      
      {/* Grid overlay */}
      <GridOverlay />
      
      {/* Capa interactiva de partículas */}
      <ParticlesContainer>
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: {
              color: {
                value: "transparent",
              },
            },
            fullScreen: {
              enable: false,
            },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "push",
                },
                onHover: {
                  enable: false,
                  mode: "grab",
                  parallax: {
                    enable: false
                  }
                },
                resize: true,
              },
              modes: {
                push: {
                  quantity: 3,
                },
                grab: {
                  distance: 150,
                  line_linked: {
                    opacity: 0.5
                  }
                },
                repulse: {
                  distance: 100,
                  duration: 0.4,
                },
              },
            },
            particles: {
              color: {
                value: ["#FF00FF", "#00FFFF", "#00FFAA"],
              },
              links: {
                color: "#00FFFF",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
              },
              collisions: {
                enable: true,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "out",
                },
                random: false,
                speed: 0.3,
                straight: false,
                attract: {
                  enable: false,
                  rotateX: 0,
                  rotateY: 0
                }
              },
              number: {
                density: {
                  enable: true,
                  area: 1200,
                  factor: 1500,
                },
                value: 120,
                limit: 200,
              },
              opacity: {
                value: 0.5,
                random: true,
                anim: {
                  enable: true,
                  speed: 0.2,
                  opacity_min: 0.3,
                  sync: false
                }
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 0.8, max: 3 },
                random: true
              },
            },
            detectRetina: true,
          }}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0, 
            width: '100%', 
            height: '100%',
            zIndex: 0
          }}
    />
      </ParticlesContainer>
  </BackgroundWrapper>
);
};

// Exportar la versión memoizada
const GlobalBackground = memo(GlobalBackgroundComponent);

export default GlobalBackground; 
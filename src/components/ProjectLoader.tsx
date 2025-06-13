// ProjectLoader.tsx
import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
  id: string;
  title: string;
  description: string;
  clientPort: number;
  serverPort: number;
  technologies: string[];
  url?: string; // Nueva propiedad para la URL pública
}

const projects: Project[] = [
  {
    id: 'freevibes',
    title: 'FreeVibes',
    description: 'Reproductor de música integrado con spotify, youtube y lastFm para poder escuchar música de forma gratuita.',
    clientPort: 5173,
    serverPort: 5000,
    technologies: ['React', 'TypeScript', 'Styled Comp.', 'YouTube API', 'MongoDB', 'Spotify API', 'LastFM API', 'Express', 'Node.js', 'LRCLIB API'],
    url: 'https://freevibes.vercel.app'
  },
  {
    id: 'tech-store',
    title: 'Tech Store',
    description: 'Tienda en línea de productos tecnológicos con carrito de compras y gestión de productos.',
    clientPort: 5174,
    serverPort: 5001,
    technologies: ['React', 'TypeScript', 'Styled Comp.', 'Context API'],
    url: 'https://tech-store-livid.vercel.app'
  }
];

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const LaunchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

interface ProjectLoaderProps {
  openProject: string | null;
  setOpenProject: (projectId: string | null) => void;
}

interface TechTagProps {
  children?: React.ReactNode;
}

const LoaderContainer = styled.div`
  padding: 4rem 2rem;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
`;

const ProjectCardStyled = styled(motion.div)`
  background: rgba(17, 17, 17, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  backdrop-filter: blur(5px);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const CardContent = styled.div`
  padding: 1.8rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const ProjectTitle = styled.h3`
  font-size: 1.6rem;
  margin-bottom: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #00FFFF 0%, #FFFF00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ProjectDescription = styled.p`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 1.5rem;
  line-height: 1.7;
`;

const TechContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
`;

const TechTag = styled.span<TechTagProps>`
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`;

const PortsInfo = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
`;

const CardActions = styled.div`
  padding: 0 1.8rem 1.8rem;
`;

const ViewProjectButton = styled(motion.button)`
  width: 100%;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00A0FF 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: filter 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 6px 20px rgba(255, 0, 255, 0.3);
  }
`;

// --- Componentes Estilizados (Modal) ---

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(5, 5, 5, 0.85); // Fondo oscuro semi-transparente
  backdrop-filter: blur(8px);
  z-index: 1100; // Encima de otros elementos
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background-color: #0a0a0a; // Ligeramente más claro que el fondo base
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  height: 100%;
  max-width: 95vw; // Ancho máximo
  max-height: 90vh; // Alto máximo
  overflow: hidden; // Para contener el iframe
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
`;

const ModalTitle = styled.h2`
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

// Reutilizar estilo de CloseButton de Chat.tsx
const ModalCloseButton = styled(motion.button)`
  background: none;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  color: #aaa;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const AlertInfo = styled.div`
    background-color: rgba(0, 255, 255, 0.1);
    color: #00FFFF;
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(0, 255, 255, 0.2);
    text-align: center;
    flex-shrink: 0;
`;

const IframeContainer = styled.div`
    flex-grow: 1;
    overflow: hidden; // Asegurar que no haya scroll extra
`;

// Añadir interfaz para props de iframe
interface StyledIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {}

const StyledIframe = styled.iframe<StyledIframeProps>` // Usar la interfaz
    width: 100%;
    height: 100%;
    border: none;
`;

// --- Componente Principal --- 
const ProjectLoader: React.FC<ProjectLoaderProps> = ({ openProject, setOpenProject }) => {
  const currentProject = projects.find(p => p.id === openProject);

  const cardVariants = {
      hidden: { opacity: 0, y: 30 },
      visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: {
              delay: i * 0.1,
              duration: 0.5,
              ease: "easeOut"
          }
      })
  };

  const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const modalContentVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
        scale: 1, 
        opacity: 1, 
        transition: { duration: 0.4, ease: "easeOut" } 
    },
    exit: { 
        scale: 0.9, 
        opacity: 0, 
        transition: { duration: 0.3, ease: "easeIn" } 
    }
  };

  return (
    <LoaderContainer>
      <ProjectsGrid>
        {projects.map((project, index) => (
          <ProjectCardStyled 
            key={project.id} 
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={{ y: -8 }}
          >
            <CardContent>
              <ProjectTitle>{project.title}</ProjectTitle>
              <ProjectDescription>{project.description}</ProjectDescription>
              <TechContainer>
                  {project.technologies.map((tech) => (
                  <TechTag key={tech}>{tech}</TechTag>
                  ))}
              </TechContainer>
              <PortsInfo>
                Puerto Cliente: {project.clientPort}<br />
                Puerto Servidor: {project.serverPort}
              </PortsInfo>
            </CardContent>
            <CardActions>
              <ViewProjectButton 
                onClick={() => setOpenProject(project.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <LaunchIcon />
                Ver Proyecto
              </ViewProjectButton>
            </CardActions>
          </ProjectCardStyled>
        ))}
      </ProjectsGrid>

      {/* Modal Implementado */}
      <AnimatePresence>
        {openProject && currentProject && (
          <ModalOverlay
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setOpenProject(null)} // Cerrar al hacer clic fuera
      >
            <ModalContent
              variants={modalContentVariants}
              onClick={(e) => e.stopPropagation()} // Evitar que el clic se propague al overlay
            >
              <ModalHeader>
                  <ModalTitle>{currentProject.title}</ModalTitle>
                  <ModalCloseButton 
            onClick={() => setOpenProject(null)}
                    aria-label="Cerrar modal"
          >
            <CloseIcon />
                  </ModalCloseButton>
              </ModalHeader>
          
              <AlertInfo>
                {/* Mostrar la URL pública si existe, si no mostrar localhost */}
                {currentProject.url
                  ? `Proyecto desplegado: ${currentProject.url}`
                  : `Asegúrate de que el proyecto esté ejecutándose en http://localhost:${currentProject.clientPort}`}
              </AlertInfo>
              
              <IframeContainer>
                 <StyledIframe
                src={currentProject.url ? currentProject.url : `http://localhost:${currentProject.clientPort}`}
                title={currentProject.title}
              />
              </IframeContainer>
            </ModalContent>
          </ModalOverlay>
          )}
      </AnimatePresence>
    </LoaderContainer>
  );
};

export default ProjectLoader;

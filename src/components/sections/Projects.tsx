import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { media } from '../../styles/breakpoints';

// Interfaces
interface Project {
  id: string;
  title: string;
  description: string;
  images?: string[];
  category: Category;
  technologies: string[];
  demoUrl?: string;
  repoUrl?: string;
  openMode?: 'modal' | 'url'; // Nueva propiedad
}

type Category = 'Web App' | 'Mobile App' | 'Backend' | 'Design';

// Agregada interfaz para TechTag
interface TechTagProps {
  children?: React.ReactNode;
}

// Agregada interfaz para CardButton/DemoButton
interface CardButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
}

interface StyledComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

// Estilos
const ProjectsSection = styled.section.withConfig({
  shouldForwardProp: (prop) => !['ref'].includes(prop)
})<StyledComponentProps>`
  /* padding: 100px 0; */
  position: relative;
  overflow: hidden;
  padding: 100px 0; /* Padding base */

  ${media.lg} {
      padding: 90px 0;
  }
  
  ${media.md} {
    padding: 70px 0; /* Menos padding en tablets */
  }

  ${media.xs} {
    padding: 50px 0; /* Menos padding en móviles */
  }
`;

const SectionContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 5;

  @media (max-width: 480px) {
    padding: 0 1rem;
  }
`;

// Variables no utilizadas, las comentamos para evitar advertencias
/* 
const LocalSectionTitle = styled.h2`
  font-size: clamp(2.5rem, 8vw, 4rem);
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #00FFFF 0%, #FFFF00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: linear-gradient(135deg, #00FFFF 0%, #FFFF00 100%);
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
    border-radius: 2px;
  }
`;

// Variables no utilizadas, las comentamos para evitar advertencias
/*
const SectionDescription = styled.p`
  text-align: center;
  max-width: 800px;
  margin: 0 auto 3rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
`;
*/

// Añadir interfaz explícita que incluya props de motion y children
interface FilterContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

const FilterContainer = styled(motion.div)<FilterContainerProps>`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 3rem;

  ${media.xs} {
    display: flex;
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
    scroll-snap-type: x mandatory;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
    
    &::-webkit-scrollbar {
      display: none; /* Webkit browsers */
    }
  }
`;

const FilterButton = styled(motion.button)<{ $isActive: boolean }>`
  padding: 0.6rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$isActive ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.$isActive ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  border: 1px solid ${props => props.$isActive ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
  box-shadow: ${props => props.$isActive ? '0 4px 15px rgba(255, 0, 255, 0.2)' : 'none'};

  &:hover {
    background: ${props => props.$isActive ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' : 'rgba(255, 255, 255, 0.15)'};
    color: white;
    border-color: ${props => props.$isActive ? 'transparent' : 'rgba(255, 255, 255, 0.4)'};
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1.2rem;
    font-size: 0.9rem;
    flex: 0 0 auto;
    scroll-snap-align: center;
    min-width: fit-content;
  }
`;

const ProjectsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  ${media.xs} {
    display: flex; 
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 1.2rem;
    padding-bottom: 1.5rem; 
    scroll-snap-type: x mandatory;
    scrollbar-width: none; 
    -ms-overflow-style: none; 
    margin: 0 -1rem; /* Compensar padding del contenedor */
    padding: 0 1rem 1.5rem 1rem;
    position: relative; /* Necesario para el pseudo-elemento */
    
    &::-webkit-scrollbar {
      display: none; 
    }
    
    /* Añadir el degradado indicador */
    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 1.5rem; /* Coincidir con padding-bottom */
      width: 40px;
      background: linear-gradient(to right, rgba(5, 5, 5, 0), rgba(5, 5, 5, 1) 80%); /* Ajustar color base */
      pointer-events: none;
      /* Necesita estar en el padding-right del contenedor virtual */
      right: 1rem; /* Posicionar sobre el padding-right */
    }
  }
`;

const ProjectCard = styled(motion.div)`
  background: rgba(17, 17, 17, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  ${media.xs} {
    flex: 0 0 80%; /* Reducir un poco más el ancho para ver mejor la siguiente */
    scroll-snap-align: center;
    height: auto;
    max-height: 290px; /* Reducir altura máxima */
    overflow: hidden; 
    margin-right: 0.8rem; /* Más separación */
    
    &:first-child {
      margin-left: 0.8rem;
    }
    
    &:hover {
      transform: translateY(-5px);
    }
  }
`;

const ProjectImage = styled.div`
  width: 100%;
  height: 200px;
  background-color: #1a1a1a;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1);
    position: absolute;
    left: 0;
    top: 0;
  }

  ${ProjectCard}:hover & .carousel-dots {
    opacity: 1;
    pointer-events: auto;
  }

  .carousel-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
    z-index: 2;
  }

  .carousel-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    border: none;
    outline: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    padding: 0;
  }
  .carousel-dot.active {
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    transform: scale(1.2);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 50%);
    z-index: 1;
  }
`;

const ProjectPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 50px;
    height: 50px;
    color: rgba(255, 255, 255, 0.2);
  }
`;

const CardContent = styled.div`
  padding: 1.5rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  
  ${media.xs} {
    padding: 1rem; /* Menos padding interno */
  }
`;

const ProjectTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  ${media.xs} {
    font-size: 1.1rem; /* Reducir un poco más */
    margin-bottom: 0.4rem;
  }
`;

const ProjectDescription = styled.p`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  line-height: 1.6;
  flex-grow: 1;
  
  ${media.xs} {
    font-size: 0.8rem; /* Reducir un poco más */
    line-height: 1.45; /* Ligeramente más compacto */
    margin-bottom: 0.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Mostrar máximo 2 líneas */
    -webkit-box-orient: vertical;  
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const TechContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  
  ${media.xs} {
    margin-bottom: 1rem; /* Menos margen */
  }
`;

const TechTag = styled.span<TechTagProps>`
  padding: 0.35rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 30px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  ${media.xs} {
    padding: 0.3rem 0.6rem; /* Más pequeño */
    font-size: 0.75rem; /* Más pequeño */
  }
`;

// Variable no utilizada, la comentamos para evitar advertencias
/*
const CardActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: auto;
`;
*/

const CardButton = styled.a<CardButtonProps>`
  padding: 0.5rem 1rem;
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 0.9rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  flex-grow: 1;
  text-align: center;
    
    &:hover {
    background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const DemoButton = styled(CardButton)`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  border: none;
  
  &:hover {
    filter: brightness(1.1);
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    border: none;
  }
`;

const ProjectModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ProjectModalContent = styled(motion.div)`
  background-color: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 800px; 
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    max-width: 95vw;
    max-height: 90vh;
    border-radius: 12px;
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 1rem;
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
  z-index: 10;
    
    &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: #0a0a0a;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

// Añadir interfaz para ModalProjectImage
interface ModalProjectImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}
const ModalProjectImage = styled.img<ModalProjectImageProps>`
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    
    ${media.xs} {
      max-height: 250px; /* Altura máxima más pequeña en móviles */
    }
`;

const ModalProjectDescription = styled.p`
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.7;
    margin-bottom: 1.5rem;
`;

const ModalTechList = styled.div`
    margin-bottom: 1.5rem;
`;

const ModalLinkContainer = styled.div`
    display: flex;
    gap: 1rem;
`;

const ModalProjectLink = styled(CardButton)`
    flex-grow: 0;
`;

// Componente Carrusel de Imágenes para la tarjeta
const ProjectImageCarousel: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setFade(true);
    timeoutRef.current = setTimeout(() => {
      setFade(false);
      timeoutRef.current = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 600); // Duración del fade out
    }, 3000); // Tiempo visible cada imagen
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, images.length]);

  const goTo = (idx: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(idx);
      setFade(true);
    }, 300);
  };

  return (
    <>
      {images.map((img, idx) => (
        <img
          key={img}
          src={img}
          alt={alt}
          style={{
            opacity: idx === current && fade ? 1 : 0,
            zIndex: idx === current ? 2 : 0,
            transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      ))}
      <div className="carousel-dots">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`carousel-dot${idx === current ? ' active' : ''}`}
            onClick={e => {
              e.stopPropagation();
              goTo(idx);
            }}
            aria-label={`Ver imagen ${idx + 1}`}
          />
        ))}
      </div>
    </>
  );
};

// Datos de ejemplo (estos vendrían de tus proyectos reales)
const projectsData: Project[] = [
  {
    id: 'tech-store',
    title: 'Tech Store',
    description: 'Tienda online con React, Material-UI y Context API para gestión de estado.',
    images: ['/images/tech-store.webp'],
    category: 'Web App',
    technologies: ['React', 'Material-UI', 'Context API'],
    demoUrl: 'https://tech-store-livid.vercel.app',
    repoUrl: 'https://github.com/lucashozo/Tech-store',
    openMode: 'url'
  },
  {
    id: 'freevibes',
    title: 'FreeVibes',
    description: 'Reproductor de música integrado con spotify, youtube y lastFm para poder escuchar música de forma gratuita.',
    images: [],
    category: 'Web App',
    technologies: ['React', 'TypeScript', 'Styled Comp.', 'YouTube API', 'MongoDB', 'Spotify API', 'LastFM API', 'Express', 'Node.js', 'LRCLIB API'],
    demoUrl: 'https://freevibes.vercel.app',
    repoUrl: 'https://github.com/lucashozo/FreeVibes',
    openMode: 'url'
  },
  {
    id: 'automessenger',
    title: 'AutoMessenger',
    description: 'Programa backend que maneja una IA GPT para contestar mensajes de manera autónoma en WhatsApp, Gmail u otros sitios web de forma económica. Incluye un frontend para su configuración.',
    images: [],
    category: 'Backend',
    technologies: ['Node.js', 'Express', 'OpenAI API', 'React', 'MongoDB', 'Websockets'],
    demoUrl: '',
    repoUrl: '',
    openMode: 'modal'
  }
];

// Componente principal
const Projects: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<Category | 'All'>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const controls = useAnimation();
  const filterContainerRef = useRef<HTMLDivElement>(null);
  
  // Categorías únicas para los filtros
  const categories = useMemo(() => 
      ['All', ...new Set(projectsData.map(p => p.category))] as const,
    []);
  
  // Función para filtrar proyectos por categoría
  const handleFilterChange = (category: Category | 'All') => {
    setActiveFilter(category);
  };
  
  // Función para desplazarse al filtro seleccionado
  const scrollToActiveFilter = () => {
    if (filterContainerRef.current && window.innerWidth <= 480) {
      const container = filterContainerRef.current;
      const activeButton = container.querySelector('[data-active="true"]') as HTMLElement;
      
      if (activeButton) {
        const containerWidth = container.offsetWidth;
        const scrollLeft = activeButton.offsetLeft - containerWidth / 2 + activeButton.offsetWidth / 2;
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };
  
  useEffect(() => {
    controls.start("visible");
  }, [controls]);
  
  useEffect(() => {
    scrollToActiveFilter();
  }, [activeFilter]);
  
  const openModal = (project: Project) => {
    setSelectedProject(project);
  };
  
  const closeModal = () => {
    setSelectedProject(null);
  };
  
  const filteredProjects = useMemo(() => {
      if (activeFilter === 'All') return projectsData;
      return projectsData.filter(p => p.category === activeFilter);
  }, [activeFilter]);
  
  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };
  
  const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const modalContentVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { scale: 0.9, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }
  };
  
  return (
    <ProjectsSection 
      id="projects"
    >
      <SectionContent>
        <motion.h2 
          style={{ 
            textAlign: 'center',
            fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', // Tamaño de fuente reducido en móviles
            fontWeight: 700,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Mis Proyectos
        </motion.h2>
         <motion.div 
           style={{ 
              height: '4px', 
              width: '100px',
              background: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
              boxShadow: '0 0 12px rgba(255, 0, 255, 0.5)',
              borderRadius: '4px',
              margin: '0.5rem auto 1.5rem auto'
            }}
           initial={{ width: 0, opacity: 0 }}
           whileInView={{ width: 100, opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
         />
         <motion.p 
           style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.2rem',
              maxWidth: '750px',
              margin: '0 auto 3rem auto',
              lineHeight: 1.7,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center'
            }}
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
         >
           Explora algunos de mis trabajos recientes.
         </motion.p>

        <FilterContainer
           variants={staggerContainerVariants}
           initial="hidden"
           animate={controls}
          ref={filterContainerRef}
        >
          {categories.map(category => (
              <FilterButton
                key={category}
              $isActive={activeFilter === category}
                onClick={() => handleFilterChange(category)}
              variants={fadeInUpVariants} 
              whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              data-active={activeFilter === category ? "true" : "false"}
              >
                {category}
              </FilterButton>
            ))}
          </FilterContainer>

        <ProjectsGrid
           variants={staggerContainerVariants}
           initial="hidden"
           animate={controls}
        >
          <AnimatePresence mode='wait'>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                variants={fadeInUpVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
                whileHover={{ y: -10 }} 
                onClick={() => {
                  if (project.openMode === 'url' && project.demoUrl) {
                    window.open(project.demoUrl, '_blank');
                  } else {
                    openModal(project);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <ProjectImage>
                  {project.images && project.images.length > 0 ? (
                    <ProjectImageCarousel images={project.images} alt={project.title} />
                  ) : (
                    <ProjectPlaceholder>
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                    </ProjectPlaceholder>
                  )}
                </ProjectImage>
                <CardContent>
                  <ProjectTitle>{project.title}</ProjectTitle>
                  <ProjectDescription>{project.description}</ProjectDescription>
                  <TechContainer>
                    {project.technologies.map((tech, techIndex) => (
                      <TechTag key={techIndex}>{tech}</TechTag>
                    ))}
                  </TechContainer>
                </CardContent>
              </ProjectCard>
          ))}
          </AnimatePresence>
        </ProjectsGrid>

        {/* Modal */} 
        <AnimatePresence>
            {selectedProject && (
                <ProjectModalOverlay
                    variants={modalOverlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={closeModal}
                >
                    <ProjectModalContent
                        variants={modalContentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CloseButton onClick={closeModal} aria-label="Cerrar modal">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </CloseButton>
                        <ModalHeader>
                            <ModalTitle>{selectedProject.title}</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                             {selectedProject.images && selectedProject.images.length > 0 && (
                                <ModalProjectImage src={selectedProject.images[0]} alt={selectedProject.title} />
                             )}
                            <ModalProjectDescription>{selectedProject.description}</ModalProjectDescription>
                            <ModalTechList>
                                {selectedProject.technologies.map((tech, index) => (
                                    <TechTag key={index}>{tech}</TechTag>
                                ))}
                            </ModalTechList>
                            <ModalLinkContainer>
                                {selectedProject.demoUrl && selectedProject.demoUrl !== '#' && (
                                    <DemoButton href={selectedProject.demoUrl} target="_blank" rel="noopener noreferrer">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                        Ver Demo
                                    </DemoButton>
                                )}
                                {selectedProject.repoUrl && (
                                    <ModalProjectLink href={selectedProject.repoUrl} target="_blank" rel="noopener noreferrer">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-1.5 6-8 0-1.25-.5-2.5-1-3.5.1-.5.4-1.75-.1-3.5 0 0-1-.35-3.5 1.5a12.3 12.3 0 0 0-6.5 0C4.85 2.15 3.85 2.5 3.85 2.5c-.5 1.75-.2 3-.1 3.5-.5 1-1 2.25-1 3.5 0 6.5 3 8 6 8a4.8 4.8 0 0 0-1 3.5v4"/></svg>
                                        Ver Código
                                    </ModalProjectLink>
                                )}
                            </ModalLinkContainer>
                        </ModalBody>
                    </ProjectModalContent>
                </ProjectModalOverlay>
            )}
        </AnimatePresence>

      </SectionContent>
    </ProjectsSection>
  );
};

export default Projects;
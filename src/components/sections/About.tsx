import React from 'react';
import { motion } from 'framer-motion';
import './../../styles/About.css';

interface Technology {
  name: string;
  icon: string;
  color: string;
  category: string;
}

interface TechIconProps {
  name: string;
  color: string;
  icon: string;
}

// Tecnologías (logos e información)
const technologies: Technology[] = [
  {
    name: 'React',
    icon: 'Reactlogo.png',
    color: '#61DAFB',
    category: 'Frontend'
  },
  {
    name: 'TypeScript',
    icon: 'typescript.svg',
    color: '#3178C6',
    category: 'Frontend'
  },
  {
    name: 'Node.js',
    icon: 'Nodejslogo.png',
    color: '#8CC84B',
    category: 'Backend'
  },
  {
    name: 'Express',
    icon: 'Expresslogo.png',
    color: '#000000',
    category: 'Backend'
  },
  {
    name: 'MongoDB',
    icon: 'mongoDBlogo.png',
    color: '#4DB33D',
    category: 'Database'
  },
  {
    name: 'PostgreSQL',
    icon: 'Postgreesqllogo.png',
    color: '#336791',
    category: 'Database'
  },
  {
    name: 'Redux',
    icon: 'reduxlogo.svg',
    color: '#764ABC',
    category: 'Frontend'
  },
  {
    name: 'Next.js',
    icon: 'nextjslogo.png',
    color: '#000000',
    category: 'Frontend'
  },
  {
    name: 'GraphQL',
    icon: 'GraphQLlogo.png',
    color: '#E10098',
    category: 'API'
  },
  {
    name: 'Tailwind',
    icon: 'Tailwindlogo.png',
    color: '#38B2AC',
    category: 'CSS'
  },
  {
    name: 'Framer Motion',
    icon: 'framermotionlogo.svg',
    color: '#0055FF',
    category: 'Animation'
  },
  {
    name: 'CSS',
    icon: 'csslogo.png',
    color: '#1572B6',
    category: 'CSS'
  }
];

// Variantes de animación para elementos
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: "easeOut" 
    }
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 1 },
    visible: { 
      opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
    }
  };
  
const techItemVariants = {
  hidden: { opacity: 0, y: 20 },
    visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const TechIcon: React.FC<TechIconProps> = ({ name, color, icon }) => {
  // Función para convertir colores hex a componentes rgb
  const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const rgb = hexToRgb(color);
  
  // Determinar si el logo necesita fondo blanco (para logos oscuros)
  const needsWhiteBg = ['Next.js', 'Express'].includes(name);
  const bgColor = needsWhiteBg ? 'rgba(255, 255, 255, 0.9)' : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  
  return (
    <motion.div
      className="tech-item"
      whileHover={{ 
        scale: 1.05, 
        boxShadow: `0 10px 25px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` 
      }}
      variants={techItemVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="tech-icon" style={{ backgroundColor: bgColor }}>
        <img 
          src={`/logo/${icon}`} 
          alt={name} 
          className="tech-img"
          loading="eager"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = '/icons/placeholder.svg';
          }}
        />
      </div>
      <div className="tech-name">{name}</div>
    </motion.div>
  );
};

const About: React.FC = () => {
  return (
    <div className="about-section" id="sobre-mi">
      {/* Eliminar Elementos de fondo */}
      
      <div className="content-container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUpVariants}
          className="header-container"
        >
          <h2 className="section-title">Sobre Mí</h2>
          <div className="divider"></div>
        </motion.div>
        
        <div className="about-content">
          <motion.div 
            className="about-image"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUpVariants}
          >
            <div className="image-container">
              <div className="image-frame"></div>
              <img src="/profile-image.jpg" alt="Lucas Dono" />
            </div>
          </motion.div>
          
          <motion.div 
            className="about-text"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainerVariants}
          >
            <motion.p variants={fadeInUpVariants} className="text-paragraph highlight">
              Desarrollador apasionado por crear experiencias digitales atractivas 
              y funcionales que resuelven problemas reales.
            </motion.p>
            
            <motion.p variants={fadeInUpVariants} className="text-paragraph">
              Habiendo trabajado en el mundo del desarrollo web por un año,
              tuve el placer de trabajar en proyectos de todo tipo, desde páginas web
              hasta modelos de IA para automatizar ventas.
            </motion.p>
            
            <motion.p variants={fadeInUpVariants} className="text-paragraph">
              Me apasiona el aprendizaje continuo y me mantengo actualizado con las 
              últimas tendencias y mejores prácticas en desarrollo. Mi objetivo es 
              crear soluciones elegantes para problemas complejos, siempre con un 
              enfoque en el rendimiento, la accesibilidad y la experiencia del usuario.
            </motion.p>
            
            <motion.div variants={fadeInUpVariants} className="stats-container">
              <div className="stat-item">
                <span className="stat-number">1</span>
                <span className="stat-label">Año de experiencia</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">5</span>
                <span className="stat-label">Proyectos completados</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">7</span>
                <span className="stat-label">Tecnologías dominadas</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div
          className="tech-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1, margin: "100px" }}
          variants={staggerContainerVariants}
        >
          <motion.h3 variants={fadeInUpVariants} className="tech-title">
            Tecnologías
          </motion.h3>
          
          <motion.div 
            className="tech-grid"
            variants={staggerContainerVariants}
          >
                {technologies.map((tech, index) => (
              <TechIcon 
                key={index} 
                name={tech.name} 
                color={tech.color}
                icon={tech.icon}
              />
                ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About; 
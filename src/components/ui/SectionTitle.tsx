import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  showBar?: boolean;
  barPosition?: 'left' | 'center' | 'right';
  className?: string;
}

const TitleContainer = styled(motion.div)<{ alignment: string }>`
  text-align: ${props => props.alignment};
  margin-bottom: 3rem;
  position: relative;
`;

const Title = styled(motion.h2)`
  font-family: 'Poppins', sans-serif;
  font-size: clamp(2.8rem, 7vw, 4.5rem);
  font-weight: 700;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding-bottom: 0.5rem;
`;

const Bar = styled(motion.div)<{ position: string }>`
  height: 4px;
  width: 100px;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  box-shadow: 0 0 12px rgba(255, 0, 255, 0.5);
  border-radius: 4px;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  
  ${props => {
    if (props.position === 'center') {
      return 'margin-left: auto; margin-right: auto;';
    } else if (props.position === 'right') {
      return 'margin-left: auto; margin-right: 0;';
    }
    return 'margin-left: 0; margin-right: auto;';
  }}
`;

const Subtitle = styled(motion.p)`
  font-family: 'Inter', sans-serif;
  font-size: 1.2rem;
  max-width: 750px;
  margin: 0 auto;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  alignment = 'center',
  showBar = true,
  barPosition = alignment,
  className,
}) => {
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }
    }
  };
  
  const barVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: { 
      width: 100,
      opacity: 1,
      transition: { 
        duration: 0.7, 
        delay: 0.3,
        ease: "easeOut" 
      }
    }
  };
  
  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.7, 
        delay: 0.5,
        ease: "easeOut" 
      }
    }
  };
  
  return (
    <motion.div 
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
    >
      <TitleContainer alignment={alignment}>
        <Title 
          variants={titleVariants}
        >
          {title}
        </Title>
        
        {showBar && (
          <Bar 
            position={barPosition}
            variants={barVariants}
          />
        )}
        
        {subtitle && (
          <Subtitle 
            variants={subtitleVariants}
          >
            {subtitle}
          </Subtitle>
        )}
      </TitleContainer>
    </motion.div>
  );
};

export default SectionTitle; 
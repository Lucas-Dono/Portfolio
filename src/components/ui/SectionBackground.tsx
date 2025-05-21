import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface SectionBackgroundProps {
  isDarkMode: boolean;
  intensity?: 'low' | 'medium' | 'high';
  particlesEnabled?: boolean;
  scannerEnabled?: boolean;
  videoBackground?: string;
}

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background-color: #050505;
`;

const GradientOverlay = styled.div<{ 
  isDark: boolean; 
  intensity: string;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  
  background: ${props => {
    const opacity = props.intensity === 'low' 
      ? '0.08' 
      : props.intensity === 'medium' 
        ? '0.12' 
        : '0.18';
    
    return `
      radial-gradient(circle at 30% 30%, rgba(255, 0, 255, ${opacity}) 0%, rgba(5, 5, 5, 0) 70%),
      radial-gradient(circle at 70% 70%, rgba(0, 255, 255, ${opacity}) 0%, rgba(5, 5, 5, 0) 70%)
    `;
  }};
`;

const FloatingCircle = styled(motion.div)<{ 
  size: number;
  gradient: string;
  position: string;
  $isDarkMode: boolean;
}>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  
  background: ${props => props.gradient};
  
  opacity: 0.1;
  filter: blur(120px);
  
  ${props => {
    const [x, y] = props.position.split(' ');
    return `
      left: ${x};
      top: ${y};
    `;
  }}
`;

const ScannerEffect = styled(motion.div)<{ $isDarkMode: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(
    90deg, 
    transparent,
    rgba(0, 255, 255, 0.7),
    transparent
  );
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5), 0 0 25px rgba(0, 255, 255, 0.4);
  opacity: 0.6;
  z-index: 2;
  pointer-events: none;
`;

const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
`;

const Particle = styled(motion.div)<{ size: number; isDarkMode: boolean }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
`;

const VideoBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.4) contrast(1.1);
  }
`;

const SectionBackground: React.FC<SectionBackgroundProps> = ({
  isDarkMode,
  intensity = 'medium',
  particlesEnabled = true,
  scannerEnabled = true,
  videoBackground,
}) => {
  const particles = [
    { size: 8, x: '20%', y: '30%', duration: 15 },
    { size: 12, x: '80%', y: '15%', duration: 18 },
    { size: 6, x: '40%', y: '80%', duration: 12 },
    { size: 10, x: '70%', y: '60%', duration: 20 },
    { size: 15, x: '10%', y: '50%', duration: 25 },
    { size: 7, x: '60%', y: '40%', duration: 22 },
    { size: 9, x: '30%', y: '70%', duration: 19 },
  ];

  const gradient1 = 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)';
  const gradient2 = 'linear-gradient(135deg, #00FFFF 0%, #FFFF00 100%)';

  return (
    <BackgroundContainer>
      {videoBackground && (
        <VideoBackground>
          <video autoPlay muted loop playsInline>
            <source src={videoBackground} type="video/mp4" />
          </video>
        </VideoBackground>
      )}
      
      <GradientOverlay 
        isDark={isDarkMode} 
        intensity={intensity}
      />
      
      <FloatingCircle
        size={500}
        gradient={gradient1}
        position="15% 15%"
        $isDarkMode={isDarkMode}
        animate={{
          x: ['0%', '8%', '-4%', '0%'],
          y: ['0%', '-6%', '5%', '0%'],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut'}}
      />
      
      <FloatingCircle
        size={600}
        gradient={gradient2}
        position="75% 65%"
        $isDarkMode={isDarkMode}
        animate={{
          x: ['0%', '-7%', '3%', '0%'],
          y: ['0%', '4%', '-8%', '0%'],
        }}
        transition={{ duration: 25, delay: 3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut'}}
      />
      
      {particlesEnabled && (
        <ParticlesContainer>
          {particles.map((particle, index) => (
            <Particle
              key={index}
              size={particle.size}
              isDarkMode={isDarkMode}
              initial={{ 
                x: particle.x, 
                y: particle.y,
                opacity: 0 
              }}
              animate={{
                y: [particle.y, `calc(${particle.y} - 30%)`],
                opacity: [0, isDarkMode ? 0.3 : 0.2, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                repeatDelay: Math.random() * 5,
                ease: "linear"
              }}
            />
          ))}
        </ParticlesContainer>
      )}
      
      {scannerEnabled && (
        <ScannerEffect
          $isDarkMode={isDarkMode}
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </BackgroundContainer>
  );
};

export default SectionBackground; 
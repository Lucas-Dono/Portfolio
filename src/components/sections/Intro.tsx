import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const IntroContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.theme.colors.background.dark};
  z-index: ${props => props.theme.zIndex.overlay};
`;

const LogoContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Initials = styled(motion.h1)`
  font-size: 7rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, 
    ${props => props.theme.colors.primary.main}, 
    ${props => props.theme.colors.secondary}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
`;

const FullName = styled(motion.div)`
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text.light};
  margin-top: 1rem;
  opacity: 0.9;
`;

const ProgressBar = styled(motion.div)`
  width: 200px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 2rem;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.primary.main}, 
    ${props => props.theme.colors.secondary}
  );
  border-radius: 2px;
`;

const TypingText = styled(motion.p)`
  font-family: 'Fira Code', monospace;
  font-size: 1rem;
  margin-top: 1rem;
  color: ${props => props.theme.colors.primary.main};
`;

interface IntroProps {
  onComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(0);
  const typingTexts = [
    'Iniciando sistema...',
    'Cargando portfolio...',
    'Bienvenido a mi mundo digital'
  ];

  useEffect(() => {
    // Simular progreso de carga
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Esperar un poco después de completar la barra de progreso antes de desaparecer
          setTimeout(() => {
            onComplete();
          }, 500);
          
          return 100;
        }
        return newProgress;
      });
    }, 50);

    // Cambiar el texto cada cierto tiempo
    const textInterval = setInterval(() => {
      setShowText(prev => (prev < typingTexts.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <IntroContainer>
        <LogoContainer
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Initials
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            LH
          </Initials>
          <FullName
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Circuit Prompt
          </FullName>
          
          <ProgressBar>
            <ProgressFill
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </ProgressBar>
          
          <AnimatePresence mode="wait">
            <TypingText
              key={showText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {typingTexts[showText]}
            </TypingText>
          </AnimatePresence>
        </LogoContainer>
      </IntroContainer>
    </AnimatePresence>
  );
};

export default Intro; 
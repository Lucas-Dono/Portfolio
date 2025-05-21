import React from 'react';
import styled, { keyframes } from 'styled-components';

// Animación de rotación para el spinner
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Contenedor principal que envuelve el spinner
const SpinnerContainer = styled.div<{ fullPage?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  ${props => props.fullPage ? `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9999;
  ` : `
    width: 100%;
    padding: 2rem 0;
  `}
`;

// El spinner en sí mismo
const Spinner = styled.div<{ size?: string; color?: string }>`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid ${props => props.color || '#61dafb'};
  animation: ${spin} 1s linear infinite;
`;

// Texto opcional que puede aparecer debajo del spinner
const LoadingText = styled.p`
  color: #ffffff;
  margin-top: 1rem;
  font-size: 1rem;
`;

interface LoadingSpinnerProps {
    fullPage?: boolean;
    size?: string;
    color?: string;
    text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    fullPage = false,
    size = '40px',
    color = '#61dafb',
    text
}) => {
    return (
        <SpinnerContainer fullPage={fullPage}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spinner size={size} color={color} />
                {text && <LoadingText>{text}</LoadingText>}
            </div>
        </SpinnerContainer>
    );
};

export default LoadingSpinner; 
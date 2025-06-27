import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const DevIndicator = styled(motion.div)`
  position: fixed;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(255, 0, 255, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);

  @media (max-width: 768px) {
    top: 5px;
    right: 5px;
    padding: 6px 12px;
    font-size: 11px;
  }
`;

const DevIcon = styled.span`
  font-size: 14px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const DevModeIndicator: React.FC = () => {
  // Solo mostrar en modo desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <DevIndicator
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <DevIcon>🔧</DevIcon>
      DEV MODE
    </DevIndicator>
  );
};

export default DevModeIndicator; 
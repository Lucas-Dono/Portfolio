import React from 'react';
import styled from 'styled-components';

// Contenedores de sección
export const SectionContainer = styled.div`
  background-color: var(--card-bg, #1f2937);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #ffffff);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
`;

// Componentes de configuración
export const SettingsSection = styled.div`
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, #374151);
  padding-bottom: 1.5rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

export const SettingsTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--text-primary, #ffffff);
`;

export const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SettingsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const SettingsLabel = styled.label`
  font-size: 0.9rem;
  color: var(--text-secondary, #9ca3af);
  min-width: 120px;
`;

export const SettingsValue = styled.div`
  font-size: 0.95rem;
  color: var(--text-primary, #e5e7eb);
  flex: 1;
  padding: 0.5rem 0;
`;

export const SettingsInput = styled.input`
  background-color: var(--input-bg, #374151);
  border: 1px solid var(--border-color, #4b5563);
  color: var(--text-primary, #e5e7eb);
  padding: 0.65rem 0.8rem;
  border-radius: 4px;
  font-size: 0.95rem;
  flex: 1;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--primary-color, #3b82f6);
  }
`;

export const SettingsButton = styled.button`
  background-color: var(--button-bg, #4b5563);
  color: var(--button-text, #e5e7eb);
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  max-width: fit-content;

  &:hover {
    background-color: var(--button-hover, #6b7280);
  }
`;

export const SaveButton = styled.button`
  background-color: var(--primary-color, #3b82f6);
  color: #ffffff;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: fit-content;
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: var(--primary-hover, #2563eb);
    transform: translateY(-1px);
  }
`;

// Selector de tema
export const ThemeSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  flex: 1;
`;

export const ThemeOption = styled.button<{ active?: boolean }>`
  background-color: ${props => props.active
        ? 'var(--primary-color, #3b82f6)'
        : 'var(--button-bg, #4b5563)'};
  color: ${props => props.active
        ? '#ffffff'
        : 'var(--text-secondary, #9ca3af)'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    background-color: ${props => props.active
        ? 'var(--primary-hover, #2563eb)'
        : 'var(--button-hover, #6b7280)'};
  }
`;

// Exportar un componente por defecto para importaciones más fáciles
const Settings: React.FC = () => {
    return null; // Este componente solo exporta estilos, no renderiza nada
};

export default Settings; 
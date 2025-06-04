import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactGridLayout, { Layout, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuth } from '../../context/AuthContext';
// Importar componentes de configuración
import SecuritySettings from './SecuritySettings';
import RefundRequest from './RefundRequest';
import {
  SectionContainer,
  SectionHeader,
  SectionTitle as SettingsSectionTitle,
  SettingsSection,
  SettingsTitle,
  SettingsForm,
  SettingsRow,
  SettingsLabel,
  SettingsValue,
  SettingsInput,
  ThemeSelector,
  ThemeOption,
  SaveButton,
  SettingsButton
} from './Settings';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Las fuentes se cargan desde index.html o CSS global para mejor compatibilidad

// Tipos para el Dashboard
interface DashboardProps {
  userName: string;
}

// Tipos para el asistente virtual Chloe
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Tipos para los hitos del proyecto
interface Milestone {
  id: string;
  name: string;
  completed: boolean;
}

// Tipos para el círculo de progreso
interface ProgressData {
  percentage: number;
  stage: string;
  nextTask: string;
  milestones: Milestone[];
}

// Tipos para las imágenes de previsualización
interface PreviewImage {
  id: number;
  url: string;
  title: string;
  description: string;
}

// Tipos para datos del proyecto
interface ProjectInfo {
  name: string;
  description: string;
  createdAt: string;
  status: 'activo' | 'en desarrollo' | 'pendiente';
  domain?: string;
  hasBusinessInfo: boolean;
  businessType?: string;
}

// Tipos para sitios activos
interface ActiveSite {
  id: string;
  name: string;
  domain: string;
  status: 'online' | 'maintenance' | 'development';
  lastUpdated: string;
  type: 'landing' | 'blog' | 'ecommerce' | 'portfolio';
}

// Interfaz para los servicios del usuario recibidos de la API
interface UserService {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  status?: string;
  domain?: string;
  progress?: number;
  stage?: string;
  nextTask?: string;
  milestones?: Milestone[];
  previews?: PreviewImage[];
  createdAt: string;
  updatedAt?: string;
  businessType?: string;
  purchaseDate?: string;
  amount?: number;
}

// Componentes estilizados
const DashboardContainer = styled.div`
  padding: 1rem;
  min-height: 100vh;
  height: 100vh;
  background-color: #121212;
  color: #f5f5f5;
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 1024px) {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
    justify-content: space-between;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(90deg, #00d2ff, #3a7bd5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  
  @media (max-width: 640px) {
    flex-wrap: nowrap;
    gap: 0.5rem;
  }
  
  & > div {
    display: flex;
    flex-direction: column;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3a7bd5, #00d2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(0, 210, 255, 0.3);
  
  @media (max-width: 640px) {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
  }
`;

const NavButton = styled(Link)`
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: rgba(30, 30, 30, 0.6);
  color: #f5f5f5;
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  &:hover {
    background-color: rgba(58, 123, 213, 0.2);
    border-color: rgba(58, 123, 213, 0.5);
    transform: translateY(-2px);
  }
  
  @media (max-width: 640px) {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  color: #f5f5f5;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  padding: 0.75rem 1.25rem 0;
  
  svg {
    color: #00d2ff;
  }
`;

const ContentGrid = styled.div<{ height: number }>`
  width: 100%;
  height: ${props => `calc(${props.height}px - 100px)`};
  padding: 0.5rem;
  overflow-x: hidden;
  overflow-y: auto;
  display: grid;
  
  .react-grid-item {
    transition: all 200ms ease;
    transition-property: left, top, width, height;
  }
  
  .react-grid-item.react-draggable-dragging {
    transition: none;
    z-index: 100;
    opacity: 0.8;
  }
  
  .react-grid-item.react-grid-placeholder {
    background: rgba(0, 210, 255, 0.2);
    border: 2px dashed rgba(0, 210, 255, 0.4);
    border-radius: 8px;
    opacity: 0.8;
    z-index: 0;
  }
  
  .react-resizable-handle {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.4)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 16 14 12"></polyline><polyline points="2 12 6 8 10 12"></polyline></svg>');
    background-position: bottom right;
    background-repeat: no-repeat;
    background-size: 14px 14px;
    padding: 0 3px 3px 0;
    right: 5px;
    bottom: 5px;
  }
  
  &.dragging {
    cursor: grabbing;
  }
  
  &.resizing {
    cursor: nwse-resize;
  }
  
  @media (max-width: 1024px) {
    height: auto;
    min-height: ${props => `calc(${props.height}px - 100px)`};
  }
`;

const Card = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: auto;
  height: 100%;
  
  &:hover {
    box-shadow: none;
  }
`;

const MainCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

// Los componentes para login ya no son necesarios, ahora usamos el sistema de autenticación central

// Componentes para la visualización del progreso
const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0.5rem 0;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 1rem 0;
  position: relative;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: linear-gradient(to right, #00d2ff, #3a7bd5);
  border-radius: 10px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0) 25%,
      rgba(255, 255, 255, 0.2) 25%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0) 75%,
      rgba(255, 255, 255, 0.2) 75%,
      rgba(255, 255, 255, 0.2) 100%
    );
    background-size: 20px 20px;
    animation: moveStripes 1s linear infinite;
    
    @keyframes moveStripes {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 20px 20px;
      }
    }
  }
`;

const ProgressValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #00FFFF;
  margin-right: 0.5rem;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressDetails = styled.div`
  display: flex;
  align-items: center;
`;

const ProgressStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #00FFFF;
  }
`;

const ProgressStage = styled.div`
  font-size: 1.1rem;
  color: #f5f5f5;
  font-weight: 500;
`;

const ProgressNextTask = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
`;

const MilestonesContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: rgba(255, 255, 255, 0.1);
    z-index: 0;
  }
`;

const Milestone = styled.div<{ completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
`;

const MilestoneIcon = styled.div<{ completed: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.completed ? '#00FFFF' : 'rgba(255, 255, 255, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: ${props => props.completed ? '#000' : '#fff'};
  transition: all 0.3s ease;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const MilestoneName = styled.div<{ completed: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.completed ? '#fff' : 'rgba(255, 255, 255, 0.5)'};
  text-align: center;
  font-weight: ${props => props.completed ? '500' : '400'};
`;

const ViewSiteButton = styled.a`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }
`;

// Componentes para las imágenes de previsualización
const PreviewContainer = styled.div`
  margin-bottom: 1rem;
  position: relative;
`;

const PreviewButton = styled.button`
  background: rgba(0, 0, 0, 0.3);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 210, 255, 0.3);
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: scale(1);
  }
`;

const PreviewHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const PreviewInfoSection = styled.div`
  flex: 1;
`;

const PreviewDevices = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DeviceButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(0, 210, 255, 0.2)' : 'transparent'};
  border: 1px solid ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.2)'};
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  color: ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  
  &:hover {
    background: rgba(0, 210, 255, 0.1);
    border-color: rgba(0, 210, 255, 0.5);
  }
`;

const ProgressIndicator = styled.div`
  background: rgba(0, 0, 0, 0.4);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: #00FFFF;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 210, 255, 0.2);
`;

const PreviewImage = styled.div<{ imageUrl: string }>`
  width: 100%;
  height: 280px;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const PreviewMockup = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  flex-direction: column;
  gap: 1rem;
  border-radius: 8px;
  
  svg {
    color: #00d2ff;
    animation: spin 2s linear infinite;
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
`;

// Componentes para el chat con Chloe
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  max-height: 100%;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
`;

const AssistantAvatar = styled.div`
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(255, 0, 255, 0.3);
  
  /* Agregar estas propiedades para mantener la proporción circular */
  aspect-ratio: 1 / 1;
  overflow: hidden;
  
  /* Asegurar consistencia en móvil */
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
  }
`;

const AssistantInfo = styled.div`
  h3 {
    margin: 0;
    font-size: 1.1rem;
  font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }
`;

const MinimizeButton = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.2rem;
  margin-left: auto;
  
  &:hover {
    color: white;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const MessagesContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const MessageBubble = styled(motion.div) <{ $isUser?: boolean }>`
  padding: 0.8rem 1rem;
  border-radius: ${props => props.$isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  max-width: 85%;
  background: ${props =>
    props.$isUser
      ? 'linear-gradient(135deg, #FF00FF 0%, #00A0FF 100%)'
      : 'rgba(30, 30, 30, 0.7)'};
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  word-break: break-word;
  color: ${props => props.$isUser ? '#fff' : '#eee'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-size: 0.95rem;
  line-height: 1.6;
  
  p { margin: 0; }
`;

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: rgba(15, 15, 15, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: visible;
  margin-bottom: 0.5rem;
  width: 90%;
  margin-left: auto;
  margin-right: auto;
`;

const ChatInput = styled.input`
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  color: #eee;
  font-family: inherit;
  font-size: 0.85rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  border: none;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 0, 255, 0.2);
  flex-shrink: 0;
  margin-right: 1px;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 6px 15px rgba(0, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const QuickReplies = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const QuickReply = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: rgba(0, 210, 255, 0.1);
    border-color: rgba(0, 210, 255, 0.3);
    color: #00FFFF;
  }
`;

const MinimizedChat = styled(motion.div)`
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  background: rgba(30, 30, 30, 0.95);
  border-radius: 12px 12px 0 0;
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10;
  
  &:hover {
    background: rgba(40, 40, 40, 0.95);
  }
  
  @media (max-width: 768px) {
    position: fixed;
    bottom: 20px;
    left: auto;
    right: 20px;
    width: auto;
    border-radius: 50px;
    padding: 0.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
`;

const FullScreenChatContainer = styled(motion.div)`
  display: none;
  
  @media (max-width: 1024px) {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(18, 18, 18, 0.98);
    z-index: 1000;
    flex-direction: column;
    padding: 1rem;
  }
`;

// Componentes para sitios activos
const SitesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Interfaces para los estilos
interface SiteCardProps {
  selected?: boolean;
}

const SiteCard = styled.div<SiteCardProps>`
  background-color: rgba(37, 37, 37, 0.7);
  border-radius: 12px;
  padding: 1rem;
  border-left: 3px solid #00FFFF;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    background-color: rgba(45, 45, 45, 0.8);
  }
  
  ${props => props.selected && `
    background-color: rgba(45, 45, 45, 0.95);
    border-left: 3px solid #FF00FF;
    box-shadow: 0 8px 25px rgba(255, 0, 255, 0.2);
    transform: translateY(-3px);
  `}
`;

const SiteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const SiteName = styled.h3`
  font-size: 1.1rem;
  margin: 0;
  color: #f5f5f5;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    color: #00d2ff;
  }
`;

const SiteStatus = styled.span<{ status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props =>
    props.status === 'online' ? 'rgba(72, 187, 120, 0.2)' :
      props.status === 'maintenance' ? 'rgba(246, 173, 85, 0.2)' :
        'rgba(99, 179, 237, 0.2)'
  };
  color: ${props =>
    props.status === 'online' ? '#48BB78' :
      props.status === 'maintenance' ? '#F6AD55' :
        '#63B3ED'
  };
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const SiteFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
`;

const SiteDate = styled.span`
  color: rgba(255, 255, 255, 0.6);
`;

const NoSitesCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  min-height: 200px;
  width: 100%;
  height: 100%;
`;

const NoSitesTitle = styled.h3`
  font-size: 1.2rem;
  margin: 1rem 0 0.5rem 0;
  color: #f5f5f5;
`;

const NoSitesDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const NoSitesButton = styled.button`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3a7bd5, #00d2ff);
  color: white;
  border: none;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 210, 255, 0.3);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 210, 255, 0.4);
  }
`;

// Componentes para la barra lateral mobile y sidebar
// El componente SidebarToggle ya no se usa, pero lo mantenemos comentado por si se necesita en el futuro
/* 
const SidebarToggle = styled.button`
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3a7bd5, #00d2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 210, 255, 0.4);
  cursor: pointer;
  z-index: 900;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  @media (min-width: 1280px) {
    display: none;
  }
`;
*/

const Overlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 950;
  opacity: ${props => props.isVisible ? 1 : 0};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  backdrop-filter: blur(3px);
`;

// ... existing code ...

// Componentes específicos para la visualización móvil
// Estos componentes ya no se utilizan directamente, pero se mantienen comentados por si se necesitan
/*
const MobileView = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0.5rem;
  gap: 1rem;
  overflow: hidden;
  
  & > * {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
`;

const MobileCard = styled.div`
  background-color: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  backdrop-filter: blur(8px);
  padding: 0;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  
  &:hover {
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
    border-color: rgba(0, 210, 255, 0.2);
  }
`;
*/

const MobileSidebar = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 85%;
  max-width: 320px;
  background-color: #1a1a1a;
  z-index: 999;
  padding: 1.5rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;
  overflow-y: auto;
`;

const MobileSidebarClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: white;
  }
`;

// Botón para restablecer el layout
const ResetLayoutButton = styled.button`
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00d2ff;
  z-index: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(40, 40, 40, 0.9);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const HamburgerMenuButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;
  margin-right: 1rem;
  
  &:hover {
    color: white;
  }
  
  @media (min-width: 768px) and (max-width: 1024px) {
    margin-right: 1.25rem;
    padding: 0.6rem;
  }
`;

// Función para obtener la fecha formateada
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// El componente Login ya no es necesario, ahora usamos el sistema de autenticación central

// Icono de envío para el chat
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);



// Mejorar el componente de previsualización con miniaturas
const PreviewThumbnails = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  padding-top: 0.5rem;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 210, 255, 0.3);
    border-radius: 4px;
  }
`;

const PreviewThumbnail = styled.div<{ active: boolean, imageUrl: string }>`
  width: 180px;
  height: 120px;
  border-radius: 8px;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  background-position: center;
  cursor: pointer;
  opacity: ${props => props.active ? 1 : 0.7};
  border: 2px solid ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.1)'};
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  position: relative;
  
  &:hover {
    opacity: 1;
    transform: translateY(-5px);
    border-color: ${props => props.active ? '#00d2ff' : 'rgba(0, 210, 255, 0.5)'};
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }
`;

const ThumbnailTitle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  font-size: 0.8rem;
  border-radius: 0 0 8px 8px;
`;

// Botón de WhatsApp para soporte
const WhatsAppButton = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

// Componentes para el modal de imagen
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  position: relative;
  max-width: 90%;
  max-height: 90vh;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const ModalImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  max-height: 80vh;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 1;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const ModalTitle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }
`;

// Iconos para dashboard

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375a9.869 9.869 0 01-1.516-5.26c0-5.445 4.455-9.885 9.942-9.885a9.865 9.865 0 017.022 2.895 9.788 9.788 0 012.896 7.022c-.003 5.445-4.447 9.87-9.928 9.87m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Icono para el botón de reseteo
const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v6h6"></path>
    <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
    <path d="M21 22v-6h-6"></path>
    <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
  </svg>
);

// Estilo para los elementos arrastables
const DraggableItem = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  display: flex;
  flex-direction: column;
  
  &:hover {
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
    border-color: rgba(0, 210, 255, 0.2);
  }
  
  &:hover .drag-handle {
    opacity: 1;
  }
  
  &.react-draggable-dragging {
    z-index: 100;
    border-color: #00d2ff;
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.3);
  }
  
  &.resizing {
    opacity: 0.8;
    border-color: #00d2ff;
  }
`;

const DragHandle = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px;
  cursor: move;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
  z-index: 10;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  
  &:hover {
    color: #00d2ff;
    background: rgba(0, 0, 0, 0.5);
  }
`;

// Configurar el WidthProvider de ReactGridLayout fuera del componente
const ResponsiveGridLayout = WidthProvider(ReactGridLayout);

const FullScreenChatOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(18, 18, 18, 0.98);
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const CloseFullScreenButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  z-index: 1100;
  cursor: pointer;
  
  &:hover {
    color: white;
    background: rgba(40, 40, 40, 0.9);
  }
`;

// Componente principal


const Dashboard: React.FC<DashboardProps> = ({ userName }) => {
  // Estado para el tema de la interfaz
  const [theme, setTheme] = useState('dark');
  // Estado para el modal de configuración
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // El layout sigue este patrón en una cuadrícula de 6x6:
  // [sites (1x6)] [projectStatus (4x3)] [assistant (1x6)]
  // [sites (cont)] [preview (4x3)]      [assistant (cont)]
  const defaultLayout: Layout[] = [
    { i: 'projectStatus', x: 1, y: 0, w: 4, h: 3, minW: 2, minH: 1 },
    { i: 'preview', x: 1, y: 3, w: 4, h: 4, minW: 2, minH: 1 },
    { i: 'assistant', x: 5, y: 0, w: 1, h: 7, minW: 1, minH: 2 },
    { i: 'sites', x: 0, y: 0, w: 1, h: 7, minW: 1, minH: 2 }
  ];

  // Layout para móvil - organiza los elementos en una sola columna
  // manteniendo un orden lógico y visual consistente
  const mobileLayout: Layout[] = [
    { i: 'sites', x: 0, y: 0, w: 1, h: 4, minW: 1, minH: 2 },
    { i: 'projectStatus', x: 0, y: 4, w: 1, h: 3, minW: 1, minH: 1 },
    { i: 'preview', x: 0, y: 7, w: 1, h: 3, minW: 1, minH: 1 },
    { i: 'assistant', x: 0, y: 10, w: 1, h: 4, minW: 1, minH: 2 }
  ];

  // Obtener contexto de autenticación
  const { user, isAuthenticated, isLoading: authLoading, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  // ===== TODOS LOS HOOKS PRIMERO =====
  // Estado para el tamaño de la ventana y tipo de dispositivo
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Función para determinar el tipo de dispositivo basado en el tamaño de pantalla
  const getDeviceType = () => {
    if (windowSize.width <= 1024) return 'mobile';
    return 'desktop';
  };

  // Estado para el tipo de dispositivo
  const [deviceType, setDeviceType] = useState(getDeviceType());
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState(user?.name || userName);

  // Estado para determinar si el usuario tiene proyectos activos
  const [hasActiveProjects, setHasActiveProjects] = useState(false);

  // Estado para el progreso del proyecto con hitos
  const [progress, setProgress] = useState<ProgressData>({
    percentage: 30,
    stage: 'Desarrollo en curso',
    nextTask: 'Configuración del diseño responsivo',
    milestones: [
      { id: 'design', name: 'Diseño', completed: true },
      { id: 'content', name: 'Contenido', completed: true },
      { id: 'responsive', name: 'Responsive', completed: false },
      { id: 'domain', name: 'Dominio', completed: false },
      { id: 'launch', name: 'Lanzamiento', completed: false }
    ]
  });

  // Estado para el chat con Chloe
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para las imágenes de previsualización
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);

  // Estado para la información del proyecto
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: 'Mi Sitio Web',
    description: 'Página web profesional para mostrar servicios y portafolio',
    createdAt: '2023-12-15',
    status: 'en desarrollo',
    hasBusinessInfo: false
  });

  // Estado para los sitios activos
  const [activeSites, setActiveSites] = useState<ActiveSite[]>([]);

  // Estado para el sitio actualmente seleccionado
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Estados para la previsualización
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeDevice, setActiveDevice] = useState('desktop');

  // Estado para el chat minimizado
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Estado para la barra lateral móvil
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estado para el chat en pantalla completa en móvil
  const [isFullscreenChat, setIsFullscreenChat] = useState(false);

  // Estado para mostrar u ocultar el chat flotante en móvil
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Estado para el layout de la cuadrícula
  const [layouts, setLayouts] = useState<Layout[]>(defaultLayout);

  // Lista de respuestas rápidas
  const quickReplies = hasActiveProjects ? [
    '¿Cómo va mi proyecto?',
    '¿Qué incluirá mi sitio?',
    '¿Cuándo estará listo?',
    'Quiero hacer un cambio'
  ] : [
    '¿Qué servicios ofrecen?',
    '¿Cuánto cuesta?',
    'Quiero ver ejemplos',
    'Necesito ayuda'
  ];

  // Estados para el modal de imagen
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PreviewImage | null>(null);

  // Estado para los servicios comprados
  const [purchasedServices, setPurchasedServices] = useState<any[]>([]);

  // ===== TODOS LOS EFECTOS DESPUÉS =====

  // Tiempo de inactividad para minimizar el chat automáticamente
  useEffect(() => {
    if (messages.length > 0 && !isChatMinimized) {
      const timer = setTimeout(() => {
        setIsChatMinimized(true);
      }, 60000); // 1 minuto de inactividad

      return () => clearTimeout(timer);
    }
  }, [messages, inputMessage, isChatMinimized]);

  // Verificar autenticación y cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);

      try {
        // Si no hay usuario autenticado, redirigir al login
        if (!isAuthenticated && !authLoading) {
          console.warn('Usuario no autenticado, redirigiendo al login');
          redirectToLogin();
          return;
        }

        // Si el usuario está autenticado, actualizar estados con datos del usuario
        if (user) {
          setUserFullName(user.name);

          // Comprobar si el usuario tiene proyectos activos
          // En un entorno real esto se cargaría de la API
          const hasProjects = true; // Simulación, en producción esto vendría de la API
          setHasActiveProjects(hasProjects);

          // Comprobar si es la primera vez que el usuario inicia sesión
          const firstLogin = localStorage.getItem('firstLogin') !== 'false';
          setIsFirstLogin(firstLogin);

          if (hasProjects) {
            await loadProjectData();
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar datos si la autenticación ya terminó de cargarse
    if (!authLoading) {
      loadUserData();
    }
  }, [user, isAuthenticated, authLoading]);

  // Efecto para verificar si se registró un nuevo servicio
  useEffect(() => {
    const checkNewService = () => {
      const newServiceRegistered = localStorage.getItem('new_service_registered');
      if (newServiceRegistered === 'true') {
        console.log('🔄 Se detectó un nuevo servicio registrado, recargando datos...');

        // Eliminar la marca para evitar recargas innecesarias
        localStorage.removeItem('new_service_registered');

        // Recargar datos del proyecto
        if (isAuthenticated && user) {
          loadProjectData();
        }
      }
    };

    // Verificar al montar el componente
    checkNewService();

    // Configurar un intervalo para verificar periódicamente (cada 10 segundos)
    const interval = setInterval(checkNewService, 10000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Función para redirigir al login
  const redirectToLogin = () => {
    // Establecer una bandera para indicar que fue redirigido desde el dashboard
    localStorage.setItem('redirect_after_login', 'dashboard');

    // Redirigir a la página de login
    navigate('/login');
  };

  // Efecto para iniciar la conversación con Chloe
  useEffect(() => {
    if (isAuthenticated && !loading) {
      if (hasActiveProjects && isFirstLogin) {
        // Iniciar la conversación con información específica del proyecto
        setTimeout(() => {
          const projectType = projectInfo.businessType === 'ecommerce' ? 'tienda online' :
            projectInfo.businessType === 'blog' ? 'blog' :
              projectInfo.businessType === 'portfolio' ? 'portfolio' :
                'sitio web';

          addMessage('assistant', `¡Hola! 👋 Soy Chloe, tu asistente virtual especializada en desarrollo web. Veo que tienes un proyecto de ${projectType} llamado "${projectInfo.name}" en desarrollo.`);
        }, 500);

        setTimeout(() => {
          addMessage('assistant', `Tu proyecto está actualmente al ${progress.percentage}% de completarse y estamos en la fase de "${progress.stage}". ¿Te gustaría que te cuente más detalles sobre el progreso, las características que incluirá tu sitio, o tienes alguna pregunta específica?`);
        }, 2500);
      } else if (hasActiveProjects && !isFirstLogin) {
        // Si no es la primera vez, mensaje de bienvenida personalizado
        const projectType = projectInfo.businessType === 'ecommerce' ? 'tienda online' :
          projectInfo.businessType === 'blog' ? 'blog' :
            projectInfo.businessType === 'portfolio' ? 'portfolio' :
              'sitio web';

        setMessages([
          { role: 'assistant', content: `¡Hola de nuevo! 👋 Tu ${projectType} "${projectInfo.name}" está progresando muy bien. Actualmente está al ${progress.percentage}% de completarse. ¿En qué puedo ayudarte hoy?` }
        ]);
      } else {
        // Usuario sin proyectos activos
        setMessages([
          { role: 'assistant', content: '¡Hola! 👋 Soy Chloe, tu asistente virtual especializada en desarrollo web. Veo que aún no tienes proyectos activos. ¿Te gustaría conocer nuestros servicios de desarrollo web? Puedo ayudarte a encontrar la solución perfecta para tu presencia online.' }
        ]);
      }
    }
  }, [isAuthenticated, isFirstLogin, hasActiveProjects, loading, projectInfo, progress]);

  // Efecto para hacer scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cargar layout guardado al inicio
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard_layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setLayouts(parsedLayout);
      } catch (e) {
        console.error('Error parsing saved layout', e);
        // Si hay un error, usar el layout predeterminado según tamaño de pantalla
        const width = window.innerWidth;
        setLayouts(width <= 768 ? mobileLayout : defaultLayout);
      }
    } else {
      // Si no hay layout guardado, usar el predeterminado según tamaño de pantalla
      const width = window.innerWidth;
      setLayouts(width <= 768 ? mobileLayout : defaultLayout);
    }
  }, []);

  // Efecto para manejar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      setWindowSize(newSize);

      // Actualizar el tipo de dispositivo
      const newDeviceType = newSize.width <= 1024 ? 'mobile' : 'desktop';
      setDeviceType(newDeviceType);

      console.log('Cambio de tamaño:', newSize.width, 'DeviceType:', newDeviceType);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Llamar una vez al inicio para asegurar que se establezca correctamente

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para adaptar la distribución según el tamaño de pantalla
  useEffect(() => {
    const breakpoint = 1024;
    const isMobile = windowSize.width <= breakpoint;

    console.log('Efecto de adaptación:', windowSize.width, 'Es móvil:', isMobile, 'DeviceType:', deviceType);

    // Solo cambiar el layout si no hay un layout personalizado o si cambiamos entre móvil y escritorio
    if (!localStorage.getItem('dashboard_layout')) {
      // Usar el layout predeterminado según el tamaño de la pantalla
      setLayouts(isMobile ? mobileLayout : defaultLayout);
    }
  }, [windowSize, deviceType]);

  // Añadir estados para manejar el arrastre y redimensionamiento
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Actualizar las funciones de manejo de eventos
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (layout: Layout[], oldItem: Layout, newItem: Layout) => {
    console.log('Elemento arrastrado:', oldItem, 'a nueva posición:', newItem);
    setLayouts(layout);
    saveLayout(layout);
    setIsDragging(false);
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeStop = (layout: Layout[], oldItem: Layout, newItem: Layout) => {
    console.log('Elemento redimensionado:', oldItem, 'a nuevo tamaño:', newItem);
    setLayouts(layout);
    saveLayout(layout);
    setIsResizing(false);
  };

  // ===== TODAS LAS FUNCIONES DESPUÉS =====

  // Función para guardar el layout en localStorage
  const saveLayout = (newLayout: Layout[]) => {
    localStorage.setItem('dashboard_layout', JSON.stringify(newLayout));
  };

  // Mejorar la función handleLayoutChange para manejar mejor el cambio de tamaño
  const handleLayoutChange = (newLayout: Layout[]) => {
    // Solo procesar si hay cambios reales en el layout
    const hasChanged = JSON.stringify(layouts) !== JSON.stringify(newLayout);

    if (hasChanged && newLayout && newLayout.length === defaultLayout.length) {
      console.log('Layout actualizado:', newLayout);
      setLayouts(newLayout);

      // Solo guardar en localStorage si el cambio fue generado por el usuario
      // (para evitar sobreescribir cuando es generado por cambios de ventana)
      if (isDragging || isResizing) {
        saveLayout(newLayout);
      }
    }
  };

  // Función para restablecer el layout a la configuración original
  const resetLayout = () => {
    const isMobile = windowSize.width <= 768;

    // Calcular la proporción óptima para la altura de los componentes
    // basada en la altura real de la ventana
    const availableHeight = windowSize.height - 150;
    const rowsPerScreen = isMobile ? 12 : 8;
    const optimalRowHeight = Math.floor(availableHeight / rowsPerScreen);

    // Ajustar la altura de los componentes si es necesario para no desbordar
    let adjustedLayout;

    if (isMobile) {
      adjustedLayout = [...mobileLayout];
    } else {
      // Para pantalla grande, ajustar la altura de los componentes laterales
      // para que no se salgan de la pantalla
      const sidebarHeight = Math.min(7, Math.floor(availableHeight / optimalRowHeight) - 1);

      adjustedLayout = [
        { i: 'projectStatus', x: 1, y: 0, w: 4, h: 3, minW: 2, minH: 1 },
        { i: 'preview', x: 1, y: 3, w: 4, h: 4, minW: 2, minH: 1 },
        { i: 'assistant', x: 5, y: 0, w: 1, h: sidebarHeight, minW: 1, minH: 2 },
        { i: 'sites', x: 0, y: 0, w: 1, h: sidebarHeight, minW: 1, minH: 2 }
      ];
    }

    setLayouts(adjustedLayout);
    saveLayout(adjustedLayout);

    // Eliminar del localStorage para forzar el uso del default la próxima vez
    localStorage.removeItem('dashboard_layout');
  };

  // Cargar datos del proyecto
  const loadProjectData = async () => {
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error("No hay token de autenticación");
        return;
      }

      setLoading(true);

      try {
        // Realizar la llamada a la API para obtener los servicios del usuario
        const apiUrl = `${API_BASE_URL}/users/services`;
        console.log('🔄 Obteniendo servicios del usuario desde:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error al obtener servicios (${response.status}):`, errorText);
          throw new Error(`Error al obtener servicios: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Datos de servicios recibidos:', data);

        // Preparar los servicios para el componente de reembolso con fechas de compra y montos
        if (data.services && data.services.length > 0) {
          const servicesWithPurchaseInfo = data.services.map((service: UserService) => ({
            ...service,
            purchaseDate: service.purchaseDate || service.createdAt, // Usar createdAt como fallback
            amount: service.amount || 99.99 // Valor por defecto si no hay monto
          }));

          setPurchasedServices(servicesWithPurchaseInfo);
        }

        // Verificar si el usuario tiene servicios contratados
        if (data.services && data.services.length > 0) {
          // Establecer que el usuario tiene proyectos activos
          setHasActiveProjects(true);

          // Actualizar la lista de sitios activos con los datos reales
          const sitesData = data.services.map((service: UserService) => ({
            id: service.id,
            name: service.name || `Mi ${service.type || 'Sitio Web'}`,
            domain: service.domain || 'pendiente.com',
            status: service.status || 'development',
            lastUpdated: service.updatedAt || service.createdAt || new Date().toISOString(),
            type: service.type || 'landing'
          }));

          setActiveSites(sitesData);

          // Si hay al menos un proyecto, usarlo como el proyecto actual
          if (data.services[0]) {
            const mainService = data.services[0];

            console.log('📋 Usando servicio principal:', mainService);

            // Seleccionar automáticamente el primer sitio
            const firstSiteId = sitesData[0]?.id;
            if (firstSiteId) {
              setSelectedSiteId(firstSiteId);
            }

            setProjectInfo({
              name: mainService.name || 'Mi Sitio Web',
              description: mainService.description || 'Sitio web en desarrollo',
              createdAt: mainService.createdAt,
              status: mainService.status || 'en desarrollo',
              hasBusinessInfo: !!mainService.businessType,
              businessType: mainService.businessType
            });

            // Actualizar el progreso del proyecto
            setProgress({
              percentage: mainService.progress !== undefined ? mainService.progress : 30,
              stage: mainService.stage || 'Desarrollo en curso',
              nextTask: mainService.nextTask || 'Configuración del diseño responsivo',
              milestones: mainService.milestones || [
                { id: 'design', name: 'Diseño', completed: true },
                { id: 'content', name: 'Contenido', completed: true },
                { id: 'responsive', name: 'Responsive', completed: false },
                { id: 'domain', name: 'Dominio', completed: false },
                { id: 'launch', name: 'Lanzamiento', completed: false }
              ]
            });

            // Cargar las previsualizaciones si existen
            if (mainService.previews && mainService.previews.length > 0) {
              setPreviewImages(mainService.previews);
            } else {
              // No hay imágenes de previsualización disponibles
              setPreviewImages([]);
            }
          }
        } else {
          console.log('El usuario no tiene servicios activos');
          setHasActiveProjects(false);
        }
      } catch (apiError) {
        console.error("Error en la llamada a la API:", apiError);
        // En caso de error en la API, usar datos de prueba para desarrollo
        console.log("Usando datos de prueba como fallback");

        // Marcar como que tiene proyectos activos para propósitos de desarrollo
        setHasActiveProjects(true);

        // Datos de prueba para desarrollo
        setPreviewImages([
          {
            id: 1,
            url: 'https://placehold.co/600x400/00FFFF/1e1e1e?text=Home+Page',
            title: 'Página de inicio',
            description: 'Vista principal de la página de inicio'
          },
          {
            id: 2,
            url: 'https://placehold.co/600x400/FF00FF/1e1e1e?text=About+Page',
            title: 'Página Sobre Nosotros',
            description: 'Información sobre la empresa y servicios'
          },
          {
            id: 3,
            url: 'https://placehold.co/600x400/00A0FF/1e1e1e?text=Services+Page',
            title: 'Página de Servicios',
            description: 'Listado de servicios ofrecidos'
          }
        ]);

        setActiveSites([
          {
            id: 'site-1',
            name: 'Mi Portfolio',
            domain: 'portfolio.ejemplo.com',
            status: 'online',
            lastUpdated: '2024-06-10',
            type: 'portfolio'
          },
          {
            id: 'site-2',
            name: 'Blog Personal',
            domain: 'blog.ejemplo.com',
            status: 'development',
            lastUpdated: '2024-06-08',
            type: 'blog'
          }
        ]);

        setProjectInfo({
          name: 'Mi Sitio Web Profesional',
          description: 'Página web profesional para mostrar servicios y portafolio',
          createdAt: '2024-06-01',
          status: 'en desarrollo',
          hasBusinessInfo: true,
          businessType: 'portfolio'
        });

        setProgress({
          percentage: 45,
          stage: 'Desarrollo en curso',
          nextTask: 'Configuración del diseño responsivo',
          milestones: [
            { id: 'design', name: 'Diseño', completed: true },
            { id: 'content', name: 'Contenido', completed: true },
            { id: 'responsive', name: 'Responsive', completed: false },
            { id: 'domain', name: 'Dominio', completed: false },
            { id: 'launch', name: 'Lanzamiento', completed: false }
          ]
        });
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error general al cargar datos del proyecto:", error);
      setLoading(false);
    }
  };

  // Función para agregar un mensaje al chat
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }]);

    // En un entorno real, también enviaríamos el mensaje a la API para guardarlo
    if (role === 'user' && isAuthenticated) {
      // Ejemplo de cómo sería la llamada a la API
      // fetch('/api/chat/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${getToken()}`
      //   },
      //   body: JSON.stringify({ content })
      // });
    }
  };

  // Función para seleccionar un sitio y actualizar la información del proyecto
  const selectSite = (siteId: string) => {
    setSelectedSiteId(siteId);

    // Buscar el sitio seleccionado en los servicios del usuario
    const selectedService = activeSites.find(site => site.id === siteId);

    if (selectedService) {
      console.log('🔄 Sitio seleccionado:', selectedService);

      // Actualizar la información del proyecto con los datos del sitio seleccionado
      setProjectInfo({
        name: selectedService.name,
        description: selectedService.type === 'blog' ? 'Blog con múltiples secciones y categorías' :
          selectedService.type === 'portfolio' ? 'Portfolio profesional con galería de proyectos' :
            selectedService.type === 'ecommerce' ? 'Tienda online completa con catálogo de productos' :
              'Sitio web con múltiples secciones para presentar tu proyecto',
        createdAt: selectedService.lastUpdated,
        status: selectedService.status === 'online' ? 'activo' :
          selectedService.status === 'maintenance' ? 'en desarrollo' : 'en desarrollo',
        hasBusinessInfo: true,
        businessType: selectedService.type
      });

      // Aquí también se podrían cargar datos específicos del sitio desde la API
      loadSiteSpecificData(siteId);
    }
  };

  // Función para cargar datos específicos del sitio seleccionado
  const loadSiteSpecificData = async (siteId: string) => {
    try {
      // En un entorno real, aquí se haría una llamada a la API
      // para obtener datos específicos del sitio seleccionado
      console.log(`🔄 Cargando datos específicos para el sitio ${siteId}...`);

      // Simulación de carga - en una implementación real esto vendría de la API
      setLoading(true);

      // Simular una carga de datos
      setTimeout(() => {
        setLoading(false);
      }, 500);

    } catch (error) {
      console.error("Error al cargar datos específicos del sitio:", error);
      setLoading(false);
    }
  };

  // Función para manejar la respuesta de Chloe basada en mensajes del usuario
  const handleChloeResponse = (userMessage: string) => {
    const lowerCaseMessage = userMessage.toLowerCase();

    // Respuestas diferentes según si el usuario tiene proyectos activos o no
    if (!hasActiveProjects) {
      // Respuestas para usuarios sin proyectos
      setTimeout(() => {
        if (lowerCaseMessage.includes('servicio') || lowerCaseMessage.includes('precio') || lowerCaseMessage.includes('costo')) {
          addMessage('assistant', 'Ofrecemos diferentes servicios de desarrollo web adaptados a tus necesidades. Puedes ver todos nuestros servicios en la sección "Servicios" de nuestra página principal. ¿Te gustaría que te redirija allí?');
        } else if (lowerCaseMessage.includes('ver') || lowerCaseMessage.includes('mostrar') || lowerCaseMessage.includes('servicios')) {
          addMessage('assistant', 'Perfecto! Te invito a explorar nuestros servicios en la página principal. Allí encontrarás opciones desde landing pages hasta tiendas online completas.');
        } else {
          addMessage('assistant', 'Gracias por tu mensaje. Te recomiendo explorar nuestros servicios para encontrar la opción que mejor se adapte a tus necesidades. ¿Hay algo específico en lo que pueda orientarte?');
        }
      }, 1000);
      return;
    }

    // Si tiene proyectos activos, usar respuestas inteligentes basadas en el estado del proyecto
    setTimeout(() => {
      // Respuestas sobre el progreso del proyecto
      if (lowerCaseMessage.includes('progreso') || lowerCaseMessage.includes('avance') || lowerCaseMessage.includes('como va')) {
        const currentMilestone = progress.milestones.find(m => !m.completed);
        const completedMilestones = progress.milestones.filter(m => m.completed);

        let progressMessage = `Tu proyecto "${projectInfo.name}" está al ${progress.percentage}% de completarse. `;
        progressMessage += `Actualmente estamos en la fase de "${progress.stage}".\\n\\n`;

        if (completedMilestones.length > 0) {
          progressMessage += `✅ **Etapas completadas:**\\n`;
          completedMilestones.forEach(milestone => {
            progressMessage += `• ${milestone.name}\\n`;
          });
        }

        if (currentMilestone) {
          progressMessage += `\\n🔄 **Próxima etapa:** ${currentMilestone.name}\\n`;
          progressMessage += `**Próximo paso:** ${progress.nextTask}`;
        }

        addMessage('assistant', progressMessage);
      }

      // Respuestas sobre la composición del proyecto
      else if (lowerCaseMessage.includes('composición') || lowerCaseMessage.includes('incluye') || lowerCaseMessage.includes('tendrá') || lowerCaseMessage.includes('características')) {
        let compositionMessage = `Tu proyecto "${projectInfo.name}" incluirá las siguientes características:\\n\\n`;

        // Personalizar según el tipo de proyecto
        if (projectInfo.businessType === 'ecommerce') {
          compositionMessage += `🛒 **Tienda Online Completa:**\\n`;
          compositionMessage += `• Catálogo de productos con imágenes\\n`;
          compositionMessage += `• Carrito de compras integrado\\n`;
          compositionMessage += `• Sistema de pagos con MercadoPago\\n`;
          compositionMessage += `• Panel de administración de productos\\n`;
          compositionMessage += `• Gestión de inventario\\n`;
          compositionMessage += `• Sistema de envíos\\n`;
        } else if (projectInfo.businessType === 'blog') {
          compositionMessage += `📝 **Blog Profesional:**\\n`;
          compositionMessage += `• Sistema de gestión de contenido\\n`;
          compositionMessage += `• Categorías y etiquetas\\n`;
          compositionMessage += `• Comentarios de usuarios\\n`;
          compositionMessage += `• Newsletter integrado\\n`;
          compositionMessage += `• SEO optimizado\\n`;
        } else if (projectInfo.businessType === 'portfolio') {
          compositionMessage += `🎨 **Portfolio Profesional:**\\n`;
          compositionMessage += `• Galería de proyectos\\n`;
          compositionMessage += `• Sección sobre ti/empresa\\n`;
          compositionMessage += `• Formulario de contacto\\n`;
          compositionMessage += `• Testimonios de clientes\\n`;
          compositionMessage += `• CV/Experiencia descargable\\n`;
        } else {
          compositionMessage += `🌐 **Sitio Web Profesional:**\\n`;
          compositionMessage += `• Página de inicio atractiva\\n`;
          compositionMessage += `• Sección sobre nosotros\\n`;
          compositionMessage += `• Servicios/Productos\\n`;
          compositionMessage += `• Formulario de contacto\\n`;
          compositionMessage += `• Integración con redes sociales\\n`;
        }

        compositionMessage += `\\n✨ **Características generales:**\\n`;
        compositionMessage += `• Diseño responsive (móvil y desktop)\\n`;
        compositionMessage += `• Optimización SEO\\n`;
        compositionMessage += `• Velocidad de carga optimizada\\n`;
        compositionMessage += `• Certificado SSL incluido\\n`;
        compositionMessage += `• Panel de administración\\n`;

        addMessage('assistant', compositionMessage);
      }

      // Respuestas sobre cambios o modificaciones
      else if (lowerCaseMessage.includes('cambiar') || lowerCaseMessage.includes('modificar') || lowerCaseMessage.includes('agregar')) {
        let changeMessage = `¡Por supuesto! Puedes solicitar cambios en cualquier momento durante el desarrollo. `;

        if (progress.percentage < 50) {
          changeMessage += `Como tu proyecto está en las etapas iniciales (${progress.percentage}%), es el momento perfecto para hacer ajustes sin costo adicional.\\n\\n`;
        } else if (progress.percentage < 80) {
          changeMessage += `Tu proyecto está en desarrollo avanzado (${progress.percentage}%). Algunos cambios menores son posibles, pero cambios mayores podrían afectar el cronograma.\\n\\n`;
        } else {
          changeMessage += `Tu proyecto está casi terminado (${progress.percentage}%). Los cambios en esta etapa son limitados para mantener la calidad y el cronograma.\\n\\n`;
        }

        changeMessage += `**¿Qué te gustaría modificar específicamente?**\\n`;
        changeMessage += `• Diseño o colores\\n`;
        changeMessage += `• Contenido o textos\\n`;
        changeMessage += `• Funcionalidades\\n`;
        changeMessage += `• Estructura de páginas\\n\\n`;
        changeMessage += `Puedes contactar directamente al desarrollador usando el botón de WhatsApp para discutir los detalles.`;

        addMessage('assistant', changeMessage);
      }

      // Respuestas sobre tiempos de entrega
      else if (lowerCaseMessage.includes('cuándo') || lowerCaseMessage.includes('tiempo') || lowerCaseMessage.includes('entrega') || lowerCaseMessage.includes('listo')) {
        const remainingPercentage = 100 - progress.percentage;
        const estimatedDays = Math.ceil((remainingPercentage / 100) * 14); // Estimación basada en 14 días total

        let timeMessage = `Basándome en el progreso actual (${progress.percentage}%), tu proyecto estará listo en aproximadamente **${estimatedDays} días**.\\n\\n`;

        timeMessage += `📅 **Cronograma estimado:**\\n`;
        progress.milestones.forEach((milestone, index) => {
          const daysForMilestone = Math.ceil(((index + 1) / progress.milestones.length) * 14);
          const status = milestone.completed ? '✅' : '⏳';
          timeMessage += `${status} ${milestone.name}: ${milestone.completed ? 'Completado' : `Día ${daysForMilestone}`}\\n`;
        });

        timeMessage += `\\n*Los tiempos pueden variar según la complejidad de los cambios solicitados y la disponibilidad de contenido por parte del cliente.*`;

        addMessage('assistant', timeMessage);
      }

      // Respuestas sobre el dominio
      else if (lowerCaseMessage.includes('dominio') || lowerCaseMessage.includes('url') || lowerCaseMessage.includes('dirección')) {
        let domainMessage = '';

        if (projectInfo.domain && projectInfo.domain !== 'pendiente.com') {
          domainMessage = `Tu sitio web estará disponible en: **${projectInfo.domain}**\\n\\n`;
        } else {
          domainMessage = `Aún no has configurado tu dominio personalizado. `;
        }

        domainMessage += `🌐 **Opciones de dominio:**\\n`;
        domainMessage += `• **Dominio gratuito:** subdominio.circuitprompt.com.ar\\n`;
        domainMessage += `• **Dominio personalizado:** tuempresa.com (costo adicional)\\n\\n`;
        domainMessage += `Si ya tienes un dominio, podemos configurarlo para que apunte a tu nuevo sitio. ¿Te gustaría que te ayude con la configuración del dominio?`;

        addMessage('assistant', domainMessage);
      }

      // Respuestas sobre hosting y mantenimiento
      else if (lowerCaseMessage.includes('hosting') || lowerCaseMessage.includes('mantenimiento') || lowerCaseMessage.includes('servidor')) {
        let hostingMessage = `🖥️ **Hosting y Mantenimiento incluido:**\\n\\n`;
        hostingMessage += `✅ **Hosting gratuito el primer año**\\n`;
        hostingMessage += `✅ **Certificado SSL incluido**\\n`;
        hostingMessage += `✅ **Copias de seguridad automáticas**\\n`;
        hostingMessage += `✅ **Actualizaciones de seguridad**\\n`;
        hostingMessage += `✅ **Soporte técnico 24/7**\\n\\n`;
        hostingMessage += `Después del primer año, el hosting tiene un costo de mantenimiento muy accesible. Te notificaremos con anticipación para que puedas renovar sin interrupciones.`;

        addMessage('assistant', hostingMessage);
      }

      // Respuestas sobre SEO y posicionamiento
      else if (lowerCaseMessage.includes('seo') || lowerCaseMessage.includes('google') || lowerCaseMessage.includes('posicionamiento') || lowerCaseMessage.includes('búsqueda')) {
        let seoMessage = `🔍 **Optimización SEO incluida:**\\n\\n`;
        seoMessage += `✅ **SEO Técnico:**\\n`;
        seoMessage += `• Estructura HTML optimizada\\n`;
        seoMessage += `• Meta tags y descripciones\\n`;
        seoMessage += `• Sitemap XML automático\\n`;
        seoMessage += `• Velocidad de carga optimizada\\n\\n`;
        seoMessage += `✅ **SEO de Contenido:**\\n`;
        seoMessage += `• Títulos y encabezados optimizados\\n`;
        seoMessage += `• URLs amigables\\n`;
        seoMessage += `• Imágenes optimizadas\\n\\n`;
        seoMessage += `📈 **Servicios adicionales disponibles:**\\n`;
        seoMessage += `• Análisis de palabras clave\\n`;
        seoMessage += `• Optimización avanzada\\n`;
        seoMessage += `• Configuración de Google Analytics\\n`;
        seoMessage += `• Google My Business`;

        addMessage('assistant', seoMessage);
      }

      // Respuesta genérica inteligente
      else {
        const responses = [
          `Entiendo tu consulta sobre "${projectInfo.name}". ¿Podrías ser más específico sobre qué aspecto del proyecto te interesa conocer?`,
          `Estoy aquí para ayudarte con cualquier duda sobre tu proyecto. Puedo contarte sobre el progreso, características, tiempos de entrega, o cualquier otro aspecto.`,
          `¡Perfecto! Tomaré nota de esto para el desarrollo de tu sitio. ¿Hay algo más específico en lo que pueda ayudarte hoy?`,
          `Gracias por tu mensaje. Si necesitas hacer cambios o tienes dudas específicas, no dudes en contactar al desarrollador directamente por WhatsApp.`
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage('assistant', randomResponse);
      }
    }, 1000);
  };

  // Función para manejar el envío de mensajes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Añadir mensaje del usuario
    addMessage('user', inputMessage);

    // Procesar respuesta de Chloe
    handleChloeResponse(inputMessage);

    // Limpiar el input
    setInputMessage('');
  };

  // La función handleLogin ya no es necesaria, ahora redirigimos directamente

  // Función para cerrar sesión usando el hook de autenticación
  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  // Función para manejar los cambios en la configuración
  const handleSaveSettings = () => {
    // Aquí iría la lógica para guardar los cambios de configuración
    alert('Cambios guardados con éxito');
  };

  // Función para manejar las solicitudes de reembolso
  const handleRefundRequest = async (serviceId: string, reason: string, paymentId?: string): Promise<void> => {
    try {
      setLoading(true);

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      // Obtener detalles del servicio para el email
      const serviceDetails = purchasedServices.find(service => service.id === serviceId);

      // Preparar los datos para la solicitud
      const refundData = {
        serviceId,
        reason,
        paymentId, // Incluir el ID de pago de MercadoPago
        userId: user?.id,
        userEmail: user?.email,
        adminEmail: 'lucasdono391@gmail.com',
        serviceName: serviceDetails?.name || 'Servicio desconocido',
        amount: serviceDetails?.amount || 0,
        purchaseDate: serviceDetails?.purchaseDate || new Date().toISOString()
      };

      console.log('Enviando solicitud de reembolso:', refundData);
      console.log('URL de API:', `${API_BASE_URL} /payments/refunds / request`);

      // Usar axios en lugar de fetch para mejor manejo de errores
      const response = await axios.post(
        `${API_BASE_URL} /payments/refunds / request`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token} `
          }
        }
      );

      console.log('Solicitud de reembolso enviada:', response.data);

      // Actualizar servicios después de procesar
      await fetchUserServices();

      // No retornamos nada para que sea Promise<void>
    } catch (err: any) {
      console.error('Error en solicitud de reembolso:', err);

      // Mostrar detalles específicos del error para mejor diagnóstico
      if (err.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error('Error de respuesta:', {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
        throw new Error(err.response.data?.message || `Error ${err.response.status}: Error al procesar la solicitud`);
      } else if (err.request) {
        // La solicitud se hizo pero no se recibió respuesta
        console.error('Error de solicitud (sin respuesta):', err.request);
        throw new Error('No se recibió respuesta del servidor. Verifica tu conexión a internet.');
      } else {
        // Ocurrió un error durante la configuración de la solicitud
        console.error('Error de configuración:', err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar navegación de slides
  const handleNextSlide = () => {
    setCurrentSlide(current =>
      current === previewImages.length - 1 ? 0 : current + 1
    );
  };

  const handlePrevSlide = () => {
    setCurrentSlide(current =>
      current === 0 ? previewImages.length - 1 : current - 1
    );
  };

  // Manejar respuesta rápida
  const handleQuickReply = (message: string) => {
    if (isChatMinimized) {
      setIsChatMinimized(false);
    }

    // Añadir mensaje del usuario
    addMessage('user', message);

    // Procesar respuesta de Chloe
    handleChloeResponse(message);
  };

  // Funciones para el modal de imagen
  const openImageModal = (image: PreviewImage) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  // Renderizar previsualización
  const renderPreview = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: windowSize.width <= 1024 ? 'auto' : '100%',
      overflow: windowSize.width <= 1024 ? 'visible' : 'hidden',
      padding: windowSize.width <= 1024 ? '0' : '1rem',
      minHeight: windowSize.width <= 1024 ? '300px' : 'auto'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <PreviewHeaderContainer>
          <PreviewInfoSection>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f5f5f5', fontSize: '1.1rem' }}>
              Vista Previa
            </h3>
          </PreviewInfoSection>

          <div style={{
            display: 'flex',
            gap: windowSize.width <= 1024 ? '0.5rem' : '1rem',
            alignItems: 'center',
            marginLeft: windowSize.width <= 1024 ? 'auto' : '0'
          }}>
            <PreviewDevices>
              <DeviceButton
                active={activeDevice === 'desktop'}
                onClick={() => setActiveDevice('desktop')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                Desktop
              </DeviceButton>

              <DeviceButton
                active={activeDevice === 'mobile'}
                onClick={() => setActiveDevice('mobile')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                Móvil
              </DeviceButton>
            </PreviewDevices>

            {windowSize.width > 1024 && (
              <ProgressIndicator>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
                {progress.percentage}% completado
              </ProgressIndicator>
            )}
          </div>
        </PreviewHeaderContainer>
      </div>

      <div style={{ flex: windowSize.width <= 1024 ? 'none' : 1, height: 'auto', overflow: 'visible' }}>
        <PreviewContainer>
          {previewImages.length > 0 ? (
            <div>
              <h4 style={{ margin: '0 0 1rem 0.5rem', color: '#f5f5f5', fontSize: '1rem', fontWeight: 'normal' }}>
                {activeDevice === 'desktop' ? 'Vista de escritorio' : 'Vista móvil'} • Haz clic en una imagen para ampliarla
              </h4>

              {/* Carrusel horizontal de miniaturas */}
              <PreviewThumbnails>
                {previewImages.map((image, index) => (
                  <PreviewThumbnail
                    key={image.id}
                    active={currentSlide === index}
                    imageUrl={image.url}
                    onClick={() => {
                      setCurrentSlide(index);
                      openImageModal(image);
                    }}
                  >
                    <ThumbnailTitle>{image.title}</ThumbnailTitle>
                  </PreviewThumbnail>
                ))}
              </PreviewThumbnails>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                  {currentSlide + 1} de {previewImages.length}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <PreviewButton onClick={handlePrevSlide} disabled={previewImages.length <= 1}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </PreviewButton>

                  <PreviewButton onClick={handleNextSlide} disabled={previewImages.length <= 1}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </PreviewButton>
                </div>
              </div>
            </div>
          ) : (
            <PreviewMockup>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              <div style={{ color: '#fff', fontWeight: '500', textAlign: 'center' }}>
                Acá verás la vista previa de tu sitio web
              </div>
            </PreviewMockup>
          )}
        </PreviewContainer>
      </div>

      {/* Modal para vista ampliada de imágenes */}
      <AnimatePresence>
        {isImageModalOpen && selectedImage && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
          >
            <ModalContent
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalClose onClick={closeImageModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </ModalClose>
              <ModalImage src={selectedImage.url} alt={selectedImage.title} />
              <ModalTitle>
                <h4>{selectedImage.title}</h4>
                <p>{selectedImage.description}</p>
              </ModalTitle>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );

  // Componente para la sección de sitios activos
  const renderActiveSites = () => (
    <Card>
      {activeSites.length > 0 ? (
        <SitesContainer>
          {activeSites.map(site => (
            <SiteCard
              key={site.id}
              onClick={() => selectSite(site.id)}
              selected={selectedSiteId === site.id}
            >
              <SiteHeader>
                <SiteName>
                  {site.type === 'portfolio' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  ) : site.type === 'blog' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  )}
                  {site.name}
                </SiteName>
                <SiteStatus status={site.status}>
                  {site.status === 'online' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      En línea
                    </>
                  ) : site.status === 'maintenance' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Mantenimiento
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      Desarrollo
                    </>
                  )}
                </SiteStatus>
              </SiteHeader>

              <SiteFooter>
                <SiteDate>Actualizado: {formatDate(site.lastUpdated)}</SiteDate>
              </SiteFooter>
            </SiteCard>
          ))}
        </SitesContainer>
      ) : (
        <NoSitesCard>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <NoSitesTitle>¡Aún no tienes sitios activos!</NoSitesTitle>
          <NoSitesDescription>
            Explora nuestros planes y lanza tu primer sitio web hoy. Tenemos opciones para todos los proyectos y presupuestos. 🚀
          </NoSitesDescription>
          <NoSitesButton onClick={navigateToServices}>
            Ver planes disponibles
          </NoSitesButton>
        </NoSitesCard>
      )}

      {activeSites.length > 0 && (
        <WhatsAppButton href="https://wa.me/542324543762?text=Hola,%20tengo%20una%20consulta%20sobre%20mi%20proyecto" target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          Contactar al desarrollador
        </WhatsAppButton>
      )}
    </Card>
  );

  // Renderizar componente de estado del proyecto
  const renderProjectStatus = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: windowSize.width <= 1024 ? '0' : '1rem',
      height: windowSize.width <= 1024 ? 'auto' : '100%',
      minHeight: windowSize.width <= 1024 ? '400px' : 'auto'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#f5f5f5', fontSize: '1.2rem', fontWeight: '600' }}>
        {projectInfo.name}
      </h3>
      <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 1.5rem 0', lineHeight: '1.6' }}>
        {projectInfo.description}
      </p>

      <ProgressContainer>
        <ProgressInfo>
          <ProgressDetails>
            <ProgressValue style={{
              fontSize: windowSize.width <= 1024 ? '2rem' : '1.5rem',
              color: windowSize.width <= 1024 ? '#00FFFF' : '#00FFFF',
              fontWeight: windowSize.width <= 1024 ? '700' : '700'
            }}>
              {progress.percentage}%
            </ProgressValue>
            <div>
              <ProgressStage>{progress.stage}</ProgressStage>
              <ProgressNextTask>Próximo paso: {progress.nextTask}</ProgressNextTask>
            </div>
          </ProgressDetails>

          <ProgressStatus>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
            Activo
          </ProgressStatus>
        </ProgressInfo>

        <ProgressBarContainer>
          <ProgressBarFill percentage={progress.percentage} />
        </ProgressBarContainer>

        <MilestonesContainer>
          {progress.milestones.map(milestone => (
            <Milestone key={milestone.id} completed={milestone.completed}>
              <MilestoneIcon completed={milestone.completed}>
                {milestone.completed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                )}
              </MilestoneIcon>
              <MilestoneName completed={milestone.completed}>
                {milestone.name}
              </MilestoneName>
            </Milestone>
          ))}
        </MilestonesContainer>

        {progress.percentage > 80 && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <ViewSiteButton href="#" target="_blank">
              Ver sitio web
            </ViewSiteButton>
          </div>
        )}
      </ProgressContainer>
    </div>
  );

  // Renderizar asistente virtual
  const renderAssistantChat = () => {
    const chatContent = (
      <>
        <ChatHeader>
          <AssistantAvatar>🤖</AssistantAvatar>
          <AssistantInfo>
            <h3>Chloe</h3>
            <p>Asistente Virtual</p>
          </AssistantInfo>
          <MinimizeButton
            onClick={() => {
              setIsChatMinimized(true);
              setIsFullscreenChat(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </MinimizeButton>
        </ChatHeader>

        <MessagesContainer>
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              $isUser={msg.role === 'user'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <QuickReplies>
          {quickReplies.map((reply, index) => (
            <QuickReply
              key={index}
              onClick={() => handleQuickReply(reply)}
            >
              {reply}
            </QuickReply>
          ))}
        </QuickReplies>

        <InputContainer onSubmit={handleSubmit}>
          <ChatInput
            type="text"
            placeholder="Escribe un mensaje..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onClick={() => setIsChatMinimized(false)}
          />
          <SendButton
            type="submit"
            disabled={!inputMessage.trim()}
          >
            <SendIcon />
          </SendButton>
        </InputContainer>
      </>
    );

    return (
      <MainCard>
        <ChatContainer>
          {isChatMinimized ? (
            <MinimizedChat
              onClick={() => {
                setIsChatMinimized(false);
                if (window.innerWidth <= 768) {
                  setIsFullscreenChat(true);
                }
              }}
              initial={{ y: '80%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AssistantAvatar>🤖</AssistantAvatar>
              <AssistantInfo>
                <h3>Chloe</h3>
                <p>Haz clic para continuar la conversación</p>
              </AssistantInfo>
            </MinimizedChat>
          ) : (
            <>
              {chatContent}

              {isFullscreenChat && (
                <FullScreenChatContainer
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.3 }}
                >
                  {chatContent}
                </FullScreenChatContainer>
              )}
            </>
          )}
        </ChatContainer>
      </MainCard>
    );
  };

  // Renderizar el dashboard para visualización móvil
  const renderMobileView = () => (
    <>
      {/* Contenido principal con nueva disposición sin tarjetas */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: 'calc(100vh - 100px)',
        padding: '0.5rem',
        overflow: 'auto',
        gap: '1rem'
      }}>
        {/* Botón de configuración destacado para móvil */}
        <div style={{
          margin: '0.5rem 0 1rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: '0.8rem 1.5rem',
              background: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 10px rgba(255, 0, 255, 0.3)',
              fontSize: '1rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Configuración y Reembolsos
          </button>
        </div>
        {/* Estado del Proyecto */}
        <div style={{
          flex: hasActiveProjects ? 'none' : 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          marginBottom: '1.5rem',
          minHeight: '450px'
        }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              color: '#f5f5f5',
              fontFamily: "'Poppins', sans-serif"
            }}>Estado del Proyecto</span>
          </div>
          <div style={{ height: 'auto', overflow: 'visible', padding: '0 0.75rem' }}>
            {hasActiveProjects ? renderProjectStatus() : <NoProjectsContent />}
          </div>
        </div>

        {/* Previsualización */}
        {hasActiveProjects && (
          <div style={{
            flex: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            marginBottom: '1.5rem',
            minHeight: '500px'
          }}>
            <div style={{
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span style={{
                fontSize: '1.4rem',
                fontWeight: 600,
                color: '#f5f5f5',
                fontFamily: "'Poppins', sans-serif"
              }}>Previsualización</span>
            </div>
            <div style={{ height: 'auto', overflow: 'visible', padding: '0 0.75rem' }}>
              {renderPreview()}
            </div>
          </div>
        )}
      </div>

      {/* Overlay para cerrar el menú lateral */}
      <Overlay isVisible={isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />

      {/* Barra lateral para móvil - para sitios */}
      <MobileSidebar isOpen={isSidebarOpen}>
        <MobileSidebarClose onClick={() => setIsSidebarOpen(false)}>
          <CloseIcon />
        </MobileSidebarClose>
        <div style={{
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
          </svg>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 600,
            color: '#f5f5f5',
            fontFamily: "'Poppins', sans-serif"
          }}>Mis Sitios</span>
        </div>
        <div style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
          {renderActiveSites()}
        </div>
      </MobileSidebar>

      {/* Chat en pantalla completa */}
      <FullScreenChatOverlay isOpen={showMobileChat}>
        <CloseFullScreenButton onClick={() => setShowMobileChat(false)}>
          <CloseIcon />
        </CloseFullScreenButton>
        <div style={{ height: '100%', padding: '1rem', paddingTop: '3rem' }}>
          {renderAssistantChat()}
        </div>
      </FullScreenChatOverlay>
    </>
  );

  // Verificar autenticación - si estamos cargando, mostrar pantalla de carga
  if (authLoading || loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#121212',
        color: '#f5f5f5'
      }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00d2ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: 'spin 1.5s linear infinite',
            marginBottom: '1rem'
          }}
        >
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <style>{`
          @keyframes spin {
  0 % { transform: rotate(0deg); }
  100 % { transform: rotate(360deg); }
          }
        `}</style>
        <div>Cargando datos del proyecto...</div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    redirectToLogin();
    return null;
  }

  // Componente para mostrar cuando no hay proyectos activos
  const NoProjectsContent = () => (
    <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', color: '#00FFFF' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#F5F5F5' }}>
        ¡No tienes proyectos activos aún!
      </h3>
      <p style={{ color: '#AAA', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
        Todavía no has adquirido ninguno de nuestros servicios. Explora nuestras opciones
        de desarrollo web y encuentra la solución perfecta para tu presencia online.
      </p>
    </Card>
  );

  // Renderiza el componente de solicitud de reembolso
  const renderRefundRequest = () => {
    // Datos simulados de servicios para demostración
    // En un entorno real, estos datos vendrían de la API
    const demoServices = [
      {
        id: '1',
        name: 'Desarrollo Web - Plan Básico',
        purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días atrás
        amount: 199.99,
        description: 'Página web profesional con hasta 5 secciones y diseño responsive.'
      },
      {
        id: '2',
        name: 'SEO Optimización',
        purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
        amount: 149.99,
        description: 'Mejora el posicionamiento de tu sitio en buscadores.'
      },
      {
        id: '3',
        name: 'Mantenimiento Anual',
        purchaseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 días atrás (no elegible)
        amount: 299.99,
        description: 'Servicio de mantenimiento y actualizaciones durante un año.'
      }
    ];

    return (
      <RefundRequest
        userServices={purchasedServices.length > 0 ? purchasedServices : demoServices}
        onSubmitRequest={handleRefundRequest}
      />
    );
  };

  // Componente de configuraciones
  const renderSettings = () => (
    <SectionContainer>
      <SectionHeader>
        <SettingsSectionTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Configuración
        </SettingsSectionTitle>
      </SectionHeader>

      {/* Configuración del Usuario */}
      <SettingsSection>
        <SettingsTitle>Configuración de Cuenta</SettingsTitle>
        <SettingsForm>
          <SettingsRow>
            <SettingsLabel>Nombre</SettingsLabel>
            <SettingsInput
              type="text"
              value={userFullName}
              onChange={(e) => setUserFullName(e.target.value)}
            />
          </SettingsRow>
          <SettingsRow>
            <SettingsLabel>Email</SettingsLabel>
            <SettingsValue>{user?.email || 'No disponible'}</SettingsValue>
          </SettingsRow>
          <SettingsRow>
            <SettingsLabel>Tema</SettingsLabel>
            <ThemeSelector>
              <ThemeOption
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
              >
                Oscuro
              </ThemeOption>
              <ThemeOption
                active={theme === 'light'}
                onClick={() => setTheme('light')}
              >
                Claro
              </ThemeOption>
            </ThemeSelector>
          </SettingsRow>
          <SaveButton onClick={handleSaveSettings}>
            Guardar Cambios
          </SaveButton>
        </SettingsForm>
      </SettingsSection>

      {/* Añadir aquí el componente de Configuración de Seguridad */}
      <SecuritySettings />

      {/* Componente de solicitud de reembolso */}
      {renderRefundRequest()}

      {/* Otras opciones de configuración */}
      <SettingsSection>
        <SettingsTitle>Opciones de Panel</SettingsTitle>
        <SettingsButton onClick={resetLayout}>
          Restablecer Diseño del Panel
        </SettingsButton>
      </SettingsSection>

      <SettingsSection>
        <SettingsTitle>Sesión</SettingsTitle>
        <SettingsButton onClick={handleLogout}>
          Cerrar Sesión
        </SettingsButton>
      </SettingsSection>
    </SectionContainer>
  );

  // Función para cargar/actualizar los servicios del usuario
  const fetchUserServices = async () => {
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No se encontró token de autenticación');
        return;
      }

      setLoading(true);

      // Obtener servicios del usuario desde la API
      const response = await fetch(`${API_BASE_URL} /services/user`, {
        headers: {
          'Authorization': `Bearer ${token} `,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }

      const data = await response.json();

      // Actualizar estado con los servicios obtenidos
      if (data && data.services) {
        const servicesWithPurchaseInfo = data.services.map((service: any) => ({
          ...service,
          purchaseDate: service.purchaseDate || service.createdAt,
          amount: service.amount || 0
        }));

        setPurchasedServices(servicesWithPurchaseInfo);
      }
    } catch (error) {
      console.error('Error al cargar servicios del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  // Añadir esta función para navegar a servicios sin recargar la página
  const navigateToServices = () => {
    console.log('Navegando a la sección de servicios sin recargar la página');
    // Navegar a la página principal
    navigate('/');

    // Esperar un poco para que cargue la página
    setTimeout(() => {
      // Desplazarse a la sección de servicios
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  return (
    <DashboardContainer style={{ overflow: windowSize.width <= 1024 ? 'hidden' : 'auto' }}>
      <Header>
        <HeaderTop>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {windowSize.width <= 1024 && (
              <HamburgerMenuButton onClick={() => setIsSidebarOpen(true)}>
                <MenuIcon />
              </HamburgerMenuButton>
            )}
            <Title>Panel de Proyecto</Title>
          </div>
          <UserInfo>
            <Avatar>{userFullName.charAt(0)}</Avatar>
            <div>
              <div>{userFullName}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <NavButton to="/">
                  <HomeIcon /> Inicio
                </NavButton>
                <NavButton
                  as="button"
                  style={{
                    background: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                  onClick={() => setShowSettingsModal(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Configuración
                </NavButton>
                <NavButton as="button" onClick={handleLogout}>Cerrar sesión</NavButton>
              </div>
            </div>
          </UserInfo>
        </HeaderTop>
      </Header>

      {windowSize.width <= 1024 ? (
        /* Vista móvil optimizada */
        renderMobileView()
      ) : (
        /* Grid reorganizable para tablet y desktop */
        <>
          <ContentGrid height={windowSize.height}>
            <ResponsiveGridLayout
              className={`layout ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} `}
              layout={layouts}
              cols={6}
              rowHeight={Math.max(80, Math.floor((windowSize.height - 150) / 8))}
              width={windowSize.width - 48}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              margin={[12, 12]}
              containerPadding={[8, 8]}
              isDraggable={true}
              isResizable={true}
              compactType="vertical"
              preventCollision={false}
              useCSSTransforms={true}
              verticalCompact={true}
              onDragStart={handleDragStart}
              onDragStop={handleDragStop}
              onResizeStart={handleResizeStart}
              onResizeStop={handleResizeStop}
              autoSize={true}
            >
              <DraggableItem key="projectStatus">
                <DragHandle className="drag-handle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </DragHandle>
                {hasActiveProjects ? renderProjectStatus() : <NoProjectsContent />}
              </DraggableItem>

              <DraggableItem key="preview">
                <DragHandle className="drag-handle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </DragHandle>
                {hasActiveProjects && renderPreview()}
              </DraggableItem>

              <DraggableItem key="assistant">
                <DragHandle className="drag-handle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </DragHandle>
                <SectionTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                  Asistente Virtual
                </SectionTitle>
                {renderAssistantChat()}
              </DraggableItem>

              <DraggableItem key="sites" style={{ display: windowSize.width > 1024 || isSidebarOpen ? 'flex' : 'none' }}>
                <DragHandle className="drag-handle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </DragHandle>
                <SectionTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
                  </svg>
                  Mis Sitios
                </SectionTitle>
                {renderActiveSites()}
              </DraggableItem>
            </ResponsiveGridLayout>
          </ContentGrid>

          {/* Overlay para cerrar el menú lateral */}
          <Overlay isVisible={isSidebarOpen && windowSize.width <= 1024} onClick={() => setIsSidebarOpen(false)} />

          {/* Barra lateral para móvil - para sitios */}
          <MobileSidebar isOpen={isSidebarOpen && windowSize.width <= 1024}>
            <MobileSidebarClose onClick={() => setIsSidebarOpen(false)}>
              <CloseIcon />
            </MobileSidebarClose>
            <div style={{
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
              </svg>
              <span style={{
                fontSize: '1.4rem',
                fontWeight: 600,
                color: '#f5f5f5',
                fontFamily: "'Poppins', sans-serif"
              }}>Mis Sitios</span>
            </div>
            <div style={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
              {renderActiveSites()}
            </div>
          </MobileSidebar>

          {/* Botón para restablecer el layout */}
          <ResetLayoutButton onClick={resetLayout} title="Restablecer diseño">
            <ResetIcon />
          </ResetLayoutButton>
        </>
      )}


      {/* Chat en pantalla completa solo para móvil */}
      <FullScreenChatOverlay isOpen={showMobileChat && windowSize.width <= 1024}>
        <CloseFullScreenButton onClick={() => setShowMobileChat(false)}>
          <CloseIcon />
        </CloseFullScreenButton>
        <div style={{ height: '100%', padding: '1rem', paddingTop: '3rem' }}>
          {renderAssistantChat()}
        </div>
      </FullScreenChatOverlay>

      {/* Modal de Configuración */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '1.5rem',
                zIndex: 1
              }}
              onClick={() => setShowSettingsModal(false)}
            >
              <CloseIcon />
            </button>

            {renderSettings()}
          </div>
        </div>
      )}
    </DashboardContainer>
  );
};

export default Dashboard; 
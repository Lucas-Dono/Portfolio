import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Interfaces
interface Message {
  id: number;
  senderType: 'user' | 'ai' | 'developer' | 'system';
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  type: 'ai' | 'developer';
  messages: Message[];
}

interface HybridChatProps {
  userId: string;
  projectId?: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

// Componentes estilizados
const ChatContainer = styled(motion.div)<{ $isMinimized: boolean }>`
  display: flex;
  flex-direction: column;
  height: ${props => props.$isMinimized ? '60px' : '500px'};
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    height: ${props => props.$isMinimized ? '60px' : '400px'};
    border-radius: 8px;
  }
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #2a2a2a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 60px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AssistantAvatar = styled.div<{ $type: 'ai' | 'developer' }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$type === 'ai' 
    ? 'linear-gradient(135deg, #007bff, #0056b3)'
    : 'linear-gradient(135deg, #ff6b35, #ff8c42)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const AssistantInfo = styled.div`
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: #888;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TypeSelector = styled.div`
  display: flex;
  background: #333;
  border-radius: 20px;
  padding: 2px;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const TypeButton = styled.button<{ $active: boolean; $type: 'ai' | 'developer' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 18px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => props.$active 
    ? (props.$type === 'ai' ? '#007bff' : '#ff6b35')
    : 'transparent'};
  color: ${props => props.$active ? 'white' : '#888'};
  
  &:hover {
    color: ${props => props.$type === 'ai' ? '#007bff' : '#ff6b35'};
  }
`;

const MinimizeButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
  
  &:hover {
    color: #ffffff;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #2a2a2a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
  }
`;

const MessageBubble = styled(motion.div)<{ $isUser: boolean; $senderType: string }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  
  background: ${props => {
    if (props.$isUser) return 'linear-gradient(135deg, #007bff, #0056b3)';
    if (props.$senderType === 'ai') return '#2a2a2a';
    if (props.$senderType === 'developer') return 'linear-gradient(135deg, #ff6b35, #ff8c42)';
    return '#333';
  }};
  
  color: ${props => props.$senderType === 'ai' && !props.$isUser ? '#e0e0e0' : 'white'};
  border: ${props => props.$senderType === 'ai' && !props.$isUser ? '1px solid #444' : 'none'};
  
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  
  @media (max-width: 480px) {
    max-width: 90%;
    padding: 10px 12px;
    font-size: 13px;
  }
`;

const InputContainer = styled.form`
  display: flex;
  padding: 16px;
  gap: 8px;
  background: #2a2a2a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  background: #333;
  border: 1px solid #444;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  outline: none;
  
  &::placeholder {
    color: #888;
  }
  
  &:focus {
    border-color: #007bff;
  }
`;

const SendButton = styled.button`
  padding: 12px 16px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConnectionStatus = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${props => props.$connected ? '#4caf50' : '#f44336'};
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$connected ? '#4caf50' : '#f44336'};
  }
`;

const MobileSwipeIndicator = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    padding: 8px;
    background: #333;
    
    &::after {
      content: '⬅️ Desliza para cambiar IA/Dev ➡️';
      font-size: 11px;
      color: #888;
    }
  }
`;

// Componente principal
const HybridChat: React.FC<HybridChatProps> = ({ 
  userId, 
  projectId, 
  isMinimized, 
  onToggleMinimize 
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentType, setCurrentType] = useState<'ai' | 'developer'>('ai');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Efectos
  useEffect(() => {
    initializeConversation();
  }, [userId, projectId, currentType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Funciones
  const initializeConversation = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/hybrid-chat/conversations`, {
        userId,
        projectId,
        type: currentType
      });
      
      if ((response.data as any).success) {
        setConversation((response.data as any).conversation);
        setMessages((response.data as any).conversation.messages || []);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !conversation || isLoading) return;
    
    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    // Agregar mensaje del usuario inmediatamente
    const userMessage: Message = {
      id: Date.now(),
      senderType: 'user',
      message: messageText,
      createdAt: new Date().toISOString(),
      isRead: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/hybrid-chat/messages`, {
        conversationId: conversation.id,
        senderType: 'user',
        message: messageText,
        senderId: userId
      });
      
      if ((response.data as any).success) {
        // Refrescar mensajes para obtener respuesta de IA/Dev
        setTimeout(() => {
          refreshMessages();
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMessages = async () => {
    if (!conversation) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/hybrid-chat/conversations`, {
        userId,
        projectId,
        type: currentType
      });
      
      if ((response.data as any).success) {
        setMessages((response.data as any).conversation.messages || []);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const switchType = async (newType: 'ai' | 'developer') => {
    if (newType === currentType || !conversation) return;
    
    try {
      setIsLoading(true);
      await axios.put(`${API_BASE_URL}/api/hybrid-chat/conversations/switch-type`, {
        conversationId: conversation.id,
        newType
      });
      
      setCurrentType(newType);
      await initializeConversation();
    } catch (error) {
      console.error('Error switching conversation type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handlers para móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentType === 'ai') {
        switchType('developer');
      } else if (diff < 0 && currentType === 'developer') {
        switchType('ai');
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Render
  if (isMinimized) {
    return (
      <ChatContainer $isMinimized={true}>
        <ChatHeader>
          <HeaderLeft>
            <AssistantAvatar $type={currentType}>
              {currentType === 'ai' ? 'IA' : 'DEV'}
            </AssistantAvatar>
            <AssistantInfo>
              <h3>{currentType === 'ai' ? 'Asistente IA' : 'Desarrollador'}</h3>
              <p>{currentType === 'ai' ? 'Respuesta automática' : 'Respuesta personal'}</p>
            </AssistantInfo>
          </HeaderLeft>
          <HeaderRight>
            <ConnectionStatus $connected={isConnected}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </ConnectionStatus>
            <MinimizeButton onClick={onToggleMinimize}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            </MinimizeButton>
          </HeaderRight>
        </ChatHeader>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer 
      $isMinimized={false}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ChatHeader>
        <HeaderLeft>
          <AssistantAvatar $type={currentType}>
            {currentType === 'ai' ? 'IA' : 'DEV'}
          </AssistantAvatar>
          <AssistantInfo>
            <h3>{currentType === 'ai' ? 'Asistente IA' : 'Desarrollador'}</h3>
            <p>{currentType === 'ai' ? 'Respuesta automática' : 'Respuesta personal'}</p>
          </AssistantInfo>
        </HeaderLeft>
        <HeaderRight>
          <TypeSelector>
            <TypeButton 
              $active={currentType === 'ai'} 
              $type="ai"
              onClick={() => switchType('ai')}
            >
              IA
            </TypeButton>
            <TypeButton 
              $active={currentType === 'developer'} 
              $type="developer"
              onClick={() => switchType('developer')}
            >
              Dev
            </TypeButton>
          </TypeSelector>
          <ConnectionStatus $connected={isConnected}>
            {isConnected ? 'En línea' : 'Sin conexión'}
          </ConnectionStatus>
          <MinimizeButton onClick={onToggleMinimize}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </MinimizeButton>
        </HeaderRight>
      </ChatHeader>

      <MobileSwipeIndicator />

      <MessagesContainer>
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              $isUser={message.senderType === 'user'}
              $senderType={message.senderType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
                  a: ({ node, ...props }) => (
                    <a 
                      style={{ 
                        color: message.senderType === 'user' ? '#e3f2fd' : '#64b5f6',
                        textDecoration: 'underline' 
                      }} 
                      {...props} 
                    />
                  ),
                }}
              >
                {message.message}
              </ReactMarkdown>
            </MessageBubble>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer onSubmit={sendMessage}>
        <ChatInput
          ref={inputRef}
          type="text"
          placeholder={`Escribe un mensaje ${currentType === 'ai' ? 'a la IA' : 'al desarrollador'}...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading || !isConnected}
        />
        <SendButton type="submit" disabled={!inputMessage.trim() || isLoading || !isConnected}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default HybridChat; 
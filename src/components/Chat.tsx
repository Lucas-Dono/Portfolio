import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Funciones para captura de leads (definidas localmente por ahora)
const addCapturedLead = (email: string, context: string) => {
  const lead = {
    email,
    context,
    timestamp: new Date().toISOString(),
    source: 'chat-assistant'
  };
  
  // Guardar en localStorage
  try {
    const existingLeads = JSON.parse(localStorage.getItem('captured_leads') || '[]');
    existingLeads.push(lead);
    localStorage.setItem('captured_leads', JSON.stringify(existingLeads));
    
    // Enviar al backend
    fetch('/api/auth/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).catch(error => console.error('Error enviando lead al backend:', error));
    
  } catch (error) {
    console.error('Error guardando lead:', error);
  }
  
  return lead;
};

const isEmailCaptured = (email: string): boolean => {
  try {
    const existingLeads = JSON.parse(localStorage.getItem('captured_leads') || '[]');
    return existingLeads.some((lead: any) => lead.email.toLowerCase() === email.toLowerCase());
  } catch {
    return false;
  }
};

// --- Iconos SVG --- 
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.4 8.6 2 9.2l5.6 6.4L6.8 22 12 18l5.2 4-1.4-6.4L22 9.2l-7.4-.6L12 2z" />
    <path d="M5 3v4h4" />
    <path d="M19 17v4h-4" />
    <path d="M3 5l4-4" />
    <path d="M17 19l4 4" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

// Icono para maximizar/restaurar (contorno cuadrado)
const MaximizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg"
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
  </svg>

);

// Icono para minimizar/restaurar (esquinas en ángulo para minimizar)
const MinimizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg"
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Contenedor para agrupar los botones de maximizar y cerrar en el header
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Estilos cinematográficos para el chat
const ChatContainer = styled(motion.div)<{ isOpen: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  width: ${props => props.isOpen ? '400px' : '60px'};
  height: ${props => props.isOpen ? '600px' : '60px'};
  background: rgba(0, 0, 0, 0.95);
  border-radius: ${props => props.isOpen ? '16px' : '50%'};
  border: 2px solid #00FFFF;
  box-shadow: ${props => props.isOpen 
    ? '0 8px 32px rgba(0, 255, 255, 0.4), 0 0 0 4px rgba(0, 255, 255, 0.1)' 
    : '0 8px 32px rgba(0, 255, 255, 0.3)'};
  backdrop-filter: blur(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  /* Efecto de pulso sutil cuando está abierto */
  ${props => props.isOpen && css`
    animation: subtlePulse 3s ease-in-out infinite;
    
    @keyframes subtlePulse {
      0%, 100% { 
        box-shadow: 0 8px 32px rgba(0, 255, 255, 0.4), 0 0 0 4px rgba(0, 255, 255, 0.1);
      }
      50% { 
        box-shadow: 0 8px 32px rgba(0, 255, 255, 0.6), 0 0 0 6px rgba(0, 255, 255, 0.2);
      }
    }
  `}
  
  @media (max-width: 768px) {
    width: ${props => props.isOpen ? 'calc(100vw - 20px)' : '60px'};
    height: ${props => props.isOpen ? 'calc(100vh - 40px)' : '60px'};
    bottom: 10px;
    right: 10px;
    border-radius: ${props => props.isOpen ? '12px' : '50%'};
  }
`;

const ChatHeader = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  font-weight: 600;
  border-radius: 14px 14px 0 0;
`;

const ChatTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

const ChatToggle = styled.button<{ isOpen: boolean }>`
  position: ${props => props.isOpen ? 'static' : 'absolute'};
  top: ${props => props.isOpen ? 'auto' : '50%'};
  left: ${props => props.isOpen ? 'auto' : '50%'};
  transform: ${props => props.isOpen ? 'none' : 'translate(-50%, -50%)'};
  width: ${props => props.isOpen ? '32px' : '60px'};
  height: ${props => props.isOpen ? '32px' : '60px'};
  border: none;
  background: ${props => props.isOpen ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)'};
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.isOpen ? '1.2rem' : '1.5rem'};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.isOpen ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(135deg, #FF33FF 0%, #33FFFF 100%)'};
    transform: ${props => props.isOpen ? 'none' : 'translate(-50%, -50%) scale(1.1)'};
  }
  
  &:focus {
    outline: 3px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }
`;

const ChatBody = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  height: calc(100% - 70px);
  padding: 0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &::-webkit-scrollbar-thumb {
    background: #00FFFF;
    border-radius: 3px;
  }
`;

const Message = styled(motion.div)<{ isUser: boolean }>`
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 80%;
  padding: 0.8rem 1rem;
  border-radius: ${props => props.isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' 
    : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  font-size: 0.9rem;
  line-height: 1.4;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.isUser ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
`;

const InputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`;

const ChatInput = styled.textarea`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #FF33FF 0%, #33FFFF 100%);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: 3px solid rgba(0, 255, 255, 0.6);
    outline-offset: 2px;
  }
`;

const TypingIndicator = styled(motion.div)`
  align-self: flex-start;
  padding: 0.8rem 1rem;
  border-radius: 16px 16px 16px 4px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WelcomeMessage = styled(motion.div)`
  padding: 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

// Interfaces
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatProps {
  isChatOpen?: boolean;
  setIsChatOpen?: (open: boolean) => void;
}

// Componente principal del Chat
const Chat: React.FC<ChatProps> = ({ isChatOpen = true, setIsChatOpen }) => {
  const [isOpen, setIsOpen] = useState(false); // Inicia cerrado para hacer animación de apertura
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Bienvenido a Circuit Prompt! 🚀\n\nSoy tu asistente personal y estoy aquí para ayudarte a:\n\n• 🎯 Encontrar el servicio perfecto para tu proyecto\n• 💰 Obtener cotizaciones personalizadas\n• 📂 Explorar nuestros proyectos anteriores\n• ❓ Resolver cualquier duda sobre desarrollo web\n\n¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Animación de apertura automática al cargar la página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
      if (setIsChatOpen) {
        setIsChatOpen(true);
      }
    }, 1500); // Abre automáticamente después de 1.5 segundos

    return () => clearTimeout(timer);
  }, []); // Solo se ejecuta una vez al montar el componente

  // Sincronizar con props externas (solo si se cambia desde fuera)
  useEffect(() => {
    if (isChatOpen !== undefined) {
      setIsOpen(isChatOpen);
    }
  }, [isChatOpen]);

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Manejar envío de mensajes
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue.trim(),
          context: 'quotation_assistant',
          conversationHistory: messages.slice(-5) // Últimos 5 mensajes para contexto
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.response || 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Disculpa, hubo un problema técnico. Mientras tanto, puedes usar nuestro formulario de cotización o contactarnos directamente.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Manejar Enter para enviar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize del textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Manejar toggle del chat
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (setIsChatOpen) {
      setIsChatOpen(newState);
    }
  };

  return (
    <ChatContainer
      isOpen={isOpen}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.6
        }
      }}
    >
      {/* Header del chat */}
      <ChatHeader isOpen={isOpen}>
        <ChatTitle>
          🤖 Asistente de Cotización
        </ChatTitle>
        <ChatToggle
          isOpen={isOpen}
          onClick={handleToggle}
          aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
        >
          {isOpen ? '×' : '💬'}
        </ChatToggle>
      </ChatHeader>

      {/* Botón toggle cuando está cerrado */}
      {!isOpen && (
        <ChatToggle
          isOpen={isOpen}
          onClick={handleToggle}
          aria-label="Abrir chat"
        >
          💬
        </ChatToggle>
      )}

      {/* Cuerpo del chat */}
      <ChatBody isOpen={isOpen}>
        {/* Mensaje de bienvenida */}
        <WelcomeMessage
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          💡 <strong>Tip:</strong> Cuéntame sobre tu proyecto y te ayudo a elegir el servicio perfecto
        </WelcomeMessage>

        {/* Contenedor de mensajes */}
        <MessagesContainer>
          <AnimatePresence>
            {messages.map((message) => (
              <Message
                key={message.id}
                isUser={message.isUser}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {message.text}
              </Message>
            ))}
            
            {/* Indicador de escritura */}
            {isTyping && (
              <TypingIndicator
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⚙️
                </motion.div>
                Escribiendo...
              </TypingIndicator>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Input para escribir mensajes */}
        <InputContainer>
          <ChatInput
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Describe tu proyecto web ideal..."
            disabled={isTyping}
            rows={1}
          />
          <SendButton
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            aria-label="Enviar mensaje"
          >
            {isTyping ? '⏳' : '🚀'}
          </SendButton>
        </InputContainer>
      </ChatBody>
    </ChatContainer>
  );
};

export default Chat;



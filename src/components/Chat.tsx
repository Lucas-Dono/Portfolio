import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <path d="M12 2L9.4 8.6 2 9.2l5.6 6.4L6.8 22 12 18l5.2 4-1.4-6.4L22 9.2l-7.4-.6L12 2z"/>
    <path d="M5 3v4h4"/>
    <path d="M19 17v4h-4"/>
    <path d="M3 5l4-4"/>
    <path d="M17 19l4 4"/>
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
  <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
  <path d="M16 3h3a2 2 0 0 1 2 2v3"/>
  <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
  <path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
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
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>
);

// Contenedor para agrupar los botones de maximizar y cerrar en el header
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Estilos cinematográficos para el chat
const ChatContainer = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1050;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
  }
`;

const ChatWindow = styled(motion.div)<{ $isOpen: boolean; $isDarkMode: boolean; $isMaximized: boolean; children?: React.ReactNode }>`
  width: 360px;
  height: 500px;
  background: ${props => props.$isDarkMode
    ? 'rgba(15, 15, 15, 0.85)'
    : 'rgba(250, 250, 250, 0.9)'};
  border-radius: 16px;
  box-shadow: ${props => props.$isDarkMode
    ? '0 10px 40px rgba(0, 0, 0, 0.5)'
    : '0 10px 30px rgba(0, 0, 0, 0.15)'};
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin-bottom: 1rem;
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(50px)'};
  transition: background-color 0.3s, border-color 0.3s;
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  /* Optimiza transform y opacity para evitar parpadeos en la animación */
  will-change: opacity, transform;
  backface-visibility: hidden;
  /* Maximizado */
  ${props =>
    props.$isMaximized &&
    css`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      border-radius: 0;
      margin-bottom: 0;
    `}

  @media (max-width: 768px) {
      width: calc(100vw - 2rem);
      height: calc(100vh - 7rem);
      bottom: 5rem;
  }
`;

interface ChatHeaderProps {
  $isDarkMode: boolean;
  children?: React.ReactNode;
}

const ChatHeader = styled.div<ChatHeaderProps>`
  padding: 0.8rem 1rem;
  background: ${props => props.$isDarkMode
    ? 'linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(0, 255, 255, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(230, 230, 250, 0.8) 0%, rgba(210, 240, 255, 0.8) 100%)'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
`;

interface HeaderTitleProps {
  $isDarkMode: boolean;
  children?: React.ReactNode;
}

const HeaderTitle = styled.div<HeaderTitleProps>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: ${props => props.$isDarkMode ? '#fff' : '#333'};
  }
  
  svg {
    color: ${props => props.$isDarkMode ? '#00FFFF' : '#FF00FF'};
    width: 20px;
    height: 20px;
  }
`;

// Interfaz para CloseButton si recibe $isDarkMode directamente
interface CloseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  $isDarkMode: boolean;
}

const CloseButton = styled(motion.button)<CloseButtonProps>`
    background: none;
    border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  color: ${props => props.$isDarkMode ? '#aaa' : '#777'};
    
    &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.$isDarkMode ? '#fff' : '#000'};
    }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// Botón para maximizar/restaurar
const MaximizeButton = styled(motion.button)<CloseButtonProps>`
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  color: ${props => props.$isDarkMode ? '#aaa' : '#777'};
  margin-right: 0.5rem;

  &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.$isDarkMode ? '#fff' : '#000'};
  }
  svg { width: 18px; height: 18px; }
`;

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  $isDarkMode?: boolean;
  children?: React.ReactNode;
}

const NavigationButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  justify-content: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
`;

const NavButton = styled(motion.button)<NavButtonProps>`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  
  &:hover, &:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(255, 0, 255, 0.3);
    filter: brightness(1.1);
  }
  
  &:active {
    transform: translateY(0);
    filter: brightness(0.95);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

interface MessagesContainerProps {
  children?: React.ReactNode;
  ref?: React.RefObject<HTMLDivElement | null>;
}

const MessagesContainer = styled.div<MessagesContainerProps>`
  padding: 1rem;
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  
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
  &:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.25);
  }
`;

interface MessageBubbleProps {
  $isUser?: boolean;
  $isDarkMode: boolean;
  children?: React.ReactNode;
}

const MessageBubble = styled(motion.div)<MessageBubbleProps>`
  padding: 0.6rem 1rem;
  border-radius: ${props => props.$isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  max-width: 85%;
  background: ${props => 
    props.$isUser
      ? 'linear-gradient(135deg, #FF00FF 0%, #00A0FF 100%)'
    : props.$isDarkMode
        ? 'rgba(255, 255, 255, 0.07)'
        : '#e9eef2'};
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  word-break: break-word;
  color: ${props => props.$isUser ? '#fff' : props.$isDarkMode ? '#eee' : '#333'};
  box-shadow: ${props => props.$isDarkMode
    ? '0 2px 5px rgba(0, 0, 0, 0.3)'
    : '0 2px 4px rgba(0, 0, 0, 0.08)'};
  font-size: 0.95rem;
  line-height: 1.5;
  p { margin: 0; }
`;

interface InputContainerProps {
  $isDarkMode: boolean;
  children?: React.ReactNode;
}

const InputContainer = styled.form<InputContainerProps & { onSubmit: (e: React.FormEvent) => void }>`
  padding: 0.8rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: ${props => props.$isDarkMode ? 'rgba(5, 5, 5, 0.7)' : 'rgba(245, 247, 250, 0.9)'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  $isDarkMode?: boolean;
}

const Input = styled.input<InputProps>`
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.7rem 1rem;
  color: ${props => props.$isDarkMode ? '#eee' : '#333'};
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  outline: none;
  
  &:focus {
    border-color: #00FFFF;
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  ${props => !props.$isDarkMode && `
    background: #fff;
    border-color: #ccc;
    color: #333;
    &::placeholder {
      color: #999;
    }
    &:focus {
      border-color: #FF00FF;
      box-shadow: 0 0 8px rgba(255, 0, 255, 0.3);
  }
  `}
`;

const SendButton = styled(motion.button)`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  border: none;
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: filter 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 4px 10px rgba(255, 0, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
`;

const FloatingButton = styled(motion.button)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  svg {
    width: 28px;
    height: 28px;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(255, 0, 255, 0.4);
  }
`;

// Definimos la interfaz para cada mensaje
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  // Prop para ejecutar la redirección o apertura de proyecto
  setOpenProject: (projectId: string | null) => void;
  // Prop para la navegación entre secciones
  onNavigate?: (section: string) => void;
}


const Chat = ({ isChatOpen, setIsChatOpen, setOpenProject, onNavigate }: ChatProps) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "¡Hola! Soy el asistente virtual de Lucas. Puedo ayudarte a navegar por el portfolio, mostrarte proyectos o responder tus preguntas. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Función para ejecutar el comando (redirección a proyecto o navegación)
  const executeCommand = (command: string) => {
    console.log("Ejecutando comando:", command);
    
    // Comandos de redirección a proyectos
    if (command === '{Tech-store}') {
      setOpenProject('tech-store');
    } else if (command === '{FreeVibes}') {
      setOpenProject('youtube-music-player');
    } else if (command === '{CV}') {
      window.location.href = '/curriculum';
    } 
    // Comandos de navegación
    else if (command === '{Hero}' && onNavigate) {
      onNavigate('hero');
    } else if (command === '{About}' && onNavigate) {
      onNavigate('about');
    } else if (command === '{Projects}' && onNavigate) {
      onNavigate('projects');
    } else if (command === '{Contact}' && onNavigate) {
      onNavigate('contact');
    } else {
      console.log("Comando no reconocido:", command);
    }
  };


  // Función para limpiar el mensaje (eliminar los comandos) y ejecutar el comando
  const cleanMessage = (message: string): string => {
    const commandMatch = message.match(/{([^}]*)}/);
    if (commandMatch) {
      const command = commandMatch[0]; // Ej: "{FreeVibes}"
      executeCommand(command);
    }
    // Eliminamos cualquier parte entre llaves y retornamos el mensaje limpio
    return message.replace(/{[^}]*}/g, '').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    // Capturar el texto del mensaje antes de limpiar el input
    const messageText = inputMessage.trim();
    if (!messageText) return;
    const userMessageObj: ChatMessage = { role: 'user', content: messageText };

    const updatedMessages = [...messages, userMessageObj];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Enviar mensaje al backend para clasificación y generación
      const conversationHistory = updatedMessages.map(msg => msg.content);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history: conversationHistory })
      });
      const data = await response.json();
      if (data.answer) {
        const assistantMessageObj: ChatMessage = { role: 'assistant', content: data.answer };
        setMessages((prev) => [...prev, assistantMessageObj]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Lo siento, no he podido procesar tu solicitud en este momento.' }]);
      }
    } catch (error) {
      console.error('Error al obtener la respuesta del bot:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Variantes para animaciones
  const chatContainerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.2, ease: 'easeIn' } }
  };
  
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const handleNavButtonClick = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
      setIsChatOpen(false); // Cerrar chat al navegar
    }
  };

  return (
    <ChatContainer>
      <AnimatePresence mode="wait">
        {isChatOpen ? (
          <ChatWindow
            key="chatwindow"
            $isOpen={isChatOpen}
            $isDarkMode={true}
            $isMaximized={isMaximized}
            variants={chatContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ChatHeader $isDarkMode={true}>
              <HeaderTitle $isDarkMode={true}>
                <SparkleIcon />
                <h3>Asistente Virtual</h3>
              </HeaderTitle>
              <HeaderActions>
                <MaximizeButton
                  onClick={() => setIsMaximized(!isMaximized)}
                  $isDarkMode={true}
                  aria-label={isMaximized ? "Restaurar chat" : "Maximizar chat"}
                >
                  {isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
                </MaximizeButton>
                <CloseButton
                  onClick={() => setIsChatOpen(false)}
                  $isDarkMode={true}
                  aria-label="Cerrar chat"
                >
                  <CloseIcon />
                </CloseButton>
              </HeaderActions>
            </ChatHeader>
            
            {/* Botones de navegación rápida */}
            <NavigationButtons>
              <NavButton $isDarkMode={true} onClick={() => handleNavButtonClick('projects')}>Proyectos</NavButton>
              <NavButton $isDarkMode={true} onClick={() => handleNavButtonClick('sobre-mi')}>Sobre Mí</NavButton>
              <NavButton $isDarkMode={true} onClick={() => handleNavButtonClick('servicios')}>Servicios</NavButton>
              <NavButton $isDarkMode={true} onClick={() => handleNavButtonClick('contacto')}>Contacto</NavButton>
            </NavigationButtons>
            
            <MessagesContainer ref={messagesEndRef}>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  $isUser={msg.role === 'user'}
                  $isDarkMode={true}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  layout
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cleanMessage(msg.content)}
                  </ReactMarkdown>
                </MessageBubble>
              ))}
              {isLoading && (
                <MessageBubble $isDarkMode={true} $isUser={false} >
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }} 
                    transition={{ duration: 1, repeat: Infinity }}>
                    Escribiendo...
                  </motion.div>
                </MessageBubble>
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>
            
            <InputContainer $isDarkMode={true} onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={inputMessage}
                onChange={handleInputChange}
                disabled={isLoading}
                $isDarkMode={true}
              />
              <SendButton
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Enviar mensaje"
              >
                <SendIcon />
              </SendButton>
            </InputContainer>
          </ChatWindow>
        ) : (
          <FloatingButton
            key="floatingbutton"
            onClick={() => setIsChatOpen(true)}
            variants={chatContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Abrir chat"
          >
            <ChatIcon />
          </FloatingButton>
        )}
      </AnimatePresence>
    </ChatContainer>
  );
};

export default Chat;



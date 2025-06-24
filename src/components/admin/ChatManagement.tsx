import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';

// Interfaces
interface ChatMessage {
  id: number;
  senderType: 'user' | 'ai' | 'developer' | 'system';
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatConversation {
  id: number;
  userId: string;
  projectId?: string;
  type: 'ai' | 'developer';
  lastMessageAt: string;
  messages: ChatMessage[];
  notifications: any[];
  unreadCount?: number;
}

// Componentes estilizados
const Container = styled.div`
  padding: 20px;
  background: #121212;
  min-height: 100vh;
  color: #ffffff;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SortButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? '#ff6b35' : '#444'};
  background: ${props => props.$active ? '#ff6b35' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#ccc'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #ff6b35;
    color: ${props => props.$active ? 'white' : '#ff6b35'};
  }
`;

const NotificationBadge = styled.div`
  background: #ff4444;
  color: white;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
`;

const ConversationsList = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ConversationCard = styled(motion.div)<{ $hasUnread: boolean }>`
  background: #1a1a1a;
  border: 1px solid ${props => props.$hasUnread ? '#ff6b35' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    border-color: #ff6b35;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.15);
  }
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
`;

const UserInfo = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    color: #888;
  }
`;

const ConversationMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const TimeStamp = styled.span`
  font-size: 12px;
  color: #666;
`;

const TypeBadge = styled.div<{ $type: 'ai' | 'developer' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => props.$type === 'ai' 
    ? 'linear-gradient(135deg, #007bff, #0056b3)'
    : 'linear-gradient(135deg, #ff6b35, #ff8c42)'};
  color: white;
`;

const LastMessage = styled.div`
  background: #2a2a2a;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #ff6b35;
  
  .sender {
    font-size: 12px;
    color: #ff6b35;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .message {
    font-size: 14px;
    color: #e0e0e0;
    line-height: 1.4;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }
  ` : `
    background: transparent;
    color: #888;
    border: 1px solid #444;
    
    &:hover {
      color: #ffffff;
      border-color: #666;
    }
  `}
`;

const ChatModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ChatWindow = styled(motion.div)`
  background: #1a1a1a;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  background: #2a2a2a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
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

const MessageBubble = styled.div<{ $isUser: boolean; $senderType: string }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  
  background: ${props => {
    if (props.$senderType === 'user') return 'linear-gradient(135deg, #007bff, #0056b3)';
    if (props.$senderType === 'ai') return '#2a2a2a';
    if (props.$senderType === 'developer') return 'linear-gradient(135deg, #ff6b35, #ff8c42)';
    return '#333';
  }};
  
  color: ${props => props.$senderType === 'ai' ? '#e0e0e0' : 'white'};
  border: ${props => props.$senderType === 'ai' ? '1px solid #444' : 'none'};
  
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
`;

const ChatInput = styled.div`
  display: flex;
  padding: 16px 20px;
  gap: 8px;
  background: #2a2a2a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const Input = styled.input`
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
    border-color: #ff6b35;
  }
`;

const SendButton = styled.button`
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
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
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #888;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

// Componente principal
const ChatManagement: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [sortBy, setSortBy] = useState<'lastMessage' | 'deliveryDate'>('lastMessage');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [sortBy]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/hybrid-chat/admin/conversations`, {
        params: { orderBy: sortBy }
      });
      
      if ((response.data as any).success) {
        const conversationsWithUnread = (response.data as any).conversations.map((conv: ChatConversation) => ({
          ...conv,
          unreadCount: conv.notifications?.length || 0
        }));
        setConversations(conversationsWithUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    markAsRead(conversation.id);
  };

  const closeConversation = () => {
    setSelectedConversation(null);
    setNewMessage('');
  };

  const markAsRead = async (conversationId: number) => {
    try {
      await axios.put(`${API_BASE_URL}/api/hybrid-chat/messages/mark-read`, {
        conversationId,
        userId: 'developer'
      });
      
      // Actualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0, notifications: [] }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    
    try {
      await axios.post(`${API_BASE_URL}/api/hybrid-chat/messages`, {
        conversationId: selectedConversation.id,
        senderType: 'developer',
        message: newMessage.trim(),
        senderId: 'admin'
      });
      
      setNewMessage('');
      
      // Actualizar mensajes
      setTimeout(() => {
        fetchConversationMessages(selectedConversation.id);
      }, 500);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchConversationMessages = async (conversationId: number) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        // Aquí podrías hacer una llamada específica para obtener mensajes actualizados
        // Por ahora, simplemente refrescamos todas las conversaciones
        fetchConversations();
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'user': return 'Cliente';
      case 'ai': return 'IA';
      case 'developer': return 'Tú';
      case 'system': return 'Sistema';
      default: return 'Desconocido';
    }
  };

  const totalUnread = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <h3>Cargando conversaciones...</h3>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Title>Gestión de Chat</Title>
          {totalUnread > 0 && <NotificationBadge>{totalUnread}</NotificationBadge>}
        </div>
        <Controls>
          <SortButton 
            $active={sortBy === 'lastMessage'}
            onClick={() => setSortBy('lastMessage')}
          >
            Por Último Mensaje
          </SortButton>
          <SortButton 
            $active={sortBy === 'deliveryDate'}
            onClick={() => setSortBy('deliveryDate')}
          >
            Por Fecha de Entrega
          </SortButton>
        </Controls>
      </Header>

      {conversations.length === 0 ? (
        <EmptyState>
          <h3>No hay conversaciones activas</h3>
          <p>Las conversaciones de chat con clientes aparecerán aquí</p>
        </EmptyState>
      ) : (
        <ConversationsList>
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              $hasUnread={(conversation.unreadCount || 0) > 0}
              onClick={() => openConversation(conversation)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ConversationHeader>
                <UserInfo>
                  <h3>Usuario: {conversation.userId}</h3>
                  <p>Proyecto: {conversation.projectId || 'General'}</p>
                </UserInfo>
                <ConversationMeta>
                  <TimeStamp>{formatTime(conversation.lastMessageAt)}</TimeStamp>
                  <TypeBadge $type={conversation.type}>
                    {conversation.type === 'ai' ? 'IA' : 'Desarrollador'}
                  </TypeBadge>
                  {(conversation.unreadCount || 0) > 0 && (
                    <NotificationBadge>{conversation.unreadCount}</NotificationBadge>
                  )}
                </ConversationMeta>
              </ConversationHeader>

              {conversation.messages && conversation.messages.length > 0 && (
                <LastMessage>
                  <div className="sender">
                    {getSenderName(conversation.messages[conversation.messages.length - 1].senderType)}
                  </div>
                  <div className="message">
                    {conversation.messages[conversation.messages.length - 1].message}
                  </div>
                </LastMessage>
              )}

              <ActionButtons>
                <ActionButton $variant="primary">
                  Responder
                </ActionButton>
                <ActionButton $variant="secondary">
                  Marcar como leído
                </ActionButton>
              </ActionButtons>
            </ConversationCard>
          ))}
        </ConversationsList>
      )}

      <AnimatePresence>
        {selectedConversation && (
          <ChatModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && closeConversation()}
          >
            <ChatWindow
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatHeader>
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff' }}>
                    Chat con {selectedConversation.userId}
                  </h3>
                  <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
                    Proyecto: {selectedConversation.projectId || 'General'}
                  </p>
                </div>
                <button
                  onClick={closeConversation}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '24px'
                  }}
                >
                  ×
                </button>
              </ChatHeader>

              <ChatMessages>
                {selectedConversation.messages?.map((message) => (
                  <MessageBubble
                    key={message.id}
                    $isUser={message.senderType === 'user'}
                    $senderType={message.senderType}
                  >
                    {message.message}
                  </MessageBubble>
                ))}
              </ChatMessages>

              <ChatInput>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <Input
                    type="text"
                    placeholder="Escribe tu respuesta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendingMessage}
                  />
                  <SendButton type="submit" disabled={!newMessage.trim() || sendingMessage}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </SendButton>
                </form>
              </ChatInput>
            </ChatWindow>
          </ChatModal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default ChatManagement; 
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  read: boolean;
  emailSent: boolean;
  data?: any;
}

interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: Record<string, number>;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    priority?: string;
    unreadOnly: boolean;
  }>({ unreadOnly: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((currentPage - 1) * ITEMS_PER_PAGE).toString(),
        ...(filter.priority && { priority: filter.priority }),
        ...(filter.unreadOnly && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
      } else {
        console.error('Error cargando notificaciones');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Marcar como leída
  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        loadStats(); // Actualizar estadísticas
      }
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        loadStats();
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        loadStats();
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  // Limpiar notificaciones de prueba
  const clearTestNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/clear-test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadNotifications();
        await loadStats();
        console.log('Notificaciones de prueba eliminadas');
      }
    } catch (error) {
      console.error('Error limpiando notificaciones de prueba:', error);
    }
  };

  // Efectos
  useEffect(() => {
    loadNotifications();
  }, [currentPage, filter]);

  useEffect(() => {
    loadStats();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Obtener icono por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NEW_LEAD': return '🎯';
      case 'NEW_QUOTATION': return '💰';
      case 'CART_ABANDONED': return '🛒';
      case 'PAYMENT_SUCCESS': return '💳';
      case 'HIGH_VALUE_LEAD': return '⭐';
      case 'DAILY_REPORT': return '📊';
      case 'SYSTEM_ALERT': return '⚠️';
      default: return '📢';
    }
  };

  // Obtener color por prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#e53e3e';
      case 'high': return '#dd6b20';
      case 'medium': return '#3182ce';
      case 'low': return '#38a169';
      default: return '#718096';
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return date.toLocaleDateString('es-AR');
  };

  if (loading && notifications.length === 0) {
    return (
      <Container>
        <LoadingSpinner>
          <div className="spinner"></div>
          <p>Cargando notificaciones...</p>
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h2>Centro de Notificaciones</h2>
        <HeaderActions>
          <button onClick={() => loadNotifications()}>
            🔄 Actualizar
          </button>
          <button onClick={markAllAsRead} disabled={!stats?.unread}>
            ✅ Marcar todas como leídas
          </button>
          <button onClick={clearTestNotifications}>
            🧹 Limpiar notificaciones de prueba
          </button>
        </HeaderActions>
      </Header>

      {/* Estadísticas */}
      {stats && (
        <StatsGrid>
          <StatCard>
            <StatNumber>{stats.unread}</StatNumber>
            <StatLabel>Sin Leer</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.today}</StatNumber>
            <StatLabel>Hoy</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.thisWeek}</StatNumber>
            <StatLabel>Esta Semana</StatLabel>
          </StatCard>
          <StatCard priority="critical">
            <StatNumber>{stats.byPriority.critical}</StatNumber>
            <StatLabel>Críticas</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      {/* Filtros */}
      <Filters>
        <FilterButton 
          active={!filter.priority}
          onClick={() => setFilter(prev => ({ ...prev, priority: undefined }))}
        >
          Todas
        </FilterButton>
        <FilterButton 
          active={filter.priority === 'critical'}
          onClick={() => setFilter(prev => ({ ...prev, priority: 'critical' }))}
        >
          Críticas
        </FilterButton>
        <FilterButton 
          active={filter.priority === 'high'}
          onClick={() => setFilter(prev => ({ ...prev, priority: 'high' }))}
        >
          Altas
        </FilterButton>
        <FilterButton 
          active={filter.unreadOnly}
          onClick={() => setFilter(prev => ({ ...prev, unreadOnly: !prev.unreadOnly }))}
        >
          Solo sin leer
        </FilterButton>
      </Filters>

      {/* Lista de notificaciones */}
      <NotificationsList>
        {notifications.length === 0 ? (
          <EmptyState>
            <p>📭 No hay notificaciones que mostrar</p>
          </EmptyState>
        ) : (
          notifications.map(notification => (
            <NotificationCard 
              key={notification.id}
              priority={notification.priority}
              unread={!notification.read}
            >
              <NotificationHeader>
                <TypeIcon>{getTypeIcon(notification.type)}</TypeIcon>
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationTime>{formatDate(notification.timestamp)}</NotificationTime>
              </NotificationHeader>
              
              <NotificationMessage>{notification.message}</NotificationMessage>
              
              <NotificationFooter>
                <PriorityBadge priority={notification.priority}>
                  {notification.priority.toUpperCase()}
                </PriorityBadge>
                
                <NotificationActions>
                  {!notification.read && (
                    <ActionButton onClick={() => markAsRead(notification.id)}>
                      ✓ Marcar leída
                    </ActionButton>
                  )}
                  <ActionButton 
                    danger 
                    onClick={() => deleteNotification(notification.id)}
                  >
                    🗑️ Eliminar
                  </ActionButton>
                </NotificationActions>
              </NotificationFooter>
            </NotificationCard>
          ))
        )}
      </NotificationsList>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationButton 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            ← Anterior
          </PaginationButton>
          
          <span>Página {currentPage} de {totalPages}</span>
          
          <PaginationButton 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Siguiente →
          </PaginationButton>
        </Pagination>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  p {
    color: #e2e8f0;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    margin: 0;
    color: #e2e8f0;
    font-size: 1.8rem;
    font-weight: 600;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  
  button {
    padding: 10px 16px;
    border: 1px solid #4a5568;
    border-radius: 8px;
    background: #2d3748;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    
    &:hover {
      background: #4a5568;
      border-color: #667eea;
      transform: translateY(-1px);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div<{ priority?: string }>`
  background: #2d3748;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  text-align: center;
  border-left: 4px solid ${props => 
    props.priority === 'critical' ? '#e53e3e' : '#667eea'
  };
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  }
`;

const StatNumber = styled.div`
  font-size: 2.2rem;
  font-weight: bold;
  color: #e2e8f0;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #a0aec0;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Filters = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 10px 18px;
  border: 1px solid ${props => props.active ? '#667eea' : '#4a5568'};
  border-radius: 25px;
  background: ${props => props.active ? '#667eea' : '#2d3748'};
  color: ${props => props.active ? 'white' : '#e2e8f0'};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    background: ${props => props.active ? '#5a67d8' : '#4a5568'};
  }
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #a0aec0;
  font-size: 1.2rem;
  
  p {
    margin: 0;
    font-weight: 500;
  }
`;

const NotificationCard = styled.div<{ priority: string; unread: boolean }>`
  background: #2d3748;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-left: 4px solid ${props => {
    switch (props.priority) {
      case 'critical': return '#e53e3e';
      case 'high': return '#dd6b20';
      case 'medium': return '#3182ce';
      case 'low': return '#38a169';
      default: return '#718096';
    }
  }};
  ${props => props.unread && `
    background: #1a365d;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
    border-left-color: #667eea;
  `}
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const TypeIcon = styled.span`
  font-size: 1.3rem;
`;

const NotificationTitle = styled.h3`
  margin: 0;
  flex: 1;
  color: #e2e8f0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const NotificationTime = styled.span`
  color: #a0aec0;
  font-size: 0.9rem;
  font-weight: 500;
`;

const NotificationMessage = styled.p`
  margin: 0 0 16px 0;
  color: #cbd5e0;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const NotificationFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const PriorityBadge = styled.span<{ priority: string }>`
  background: ${props => {
    switch (props.priority) {
      case 'critical': return '#e53e3e';
      case 'high': return '#dd6b20';
      case 'medium': return '#3182ce';
      case 'low': return '#38a169';
      default: return '#718096';
    }
  }};
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 8px 14px;
  border: 1px solid ${props => props.danger ? '#e53e3e' : '#4a5568'};
  border-radius: 6px;
  background: ${props => props.danger ? 'transparent' : '#4a5568'};
  color: ${props => props.danger ? '#fc8181' : '#e2e8f0'};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.danger ? '#e53e3e' : '#667eea'};
    color: white;
    transform: translateY(-1px);
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  
  span {
    color: #e2e8f0;
    font-weight: 500;
  }
`;

const PaginationButton = styled.button`
  padding: 10px 18px;
  border: 1px solid #4a5568;
  border-radius: 8px;
  background: #2d3748;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: #4a5568;
    border-color: #667eea;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default NotificationCenter; 
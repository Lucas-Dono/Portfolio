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
      const token = localStorage.getItem('adminToken');
      
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
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
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
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
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
    color: #2d3748;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  
  button {
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #f7fafc;
      border-color: #cbd5e0;
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
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  border-left: 4px solid ${props => 
    props.priority === 'critical' ? '#e53e3e' : '#667eea'
  };
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #718096;
  font-size: 0.9rem;
`;

const Filters = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.active ? '#667eea' : '#e2e8f0'};
  border-radius: 20px;
  background: ${props => props.active ? '#667eea' : 'white'};
  color: ${props => props.active ? 'white' : '#4a5568'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  font-size: 1.1rem;
`;

const NotificationCard = styled.div<{ priority: string; unread: boolean }>`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
    background: #f0f8ff;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  `}
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const TypeIcon = styled.span`
  font-size: 1.2rem;
`;

const NotificationTitle = styled.h3`
  margin: 0;
  flex: 1;
  color: #2d3748;
  font-size: 1.1rem;
`;

const NotificationTime = styled.span`
  color: #718096;
  font-size: 0.9rem;
`;

const NotificationMessage = styled.p`
  margin: 0 0 15px 0;
  color: #4a5568;
  line-height: 1.5;
`;

const NotificationFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.danger ? '#e53e3e' : '#e2e8f0'};
  border-radius: 4px;
  background: white;
  color: ${props => props.danger ? '#e53e3e' : '#4a5568'};
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.danger ? '#e53e3e' : '#f7fafc'};
    color: ${props => props.danger ? 'white' : '#2d3748'};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default NotificationCenter; 
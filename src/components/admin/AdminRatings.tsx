import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';

// Interfaces
interface Rating {
    id: number;
    userId: string;
    serviceId: string;
    rating: number;
    comment: string;
    projectName: string;
    userEmail: string;
    userName: string;
    createdAt: string;
    status: string;
}

interface RatingStatistics {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalRatings: number;
    limit: number;
}

interface RatingsApiResponse {
    success: boolean;
    ratings: Rating[];
    statistics: RatingStatistics;
    pagination: Pagination;
}

// URL base de la API
const API_URL = import.meta.env.VITE_API_URL || 'https://circuitprompt.com.ar/api';

// Estilos
const RatingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 3px solid #00FFFF;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
`;

const StatTitle = styled.h3`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #00FFFF;
  margin-bottom: 0.5rem;
`;

const StarDistribution = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StarLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  min-width: 60px;
`;

const StarBar = styled.div`
  flex: 1;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const StarBarFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: linear-gradient(to right, #FFD700, #FFA500);
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const StarCount = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  min-width: 30px;
  text-align: right;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  background-color: rgba(30, 30, 30, 0.8);
  color: #f5f5f5;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
  }
`;

const RatingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
`;

const RatingCard = styled(motion.div)`
  background-color: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 3px solid #00FFFF;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

const RatingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 0.25rem 0;
  color: #f5f5f5;
`;

const UserEmail = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`;

const ProjectName = styled.span`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
`;

const RatingStars = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Star = styled.span<{ filled: boolean }>`
  color: ${props => props.filled ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'};
  font-size: 1.2rem;
`;

const RatingValue = styled.span`
  margin-left: 0.5rem;
  color: #00FFFF;
  font-weight: 600;
`;

const Comment = styled.div`
  background-color: rgba(20, 20, 20, 0.7);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  font-style: italic;
`;

const RatingDate = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  margin-top: 1rem;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  background-color: ${props => props.active ? '#00FFFF' : 'rgba(30, 30, 30, 0.8)'};
  color: ${props => props.active ? '#000' : '#f5f5f5'};
  border: 1px solid ${props => props.active ? '#00FFFF' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#00FFFF' : 'rgba(0, 210, 255, 0.1)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  svg {
    animation: spin 1s linear infinite;
    color: #00FFFF;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.3);
  }
`;

const EmailButton = styled.button`
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 0, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdminRatings = () => {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [statistics, setStatistics] = useState<RatingStatistics | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [minRating, setMinRating] = useState('');
    const [maxRating, setMaxRating] = useState('');
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);

    // Función para obtener el token de autenticación
    const getAuthToken = () => {
        return localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
    };

    // Función para obtener headers de autenticación
    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Cargar valoraciones
    const fetchRatings = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10'
            });

            if (minRating) params.append('minRating', minRating);
            if (maxRating) params.append('maxRating', maxRating);

            const response = await axios.get<RatingsApiResponse>(
                `${API_URL}/ratings/admin?${params.toString()}`,
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                setRatings(response.data.ratings);
                setStatistics(response.data.statistics);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Error al cargar valoraciones:', error);
        } finally {
            setLoading(false);
        }
    };

    // Enviar email de solicitud de valoración
    const sendRatingRequestEmail = async (rating: Rating) => {
        try {
            setSendingEmail(rating.id.toString());

            await axios.post(
                `${API_URL}/ratings/request-email`,
                {
                    userEmail: rating.userEmail,
                    userName: rating.userName,
                    projectName: rating.projectName,
                    serviceId: rating.serviceId
                },
                { headers: getAuthHeaders() }
            );

            alert('Email de solicitud enviado exitosamente');
        } catch (error) {
            console.error('Error al enviar email:', error);
            alert('Error al enviar el email de solicitud');
        } finally {
            setSendingEmail(null);
        }
    };

    // Efectos
    useEffect(() => {
        fetchRatings();
    }, [currentPage, minRating, maxRating]);

    // Renderizar estrellas
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star key={index} filled={index < rating}>
                ⭐
            </Star>
        ));
    };

    // Renderizar estadísticas
    const renderStatistics = () => {
        if (!statistics) return null;

        const maxCount = Math.max(...Object.values(statistics.ratingDistribution));

        return (
            <StatsContainer>
                <StatCard>
                    <StatTitle>Promedio General</StatTitle>
                    <StatValue>{statistics.averageRating.toFixed(1)}</StatValue>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {renderStars(Math.round(statistics.averageRating))}
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                            ({statistics.totalRatings} valoraciones)
                        </span>
                    </div>
                </StatCard>

                <StatCard>
                    <StatTitle>Distribución de Estrellas</StatTitle>
                    <StarDistribution>
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = statistics.ratingDistribution[star as keyof typeof statistics.ratingDistribution];
                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                            return (
                                <StarRow key={star}>
                                    <StarLabel>{star} ⭐</StarLabel>
                                    <StarBar>
                                        <StarBarFill percentage={percentage} />
                                    </StarBar>
                                    <StarCount>{count}</StarCount>
                                </StarRow>
                            );
                        })}
                    </StarDistribution>
                </StatCard>
            </StatsContainer>
        );
    };

    if (loading) {
        return (
            <LoadingSpinner>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
            </LoadingSpinner>
        );
    }

    return (
        <RatingsContainer>
            <h2 style={{ color: '#f5f5f5', marginBottom: '1rem' }}>
                Valoraciones de Clientes
            </h2>

            {renderStatistics()}

            <FiltersContainer>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        Calificación mínima:
                    </label>
                    <FilterSelect
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                    >
                        <option value="">Todas</option>
                        <option value="1">1 estrella</option>
                        <option value="2">2 estrellas</option>
                        <option value="3">3 estrellas</option>
                        <option value="4">4 estrellas</option>
                        <option value="5">5 estrellas</option>
                    </FilterSelect>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        Calificación máxima:
                    </label>
                    <FilterSelect
                        value={maxRating}
                        onChange={(e) => setMaxRating(e.target.value)}
                    >
                        <option value="">Todas</option>
                        <option value="1">1 estrella</option>
                        <option value="2">2 estrellas</option>
                        <option value="3">3 estrellas</option>
                        <option value="4">4 estrellas</option>
                        <option value="5">5 estrellas</option>
                    </FilterSelect>
                </div>
            </FiltersContainer>

            {ratings.length === 0 ? (
                <EmptyState>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <h3>No hay valoraciones disponibles</h3>
                    <p>Aún no se han recibido valoraciones con los filtros seleccionados.</p>
                </EmptyState>
            ) : (
                <>
                    <RatingsGrid>
                        {ratings.map((rating) => (
                            <RatingCard
                                key={rating.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <RatingHeader>
                                    <UserInfo>
                                        <UserName>{rating.userName}</UserName>
                                        <UserEmail>{rating.userEmail}</UserEmail>
                                        <ProjectName>Proyecto: {rating.projectName}</ProjectName>
                                    </UserInfo>
                                    <div style={{ textAlign: 'right' }}>
                                        <RatingStars>
                                            {renderStars(rating.rating)}
                                            <RatingValue>{rating.rating}/5</RatingValue>
                                        </RatingStars>
                                        <EmailButton
                                            onClick={() => sendRatingRequestEmail(rating)}
                                            disabled={sendingEmail === rating.id.toString()}
                                        >
                                            {sendingEmail === rating.id.toString() ? 'Enviando...' : 'Solicitar nueva valoración'}
                                        </EmailButton>
                                    </div>
                                </RatingHeader>

                                {rating.comment && (
                                    <Comment>
                                        "{rating.comment}"
                                    </Comment>
                                )}

                                <RatingDate>
                                    {new Date(rating.createdAt).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </RatingDate>
                            </RatingCard>
                        ))}
                    </RatingsGrid>

                    {pagination && pagination.totalPages > 1 && (
                        <PaginationContainer>
                            <PaginationButton
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </PaginationButton>

                            {Array.from({ length: pagination.totalPages }, (_, index) => (
                                <PaginationButton
                                    key={index + 1}
                                    active={currentPage === index + 1}
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    {index + 1}
                                </PaginationButton>
                            ))}

                            <PaginationButton
                                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                disabled={currentPage === pagination.totalPages}
                            >
                                Siguiente
                            </PaginationButton>
                        </PaginationContainer>
                    )}
                </>
            )}
        </RatingsContainer>
    );
};

export default AdminRatings; 
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// Interfaces
interface RefundRequest {
    id: number;
    user_id: string;
    service_id: string;
    payment_id: string;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'error';
    admin_id: string | null;
    admin_notes: string | null;
    mercadopago_refund_id: string | null;
    user_email: string;
    admin_email: string;
    service_name: string;
    purchase_date: string;
    created_at: string;
    processed_at: string | null;
    user_name?: string; // Puede venir de un JOIN en la consulta
}

interface RefundStats {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    error_requests: number;
    total_refunded_amount: number | null;
    first_request_date: string | null;
    last_request_date: string | null;
}

// Interfaces para las respuestas de la API
interface RefundRequestsResponse {
    refunds: RefundRequest[];
    success: boolean;
}

interface RefundStatsResponse {
    statistics: RefundStats;
    success: boolean;
}

// Estilos
const Container = styled.div`
  padding: 2rem;
  color: white;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  font-size: 1.8rem;
  background: linear-gradient(90deg, #00d2ff, #3a7bd5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #00d2ff, #3a7bd5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${props => props.active ? 'rgba(0, 210, 255, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.7)'};
  border: none;
  cursor: pointer;
  position: relative;
  font-weight: ${props => props.active ? '600' : '400'};
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.active ? 'linear-gradient(90deg, #00d2ff, #3a7bd5)' : 'transparent'};
  }
  
  &:hover {
    color: ${props => !props.active && 'rgba(255, 255, 255, 0.9)'};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.3rem 0.6rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: ${props => {
        switch (props.status) {
            case 'pending': return 'rgba(255, 170, 0, 0.2)';
            case 'approved': return 'rgba(72, 187, 120, 0.2)';
            case 'rejected': return 'rgba(245, 101, 101, 0.2)';
            case 'error': return 'rgba(229, 62, 62, 0.2)';
            default: return 'rgba(160, 174, 192, 0.2)';
        }
    }};
  color: ${props => {
        switch (props.status) {
            case 'pending': return '#FF9800';
            case 'approved': return '#48BB78';
            case 'rejected': return '#F56565';
            case 'error': return '#E53E3E';
            default: return '#A0AEC0';
        }
    }};
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'default' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  background-color: ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(0, 210, 255, 0.1)';
            case 'danger': return 'rgba(245, 101, 101, 0.1)';
            default: return 'rgba(255, 255, 255, 0.05)';
        }
    }};
  
  color: ${props => {
        switch (props.variant) {
            case 'primary': return '#00d2ff';
            case 'danger': return '#F56565';
            default: return 'rgba(255, 255, 255, 0.9)';
        }
    }};
  
  border: 1px solid ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(0, 210, 255, 0.3)';
            case 'danger': return 'rgba(245, 101, 101, 0.3)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
  
  &:hover {
    transform: translateY(-2px);
    background-color: ${props => {
        switch (props.variant) {
            case 'primary': return 'rgba(0, 210, 255, 0.2)';
            case 'danger': return 'rgba(245, 101, 101, 0.2)';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1e1e1e;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(30, 30, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 0.95rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #00d2ff;
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background-color: rgba(245, 101, 101, 0.1);
  border: 1px solid rgba(245, 101, 101, 0.3);
  border-radius: 6px;
  color: #F56565;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  padding: 0.75rem;
  background-color: rgba(72, 187, 120, 0.1);
  border: 1px solid rgba(72, 187, 120, 0.3);
  border-radius: 6px;
  color: #48BB78;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const RefundDetails = styled.div`
  background-color: rgba(30, 30, 30, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  
  p {
    margin: 0.5rem 0;
  }
  
  .label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }
`;

// Componente principal
const AdminRefunds = () => {
    const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<RefundRequest[]>([]);
    const [stats, setStats] = useState<RefundStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');
    const [processingAction, setProcessingAction] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    // Obtener token de autenticación
    const getAuthToken = () => {
        return localStorage.getItem('auth_token');
    };

    // Configurar headers para solicitudes autenticadas
    const getAuthHeaders = () => {
        const token = getAuthToken();
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Cargar solicitudes de reembolso
    const fetchRefundRequests = async () => {
        try {
            setLoading(true);
            setError(null);

            const [requestsResponse, statsResponse] = await Promise.all([
                axios.get<RefundRequestsResponse>(`${API_URL}/refunds/admin/requests`, getAuthHeaders()),
                axios.get<RefundStatsResponse>(`${API_URL}/refunds/admin/stats`, getAuthHeaders())
            ]);

            setRefundRequests(requestsResponse.data.refunds);
            setStats(statsResponse.data.statistics);

            // Aplicar filtro inicial
            filterRequests('pending');

        } catch (err) {
            console.error('Error al cargar solicitudes de reembolso:', err);
            setError('No se pudieron cargar las solicitudes de reembolso. Por favor, intenta de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar solicitudes por estado
    const filterRequests = (status: 'pending' | 'approved' | 'rejected' | 'all') => {
        setActiveTab(status);

        if (status === 'all') {
            setFilteredRequests(refundRequests);
        } else {
            setFilteredRequests(refundRequests.filter(req => req.status === status));
        }
    };

    // Formatear fecha
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Abrir modal para aprobar o rechazar
    const openModal = (refund: RefundRequest, type: 'approve' | 'reject') => {
        setSelectedRefund(refund);
        setModalType(type);
        setAdminNotes('');
        setActionError(null);
        setActionSuccess(null);
        setIsModalOpen(true);
    };

    // Cerrar modal
    const closeModal = () => {
        if (processingAction) return;
        setIsModalOpen(false);
        setSelectedRefund(null);
        setModalType('approve');
        setAdminNotes('');
    };

    // Aprobar reembolso
    const approveRefund = async () => {
        if (!selectedRefund) return;

        try {
            setProcessingAction(true);
            setActionError(null);

            await axios.post(
                `${API_URL}/refunds/admin/approve/${selectedRefund.id}`,
                { notes: adminNotes },
                getAuthHeaders()
            );

            // Actualizar la lista de reembolsos
            await fetchRefundRequests();

            setActionSuccess('Reembolso aprobado correctamente. Se ha procesado el reembolso con MercadoPago.');

            // Cerrar modal después de 3 segundos
            setTimeout(() => {
                closeModal();
                setActionSuccess(null);
            }, 3000);

        } catch (err: any) {
            console.error('Error al aprobar reembolso:', err);
            setActionError(err.response?.data?.message || 'Error al procesar el reembolso. Por favor, intenta de nuevo.');
        } finally {
            setProcessingAction(false);
        }
    };

    // Rechazar reembolso
    const rejectRefund = async () => {
        if (!selectedRefund) return;

        if (!adminNotes.trim()) {
            setActionError('Por favor, proporciona un motivo para el rechazo.');
            return;
        }

        try {
            setProcessingAction(true);
            setActionError(null);

            await axios.post(
                `${API_URL}/refunds/admin/reject/${selectedRefund.id}`,
                { reason: adminNotes },
                getAuthHeaders()
            );

            // Actualizar la lista de reembolsos
            await fetchRefundRequests();

            setActionSuccess('Reembolso rechazado correctamente. Se ha notificado al cliente.');

            // Cerrar modal después de 3 segundos
            setTimeout(() => {
                closeModal();
                setActionSuccess(null);
            }, 3000);

        } catch (err: any) {
            console.error('Error al rechazar reembolso:', err);
            setActionError(err.response?.data?.message || 'Error al rechazar el reembolso. Por favor, intenta de nuevo.');
        } finally {
            setProcessingAction(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchRefundRequests();
    }, []);

    return (
        <Container>
            <Header>
                <Title>Gestión de Reembolsos</Title>
                <Button
                    onClick={() => fetchRefundRequests()}
                    disabled={loading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                    </svg>
                    Actualizar
                </Button>
            </Header>

            {stats && (
                <StatsContainer>
                    <StatCard>
                        <StatValue>{stats.total_requests}</StatValue>
                        <StatLabel>Total de solicitudes</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>{stats.pending_requests}</StatValue>
                        <StatLabel>Pendientes</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>{stats.approved_requests}</StatValue>
                        <StatLabel>Aprobados</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>{stats.rejected_requests}</StatValue>
                        <StatLabel>Rechazadas</StatLabel>
                    </StatCard>
                    <StatCard>
                        <StatValue>${stats.total_refunded_amount?.toFixed(2) || '0.00'}</StatValue>
                        <StatLabel>Total reembolsado</StatLabel>
                    </StatCard>
                </StatsContainer>
            )}

            <TabsContainer>
                <Tab
                    active={activeTab === 'pending'}
                    onClick={() => filterRequests('pending')}
                >
                    Pendientes
                </Tab>
                <Tab
                    active={activeTab === 'approved'}
                    onClick={() => filterRequests('approved')}
                >
                    Aprobados
                </Tab>
                <Tab
                    active={activeTab === 'rejected'}
                    onClick={() => filterRequests('rejected')}
                >
                    Rechazados
                </Tab>
                <Tab
                    active={activeTab === 'all'}
                    onClick={() => filterRequests('all')}
                >
                    Todos
                </Tab>
            </TabsContainer>

            {loading ? (
                <EmptyState>Cargando solicitudes de reembolso...</EmptyState>
            ) : error ? (
                <ErrorMessage>{error}</ErrorMessage>
            ) : filteredRequests.length === 0 ? (
                <EmptyState>No hay solicitudes de reembolso {activeTab !== 'all' ? `con estado "${activeTab}"` : ''}</EmptyState>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <Th>ID</Th>
                            <Th>Servicio</Th>
                            <Th>Cliente</Th>
                            <Th>Monto</Th>
                            <Th>Fecha</Th>
                            <Th>Estado</Th>
                            <Th>Acciones</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map(refund => (
                            <tr key={refund.id}>
                                <Td>{refund.id}</Td>
                                <Td>{refund.service_name}</Td>
                                <Td>{refund.user_name || refund.user_email}</Td>
                                <Td>${refund.amount.toFixed(2)}</Td>
                                <Td>{formatDate(refund.created_at)}</Td>
                                <Td>
                                    <StatusBadge status={refund.status}>
                                        {refund.status === 'pending' && 'Pendiente'}
                                        {refund.status === 'approved' && 'Aprobado'}
                                        {refund.status === 'rejected' && 'Rechazado'}
                                        {refund.status === 'error' && 'Error'}
                                    </StatusBadge>
                                </Td>
                                <Td>
                                    <ActionButtons>
                                        {refund.status === 'pending' && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => openModal(refund, 'approve')}
                                                >
                                                    Aprobar
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => openModal(refund, 'reject')}
                                                >
                                                    Rechazar
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            onClick={() => window.open(`mailto:${refund.user_email}?subject=Sobre%20tu%20reembolso%20(ID:%20${refund.id})`, '_blank')}
                                        >
                                            Contactar
                                        </Button>
                                    </ActionButtons>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Modal para aprobar/rechazar reembolso */}
            {isModalOpen && selectedRefund && (
                <Modal>
                    <ModalContent>
                        <ModalHeader>
                            <h3>
                                {modalType === 'approve' ? 'Aprobar Reembolso' : 'Rechazar Reembolso'}
                            </h3>
                            <CloseButton onClick={closeModal} disabled={processingAction}>×</CloseButton>
                        </ModalHeader>

                        <RefundDetails>
                            <p><span className="label">Servicio:</span> {selectedRefund.service_name}</p>
                            <p><span className="label">Cliente:</span> {selectedRefund.user_email}</p>
                            <p><span className="label">Monto:</span> ${selectedRefund.amount.toFixed(2)}</p>
                            <p><span className="label">Fecha:</span> {formatDate(selectedRefund.created_at)}</p>
                            <p><span className="label">Motivo:</span> {selectedRefund.reason}</p>
                            <p><span className="label">ID de Pago (MercadoPago):</span> {selectedRefund.payment_id}</p>
                        </RefundDetails>

                        {actionError && <ErrorMessage>{actionError}</ErrorMessage>}
                        {actionSuccess && <SuccessMessage>{actionSuccess}</SuccessMessage>}

                        <FormGroup>
                            <Label>
                                {modalType === 'approve'
                                    ? 'Notas adicionales (opcional)'
                                    : 'Motivo del rechazo *'}
                            </Label>
                            <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder={modalType === 'approve'
                                    ? 'Información adicional para el reembolso...'
                                    : 'Explica por qué se rechaza este reembolso...'
                                }
                                required={modalType === 'reject'}
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button onClick={closeModal} disabled={processingAction}>
                                Cancelar
                            </Button>
                            <Button
                                variant={modalType === 'approve' ? 'primary' : 'danger'}
                                onClick={modalType === 'approve' ? approveRefund : rejectRefund}
                                disabled={processingAction}
                            >
                                {processingAction
                                    ? 'Procesando...'
                                    : modalType === 'approve'
                                        ? 'Aprobar y Reembolsar'
                                        : 'Rechazar Solicitud'
                                }
                            </Button>
                        </div>
                    </ModalContent>
                </Modal>
            )}
        </Container>
    );
};

export default AdminRefunds; 
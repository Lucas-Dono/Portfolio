import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';

// Interfaces
interface StockConfig {
    planType: string;
    weight: number;
    estimatedDeliveryDays: number;
    isActive: boolean;
}

interface StockStatus {
    currentLoad: number;
    maxCapacity: number;
    warningThreshold: number;
    criticalThreshold: number;
    isAcceptingOrders: boolean;
    notes: string;
    lastUpdated: string;
}

interface StockMetrics {
    utilizationRate: number;
    ordersInProgress: number;
    queueLength: number;
    ordersLast30Days: number;
    completedLast30Days: number;
    averageCompletionTime: number;
}

interface StockHistory {
    _id: string;
    action: string;
    planType?: string;
    weightChange: number;
    previousLoad: number;
    newLoad: number;
    orderId?: string;
    userId?: string;
    adminId?: string;
    reason?: string;
    createdAt: string;
}

interface WaitingQueueEntry {
    _id: string;
    userId: string;
    userEmail: string;
    userName: string;
    planType: string;
    planWeight: number;
    requestedAt: string;
    estimatedAvailableDate: string;
    status: string;
}

// Interfaces para las respuestas de la API
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface MetricsApiResponse {
    success: boolean;
    currentStatus: StockStatus;
    planConfigs: StockConfig[];
    metrics: StockMetrics;
}

interface HistoryApiResponse {
    success: boolean;
    history: StockHistory[];
    total: number;
}

interface QueueApiResponse {
    success: boolean;
    queue: WaitingQueueEntry[];
    total: number;
}

interface NotifyApiResponse {
    success: boolean;
    notifiedCount: number;
    message: string;
}

// URL de la API
const API_URL = import.meta.env.VITE_API_URL || 'https://circuitprompt.com.ar/api';

// Componentes estilizados
const StockContainer = styled.div`
  padding: 2rem;
  color: white;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  background: linear-gradient(90deg, #00d2ff, #3a7bd5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(0, 210, 255, 0.2)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#00d2ff' : 'rgba(255, 255, 255, 0.7)'};
  padding: 1rem 1.5rem;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 2px solid ${props => props.active ? '#00d2ff' : 'transparent'};

  &:hover {
    color: #00d2ff;
    background: rgba(0, 210, 255, 0.1);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled(motion.div)`
  background: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #00d2ff;
  backdrop-filter: blur(8px);
`;

const MetricTitle = styled.h3`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #00d2ff;
  margin-bottom: 0.5rem;
`;

const MetricSubtext = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const StatusIndicator = styled.div<{ status: 'good' | 'warning' | 'critical' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  background: ${props =>
        props.status === 'good' ? 'rgba(72, 187, 120, 0.2)' :
            props.status === 'warning' ? 'rgba(246, 173, 85, 0.2)' :
                'rgba(245, 101, 101, 0.2)'
    };
  color: ${props =>
        props.status === 'good' ? '#48BB78' :
            props.status === 'warning' ? '#F6AD55' :
                '#F56565'
    };
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div<{ percentage: number; status: 'good' | 'warning' | 'critical' }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props =>
        props.status === 'good' ? 'linear-gradient(90deg, #48BB78, #68D391)' :
            props.status === 'warning' ? 'linear-gradient(90deg, #F6AD55, #FBD38D)' :
                'linear-gradient(90deg, #F56565, #FC8181)'
    };
  transition: width 0.5s ease;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ConfigCard = styled.div`
  background: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ConfigTitle = styled.h3`
  color: #f5f5f5;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  text-transform: capitalize;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #00d2ff;
    box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 0.9rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #00d2ff;
    box-shadow: 0 0 0 2px rgba(0, 210, 255, 0.2);
  }
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props =>
        props.variant === 'danger' ? 'linear-gradient(135deg, #F56565, #E53E3E)' :
            props.variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' :
                'linear-gradient(135deg, #00d2ff, #3a7bd5)'
    };
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const HistoryTable = styled.div`
  background: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 210, 255, 0.1);
  font-weight: 600;
  color: #00d2ff;
  font-size: 0.9rem;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const QueueTable = styled.div`
  background: rgba(30, 30, 30, 0.6);
  border-radius: 12px;
  overflow: hidden;
`;

const QueueHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 210, 255, 0.1);
  font-weight: 600;
  color: #00d2ff;
  font-size: 0.9rem;
`;

const QueueRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #00d2ff;

  svg {
    animation: spin 1s linear infinite;
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

  h3 {
    margin: 1rem 0 0.5rem 0;
    color: #f5f5f5;
  }
`;

// Componente principal
const StockAdmin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'history' | 'queue'>('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para datos
    const [stockStatus, setStockStatus] = useState<StockStatus | null>(null);
    const [stockConfigs, setStockConfigs] = useState<StockConfig[]>([]);
    const [stockMetrics, setStockMetrics] = useState<StockMetrics | null>(null);
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
    const [stockHistoryTotal, setStockHistoryTotal] = useState<number>(0);
    const [waitingQueue, setWaitingQueue] = useState<WaitingQueueEntry[]>([]);

    // Estados para formularios
    const [statusForm, setStatusForm] = useState<StockStatus>({
        currentLoad: 0,
        maxCapacity: 100,
        warningThreshold: 80,
        criticalThreshold: 95,
        isAcceptingOrders: true,
        notes: '',
        lastUpdated: ''
    });

    // Obtener headers de autenticación
    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    // Cargar datos iniciales
    useEffect(() => {
        loadStockData();
    }, []);

    const loadStockData = async () => {
        try {
            setLoading(true);

            const [metricsRes, historyRes, queueRes] = await Promise.all([
                axios.get<MetricsApiResponse>(`${API_URL}/stock/admin/metrics`, getAuthHeaders()),
                axios.get<HistoryApiResponse>(`${API_URL}/stock/admin/history?limit=20`, getAuthHeaders()),
                axios.get<QueueApiResponse>(`${API_URL}/stock/admin/waiting-queue`, getAuthHeaders())
            ]);

            if (metricsRes.data.success) {
                setStockStatus(metricsRes.data.currentStatus);
                setStockConfigs(metricsRes.data.planConfigs);
                setStockMetrics(metricsRes.data.metrics);

                // Inicializar formulario con datos actuales
                if (metricsRes.data.currentStatus) {
                    setStatusForm(metricsRes.data.currentStatus);
                }
            }

            if (historyRes.data.success) {
                setStockHistory(historyRes.data.history);
                setStockHistoryTotal(historyRes.data.total);
            }

            if (queueRes.data.success) {
                setWaitingQueue(queueRes.data.queue);
            }

        } catch (error) {
            console.error('Error al cargar datos del stock:', error);
        } finally {
            setLoading(false);
        }
    };

    // Actualizar configuración de un plan
    const updatePlanConfig = async (planType: string, config: Partial<StockConfig>) => {
        try {
            setSaving(true);

            const response = await axios.put<ApiResponse<any>>(
                `${API_URL}/stock/admin/config/${planType}`,
                config,
                getAuthHeaders()
            );

            if (response.data.success) {
                await loadStockData();
                alert('Configuración actualizada exitosamente');
            }

        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            alert('Error al actualizar la configuración');
        } finally {
            setSaving(false);
        }
    };

    // Actualizar estado del stock
    const updateStockStatus = async () => {
        try {
            setSaving(true);

            const response = await axios.put<ApiResponse<any>>(
                `${API_URL}/stock/admin/status`,
                statusForm,
                getAuthHeaders()
            );

            if (response.data.success) {
                await loadStockData();
                alert('Estado del stock actualizado exitosamente');
            }

        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado del stock');
        } finally {
            setSaving(false);
        }
    };

    // Liberar stock manualmente
    const releaseStock = async (planType: string, reason: string) => {
        try {
            setSaving(true);

            const response = await axios.post<ApiResponse<any>>(
                `${API_URL}/stock/admin/release`,
                { planType, reason },
                getAuthHeaders()
            );

            if (response.data.success) {
                await loadStockData();
                alert(`Stock liberado: ${planType}`);
            }

        } catch (error) {
            console.error('Error al liberar stock:', error);
            alert('Error al liberar el stock');
        } finally {
            setSaving(false);
        }
    };

    // Notificar usuarios en cola
    const notifyQueueUsers = async (queueIds: string[]) => {
        try {
            setSaving(true);

            const response = await axios.post<NotifyApiResponse>(
                `${API_URL}/stock/admin/notify-queue`,
                { queueIds },
                getAuthHeaders()
            );

            if (response.data.success) {
                await loadStockData();
                alert(`${response.data.notifiedCount} usuarios notificados`);
            }

        } catch (error) {
            console.error('Error al notificar usuarios:', error);
            alert('Error al enviar notificaciones');
        } finally {
            setSaving(false);
        }
    };

    // Inicializar configuración por defecto
    const initializeConfig = async () => {
        try {
            setSaving(true);

            const response = await axios.post<ApiResponse<any>>(
                `${API_URL}/stock/admin/initialize`,
                {},
                getAuthHeaders()
            );

            if (response.data.success) {
                await loadStockData();
                alert('Configuración inicializada correctamente');
            }

        } catch (error) {
            console.error('Error al inicializar:', error);
            alert('Error al inicializar la configuración');
        } finally {
            setSaving(false);
        }
    };

    // Obtener estado de utilización
    const getUtilizationStatus = (rate: number): 'good' | 'warning' | 'critical' => {
        if (rate < 70) return 'good';
        if (rate < 90) return 'warning';
        return 'critical';
    };

    // Formatear fecha
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Renderizar vista general
    const renderOverview = () => (
        <div>
            {stockStatus && stockMetrics && (
                <>
                    <MetricsGrid>
                        <MetricCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MetricTitle>Utilización del Stock</MetricTitle>
                            <MetricValue>{stockMetrics.utilizationRate}%</MetricValue>
                            <ProgressBar>
                                <ProgressFill
                                    percentage={stockMetrics.utilizationRate}
                                    status={getUtilizationStatus(stockMetrics.utilizationRate)}
                                />
                            </ProgressBar>
                            <StatusIndicator status={getUtilizationStatus(stockMetrics.utilizationRate)}>
                                {stockMetrics.utilizationRate < 70 ? '✅ Óptimo' :
                                    stockMetrics.utilizationRate < 90 ? '⚠️ Advertencia' : '🚨 Crítico'}
                            </StatusIndicator>
                        </MetricCard>

                        <MetricCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <MetricTitle>Carga Actual</MetricTitle>
                            <MetricValue>{stockStatus.currentLoad}/{stockStatus.maxCapacity}</MetricValue>
                            <MetricSubtext>
                                Capacidad disponible: {stockStatus.maxCapacity - stockStatus.currentLoad} puntos
                            </MetricSubtext>
                        </MetricCard>

                        <MetricCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <MetricTitle>Proyectos en Progreso</MetricTitle>
                            <MetricValue>{stockMetrics.ordersInProgress}</MetricValue>
                            <MetricSubtext>
                                Completados últimos 30 días: {stockMetrics.completedLast30Days}
                            </MetricSubtext>
                        </MetricCard>

                        <MetricCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <MetricTitle>Cola de Espera</MetricTitle>
                            <MetricValue>{stockMetrics.queueLength}</MetricValue>
                            <MetricSubtext>
                                Usuarios esperando disponibilidad
                            </MetricSubtext>
                        </MetricCard>

                        <MetricCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                        >
                            <MetricTitle>Tiempo Promedio</MetricTitle>
                            <MetricValue>{stockMetrics.averageCompletionTime}</MetricValue>
                            <MetricSubtext>días de completación</MetricSubtext>
                        </MetricCard>

                        <MetricCard
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                        >
                            <MetricTitle>Estado del Sistema</MetricTitle>
                            <MetricValue>
                                {stockStatus.isAcceptingOrders ? '🟢' : '🔴'}
                            </MetricValue>
                            <MetricSubtext>
                                {stockStatus.isAcceptingOrders ? 'Aceptando pedidos' : 'Pedidos pausados'}
                            </MetricSubtext>
                        </MetricCard>
                    </MetricsGrid>

                    <ConfigCard>
                        <ConfigTitle>Control del Sistema</ConfigTitle>
                        <FormGroup>
                            <Label>Carga Actual del Stock</Label>
                            <Input
                                type="number"
                                value={statusForm.currentLoad}
                                onChange={(e) => setStatusForm({
                                    ...statusForm,
                                    currentLoad: parseInt(e.target.value) || 0
                                })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Capacidad Máxima</Label>
                            <Input
                                type="number"
                                value={statusForm.maxCapacity}
                                onChange={(e) => setStatusForm({
                                    ...statusForm,
                                    maxCapacity: parseInt(e.target.value) || 100
                                })}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>
                                <Checkbox
                                    type="checkbox"
                                    checked={statusForm.isAcceptingOrders}
                                    onChange={(e) => setStatusForm({
                                        ...statusForm,
                                        isAcceptingOrders: e.target.checked
                                    })}
                                />
                                Aceptar nuevos pedidos
                            </Label>
                        </FormGroup>

                        <FormGroup>
                            <Label>Notas del administrador</Label>
                            <TextArea
                                value={statusForm.notes}
                                onChange={(e) => setStatusForm({
                                    ...statusForm,
                                    notes: e.target.value
                                })}
                                placeholder="Notas internas sobre el estado del stock..."
                            />
                        </FormGroup>

                        <ActionButtons>
                            <Button onClick={updateStockStatus} disabled={saving}>
                                {saving ? 'Guardando...' : 'Actualizar Estado'}
                            </Button>
                            <Button variant="secondary" onClick={initializeConfig} disabled={saving}>
                                Reinicializar Configuración
                            </Button>
                        </ActionButtons>
                    </ConfigCard>
                </>
            )}
        </div>
    );

    // Renderizar configuración
    const renderConfig = () => (
        <ConfigGrid>
            {stockConfigs.map((config) => (
                <ConfigCard key={config.planType}>
                    <ConfigTitle>Plan {config.planType}</ConfigTitle>

                    <FormGroup>
                        <Label>Peso (puntos)</Label>
                        <Input
                            type="number"
                            defaultValue={config.weight}
                            onBlur={(e) => {
                                const newWeight = parseInt(e.target.value) || config.weight;
                                if (newWeight !== config.weight) {
                                    updatePlanConfig(config.planType, { ...config, weight: newWeight });
                                }
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Días estimados de entrega</Label>
                        <Input
                            type="number"
                            defaultValue={config.estimatedDeliveryDays}
                            onBlur={(e) => {
                                const newDays = parseInt(e.target.value) || config.estimatedDeliveryDays;
                                if (newDays !== config.estimatedDeliveryDays) {
                                    updatePlanConfig(config.planType, { ...config, estimatedDeliveryDays: newDays });
                                }
                            }}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>
                            <Checkbox
                                type="checkbox"
                                checked={config.isActive}
                                onChange={(e) => {
                                    updatePlanConfig(config.planType, { ...config, isActive: e.target.checked });
                                }}
                            />
                            Plan activo
                        </Label>
                    </FormGroup>

                    <ActionButtons>
                        <Button
                            variant="danger"
                            onClick={() => {
                                const reason = prompt('Motivo para liberar stock de este plan:');
                                if (reason) {
                                    releaseStock(config.planType, reason);
                                }
                            }}
                            disabled={saving}
                        >
                            Liberar Stock
                        </Button>
                    </ActionButtons>
                </ConfigCard>
            ))}
        </ConfigGrid>
    );

    // Renderizar historial
    const renderHistory = () => (
        <HistoryTable>
            <TableHeader>
                <div>Fecha</div>
                <div>Acción</div>
                <div>Plan</div>
                <div>Cambio</div>
                <div>Carga</div>
                <div>Motivo</div>
            </TableHeader>
            {stockHistory.length > 0 ? (
                stockHistory.map((entry) => (
                    <TableRow key={entry._id}>
                        <div>{formatDate(entry.createdAt)}</div>
                        <div style={{ textTransform: 'capitalize' }}>
                            {entry.action.replace('_', ' ')}
                        </div>
                        <div>{entry.planType || '-'}</div>
                        <div style={{
                            color: entry.weightChange > 0 ? '#F56565' : entry.weightChange < 0 ? '#48BB78' : '#fff'
                        }}>
                            {entry.weightChange > 0 ? '+' : ''}{entry.weightChange}
                        </div>
                        <div>{entry.previousLoad} → {entry.newLoad}</div>
                        <div>{entry.reason || '-'}</div>
                    </TableRow>
                ))
            ) : (
                <EmptyState>
                    <h3>No hay historial disponible</h3>
                    <p>Las acciones del stock aparecerán aquí</p>
                </EmptyState>
            )}
        </HistoryTable>
    );

    // Renderizar cola de espera
    const renderQueue = () => (
        <div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <Button
                    onClick={() => {
                        const selectedIds = waitingQueue
                            .filter(entry => entry.status === 'waiting')
                            .map(entry => entry._id);
                        if (selectedIds.length > 0) {
                            notifyQueueUsers(selectedIds);
                        }
                    }}
                    disabled={saving || waitingQueue.filter(e => e.status === 'waiting').length === 0}
                >
                    Notificar Todos
                </Button>
            </div>

            <QueueTable>
                <QueueHeader>
                    <div>Usuario</div>
                    <div>Email</div>
                    <div>Plan</div>
                    <div>Peso</div>
                    <div>Fecha Solicitud</div>
                    <div>Estado</div>
                </QueueHeader>
                {waitingQueue.length > 0 ? (
                    waitingQueue.map((entry) => (
                        <QueueRow key={entry._id}>
                            <div>{entry.userName}</div>
                            <div>{entry.userEmail}</div>
                            <div style={{ textTransform: 'capitalize' }}>{entry.planType}</div>
                            <div>{entry.planWeight} pts</div>
                            <div>{formatDate(entry.requestedAt)}</div>
                            <div>
                                <StatusIndicator status={
                                    entry.status === 'waiting' ? 'warning' :
                                        entry.status === 'notified' ? 'good' : 'critical'
                                }>
                                    {entry.status === 'waiting' ? '⏳ Esperando' :
                                        entry.status === 'notified' ? '📧 Notificado' : '❌ Expirado'}
                                </StatusIndicator>
                            </div>
                        </QueueRow>
                    ))
                ) : (
                    <EmptyState>
                        <h3>No hay usuarios en cola</h3>
                        <p>Los usuarios que soliciten planes sin stock aparecerán aquí</p>
                    </EmptyState>
                )}
            </QueueTable>
        </div>
    );

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
        <StockContainer>
            <Header>
                <Title>Gestión de Stock</Title>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    Sistema de control de capacidad y calidad
                </div>
            </Header>

            <TabContainer>
                <Tab
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Vista General
                </Tab>
                <Tab
                    active={activeTab === 'config'}
                    onClick={() => setActiveTab('config')}
                >
                    ⚙️ Configuración
                </Tab>
                <Tab
                    active={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                >
                    📋 Historial
                </Tab>
                <Tab
                    active={activeTab === 'queue'}
                    onClick={() => setActiveTab('queue')}
                >
                    ⏳ Cola de Espera ({waitingQueue.filter(e => e.status === 'waiting').length})
                </Tab>
            </TabContainer>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'config' && renderConfig()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'queue' && renderQueue()}
        </StockContainer>
    );
};

export default StockAdmin; 
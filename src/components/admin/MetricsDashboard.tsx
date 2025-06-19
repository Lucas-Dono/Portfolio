import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Interfaces
interface BusinessMetrics {
  traffic: {
    totalVisits: number;
    uniqueVisitors: number;
    bounceRate: string;
    averageSessionDuration: number;
    topPages: { page: string; views: number }[];
    conversionRate: string;
  };
  leads: {
    totalLeads: number;
    leadSources: { source: string; count: number }[];
    conversionToQuotation: string;
    qualityScore: number;
  };
  quotations: {
    totalQuotations: number;
    averageQuotationValue: number;
    quotationToSaleRate: number;
    topServices: { service: string; count: number }[];
    conversionFunnel: {
      generated: number;
      sent: number;
      viewed: number;
      converted: number;
      conversionRate: string;
    };
  };
  emailMarketing: {
    totalSequences: number;
    emailsSent: number;
    openRate: number;
    clickRate: number;
    sequencePerformance: { type: string; count: number; emailsSent: number; active: number; avgEmailsPerSequence: string }[];
  };
  chatMetrics: {
    totalConversations: number;
    averageMessagesPerConversation: number;
    chatToLeadRate: string;
    topIntents: { intent: string; count: number; percentage: number }[];
    satisfactionScore: number;
  };
  revenue: {
    estimatedRevenue: number;
    averageOrderValue: number;
    revenueByService: { service: string; value: number }[];
    monthlyGrowth: string;
  };
  trends: {
    traffic: { trend: string; change: string };
    leads: { trend: string; change: string };
    quotations: { trend: string; change: string };
    revenue: { trend: string; change: string };
  };
  insights: { type: string; message: string }[];
}

interface Insight {
  type: 'opportunity' | 'success' | 'warning' | 'trend';
  title: string;
  description: string;
  impact: string;
  effort: string;
  estimatedIncrease?: string;
  currentRate?: string;
  topServices?: string[];
  priceGap?: string;
}

interface BusinessInsights {
  conversion: Insight[];
  marketing: Insight[];
  product: Insight[];
  recommendations: {
    priority: number;
    title: string;
    description: string;
    expectedROI: string;
    timeToImplement: string;
    status: 'completed' | 'in_progress' | 'pending';
  }[];
}

const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, insightsRes] = await Promise.all([
        fetch(`/api/metrics/business?period=${period}`),
        fetch('/api/metrics/insights')
      ]);

      if (!metricsRes.ok || !insightsRes.ok) {
        throw new Error('Error cargando métricas');
      }

      const metricsData = await metricsRes.json();
      const insightsData = await insightsRes.json();

      setMetrics(metricsData.metrics);
      setInsights(insightsData.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR').format(value);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '💡';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'trend': return '📊';
      default: return '📋';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <div className="spinner"></div>
          <p>Cargando métricas empresariales...</p>
        </LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>
          <h3>Error cargando métricas</h3>
          <p>{error}</p>
          <button onClick={loadMetrics}>Reintentar</button>
        </ErrorMessage>
      </Container>
    );
  }

  if (!metrics || !insights) {
    return (
      <Container>
        <ErrorMessage>
          <h3>No hay datos disponibles</h3>
          <p>Las métricas no están disponibles en este momento.</p>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <h1>📊 Dashboard Empresarial</h1>
        <PeriodSelector>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
        </PeriodSelector>
      </Header>

      {/* KPIs Principales */}
      <KPIGrid>
        <KPICard>
          <KPIIcon>👥</KPIIcon>
          <KPIContent>
            <KPIValue>{formatNumber(metrics.traffic.uniqueVisitors)}</KPIValue>
            <KPILabel>Visitantes Únicos</KPILabel>
            <KPITrend trend={metrics.trends.traffic.trend}>
              {getTrendIcon(metrics.trends.traffic.trend)} {metrics.trends.traffic.change}
            </KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard>
          <KPIIcon>🎯</KPIIcon>
          <KPIContent>
            <KPIValue>{formatNumber(metrics.leads.totalLeads)}</KPIValue>
            <KPILabel>Leads Generados</KPILabel>
            <KPITrend trend={metrics.trends.leads.trend}>
              {getTrendIcon(metrics.trends.leads.trend)} {metrics.trends.leads.change}
            </KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard>
          <KPIIcon>📋</KPIIcon>
          <KPIContent>
            <KPIValue>{formatNumber(metrics.quotations.totalQuotations)}</KPIValue>
            <KPILabel>Cotizaciones</KPILabel>
            <KPITrend trend={metrics.trends.quotations.trend}>
              {getTrendIcon(metrics.trends.quotations.trend)} {metrics.trends.quotations.change}
            </KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard>
          <KPIIcon>💰</KPIIcon>
          <KPIContent>
            <KPIValue>{formatCurrency(metrics.revenue.estimatedRevenue)}</KPIValue>
            <KPILabel>Ingresos Estimados</KPILabel>
            <KPITrend trend={metrics.trends.revenue.trend}>
              {getTrendIcon(metrics.trends.revenue.trend)} {metrics.trends.revenue.change}
            </KPITrend>
          </KPIContent>
        </KPICard>
      </KPIGrid>

      {/* Métricas Detalladas */}
      <MetricsGrid>
        {/* Tráfico y Conversión */}
        <MetricCard>
          <CardHeader>
            <h3>🌐 Tráfico y Conversión</h3>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <span>Visitas Totales:</span>
              <strong>{formatNumber(metrics.traffic.totalVisits)}</strong>
            </MetricItem>
            <MetricItem>
              <span>Tasa de Rebote:</span>
              <strong>{metrics.traffic.bounceRate}%</strong>
            </MetricItem>
            <MetricItem>
              <span>Duración Promedio:</span>
              <strong>{Math.floor(metrics.traffic.averageSessionDuration / 60)}m {metrics.traffic.averageSessionDuration % 60}s</strong>
            </MetricItem>
            <MetricItem>
              <span>Tasa de Conversión:</span>
              <strong>{metrics.traffic.conversionRate}%</strong>
            </MetricItem>
          </MetricsList>
          
          <SubSection>
            <h4>Páginas Más Visitadas</h4>
            {metrics.traffic.topPages.map((page, index) => (
              <TopPageItem key={index}>
                <span>{page.page}</span>
                <span>{formatNumber(page.views)} visitas</span>
              </TopPageItem>
            ))}
          </SubSection>
        </MetricCard>

        {/* Leads */}
        <MetricCard>
          <CardHeader>
            <h3>🎯 Generación de Leads</h3>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <span>Calidad de Leads:</span>
              <strong>{metrics.leads.qualityScore}/100</strong>
            </MetricItem>
            <MetricItem>
              <span>Conversión a Cotización:</span>
              <strong>{metrics.leads.conversionToQuotation}%</strong>
            </MetricItem>
          </MetricsList>

          <SubSection>
            <h4>Fuentes de Leads</h4>
            {metrics.leads.leadSources.map((source, index) => (
              <TopPageItem key={index}>
                <span>{source.source}</span>
                <span>{formatNumber(source.count)} leads</span>
              </TopPageItem>
            ))}
          </SubSection>
        </MetricCard>

        {/* Email Marketing */}
        <MetricCard>
          <CardHeader>
            <h3>📧 Email Marketing</h3>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <span>Secuencias Activas:</span>
              <strong>{formatNumber(metrics.emailMarketing.totalSequences)}</strong>
            </MetricItem>
            <MetricItem>
              <span>Emails Enviados:</span>
              <strong>{formatNumber(metrics.emailMarketing.emailsSent)}</strong>
            </MetricItem>
            <MetricItem>
              <span>Tasa de Apertura:</span>
              <strong>{(metrics.emailMarketing.openRate * 100).toFixed(1)}%</strong>
            </MetricItem>
            <MetricItem>
              <span>Tasa de Click:</span>
              <strong>{(metrics.emailMarketing.clickRate * 100).toFixed(1)}%</strong>
            </MetricItem>
          </MetricsList>
        </MetricCard>

        {/* Chat y IA */}
        <MetricCard>
          <CardHeader>
            <h3>💬 Chat y IA</h3>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <span>Conversaciones:</span>
              <strong>{formatNumber(metrics.chatMetrics.totalConversations)}</strong>
            </MetricItem>
            <MetricItem>
              <span>Mensajes Promedio:</span>
              <strong>{metrics.chatMetrics.averageMessagesPerConversation}</strong>
            </MetricItem>
            <MetricItem>
              <span>Chat a Lead:</span>
              <strong>{metrics.chatMetrics.chatToLeadRate}%</strong>
            </MetricItem>
            <MetricItem>
              <span>Satisfacción:</span>
              <strong>{metrics.chatMetrics.satisfactionScore}/5</strong>
            </MetricItem>
          </MetricsList>
        </MetricCard>
      </MetricsGrid>

      {/* Insights y Recomendaciones */}
      <InsightsSection>
        <SectionHeader>
          <h2>💡 Insights y Recomendaciones</h2>
        </SectionHeader>

        <InsightsGrid>
          {/* Recomendaciones Prioritarias */}
          <InsightCard>
            <CardHeader>
              <h3>🚀 Recomendaciones Prioritarias</h3>
            </CardHeader>
            {insights.recommendations.map((rec, index) => (
              <RecommendationItem key={index}>
                <RecommendationHeader>
                  <span className="priority">#{rec.priority}</span>
                  <span className="title">{rec.title}</span>
                  <span className="status">{getStatusIcon(rec.status)}</span>
                </RecommendationHeader>
                <RecommendationDetails>
                  <p>{rec.description}</p>
                  <RecommendationMeta>
                    <span>ROI: {rec.expectedROI}</span>
                    <span>Tiempo: {rec.timeToImplement}</span>
                  </RecommendationMeta>
                </RecommendationDetails>
              </RecommendationItem>
            ))}
          </InsightCard>

          {/* Insights de Conversión */}
          <InsightCard>
            <CardHeader>
              <h3>📈 Insights de Conversión</h3>
            </CardHeader>
            {insights.conversion.map((insight, index) => (
              <InsightItem key={index}>
                <InsightHeader>
                  <span className="icon">{getInsightIcon(insight.type)}</span>
                  <span className="title">{insight.title}</span>
                </InsightHeader>
                <InsightDescription>{insight.description}</InsightDescription>
                {insight.estimatedIncrease && (
                  <InsightMeta>Impacto: {insight.estimatedIncrease}</InsightMeta>
                )}
                {insight.currentRate && (
                  <InsightMeta>Actual: {insight.currentRate}</InsightMeta>
                )}
              </InsightItem>
            ))}
          </InsightCard>

          {/* Insights de Marketing */}
          <InsightCard>
            <CardHeader>
              <h3>📊 Insights de Marketing</h3>
            </CardHeader>
            {insights.marketing.map((insight, index) => (
              <InsightItem key={index}>
                <InsightHeader>
                  <span className="icon">{getInsightIcon(insight.type)}</span>
                  <span className="title">{insight.title}</span>
                </InsightHeader>
                <InsightDescription>{insight.description}</InsightDescription>
                {insight.estimatedIncrease && (
                  <InsightMeta>Impacto: {insight.estimatedIncrease}</InsightMeta>
                )}
                {insight.currentRate && (
                  <InsightMeta>Actual: {insight.currentRate}</InsightMeta>
                )}
              </InsightItem>
            ))}
          </InsightCard>
        </InsightsGrid>
      </InsightsSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
  }
`;

const PeriodSelector = styled.div`
  select {
    padding: 10px 15px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 16px;
    cursor: pointer;
    
    option {
      background: #333;
      color: white;
    }
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const KPICard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const KPIIcon = styled.div`
  font-size: 3rem;
  opacity: 0.8;
`;

const KPIContent = styled.div`
  flex: 1;
`;

const KPIValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const KPILabel = styled.div`
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 8px;
`;

const KPITrend = styled.div<{ trend: string }>`
  font-size: 0.9rem;
  color: ${props => {
    switch (props.trend) {
      case 'up': return '#4ade80';
      case 'down': return '#f87171';
      default: return '#fbbf24';
    }
  }};
  font-weight: 600;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CardHeader = styled.div`
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const MetricItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  span:first-child {
    opacity: 0.8;
  }
  
  strong {
    font-weight: 600;
  }
`;

const SubSection = styled.div`
  h4 {
    margin: 0 0 15px 0;
    font-size: 1.1rem;
    opacity: 0.9;
  }
`;

const TopPageItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
  
  span:first-child {
    opacity: 0.9;
  }
  
  span:last-child {
    font-weight: 600;
    font-size: 0.9rem;
  }
`;

const InsightsSection = styled.div`
  margin-top: 40px;
`;

const SectionHeader = styled.div`
  margin-bottom: 25px;
  
  h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
  }
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
`;

const InsightCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const RecommendationItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
`;

const RecommendationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  
  .priority {
    background: #4ade80;
    color: #000;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.8rem;
  }
  
  .title {
    flex: 1;
    font-weight: 600;
  }
  
  .status {
    font-size: 1.2rem;
  }
`;

const RecommendationDetails = styled.div`
  p {
    margin: 0 0 10px 0;
    opacity: 0.9;
    line-height: 1.5;
  }
`;

const RecommendationMeta = styled.div`
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  opacity: 0.8;
  
  span {
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 6px;
  }
`;

const InsightItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
`;

const InsightHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  
  .icon {
    font-size: 1.2rem;
  }
  
  .title {
    font-weight: 600;
  }
`;

const InsightDescription = styled.p`
  margin: 0 0 8px 0;
  opacity: 0.9;
  line-height: 1.5;
`;

const InsightMeta = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
  margin-right: 8px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    font-size: 1.1rem;
    opacity: 0.8;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  
  h3 {
    color: #f87171;
    margin-bottom: 10px;
  }
  
  p {
    opacity: 0.8;
    margin-bottom: 20px;
  }
  
  button {
    background: #4ade80;
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    
    &:hover {
      background: #22c55e;
    }
  }
`;

export default MetricsDashboard; 
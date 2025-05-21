import React, { useState } from 'react';
import styled from 'styled-components';
import {
    SectionContainer,
    SectionHeader,
    SectionTitle,
    SettingsButton,
    SaveButton,
    SettingsSection,
    SettingsTitle
} from './Settings';

// Interfaces
interface Service {
    id: string;
    name: string;
    purchaseDate: string;
    amount: number;
    description?: string;
    paymentId?: string;
}

interface RefundRequestProps {
    userServices?: Service[];
    // userId no se utiliza en este componente
    onSubmitRequest: (serviceId: string, reason: string, paymentId?: string) => Promise<void>;
}

// Componentes específicos para el flujo de reembolso
const ServiceItem = styled.div<{ isEligible: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background-color: var(--card-secondary-bg, #2d3748);
  border-radius: 8px;
  border-left: 4px solid ${props => props.isEligible ? 'var(--success-color, #10b981)' : 'var(--danger-color, #ef4444)'};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const ServiceDetails = styled.div`
  flex: 1;
`;

const ServiceName = styled.h4`
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary, #ffffff);
`;

const ServiceMeta = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #9ca3af);
`;

const EligibilityBadge = styled.span<{ isEligible: boolean }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.isEligible
        ? 'rgba(16, 185, 129, 0.2)'
        : 'rgba(239, 68, 68, 0.2)'};
  color: ${props => props.isEligible
        ? 'var(--success-color, #10b981)'
        : 'var(--danger-color, #ef4444)'};
`;

const EmptyServices = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary, #9ca3af);
  font-size: 0.95rem;
`;

const Steps = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const Step = styled.div<{ active: boolean, completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33%;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: ${props => props.completed
        ? 'var(--primary-color, #3b82f6)'
        : 'var(--border-color, #4b5563)'};
    top: 1rem;
    left: 50%;
    z-index: 0;
  }
`;

const StepCircle = styled.div<{ active: boolean, completed: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${props => props.completed
        ? 'var(--primary-color, #3b82f6)'
        : props.active
            ? 'var(--background, #1f2937)'
            : 'var(--border-color, #4b5563)'};
  border: 2px solid ${props => props.active || props.completed
        ? 'var(--primary-color, #3b82f6)'
        : 'var(--border-color, #4b5563)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 0.5rem;
  z-index: 1;
`;

const StepLabel = styled.span<{ active: boolean }>`
  font-size: 0.85rem;
  color: ${props => props.active
        ? 'var(--text-primary, #ffffff)'
        : 'var(--text-secondary, #9ca3af)'};
  text-align: center;
`;

const FormContainer = styled.div`
  margin-top: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary, #9ca3af);
`;

// FormInput ya no se utiliza, pero dejamos la definición para referencia futura
/* 
const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  background-color: var(--input-bg, #374151);
  border: 1px solid var(--border-color, #4b5563);
  border-radius: 4px;
  color: var(--text-primary, #ffffff);
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
  }
`;
*/

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background-color: var(--input-bg, #374151);
  border: 1px solid var(--border-color, #4b5563);
  border-radius: 4px;
  color: var(--text-primary, #ffffff);
  font-size: 0.95rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const RadioInput = styled.input`
  accent-color: var(--primary-color, #3b82f6);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

const ErrorMessage = styled.div`
  color: var(--danger-color, #ef4444);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: var(--success-color, #10b981);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: 4px;
`;

const InfoBox = styled.div`
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary, #9ca3af);
  line-height: 1.5;
  border-radius: 0 4px 4px 0;
`;

const RefundPolicy = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary, #9ca3af);
`;

const PolicyTitle = styled.h5`
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0 0 0.75rem 0;
  color: var(--text-primary, #ffffff);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RefundRequest: React.FC<RefundRequestProps> = ({ userServices = [], onSubmitRequest }) => {
    const [step, setStep] = useState<number>(1);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [reason, setReason] = useState<string>('');
    const [reasonType, setReasonType] = useState<string>('unsatisfied');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // Verificar si un servicio es elegible para reembolso (menos de 7 días)
    const isEligibleForRefund = (purchaseDate: string): boolean => {
        const purchase = new Date(purchaseDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - purchase.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 7;
    };

    // Filtrar servicios elegibles
    const eligibleServices = userServices.filter(service => isEligibleForRefund(service.purchaseDate));

    // Formatear fecha
    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    // Manejo del siguiente paso
    const handleNext = () => {
        if (step === 1 && !selectedService) {
            setError('Por favor, selecciona un servicio para continuar.');
            return;
        }

        if (step === 2 && reason.trim().length < 10) {
            setError('Por favor, proporciona una razón detallada para tu solicitud (mínimo 10 caracteres).');
            return;
        }

        setError(null);
        setStep(prevStep => prevStep + 1);
    };

    // Manejo del paso anterior
    const handleBack = () => {
        setStep(prevStep => prevStep - 1);
        setError(null);
    };

    // Enviar solicitud de reembolso
    const handleSubmit = async () => {
        if (!selectedService) {
            setError('Por favor, selecciona un servicio válido');
            return;
        }

        if (!reason.trim()) {
            setError('Por favor, proporciona un motivo para el reembolso');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Buscar el servicio completo usando el ID seleccionado
            const serviceObj = userServices.find(s => s.id === selectedService);

            if (!serviceObj) {
                throw new Error('No se pudo encontrar el servicio seleccionado');
            }

            // Obtener el ID de pago de MercadoPago del servicio
            const paymentId = serviceObj.paymentId || '';

            // Llamar a la función proporcionada por el padre para manejar la solicitud
            await onSubmitRequest(serviceObj.id, reason, paymentId);

            // Mostrar mensaje de éxito
            setSuccess(true);

            // Limpiar formulario
            setReasonType('unsatisfied');
            setReason('');
            setSelectedService(null);

            // Volver al paso 1 después de un retraso
            setTimeout(() => {
                setStep(1);
            }, 3000);

        } catch (err: any) {
            // Mostrar mensaje de error
            setError(err?.message || 'Error al procesar la solicitud de reembolso. Por favor, intenta de nuevo más tarde.');
            console.error('Error al enviar solicitud de reembolso:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SectionContainer>
            <SectionHeader>
                <SectionTitle>Solicitud de Reembolso</SectionTitle>
            </SectionHeader>

            <Steps>
                <Step active={step === 1} completed={step > 1}>
                    <StepCircle active={step === 1} completed={step > 1}>1</StepCircle>
                    <StepLabel active={step === 1}>Seleccionar Servicio</StepLabel>
                </Step>
                <Step active={step === 2} completed={step > 2}>
                    <StepCircle active={step === 2} completed={step > 2}>2</StepCircle>
                    <StepLabel active={step === 2}>Detalles</StepLabel>
                </Step>
                <Step active={step === 3} completed={step > 3}>
                    <StepCircle active={step === 3} completed={step > 3}>3</StepCircle>
                    <StepLabel active={step === 3}>Confirmación</StepLabel>
                </Step>
            </Steps>

            {step === 1 && (
                <SettingsSection>
                    <SettingsTitle>Servicios disponibles para reembolso</SettingsTitle>

                    <InfoBox>
                        Solo los servicios adquiridos en los últimos 7 días son elegibles para reembolso.
                        Los reembolsos se procesan a través de MercadoPago y serán devueltos al método de pago original.
                    </InfoBox>

                    {userServices.length === 0 ? (
                        <EmptyServices>
                            No tienes servicios de pago activos en este momento.
                        </EmptyServices>
                    ) : eligibleServices.length === 0 ? (
                        <EmptyServices>
                            No tienes servicios elegibles para reembolso en este momento.
                            Los reembolsos solo están disponibles dentro de los primeros 7 días después de la compra.
                        </EmptyServices>
                    ) : (
                        <>
                            {userServices.map(service => {
                                const isEligible = isEligibleForRefund(service.purchaseDate);
                                return (
                                    <ServiceItem
                                        key={service.id}
                                        isEligible={isEligible}
                                        onClick={() => isEligible && setSelectedService(service.id)}
                                        style={{ cursor: isEligible ? 'pointer' : 'default', opacity: isEligible ? 1 : 0.7 }}
                                    >
                                        <ServiceDetails>
                                            <ServiceName>{service.name}</ServiceName>
                                            <ServiceMeta>
                                                <span>Comprado el: {formatDate(service.purchaseDate)}</span>
                                                <span>Precio: ${service.amount.toFixed(2)}</span>
                                            </ServiceMeta>
                                        </ServiceDetails>

                                        <div>
                                            {isEligible ? (
                                                <EligibilityBadge isEligible={true}>
                                                    {selectedService === service.id ? '✓ Seleccionado' : 'Elegible para reembolso'}
                                                </EligibilityBadge>
                                            ) : (
                                                <EligibilityBadge isEligible={false}>
                                                    No elegible (más de 7 días)
                                                </EligibilityBadge>
                                            )}
                                        </div>
                                    </ServiceItem>
                                );
                            })}
                        </>
                    )}

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <ButtonGroup>
                        <div></div> {/* Espacio para alinear el botón a la derecha */}
                        <SaveButton
                            onClick={handleNext}
                            disabled={eligibleServices.length === 0 || !selectedService}
                            style={{ opacity: (eligibleServices.length === 0 || !selectedService) ? 0.5 : 1 }}
                        >
                            Continuar
                        </SaveButton>
                    </ButtonGroup>
                </SettingsSection>
            )}

            {step === 2 && (
                <SettingsSection>
                    <SettingsTitle>Detalles de la solicitud</SettingsTitle>

                    <FormContainer>
                        <FormGroup>
                            <FormLabel>Motivo del reembolso</FormLabel>
                            <RadioGroup>
                                <RadioOption>
                                    <RadioInput
                                        type="radio"
                                        name="reasonType"
                                        value="unsatisfied"
                                        checked={reasonType === 'unsatisfied'}
                                        onChange={() => setReasonType('unsatisfied')}
                                    />
                                    No estoy satisfecho con el servicio
                                </RadioOption>
                                <RadioOption>
                                    <RadioInput
                                        type="radio"
                                        name="reasonType"
                                        value="error"
                                        checked={reasonType === 'error'}
                                        onChange={() => setReasonType('error')}
                                    />
                                    Hubo un error en mi compra
                                </RadioOption>
                                <RadioOption>
                                    <RadioInput
                                        type="radio"
                                        name="reasonType"
                                        value="other"
                                        checked={reasonType === 'other'}
                                        onChange={() => setReasonType('other')}
                                    />
                                    Otro motivo
                                </RadioOption>
                            </RadioGroup>
                        </FormGroup>

                        <FormGroup>
                            <FormLabel>Explica detalladamente la razón de tu solicitud de reembolso</FormLabel>
                            <FormTextarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Por favor, describe el motivo de tu solicitud de manera clara y detallada..."
                            />
                        </FormGroup>
                    </FormContainer>

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <ButtonGroup>
                        <SettingsButton onClick={handleBack}>
                            Volver
                        </SettingsButton>
                        <SaveButton onClick={handleNext}>
                            Continuar
                        </SaveButton>
                    </ButtonGroup>
                </SettingsSection>
            )}

            {step === 3 && (
                <SettingsSection>
                    <SettingsTitle>Confirmar solicitud</SettingsTitle>

                    <FormContainer>
                        <p>Estás a punto de solicitar un reembolso para:</p>

                        {selectedService && (
                            <ServiceItem isEligible={true} style={{ cursor: 'default' }}>
                                <ServiceDetails>
                                    <ServiceName>
                                        {userServices.find(s => s.id === selectedService)?.name}
                                    </ServiceName>
                                    <ServiceMeta>
                                        <span>
                                            Comprado el: {formatDate(userServices.find(s => s.id === selectedService)?.purchaseDate || '')}
                                        </span>
                                        <span>
                                            Precio: ${userServices.find(s => s.id === selectedService)?.amount.toFixed(2)}
                                        </span>
                                    </ServiceMeta>
                                </ServiceDetails>
                            </ServiceItem>
                        )}

                        <FormGroup>
                            <FormLabel>Motivo seleccionado:</FormLabel>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--input-bg, #374151)', borderRadius: '4px' }}>
                                <strong>
                                    {reasonType === 'unsatisfied' && 'No estoy satisfecho con el servicio'}
                                    {reasonType === 'error' && 'Hubo un error en mi compra'}
                                    {reasonType === 'other' && 'Otro motivo'}
                                </strong>
                                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{reason}</p>
                            </div>
                        </FormGroup>

                        <RefundPolicy>
                            <PolicyTitle>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                Política de reembolsos
                            </PolicyTitle>
                            <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                                <li>Las solicitudes de reembolso son revisadas en un plazo de 1-2 días hábiles.</li>
                                <li>Los reembolsos aprobados se procesan a través de MercadoPago y pueden tardar de 3 a 15 días hábiles en reflejarse en tu método de pago original, dependiendo de tu entidad bancaria.</li>
                                <li>Al enviar esta solicitud, confirmas que has leído y aceptas nuestros <a href="#" style={{ color: '#3b82f6' }}>Términos y Condiciones</a>.</li>
                            </ul>
                        </RefundPolicy>

                        <p>
                            Una vez enviada la solicitud, nuestro equipo la revisará en un plazo de 1-2 días hábiles.
                            Si tu solicitud es aprobada, el reembolso se procesará a través del mismo método de pago utilizado en la compra.
                        </p>
                    </FormContainer>

                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    {success && <SuccessMessage>¡Tu solicitud de reembolso ha sido enviada con éxito! Te contactaremos pronto.</SuccessMessage>}

                    <ButtonGroup>
                        <SettingsButton onClick={handleBack}>
                            Volver
                        </SettingsButton>
                        <SaveButton
                            onClick={handleSubmit}
                            disabled={loading || success}
                            style={{ opacity: (loading || success) ? 0.7 : 1 }}
                        >
                            {loading ? 'Enviando...' : success ? '¡Enviado!' : 'Enviar solicitud'}
                        </SaveButton>
                    </ButtonGroup>
                </SettingsSection>
            )}
        </SectionContainer>
    );
};

export default RefundRequest; 
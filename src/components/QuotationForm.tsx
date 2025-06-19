import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  userContext?: any;
}

interface QuotationData {
  id: string;
  service: {
    type: string;
    name: string;
    description: string;
  };
  pricing: {
    basePrice: number;
    totalBeforeDiscounts: number;
    discount: {
      percentage: number;
      reason: string;
    };
    finalPrice: number;
    currency: string;
  };
  features: string[];
  addons: any[];
  delivery: {
    estimated: string;
    urgency: string;
  };
  recommendations: any[];
  validUntil: string;
}

// Styled Components
const Overlay = styled(motion.div)`
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

const Modal = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 30px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const FormSection = styled.div`
  margin-bottom: 25px;
`;

const Label = styled.label`
  display: block;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
  }

  option {
    background: #1a1a2e;
    color: #fff;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 10px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #4facfe;
  }

  span {
    color: #fff;
    font-size: 14px;
  }
`;

const Button = styled(motion.button)`
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  padding: 15px 30px;
  cursor: pointer;
  width: 100%;
  margin-top: 20px;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const QuotationResult = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  margin-top: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PriceDisplay = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const FinalPrice = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: #4facfe;
  margin-bottom: 5px;
`;

const OriginalPrice = styled.div`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: line-through;
`;

const DiscountBadge = styled.div`
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  color: #fff;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: inline-block;
  margin-top: 10px;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 20px 0;

  li {
    color: #fff;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;

    &:before {
      content: '✓';
      color: #4facfe;
      font-weight: bold;
    }
  }
`;

const QuotationForm: React.FC<QuotationFormProps> = ({ isOpen, onClose, userContext }) => {
  const [formData, setFormData] = useState({
    serviceType: '',
    requirements: '',
    urgency: 'medium',
    customization: 'semi_custom',
    additionalFeatures: [] as string[]
  });
  
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const serviceOptions = [
    { value: 'landing-page', label: 'Landing Page' },
    { value: 'website-complete', label: 'Sitio Web Completo' },
    { value: 'ecommerce', label: 'Tienda Online' },
    { value: 'portfolio', label: 'Portfolio Profesional' }
  ];

  const urgencyOptions = [
    { value: 'low', label: 'Sin prisa (1-2 semanas)' },
    { value: 'medium', label: 'Normal (1 semana)' },
    { value: 'high', label: 'Urgente (3-5 días)' },
    { value: 'urgent', label: 'Súper urgente (1-2 días)' }
  ];

  const customizationOptions = [
    { value: 'template', label: 'Basado en plantilla' },
    { value: 'semi_custom', label: 'Semi-personalizado' },
    { value: 'full_custom', label: 'Completamente personalizado' }
  ];

  const addonOptions = [
    { value: 'seo-advanced', label: 'SEO Avanzado' },
    { value: 'mobile-app', label: 'App Móvil' },
    { value: 'cms-advanced', label: 'CMS Avanzado' },
    { value: 'analytics-pro', label: 'Analytics Pro' },
    { value: 'express-delivery', label: 'Entrega Express' },
    { value: 'maintenance', label: 'Mantenimiento Anual' },
    { value: 'hosting-premium', label: 'Hosting Premium' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddonChange = (addonId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      additionalFeatures: checked 
        ? [...prev.additionalFeatures, addonId]
        : prev.additionalFeatures.filter(id => id !== addonId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceType) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/quotations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQuotation(data.quotation);
        setShowResult(true);
      } else {
        console.error('Error generando cotización');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: '',
      requirements: '',
      urgency: 'medium',
      customization: 'semi_custom',
      additionalFeatures: []
    });
    setQuotation(null);
    setShowResult(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Modal
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Header>
            <Title>
              💰 Cotización Inteligente
            </Title>
            <CloseButton onClick={onClose}>×</CloseButton>
          </Header>

          {!showResult ? (
            <form onSubmit={handleSubmit}>
              <FormSection>
                <Label>Tipo de Servicio *</Label>
                <Select
                  value={formData.serviceType}
                  onChange={(e) => handleInputChange('serviceType', e.target.value)}
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  {serviceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormSection>

              <FormSection>
                <Label>Describe tus requerimientos</Label>
                <TextArea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="Cuéntanos qué necesitas: funcionalidades específicas, diseño, integraciones, etc."
                />
              </FormSection>

              <FormSection>
                <Label>Urgencia del Proyecto</Label>
                <Select
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                >
                  {urgencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormSection>

              <FormSection>
                <Label>Nivel de Personalización</Label>
                <Select
                  value={formData.customization}
                  onChange={(e) => handleInputChange('customization', e.target.value)}
                >
                  {customizationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormSection>

              <FormSection>
                <Label>Servicios Adicionales</Label>
                <CheckboxGroup>
                  {addonOptions.map(addon => (
                    <CheckboxItem key={addon.value}>
                      <input
                        type="checkbox"
                        checked={formData.additionalFeatures.includes(addon.value)}
                        onChange={(e) => handleAddonChange(addon.value, e.target.checked)}
                      />
                      <span>{addon.label}</span>
                    </CheckboxItem>
                  ))}
                </CheckboxGroup>
              </FormSection>

              <Button
                type="submit"
                disabled={isLoading || !formData.serviceType}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Generando Cotización...' : 'Generar Cotización'}
              </Button>
            </form>
          ) : quotation && (
            <QuotationResult
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PriceDisplay>
                <FinalPrice>${quotation.pricing.finalPrice}</FinalPrice>
                {quotation.pricing.discount.percentage > 0 && (
                  <>
                    <OriginalPrice>${quotation.pricing.totalBeforeDiscounts}</OriginalPrice>
                    <DiscountBadge>
                      {Math.round(quotation.pricing.discount.percentage * 100)}% OFF
                    </DiscountBadge>
                  </>
                )}
              </PriceDisplay>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>
                  {quotation.service.name}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  Tiempo estimado: {quotation.delivery.estimated}
                </p>
              </div>

              <Label>Incluye:</Label>
              <FeaturesList>
                {quotation.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </FeaturesList>

              {quotation.pricing.discount.percentage > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <Label>Descuento Aplicado:</Label>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                    {quotation.pricing.discount.reason}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Button
                  onClick={resetForm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  Nueva Cotización
                </Button>
                <Button
                  onClick={() => window.location.href = '/payment'}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contratar Ahora
                </Button>
              </div>
            </QuotationResult>
          )}
        </Modal>
      </Overlay>
    </AnimatePresence>
  );
};

export default QuotationForm; 
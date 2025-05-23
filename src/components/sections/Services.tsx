import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';
import Button from '../ui/Button';
import { Promocion, PromocionesState, ReservaPromocion } from '../../types/promo';
import * as promocionesAPI from '../../api/promocionesAPI';
import * as preciosAPI from '../../api/preciosAPI';
import { Servicio, AddonServicio } from '../../services/preciosService';

// Estilos
const ServicesSection = styled.section`
  padding: 6rem 1.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
  }

  @media (max-width: 768px) {
    padding: 4rem 1rem;
  }
`;

const SectionContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(100% / 4 - 1.5rem), 1fr));
  gap: 1.5rem;
  margin-top: 3rem;

  @media (min-width: 1400px) {
    grid-template-columns: ${props => {
    // Calcular columnas basadas en cantidad de elementos
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    if (childCount === 2) return 'repeat(2, 1fr)';
    if (childCount === 3) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  }};
  }

  @media (max-width: 1399px) and (min-width: 1001px) {
    grid-template-columns: ${props => {
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    if (childCount === 2) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  }};
  }

  @media (max-width: 1000px) and (min-width: 651px) {
    grid-template-columns: ${props => {
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    return 'repeat(2, 1fr)';
  }};
  }

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const ServiceCard = styled(motion.div) <{ highlight?: string }>`
  background: rgba(17, 17, 17, 0.6);
  border: 1px solid ${props => props.highlight === 'true' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.07)'};
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: ${props => props.highlight === 'true' ? '0 8px 32px rgba(0, 255, 255, 0.15)' : 'none'};
  height: 100%;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  @media (min-width: 1200px) {
    font-size: 0.95rem;
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(255, 0, 255, 0.3);
`;

const PromoLabel = styled.div`
  margin-top: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: rgba(255, 255, 0, 0.1);
  border-radius: 4px;
  font-size: 0.9rem;
  color: #ffff00;
  text-align: center;
  font-weight: 500;
`;

const ServiceTitle = styled.h3`
  font-size: 1.6rem;
  font-weight: 600;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (min-width: 1200px) {
    font-size: 1.5rem;
  }
`;

const ServiceDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  font-size: 1rem;
  
  @media (min-width: 1200px) {
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

const ServiceFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const FeatureItem = styled.li`
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.4;

  &::before {
    content: "✓";
    color: #00FFFF;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }
  
  @media (min-width: 1200px) {
    font-size: 0.85rem;
  }
`;

const ServicePrice = styled.div`
  margin-top: auto;
  padding: 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const OriginalPrice = styled.span`
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  display: block;
  margin-bottom: 0.5rem;
`;

const Price = styled.span`
  font-size: 1.8rem;
  font-weight: 700;
  color: #FF00FF;
  margin-top: 0.3rem;
  display: block;
  
  @media (min-width: 1200px) {
    font-size: 1.5rem;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const SectionDivider = styled.div`
  margin: 4rem 0 2rem;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
    z-index: 0;
  }
`;

const DividerText = styled.span`
  position: relative;
  background: #111;
  padding: 0 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  z-index: 1;
`;

const AddOnsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;

  @media (min-width: 1200px) {
    grid-template-columns: ${props => {
    // Calcular columnas basadas en cantidad de elementos
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    if (childCount === 2) return 'repeat(2, 1fr)';
    if (childCount === 3) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  }};
  }

  @media (max-width: 1199px) and (min-width: 651px) {
    grid-template-columns: ${props => {
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    if (childCount === 2) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  }};
  }

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const AddOnCard = styled.div`
  background: rgba(17, 17, 17, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.2rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(17, 17, 17, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const AddOnTitle = styled.h4`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: white;
`;

const AddOnDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
`;

const AddOnPrice = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #00FFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  span {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const PackagesContainer = styled.div`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(100% / 3 - 1.5rem), 1fr));
  gap: 1.5rem;

  @media (min-width: 1200px) {
    grid-template-columns: ${props => {
    // Calcular columnas basadas en cantidad de elementos
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    if (childCount === 2) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  }};
  }

  @media (max-width: 1199px) and (min-width: 651px) {
    grid-template-columns: ${props => {
    const childCount = React.Children.count(props.children);
    if (childCount === 1) return '1fr';
    return 'repeat(2, 1fr)';
  }};
  }

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const PackageCard = styled(motion.div)`
  background: rgba(17, 17, 17, 0.6);
  background-image: linear-gradient(135deg, rgba(255, 0, 255, 0.05) 0%, rgba(0, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 580px;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
`;

const PackageTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
`;

const PackageContent = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
  height: 260px;
  overflow-y: auto;
  
  ul {
    list-style: none;
    padding-left: 0;
    
    li {
      margin-bottom: 0.4rem;
      display: flex;
      align-items: flex-start;
      
      &::before {
        content: "✓";
        color: #00FFFF;
        margin-right: 0.5rem;
      }
    }
  }
`;

const PackagePricing = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: absolute;
  top: 330px;
  left: 1.5rem;
  right: 1.5rem;
`;

const PackageSavings = styled.div`
  background: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 1rem;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PackagePriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 70px;
  justify-content: flex-end;
`;

const PackageButtonContainer = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  width: calc(100% - 3rem);
`;

const OfferButton = styled(Button)`
  background: linear-gradient(135deg, #FF0099 0%, #00DDFF 100%);
  border: 3px solid white;
  font-weight: 700;
  font-size: 1.05rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.3);
  padding: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

// Modal components - unchanged
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ModalContent = styled(motion.div)`
  background-color: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;

  &:hover {
    color: #FF00FF;
  }
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ModalDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
  margin-bottom: 2rem;
`;

const ContactButton = styled(motion.a)`
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: filter 0.3s ease;
  border: 2px solid white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

  &:hover {
    filter: brightness(1.1);
  }
`;

// Actualizando los nombres de componentes del popup para evitar duplicados
const PopupOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PopupContent = styled(motion.div)`
  background-color: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-height: 90vh;
    overflow-y: auto;
    max-width: 95%;
  }
`;

const PopupTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
`;

const PopupAddOnOption = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  height: 100%;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const PopupAddOnCheckbox = styled.div<{ checked: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid ${props => props.checked ? '#00FFFF' : 'rgba(255, 255, 255, 0.3)'};
  background: ${props => props.checked ? 'rgba(0, 255, 255, 0.2)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.checked ? '0 0 8px rgba(0, 255, 255, 0.4)' : 'none'};
  
  svg {
    opacity: ${props => props.checked ? 1 : 0};
    transform: ${props => props.checked ? 'scale(1)' : 'scale(0.5)'};
    transition: all 0.2s ease;
  }
`;

const PopupAddOnInfo = styled.div`
  flex: 1;
  padding: 0 1rem;
  cursor: pointer;
`;

const PopupAddOnName = styled.div`
  font-weight: 500;
  color: white;
  margin-bottom: 0.3rem;
`;

const PopupAddOnDescription = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
`;

const PopupAddOnPrice = styled.div`
  font-weight: 600;
  color: #FF00FF;
  min-width: 80px;
  text-align: right;
`;

const SummarySection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: #00FFFF;
`;

const ComparisonTable = styled.div`
  display: grid;
  grid-template-columns: 1.5fr repeat(4, 1fr);
  gap: 1px;
  margin-top: 4rem;
  padding-top: 20px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 992px) {
    display: none;
  }
`;

const ComparisonHeader = styled.div`
  background: #0f0f0f;
  padding: 1.5rem 1rem;
  text-align: center;
  font-weight: 600;
  color: white;
  
  &:first-child {
    text-align: left;
    font-size: 1.2rem;
  }
  
  &:nth-child(3) {
    background: rgba(0, 255, 255, 0.15);
    position: relative;
    
    &::before {
      content: 'RECOMENDADO';
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
      color: white;
      padding: 0.3rem 1.5rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      z-index: 2;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      letter-spacing: 0.5px;
    }
  }
`;

const ComparisonRow = styled.div`
  display: contents;
  
  > div {
    background: #0a0a0a;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    
    &:first-child {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
    }
    
    &:nth-child(3) {
      background: rgba(0, 255, 255, 0.08);
      border-left: 2px solid rgba(0, 255, 255, 0.3);
      border-right: 2px solid rgba(0, 255, 255, 0.3);
    }
  }
`;

const ComparisonCell = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  
  &:first-child {
    justify-content: flex-start;
    font-weight: 500;
  }
`;

const CheckIcon = styled.span`
  color: #00FFCC;
  font-size: 1.3rem;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
`;

const CrossIcon = styled.span`
  color: #FF6666;
  font-size: 1.3rem;
  font-weight: bold;
  opacity: 0.9;
`;

// Añadimos un estilo global para este botón específico
const GlobalStyle = styled.div`
  .checkout-button {
    min-width: 250px;
  }
`;

// Actualizar los datos de los servicios
const services = [
  {
    id: 'landing-page',
    title: 'Plan Básico',
    description: 'Landing page profesional con SEO básico y diseño UX/UI atractivo para tu marca.',
    features: [
      'Landing page profesional (1 página)',
      'Diseño responsive optimizado',
      'Diseño UX/UI moderno',
      'SEO básico implementado',
      'Formulario de contacto básico',
      'Analytics configurado',
      'Sin dominio incluido'
    ],
    originalPrice: 30000,
    price: 29997,
    priceValue: 29997,
    promoPrice: 0,
    promoAvailable: true,
    promoLimit: 3,
    promoText: '¡Gratis para las primeras 3 compras!',
    highlight: 'false',
    popularBadge: false
  },
  {
    id: 'basic-website',
    title: 'Plan Estándar',
    description: 'Sitio web completo con SEO avanzado y estrategia UX/UI para captar más clientes.',
    features: [
      'Sitio web completo (hasta 5 páginas)',
      'Diseño premium personalizado',
      'Estrategia UX/UI profesional',
      'Panel de administración',
      'SEO avanzado implementado',
      'Formulario de contacto avanzado',
      'Analytics y eventos configurados',
      'Soporte técnico por 1 mes',
      'Sin dominio incluido'
    ],
    originalPrice: 80000,
    price: 69997,
    priceValue: 69997,
    highlight: 'true',
    popularBadge: true,
    popularText: 'MÁS POPULAR'
  },
  {
    id: 'premium-website',
    title: 'Plan Premium',
    description: 'Solución profesional con estrategia de marketing digital y conversión optimizada.',
    features: [
      'Sitio web profesional (hasta 8 páginas)',
      'Diseño exclusivo a medida',
      'Estrategia UX/UI y marketing',
      'Panel administración avanzado',
      'SEO profesional + estrategia',
      'Optimización de conversión',
      'Integración con redes sociales',
      'Soporte técnico por 3 meses',
      'Dominio y hosting por 1 año INCLUIDOS',
      '2 revisiones de diseño INCLUIDAS'
    ],
    price: 149997,
    priceValue: 149997,
    highlight: 'false',
    popularBadge: false
  },
  {
    id: 'enterprise',
    title: 'Plan Empresarial',
    description: 'Solución integral para empresas con necesidades específicas y marketing avanzado.',
    features: [
      'Solución empresarial personalizada',
      'Estrategia digital completa',
      'Funcionalidades avanzadas ilimitadas',
      'Consultoría UX/UI y negocio',
      'SEO profesional y SEM',
      'Integraciones a medida',
      'Automatizaciones de marketing',
      'Soporte prioritario por 6 meses',
      'Todo incluido + infraestructura'
    ],
    price: 249997,
    priceValue: 249997,
    customPrice: true,
    customPriceText: 'Desde',
    contactForPrice: true,
    highlight: 'false',
    popularBadge: false
  }
];

// Add-ons selectivos para el pop-up
const selectableAddOns = [
  {
    id: 'domain',
    name: 'Dominio personalizado',
    description: 'Registro y configuración de tu propio dominio para tu sitio web',
    price: 14997,
    includesSetup: true,
    duration: 'anual'
  },
  {
    id: 'deployment',
    name: 'Despliegue profesional',
    description: 'Configuración en plataforma de alta disponibilidad (no incluye servicios persistentes)',
    price: 9997,
    includesSetup: true,
    oneTime: true
  },
  {
    id: 'revisions',
    name: 'Paquete de revisiones',
    description: '3 revisiones adicionales posteriores a la entrega',
    price: 19997,
    includesSetup: false,
    oneTime: true
  },
  {
    id: 'speedOptimization',
    name: 'Optimización de velocidad',
    description: 'Mejora el rendimiento y la velocidad de carga de tu sitio web',
    price: 12997,
    includesSetup: true,
    oneTime: true
  },
  {
    id: 'analytics',
    name: 'Analítica avanzada',
    description: 'Implementación de eventos personalizados y panel de seguimiento',
    price: 16997,
    includesSetup: true,
    oneTime: true
  },
  {
    id: 'training',
    name: 'Capacitación de uso',
    description: 'Sesión de 2 horas para aprender a gestionar tu sitio web',
    price: 8997,
    includesSetup: false,
    oneTime: true
  }
];

// Características para la tabla comparativa
const comparisonFeatures = [
  { name: 'Páginas incluidas', basic: '1', standard: '5', premium: '8', enterprise: 'Ilimitadas' },
  { name: 'Diseño responsive', basic: true, standard: true, premium: true, enterprise: true },
  { name: 'SEO implementado', basic: 'Básico', standard: 'Avanzado', premium: 'Profesional', enterprise: 'Completo' },
  { name: 'Panel de administración', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Soporte técnico', basic: false, standard: '1 mes', premium: '3 meses', enterprise: '6 meses' },
  { name: 'Dominio incluido', basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Hosting incluido', basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Optimización de conversión', basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Integración redes sociales', basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Automatizaciones', basic: false, standard: false, premium: false, enterprise: true },
  { name: 'Estrategia de marketing', basic: false, standard: false, premium: true, enterprise: true }
];

// Paquetes especiales
const specialPackages = [
  {
    id: 'paquete-emprendedor',
    title: 'Paquete Emprendedor',
    description: 'Ideal para comenzar con una presencia profesional online',
    includes: [
      'Plan Básico',
      'Dominio personalizado por 1 año',
      'Despliegue profesional',
      'Diseño de logo simple'
    ],
    originalPrice: 84990,
    price: 67997,
    savePercent: 20
  },
  {
    id: 'paquete-profesional',
    title: 'Paquete Profesional',
    description: 'Todo lo que necesitas para destacar en internet',
    includes: [
      'Plan Estándar',
      'Dominio personalizado por 1 año',
      'Hosting optimizado por 1 año',
      'Despliegue profesional',
      'Paquete de revisiones (3)',
      'Certificado SSL premium'
    ],
    originalPrice: 149985,
    price: 109997,
    savePercent: 25
  }
];

// Paquetes especiales estáticos (como fallback)
const staticSpecialPackages = [
  {
    id: 'paquete-emprendedor',
    title: 'Paquete Emprendedor',
    description: 'Ideal para comenzar con una presencia profesional online',
    includes: [
      'Plan Básico',
      'Dominio personalizado por 1 año',
      'Despliegue profesional',
      'Diseño de logo simple'
    ],
    originalPrice: 84990,
    price: 67997,
    savePercent: 20
  },
  {
    id: 'paquete-profesional',
    title: 'Paquete Profesional',
    description: 'Todo lo que necesitas para destacar en internet',
    includes: [
      'Plan Estándar',
      'Dominio personalizado por 1 año',
      'Hosting optimizado por 1 año',
      'Despliegue profesional',
      'Paquete de revisiones (3)',
      'Certificado SSL premium'
    ],
    originalPrice: 149985,
    price: 109997,
    savePercent: 25
  }
];

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Estados para cargar precios dinámicos desde la API
  const [planesPrecios, setPlanesPrecios] = useState<Servicio[]>([]);
  const [paquetesPrecios, setPaquetesPrecios] = useState<Servicio[]>([]);
  const [addonsPrecios, setAddonsPrecios] = useState<AddonServicio[]>([]);
  const [cargandoPrecios, setCargandoPrecios] = useState(true);

  // Actualizar el estado para promociones disponibles
  const [promocionesDisponibles, setPromocionesDisponibles] = useState<PromocionesState>({});
  const [cargandoPromociones, setCargandoPromociones] = useState(true);

  // Nuevo estado para reservas de promociones
  const [reservaPromocion, setReservaPromocion] = useState<ReservaPromocion | null>(null);

  // Nuevo estado para el modal de add-ons
  const [showAddOnPopup, setShowAddOnPopup] = useState(false);
  const [baseService, setBaseService] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState(0);

  // Cargar precios desde la API
  useEffect(() => {
    const cargarPrecios = async () => {
      try {
        setCargandoPrecios(true);

        // Cargar planes (servicios básicos)
        const planes = await preciosAPI.obtenerServicios();
        const planesFiltrados = planes.filter(p => !p.isPaquete);
        setPlanesPrecios(planesFiltrados);

        // Cargar paquetes (servicios especiales)
        const paquetes = planes.filter(p => p.isPaquete);
        setPaquetesPrecios(paquetes);

        // Cargar addons
        const addons = await preciosAPI.obtenerAddons();
        setAddonsPrecios(addons);

        console.log('Precios cargados:', { planesFiltrados, paquetes, addons });
        setCargandoPrecios(false);
      } catch (error) {
        console.error('Error al cargar precios:', error);
        setCargandoPrecios(false);

        // Si falla la carga, usar datos estáticos por defecto
        console.log('Usando datos estáticos para precios');
      }
    };

    cargarPrecios();

    // Recarga los precios cuando el componente vuelve a ser visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Recargando precios por cambio de visibilidad');
        cargarPrecios();
      }
    };

    // Recarga los precios en intervalos regulares (cada 30 segundos)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Recargando precios por intervalo');
        cargarPrecios();
      }
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar el listener y el intervalo cuando se desmonte el componente
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  // Cargar promociones disponibles
  useEffect(() => {
    const cargarPromociones = async () => {
      try {
        setCargandoPromociones(true);

        // Llamar a la API para obtener promociones disponibles
        const promociones = await promocionesAPI.obtenerTodasPromociones();
        setPromocionesDisponibles(promociones);
        setCargandoPromociones(false);
      } catch (error) {
        console.error('Error al cargar promociones:', error);
        setCargandoPromociones(false);
      }
    };

    cargarPromociones();
  }, []);

  // Combinar los datos estáticos con los precios dinámicos
  const serviciosActualizados = useMemo(() => {
    if (cargandoPrecios || planesPrecios.length === 0) {
      return services; // Devolver datos estáticos si aún no se han cargado los precios
    }

    return services.map(servicio => {
      const precioActualizado = planesPrecios.find(p => p.id === servicio.id);
      if (precioActualizado) {
        return {
          ...servicio,
          price: precioActualizado.price,
          originalPrice: precioActualizado.originalPrice || servicio.originalPrice
        };
      }
      return servicio;
    });
  }, [planesPrecios, cargandoPrecios]);

  // Combinar los datos estáticos de paquetes con los precios dinámicos
  const paquetesActualizados = useMemo(() => {
    if (cargandoPrecios || paquetesPrecios.length === 0) {
      return staticSpecialPackages; // Devolver datos estáticos si aún no se han cargado los precios
    }

    return paquetesPrecios.map(precioActualizado => {
      // Buscar el paquete estático correspondiente para obtener los includes
      const paqueteEstatico = staticSpecialPackages.find(p => p.id === precioActualizado.id);

      if (paqueteEstatico) {
        // Calcular el porcentaje de descuento si hay precio original
        let savePercent = 0;
        if (precioActualizado.originalPrice && precioActualizado.price) {
          savePercent = Math.round(
            ((precioActualizado.originalPrice - precioActualizado.price) / precioActualizado.originalPrice) * 100
          );
        }

        return {
          id: precioActualizado.id,
          title: precioActualizado.title,
          description: precioActualizado.description,
          includes: paqueteEstatico.includes, // Usar los includes del estático
          originalPrice: precioActualizado.originalPrice || 0,
          price: precioActualizado.price,
          savePercent: savePercent
        };
      }

      // Si no se encuentra el paquete estático, usar solo los datos de la API
      return {
        id: precioActualizado.id,
        title: precioActualizado.title,
        description: precioActualizado.description,
        includes: precioActualizado.features || [],
        originalPrice: precioActualizado.originalPrice || 0,
        price: precioActualizado.price,
        savePercent: 0
      };
    });
  }, [paquetesPrecios, cargandoPrecios]);

  // Combinar los datos estáticos de addons con los precios dinámicos
  const addonsActualizados = useMemo(() => {
    if (cargandoPrecios || addonsPrecios.length === 0) {
      return selectableAddOns; // Devolver datos estáticos si aún no se han cargado los precios
    }

    return selectableAddOns.map(addon => {
      const precioActualizado = addonsPrecios.find(a => a.id === addon.id);
      if (precioActualizado) {
        return {
          ...addon,
          price: precioActualizado.price
        };
      }
      return addon;
    });
  }, [addonsPrecios, cargandoPrecios]);

  // Inicializar Mercado Pago para Checkout Pro
  useEffect(() => {
    const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey);
    }
  }, []);

  const handleInfoClick = (serviceId: string) => {
    setSelectedService(serviceId);
    setShowInfoModal(true);
  };

  const closeInfoModal = () => {
    setShowInfoModal(false);
    setSelectedService(null);
  };

  const getWhatsAppMessage = (serviceId: string) => {
    const service = serviciosActualizados.find(s => s.id === serviceId);
    return `Hola, estoy interesado en el servicio: *${service?.title}* por $${service?.price}`;
  };

  const startHiringProcess = (serviceId: string) => {
    // Primero verificamos si es un paquete especial
    const specialPackage = paquetesActualizados.find(pkg => pkg.id === serviceId);

    if (specialPackage) {
      // Si es un paquete especial, calculamos el precio con promoción
      const precioFinal = calcularPrecioConPromocion(serviceId, specialPackage.price);
      proceedWithCheckout(serviceId, precioFinal, []);
      return;
    }

    // Si no es un paquete especial, continuamos con la lógica existente
    // Si es el plan empresarial, redirigir a contacto
    const service = serviciosActualizados.find(s => s.id === serviceId);
    if (service?.contactForPrice) {
      navigate('/contact?service=' + serviceId);
      return;
    }

    // En lugar de redirigir, mostrar el popup de add-ons
    if (service) {
      // Calcular el precio con promoción aplicada
      const precioFinal = calcularPrecioConPromocion(serviceId, service.price);

      setBaseService(serviceId);
      setBasePrice(precioFinal);
      setSelectedAddOns([]); // Reiniciar add-ons seleccionados
      setShowAddOnPopup(true);
    }
  };

  // Actualizar la función proceedWithCheckout para usar la API de promociones
  const proceedWithCheckout = async (serviceId: string, price: number, addOns: string[] = []) => {
    setIsLoading(true);

    try {
      // Verificar si existe promoción disponible para este servicio
      const promocion = promocionesDisponibles[serviceId];
      let precioFinal = price;
      let aplicoPromocion = false;
      let reservaPromocionId = null;

      // Verificar si hay promoción disponible y aplicarla
      if (promocion && promocion.activa && promocion.cantidadUsada < promocion.cantidadLimite) {
        aplicoPromocion = true;

        // Aplicar descuento según tipo de promoción
        if (promocion.tipo === 'GRATIS') {
          precioFinal = 0;
        } else if (promocion.tipo === 'DESCUENTO' && promocion.valorDescuento) {
          const descuento = price * (promocion.valorDescuento / 100);
          precioFinal = price - descuento;
        }

        try {
          // Reservar la promoción a través de la API
          const reserva = await promocionesAPI.reservarPromocion(promocion.id);
          reservaPromocionId = reserva.id;
          setReservaPromocion(reserva);
        } catch (error) {
          console.error('Error al reservar promoción:', error);
          // Si falla la reserva, continuar con precio normal
          precioFinal = price;
          aplicoPromocion = false;
        }
      }

      // Verificar si el usuario está autenticado
      const isAuthenticated = localStorage.getItem('user_token') || false;

      if (!isAuthenticated) {
        // Si no está autenticado, guardamos la selección en localStorage y redirigimos a login
        localStorage.setItem('pending_purchase', JSON.stringify({
          serviceId: serviceId,
          addOns: addOns,
          promocionId: promocion?.id,
          reservaPromocionId
        }));

        setIsLoading(false);
        navigate(`/login?redirect=/payment`);
        return;
      }

      // Si está autenticado, procedemos con la creación de la preferencia de pago
      // Verificar si es un paquete especial
      const specialPackage = paquetesActualizados.find(pkg => pkg.id === serviceId);
      const service = specialPackage || serviciosActualizados.find(s => s.id === serviceId);

      if (!service) {
        setIsLoading(false);
        return;
      }

      // Preparar los items para Mercado Pago
      const items = [
        {
          id: service.id,
          title: specialPackage ? specialPackage.title : service.title,
          description: specialPackage ? specialPackage.description : service.description,
          quantity: 1,
          unit_price: precioFinal // Usar el precio con promoción aplicada si corresponde
        }
      ];

      // Agregar add-ons seleccionados
      addOns.forEach(addOnId => {
        const addon = addonsActualizados.find(a => a.id === addOnId);
        if (addon) {
          items.push({
            id: addon.id,
            title: addon.name,
            description: addon.description,
            quantity: 1,
            unit_price: addon.price
          });
        }
      });

      // En una implementación real, enviar todos los datos al backend
      /*
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify({
          items: items,
          serviceId: service.id,
          serviceTitle: specialPackage ? specialPackage.title : service.title,
          servicePrice: precioFinal,
          addOns: addOns,
          isSpecialPackage: !!specialPackage,
          promocionId: promocion?.id,
          reservaPromocionId,
          precioOriginal: price,
          userName: 'Usuario'
        })
      });
      
      const data = await response.json();
      
      if (data.init_point) {
        // Redireccionar al punto de inicio de MercadoPago
        window.open(data.init_point, '_blank');
      }
      */

      // Para demostración, simular que todo fue exitoso
      console.log('Simulando checkout exitoso:', {
        serviceId: service.id,
        serviceTitle: specialPackage ? specialPackage.title : service.title,
        precioOriginal: price,
        precioFinal,
        addOns,
        aplicoPromocion,
        promocionId: promocion?.id,
        reservaPromocionId
      });

      // Si fue gratis, mostrar mensaje y confirmar uso de la promoción
      if (precioFinal === 0) {
        // Confirmar uso de la promoción
        if (reservaPromocionId) {
          await promocionesAPI.confirmarPromocion(reservaPromocionId);
        }

        alert(`¡Felicidades! Has obtenido el plan ${service.title} gratuitamente gracias a una promoción limitada.`);

        // Actualizar el estado de las promociones
        if (promocion) {
          // Actualizar localmente la promoción
          setPromocionesDisponibles(prev => {
            const promocionActualizada = {
              ...promocion,
              cantidadUsada: promocion.cantidadUsada + 1,
              activa: promocion.cantidadUsada + 1 < promocion.cantidadLimite
            };

            return {
              ...prev,
              [serviceId]: promocionActualizada.activa ? promocionActualizada : null
            };
          });
        }
      } else {
        // Simulación para precios normales (en producción, se confirmaría en el webhook)
        alert(`Procesando compra: ${service.title} por $${precioFinal.toLocaleString('es-AR')}`);

        // En la implementación real, la confirmación de promoción ocurriría en el webhook
        // después de que el pago sea exitoso
      }

      setIsLoading(false);
      if (showAddOnPopup) closeAddOnPopup();
    } catch (error) {
      console.error('Error durante el checkout:', error);
      setIsLoading(false);

      // Si hubo un error, liberar la reserva de promoción
      setReservaPromocion(null);
    }
  };

  const proceedToCheckout = async () => {
    if (!baseService) return;

    // Reutilizar la función común
    await proceedWithCheckout(baseService, calculateTotalPrice(), selectedAddOns);
    closeAddOnPopup();
  };

  const closeAddOnPopup = () => {
    setShowAddOnPopup(false);
    setBaseService(null);
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotalPrice = () => {
    let total = basePrice;
    selectedAddOns.forEach(addOnId => {
      const addon = addonsActualizados.find(a => a.id === addOnId);
      if (addon) {
        total += addon.price;
      }
    });
    return total;
  };

  // Calcular el precio final considerando promociones
  const calcularPrecioConPromocion = (serviceId: string, precioOriginal: number) => {
    const promocion = promocionesDisponibles[serviceId];

    if (promocion && promocion.activa && promocion.cantidadUsada < promocion.cantidadLimite) {
      if (promocion.tipo === 'GRATIS') {
        return 0;
      } else if (promocion.tipo === 'DESCUENTO' && promocion.valorDescuento) {
        const descuento = precioOriginal * (promocion.valorDescuento / 100);
        return precioOriginal - descuento;
      }
    }

    return precioOriginal;
  };

  return (
    <ServicesSection id="services">
      <GlobalStyle />
      <SectionContent>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}
        >
          Servicios
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem', color: 'rgba(255,255,255,0.7)' }}
        >
          Soluciones completas de diseño UX/UI y desarrollo para tu presencia digital
        </motion.p>

        <ServicesGrid>
          {serviciosActualizados
            .sort((a, b) => a.price - b.price) // Ordenar por precio, del más barato al más caro
            .map((service, index) => {
              // Calcular precio con promoción para cada servicio
              const precioConPromocion = calcularPrecioConPromocion(service.id, service.price);
              const tienePromocion = precioConPromocion !== service.price;

              return (
                <ServiceCard
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  highlight={service.highlight}
                >
                  {service.popularBadge && (
                    <PopularBadge>{service.popularText || 'MÁS POPULAR'}</PopularBadge>
                  )}
                  <ServiceTitle>{service.title}</ServiceTitle>
                  <ServiceDescription>{service.description}</ServiceDescription>
                  <ServiceFeatures>
                    {service.features.map((feature, i) => (
                      <FeatureItem key={i}>{feature}</FeatureItem>
                    ))}
                  </ServiceFeatures>
                  <ServicePrice>
                    {tienePromocion ? (
                      <OriginalPrice>${service.price.toLocaleString('es-AR')}</OriginalPrice>
                    ) : (
                      service.originalPrice && service.originalPrice > service.price && (
                        <OriginalPrice>${service.originalPrice.toLocaleString('es-AR')}</OriginalPrice>
                      )
                    )}

                    <Price>
                      {service.customPrice ? service.customPriceText : '$'}
                      {service.contactForPrice ? 'Consultar' :
                        precioConPromocion === 0 ? 'GRATIS' :
                          precioConPromocion.toLocaleString('es-AR')}
                    </Price>

                    {/* Mostrar promoción si está disponible */}
                    {promocionesDisponibles[service.id]?.tipo === 'GRATIS' &&
                      promocionesDisponibles[service.id]?.activa && (
                        <PromoLabel>
                          ¡GRATIS! Quedan {promocionesDisponibles[service.id]!.cantidadLimite -
                            promocionesDisponibles[service.id]!.cantidadUsada} de {
                            promocionesDisponibles[service.id]!.cantidadLimite}
                        </PromoLabel>
                      )}
                    {promocionesDisponibles[service.id]?.tipo === 'DESCUENTO' &&
                      promocionesDisponibles[service.id]?.activa && (
                        <PromoLabel>
                          ¡{promocionesDisponibles[service.id]!.valorDescuento}% OFF!
                          Quedan {promocionesDisponibles[service.id]!.cantidadLimite -
                            promocionesDisponibles[service.id]!.cantidadUsada} descuentos
                        </PromoLabel>
                      )}
                  </ServicePrice>
                  <ButtonsContainer>
                    <Button
                      primary={false}
                      outline={true}
                      small
                      onClick={() => handleInfoClick(service.id)}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      }
                    >
                      Más Info
                    </Button>

                    <Button
                      primary
                      small
                      onClick={() => startHiringProcess(service.id)}
                      disabled={isLoading || cargandoPromociones || cargandoPrecios}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3.8 6h16.4M16 10a4 4 0 1 1-8 0" />
                        </svg>
                      }
                    >
                      {cargandoPrecios || cargandoPromociones ? 'Cargando...' :
                        isLoading ? 'Procesando...' :
                          promocionesDisponibles[service.id]?.tipo === 'GRATIS' &&
                            promocionesDisponibles[service.id]?.activa ? 'Obtener Gratis' : 'Contratar'}
                    </Button>
                  </ButtonsContainer>
                </ServiceCard>
              );
            })}
        </ServicesGrid>

        {/* Sección de Paquetes Especiales */}
        <SectionDivider>
          <DividerText>OFERTAS ESPECIALES</DividerText>
        </SectionDivider>

        <PackagesContainer>
          {paquetesActualizados
            .sort((a, b) => a.price - b.price) // Ordenar por precio, del más barato al más caro
            .map((pkg, index) => {
              // Calcular precio con promoción para cada paquete especial
              const precioConPromocion = calcularPrecioConPromocion(pkg.id, pkg.price);
              const tienePromocion = precioConPromocion !== pkg.price;

              return (
                <PackageCard
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <PackageTitle>{pkg.title}</PackageTitle>
                  <PackageContent>
                    <p>{pkg.description}</p>
                    <ul>
                      {pkg.includes.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </PackageContent>
                  <PackagePricing>
                    <PackagePriceContainer>
                      {tienePromocion ? (
                        <OriginalPrice>${pkg.price.toLocaleString('es-AR')}</OriginalPrice>
                      ) : (
                        pkg.originalPrice && (
                          <OriginalPrice>${pkg.originalPrice.toLocaleString('es-AR')}</OriginalPrice>
                        )
                      )}
                      <Price>
                        {precioConPromocion === 0 ? 'GRATIS' : `$${precioConPromocion.toLocaleString('es-AR')}`}
                      </Price>
                    </PackagePriceContainer>
                    {!tienePromocion && pkg.originalPrice && (
                      <PackageSavings>
                        AHORRA {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                      </PackageSavings>
                    )}
                    {promocionesDisponibles[pkg.id]?.tipo === 'DESCUENTO' &&
                      promocionesDisponibles[pkg.id]?.activa && (
                        <PackageSavings>
                          {promocionesDisponibles[pkg.id]!.valorDescuento}% EXTRA
                        </PackageSavings>
                      )}
                  </PackagePricing>
                  <PackageButtonContainer>
                    <Button
                      primary
                      variant="special"
                      onClick={() => startHiringProcess(pkg.id)}
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        padding: '1rem'
                      }}
                    >
                      {precioConPromocion === 0 ? 'Obtener Gratis' : 'Aprovechar Oferta'}
                    </Button>
                  </PackageButtonContainer>
                </PackageCard>
              );
            })}
        </PackagesContainer>

        {/* Tabla Comparativa */}
        <SectionDivider>
          <DividerText>COMPARATIVA DETALLADA DE PLANES</DividerText>
        </SectionDivider>

        <ComparisonTable>
          <ComparisonHeader>Características</ComparisonHeader>
          <ComparisonHeader>Básico</ComparisonHeader>
          <ComparisonHeader>
            Estándar
          </ComparisonHeader>
          <ComparisonHeader>Premium</ComparisonHeader>
          <ComparisonHeader>Empresarial</ComparisonHeader>

          {comparisonFeatures.map((feature, index) => (
            <ComparisonRow key={index}>
              <ComparisonCell>{feature.name}</ComparisonCell>
              <ComparisonCell>
                {typeof feature.basic === 'boolean'
                  ? (feature.basic ? <CheckIcon>✓</CheckIcon> : <CrossIcon>✗</CrossIcon>)
                  : feature.basic}
              </ComparisonCell>
              <ComparisonCell>
                {typeof feature.standard === 'boolean'
                  ? (feature.standard ? <CheckIcon>✓</CheckIcon> : <CrossIcon>✗</CrossIcon>)
                  : feature.standard}
              </ComparisonCell>
              <ComparisonCell>
                {typeof feature.premium === 'boolean'
                  ? (feature.premium ? <CheckIcon>✓</CheckIcon> : <CrossIcon>✗</CrossIcon>)
                  : feature.premium}
              </ComparisonCell>
              <ComparisonCell>
                {typeof feature.enterprise === 'boolean'
                  ? (feature.enterprise ? <CheckIcon>✓</CheckIcon> : <CrossIcon>✗</CrossIcon>)
                  : feature.enterprise}
              </ComparisonCell>
            </ComparisonRow>
          ))}
        </ComparisonTable>

        {/* Sección de Add-ons */}
        <SectionDivider>
          <DividerText>PERSONALIZA TU PLAN</DividerText>
        </SectionDivider>

        <AddOnsContainer>
          {addonsActualizados.map((addon, index) => (
            <AddOnCard
              key={addon.id}
              as={motion.div}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
              viewport={{ once: true }}
            >
              <AddOnTitle>{addon.name}</AddOnTitle>
              <AddOnDescription>{addon.description}</AddOnDescription>
              <AddOnPrice>
                ${addon.price.toLocaleString('es-AR')}
                {addon.duration && <span>/{addon.duration}</span>}
                {addon.oneTime && <span>(único pago)</span>}
              </AddOnPrice>
            </AddOnCard>
          ))}
        </AddOnsContainer>

        {/* Modal de información */}
        <AnimatePresence>
          {showInfoModal && selectedService && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeInfoModal}
            >
              <ModalContent
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <CloseButton onClick={closeInfoModal}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </CloseButton>

                <ModalTitle>
                  {services.find(s => s.id === selectedService)?.title}
                </ModalTitle>

                <ModalDescription>
                  {services.find(s => s.id === selectedService)?.description}
                  <br /><br />
                  Este servicio incluye:
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {services.find(s => s.id === selectedService)?.features.map((feature, i) => (
                      <li key={i} style={{ marginBottom: '0.5rem' }}>{feature}</li>
                    ))}
                  </ul>
                </ModalDescription>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <ContactButton
                    href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage(selectedService))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Contactar por WhatsApp
                  </ContactButton>

                  <Button
                    primary
                    onClick={() => {
                      closeInfoModal();
                      startHiringProcess(selectedService);
                    }}
                  >
                    Contratar Ahora
                  </Button>
                </div>
              </ModalContent>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* Popup de Add-ons */}
        <AnimatePresence>
          {showAddOnPopup && baseService && (
            <PopupOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddOnPopup}
            >
              <PopupContent
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <CloseButton onClick={closeAddOnPopup}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </CloseButton>

                <PopupTitle>Personaliza tu Plan</PopupTitle>

                <div style={{
                  background: 'rgba(0, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.1)'
                }}>
                  {(() => {
                    // Verificamos si es un paquete especial
                    const specialPackage = paquetesActualizados.find(pkg => pkg.id === baseService);
                    const regularService = serviciosActualizados.find(s => s.id === baseService);
                    const promocion = promocionesDisponibles[baseService];

                    if (specialPackage) {
                      return (
                        <>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.2rem' }}>
                            {specialPackage.title} seleccionado
                          </h4>
                          <div style={{ margin: '0.5rem 0', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                            <p style={{ margin: '0 0 0.5rem 0' }}>{specialPackage.description}</p>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                              {specialPackage.includes.map((item, i) => (
                                <li key={i} style={{ marginBottom: '0.3rem' }}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <div>
                              <span style={{ textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.5)', marginRight: '0.5rem', fontSize: '0.9rem' }}>
                                ${specialPackage.originalPrice.toLocaleString('es-AR')}
                              </span>
                              <span style={{ color: '#00FFFF', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                ${specialPackage.price.toLocaleString('es-AR')}
                              </span>
                            </div>
                            <div style={{
                              background: 'rgba(0, 255, 0, 0.1)',
                              color: '#00ff00',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}>
                              AHORRA {specialPackage.savePercent}%
                            </div>
                          </div>
                        </>
                      );
                    } else if (regularService) {
                      return (
                        <>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>
                            {regularService.title} seleccionado
                          </h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                              Precio base: ${basePrice.toLocaleString('es-AR')}
                            </p>

                            {/* Mostrar información de promoción si hay alguna disponible */}
                            {promocion && promocion.activa && promocion.cantidadUsada < promocion.cantidadLimite && (
                              <div style={{
                                background: promocion.tipo === 'GRATIS' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 0, 0.1)',
                                color: promocion.tipo === 'GRATIS' ? '#00ff00' : '#ffff00',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                              }}>
                                {promocion.tipo === 'GRATIS' ? '¡GRATIS!' : `¡${promocion.valorDescuento}% OFF!`}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    }

                    return null;
                  })()}
                </div>

                <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
                  Selecciona los complementos que deseas agregar:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
                  {addonsActualizados.map(addon => (
                    <PopupAddOnOption key={addon.id} onClick={() => toggleAddOn(addon.id)}>
                      <PopupAddOnCheckbox checked={selectedAddOns.includes(addon.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="#00FFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </PopupAddOnCheckbox>
                      <PopupAddOnInfo>
                        <PopupAddOnName>{addon.name}</PopupAddOnName>
                        <PopupAddOnDescription>{addon.description}</PopupAddOnDescription>
                      </PopupAddOnInfo>
                      <PopupAddOnPrice>
                        ${addon.price.toLocaleString('es-AR')}
                        {addon.duration && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>/{addon.duration}</span>}
                      </PopupAddOnPrice>
                    </PopupAddOnOption>
                  ))}
                </div>

                <SummarySection>
                  <SummaryRow>
                    <span>{selectedAddOns.length > 0 ? 'Total con Complementos:' : 'Precio Total:'}</span>
                    <span>
                      {(() => {
                        // Obtener precio final con todos los add-ons
                        let precioTotal = calculateTotalPrice();

                        // Obtener precio base con promoción aplicada
                        const precioBase = basePrice;
                        const tieneDescuento = precioBase === 0 || precioBase !== (
                          specialPackages.find(p => p.id === baseService)?.price ||
                          services.find(s => s.id === baseService)?.price || 0
                        );

                        // Determinar precio original sin promoción
                        const precioOriginal = specialPackages.find(p => p.id === baseService)?.price ||
                          services.find(s => s.id === baseService)?.price || 0;

                        // Calcular precio de add-ons
                        const precioAddOns = selectedAddOns.reduce((sum, addOnId) => {
                          const addon = addonsActualizados.find(a => a.id === addOnId);
                          return sum + (addon?.price || 0);
                        }, 0);

                        // Si el servicio base es gratis, solo cobrar los add-ons
                        const precioFinal = precioBase === 0 ? precioAddOns : precioTotal;

                        if (tieneDescuento) {
                          return (
                            <>
                              <span style={{ textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.5)', marginRight: '0.5rem', fontSize: '0.9rem' }}>
                                ${(precioOriginal + precioAddOns).toLocaleString('es-AR')}
                              </span>
                              {precioFinal === 0 ?
                                <span style={{ color: '#00ff00' }}>GRATIS</span> :
                                `$${precioFinal.toLocaleString('es-AR')}`}
                            </>
                          );
                        }

                        // Sin descuento
                        return `$${precioFinal.toLocaleString('es-AR')}`;
                      })()}
                    </span>
                  </SummaryRow>
                </SummarySection>

                <div style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}>
                  <Button
                    primary
                    onClick={proceedToCheckout}
                    disabled={isLoading}
                    className="checkout-button"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '1rem'
                    }}
                  >
                    {isLoading ? 'Procesando...' : (() => {
                      const precioFinal = calculateTotalPrice();
                      const esGratis = basePrice === 0 && selectedAddOns.length === 0;

                      if (esGratis) {
                        return 'Obtener Gratis';
                      } else {
                        return `Continuar con el Pago ${selectedAddOns.length > 0 ? `(${selectedAddOns.length} complementos)` : ''}`;
                      }
                    })()}
                  </Button>
                </div>
              </PopupContent>
            </PopupOverlay>
          )}
        </AnimatePresence>
      </SectionContent>
    </ServicesSection>
  );
};

export default Services; 
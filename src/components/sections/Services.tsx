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
import axios from 'axios';
import { getApiUrl } from '../../config/apiConfig';

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
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
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
  
  @media (max-width: 768px) {
    padding: 0.8rem;
    align-items: flex-start;
    gap: 0.8rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.6rem;
    gap: 0.6rem;
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
  flex-shrink: 0;
  margin-top: 0.2rem;
  
  svg {
    opacity: ${props => props.checked ? 1 : 0};
    transform: ${props => props.checked ? 'scale(1)' : 'scale(0.5)'};
    transition: all 0.2s ease;
  }
  
  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
    margin-top: 0;
  }
`;

const PopupAddOnInfo = styled.div`
  flex: 1;
  padding: 0 1rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    padding: 0 0.8rem;
  }
  
  @media (max-width: 480px) {
    padding: 0 0.6rem;
  }
`;

const PopupAddOnName = styled.div`
  font-weight: 500;
  color: white;
  margin-bottom: 0.3rem;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 0.4rem;
  }
`;

const PopupAddOnDescription = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    line-height: 1.5;
  }
`;

const PopupAddOnPrice = styled.div`
  font-weight: 600;
  color: #FF00FF;
  min-width: 80px;
  text-align: right;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    min-width: 70px;
    font-size: 0.9rem;
  }
  
  @media (max-width: 480px) {
    min-width: 60px;
    font-size: 0.85rem;
  }
`;

const SummarySection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    margin-top: 1.5rem;
    padding-top: 1.2rem;
  }
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: #00FFFF;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const PopupAddOnsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.6rem;
    grid-template-columns: 1fr;
  }
  
  @media (max-width: 360px) {
    gap: 0.5rem;
  }
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
    id: 'basic',  // Cambiado de 'landing-page' a 'basic'
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
    id: 'standard',  // Cambiado de 'basic-website' a 'standard'
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
    id: 'premium',  // Cambiado de 'premium-website' a 'premium'
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
    customPriceText: 'Desde ',
    contactForPrice: false,
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

  // Agregar un nuevo estado para el modal de chat empresarial
  const [showEnterpriseChatModal, setShowEnterpriseChatModal] = useState(false);
  const [enterpriseChatMessages, setEnterpriseChatMessages] = useState<Array<{ role: string, content: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Actualizar el estado para el formulario empresarial
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [formCompleted, setFormCompleted] = useState(false);

  // Agregar esta declaración de estado que falta
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string, content: string }>>([]);

  // Estados para el sistema de stock
  const [stockStatus, setStockStatus] = useState<Record<string, any>>({});
  const [stockLoading, setStockLoading] = useState(false);

  // Guión de preguntas para la IA
  const enterpriseQuestions = [
    "¿Cómo se llama tu empresa?",
    "¿En qué mercado o industria se desarrolla tu empresa?",
    "¿Cuáles son tus principales necesidades o exigencias para este proyecto?",
    "¿Cuál es el tamaño aproximado de tu empresa? (cantidad de empleados, sucursales, etc.)",
    "¿Qué objetivos específicos tienes con este proyecto digital?",
    "¿Hay algún plazo específico en el que necesitas tener el proyecto implementado?",
    "¿Hay alguna información adicional que consideres relevante para entender mejor tus necesidades?"
  ];

  // Función para abrir el chat empresarial
  const openEnterpriseChat = () => {
    // Iniciar con el primer mensaje
    setEnterpriseChatMessages([
      { role: "assistant", content: enterpriseQuestions[0] }
    ]);
    setCurrentQuestion(0);
    setShowEnterpriseChatModal(true);
  };

  // Función para enviar mensaje en el chat empresarial
  const sendEnterpriseMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage = userInput.trim();
    setUserInput("");
    setIsProcessing(true);

    // Agregar mensaje del usuario
    setEnterpriseChatMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Simulamos la respuesta de la IA con setTimeout tipado correctamente
    setTimeout(() => {
      const nextQuestionIndex = currentQuestion + 1;

      // Verificar si hay más preguntas en el guión
      if (nextQuestionIndex < enterpriseQuestions.length) {
        setCurrentQuestion(nextQuestionIndex);
        setEnterpriseChatMessages(prev => [...prev, {
          role: "assistant",
          content: enterpriseQuestions[nextQuestionIndex]
        }]);
      } else {
        // Finalizar el chat y enviar la información
        setEnterpriseChatMessages(prev => [...prev, {
          role: "assistant",
          content: "¡Gracias por toda la información! Uno de nuestros asesores revisará tus necesidades y se pondrá en contacto contigo a la brevedad. ¿Hay algo más que quieras agregar antes de finalizar?"
        }]);

        // Aquí podríamos enviar la conversación al backend
        console.log("Enviando datos de la conversación empresarial:", enterpriseChatMessages);
      }

      setIsProcessing(false);
    }, 1000);
  };

  // Función para cerrar el chat empresarial
  const closeEnterpriseChat = () => {
    setShowEnterpriseChatModal(false);
    setEnterpriseChatMessages([]);
    setCurrentQuestion(0);
  };

  // Ejemplo de función para enviar datos de la conversación al backend (no implementada)
  const sendEnterpriseData = async (messages: Array<{ role: string, content: string }>) => {
    try {
      // Esta es una función de ejemplo que deberías implementar con tu lógica real
      // para enviar los datos a tu backend y procesarlos para WhatsApp/Gmail
      /*
      const response = await fetch('/api/enterprise/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          timestamp: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      console.log('Datos enviados correctamente:', data);
      */

      console.log('Función de envío simulada, implementa tu lógica real aquí');
    } catch (error) {
      console.error('Error al enviar datos de la conversación:', error);
    }
  };

  // Función para verificar stock de servicios
  const verificarStock = async () => {
    try {
      setStockLoading(true);

      // Mapear serviceIds a planTypes
      const servicePlanMap: Record<string, string> = {
        'landing-basico': 'basico',
        'landing-estandar': 'estandar',
        'landing-premium': 'premium',
        'landing-empresarial': 'empresarial',
        'ecommerce-basico': 'basico',
        'ecommerce-estandar': 'estandar',
        'ecommerce-premium': 'premium',
        'ecommerce-empresarial': 'empresarial',
        'blog-basico': 'basico',
        'blog-estandar': 'estandar',
        'blog-premium': 'premium',
        'blog-empresarial': 'empresarial',
        'portfolio-basico': 'basico',
        'portfolio-estandar': 'estandar',
        'portfolio-premium': 'premium',
        'portfolio-empresarial': 'empresarial'
      };

      const stockPromises = Object.entries(servicePlanMap).map(async ([serviceId, planType]) => {
        try {
          const response = await axios.get(`${getApiUrl('')}/stock/availability/${planType}`);
          return { serviceId, ...(response.data as Record<string, any>) };
        } catch (error) {
          console.error(`Error al verificar stock para ${serviceId}:`, error);
          return { serviceId, available: true, warning: null }; // Fallback: asumir disponible
        }
      });

      const stockResults = await Promise.all(stockPromises);

      const stockMap = stockResults.reduce((acc: Record<string, any>, result: any) => {
        acc[result.serviceId] = result;
        return acc;
      }, {} as Record<string, any>);

      setStockStatus(stockMap);

    } catch (error) {
      console.error('Error al verificar stock general:', error);
    } finally {
      setStockLoading(false);
    }
  };

  // Cargar precios desde la API
  useEffect(() => {
    let isMounted = true;
    const CACHE_KEY = 'cachedPrecios';
    const CACHE_TIME_KEY = 'lastPricesUpdate';
    const CACHE_DURATION = 30 * 1000; // 30 segundos en lugar de 5 minutos

    const cargarPrecios = async () => {
      let lastUpdated = Date.now().toString(); // Valor predeterminado

      try {
        // Primero, verificar el timestamp de última actualización desde el servidor
        try {
          const timestampResponse = await fetch(getApiUrl('/servicios/last-updated'));
          if (timestampResponse.ok) { // Verificar que la respuesta sea exitosa
            const data = await timestampResponse.json();
            if (data && data.lastUpdated) {
              lastUpdated = data.lastUpdated;
              console.log('✅ Timestamp de última actualización obtenido:', lastUpdated);
            }
          } else {
            console.error('Error al obtener timestamp, código:', timestampResponse.status);
          }
        } catch (timestampError) {
          console.error('Error al obtener timestamp de actualización:', timestampError);
          // Continuamos con el proceso aunque falle el timestamp
        }

        // Verificar si ya tenemos datos en caché y si son recientes
        const cachedData = localStorage.getItem(CACHE_KEY);
        const lastUpdate = localStorage.getItem(CACHE_TIME_KEY);
        const cachedTimestamp = localStorage.getItem('cachedPricesTimestamp');
        const now = Date.now();

        // Si tenemos datos en caché, son recientes Y el timestamp del servidor coincide, usarlos
        if (cachedData && lastUpdate && cachedTimestamp &&
          (now - parseInt(lastUpdate)) < CACHE_DURATION &&
          cachedTimestamp === lastUpdated) {
          if (isMounted) {
            console.log('✅ Usando precios en caché con timestamp:', cachedTimestamp);
            const { planes, paquetes, addons } = JSON.parse(cachedData);
            setPlanesPrecios(planes);
            setPaquetesPrecios(paquetes);
            setAddonsPrecios(addons);
            setCargandoPrecios(false);
          }
          return;
        }

        if (isMounted) {
          setCargandoPrecios(true);
        }

        // Cargar planes (servicios básicos)
        const planes = await preciosAPI.obtenerServicios();
        const planesFiltrados = planes.filter(p => !p.isPaquete);

        // Cargar paquetes (servicios especiales)
        const paquetes = planes.filter(p => p.isPaquete);

        // Cargar addons
        const addons = await preciosAPI.obtenerAddons();

        if (isMounted) {
          setPlanesPrecios(planesFiltrados);
          setPaquetesPrecios(paquetes);
          setAddonsPrecios(addons);
          setCargandoPrecios(false);

          // Guardar en caché
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            planes: planesFiltrados,
            paquetes,
            addons
          }));
          localStorage.setItem(CACHE_TIME_KEY, now.toString());
          localStorage.setItem('cachedPricesTimestamp', lastUpdated);
          console.log('✅ Precios actualizados guardados en caché con timestamp:', lastUpdated);
        }
      } catch (error) {
        console.error('Error al cargar precios:', error);
        // Intentar cargar nuevamente sin considerar el caché
        try {
          if (isMounted) {
            setCargandoPrecios(true);

            // Cargar directamente sin verificar caché
            const planes = await preciosAPI.obtenerServicios();
            const planesFiltrados = planes.filter(p => !p.isPaquete);
            const paquetes = planes.filter(p => p.isPaquete);
            const addons = await preciosAPI.obtenerAddons();

            if (isMounted) {
              setPlanesPrecios(planesFiltrados);
              setPaquetesPrecios(paquetes);
              setAddonsPrecios(addons);
              setCargandoPrecios(false);
            }
          }
        } catch (retryError) {
          console.error('Error en segundo intento de carga:', retryError);
          if (isMounted) {
            setCargandoPrecios(false);
          }
        }
      }
    };

    // Cargar precios solo una vez al montar el componente
    cargarPrecios();

    // Recargar los precios solo cuando el usuario vuelve a la pestaña después de 5 minutos
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastUpdate = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (!lastUpdate || (now - parseInt(lastUpdate)) > CACHE_DURATION) {
          cargarPrecios();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar el listener cuando se desmonte el componente
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    // Inicializar MercadoPago al cargar el componente
    try {
      const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
      console.log('Clave pública de MercadoPago:', mpPublicKey);

      if (mpPublicKey) {
        // Primero intentar usar window.MercadoPago si está disponible
        if (typeof window.MercadoPago === 'function') {
          console.log('✅ MercadoPago SDK ya estaba disponible en window');
          // Ya está inicializado, no hacer nada
        } else {
          console.log('🔄 Inicializando MercadoPago mediante SDK React');
          initMercadoPago(mpPublicKey);
        }
      } else {
        console.error('Error: No se encontró la clave pública de MercadoPago');
      }
    } catch (error) {
      console.error('Error al inicializar MercadoPago:', error);
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

  // Función para asignar el servicio gratuito al usuario tras confirmar la promoción
  const asignarServicioGratuito = async (serviceId: string) => {
    try {
      // Aquí deberías llamar a tu endpoint real de backend para asignar el servicio
      // Por ahora, simulamos con un delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // TODO: Reemplazar por llamada real, por ejemplo:
      // await fetch(`/api/user-services/assign-free`, { method: 'POST', body: JSON.stringify({ serviceId }) })

      // Marcar que el servicio fue asignado gratuitamente
      localStorage.setItem('free_service_assigned', 'true');
      localStorage.setItem('assigned_service_id', serviceId);

      // Mostrar mensaje de éxito y redirigir al dashboard
      alert('¡Servicio gratuito asignado correctamente!');
      navigate('/dashboard');
    } catch (error) {
      alert('Error al asignar el servicio gratuito. Intenta nuevamente.');
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
      const isAuthenticated = !!localStorage.getItem('auth_token');

      if (!isAuthenticated) {
        // Si no está autenticado, guardamos la selección en localStorage y redirigimos a login
        localStorage.setItem('pending_purchase', JSON.stringify({
          serviceId: serviceId,
          addOns: addOns,
          promocionId: promocion?.id,
          reservaPromocionId
        }));

        setIsLoading(false);
        // Incluir el serviceId y los addons en la URL de redirección
        let redirectUrl = `/payment?service=${serviceId}`;
        if (addOns && addOns.length > 0) {
          redirectUrl += `&addons=${addOns.join(',')}`;
        }
        navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
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
        // Asignar el servicio gratuito al usuario
        await asignarServicioGratuito(serviceId);

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
        // Para servicios de pago, redirigir a la página de pago con los add-ons incluidos
        console.log('🔄 Redirigiendo a página de pago para servicio:', serviceId, 'Precio:', precioFinal);

        // Guardar información del servicio en localStorage para la página de pago
        localStorage.setItem('last_payment_service', serviceId);
        localStorage.setItem('last_payment_amount', precioFinal.toString());
        localStorage.setItem('last_payment_service_title', service.title);

        let redirectUrl = `/payment?service=${serviceId}`;
        if (addOns && addOns.length > 0) {
          redirectUrl += `&addons=${addOns.join(',')}`;
        }

        console.log('🔗 URL de redirección:', redirectUrl);
        navigate(redirectUrl);
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

  // Al montar el componente, si el usuario acaba de autenticarse y hay una intención pendiente, completarla
  useEffect(() => {
    const pending = localStorage.getItem('pending_purchase');
    if (pending) {
      try {
        const { serviceId, reservaPromocionId } = JSON.parse(pending);
        // Verificar si el usuario ya está autenticado
        const isAuthenticated = !!localStorage.getItem('auth_token');
        if (isAuthenticated && serviceId) {
          // Limpiar la intención pendiente
          localStorage.removeItem('pending_purchase');
          // Confirmar la promoción si hay reserva
          (async () => {
            if (reservaPromocionId) {
              await promocionesAPI.confirmarPromocion(reservaPromocionId);
            }
            await asignarServicioGratuito(serviceId);
          })();
        }
      } catch (e) {
        // Si hay error, limpiar la intención pendiente
        localStorage.removeItem('pending_purchase');
      }
    }
  }, []);

  // Función para abrir el formulario empresarial
  const openEnterpriseForm = () => {
    setCurrentQuestion(0);
    setUserResponses({});
    setUserInput("");
    setIsProcessing(false);
    setConversationHistory([]);
    setFormCompleted(false);
    setShowEnterpriseForm(true);
  };

  // Interfaz para los datos del formulario empresarial
  interface EnterpriseFormData {
    responses: Record<string, string>;
    summary: string;
    conversation: Array<{ role: string; content: string }>;
  }

  // Función para enviar datos al backend
  const sendEnterpriseDataToBackend = async (data: EnterpriseFormData) => {
    try {
      const response = await fetch('/api/enterprise/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }

      const result = await response.json();
      console.log('Datos enviados correctamente al backend:', result);
      return result;
    } catch (error) {
      console.error('Error al enviar datos al backend:', error);
      throw error; // Re-lanzar el error para manejarlo en el nivel superior
    }
  };

  // Función para enviar respuesta en el formulario empresarial
  const submitEnterpriseResponse = async () => {
    if (!userInput.trim() || isProcessing) return;

    const response = userInput.trim();
    setUserInput("");
    setIsProcessing(true);

    try {
      // Guardar la respuesta actual
      setUserResponses(prev => ({
        ...prev,
        [currentQuestion]: response
      }));

      // Actualizar historial de conversación para GPT
      const updatedHistory = [
        ...conversationHistory,
        { role: "user", content: `${enterpriseQuestions[currentQuestion]}\nRespuesta: ${response}` }
      ];
      setConversationHistory(updatedHistory);

      // Determinar si es la última pregunta
      const isLastQuestion = currentQuestion === enterpriseQuestions.length - 1;

      // Si es la última pregunta, procesamos con GPT para generar un resumen
      if (isLastQuestion) {
        try {
          // Preparar los datos para la llamada a GPT
          const messages = [
            { role: "system", content: "Eres un asistente especializado en analizar necesidades empresariales para proyectos digitales. Tu tarea es generar un resumen ejecutivo de las necesidades del cliente basado en sus respuestas a un cuestionario." },
            ...updatedHistory,
            { role: "user", content: "Genera un resumen ejecutivo con formato de puntos clave sobre las necesidades de este cliente y el tipo de proyecto que necesita. Sé conciso y profesional." }
          ];

          // Llamada a la API de GPT
          const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
          const apiEndpoint = import.meta.env.VITE_OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';

          if (!apiKey) {
            throw new Error('API key de OpenAI no configurada');
          }

          interface OpenAIResponse {
            choices: Array<{
              message: {
                content: string;
              };
            }>;
          }

          const apiResponse = await axios.post<OpenAIResponse>(apiEndpoint, {
            model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          });

          // Obtener el resumen generado
          const summary = apiResponse.data.choices?.[0]?.message?.content || "No se pudo generar un resumen.";

          // Mostrar mensaje de éxito inmediatamente
          setEnterpriseChatMessages(prev => [...prev, {
            role: "assistant",
            content: "¡Gracias por toda la información! Hemos recibido tu consulta y un asesor se pondrá en contacto contigo a la brevedad."
          }]);

          // Marcar formulario como completado inmediatamente
          setFormCompleted(true);

          // Enviar datos al backend en segundo plano
          sendEnterpriseDataToBackend({
            responses: userResponses,
            summary: summary,
            conversation: updatedHistory
          }).catch(error => {
            console.error('Error al enviar datos al backend:', error);
            // No mostramos el error al usuario ya que ya le dimos el mensaje de éxito
          });

        } catch (error) {
          console.error('Error al procesar con GPT o enviar datos:', error);

          // Mensaje de error específico según el tipo de error
          let errorMessage = "Lo siento, hubo un error al procesar tu información. ";
          if (error instanceof Error) {
            if (error.message.includes('401')) {
              errorMessage += "Error de autenticación con el servicio de IA. ";
            } else if (error.message.includes('429')) {
              errorMessage += "El servicio está temporalmente sobrecargado. ";
            }
          }
          errorMessage += "Por favor, intenta nuevamente o contacta a soporte.";

          // Mostrar mensaje de error al usuario
          setEnterpriseChatMessages(prev => [...prev, {
            role: "assistant",
            content: errorMessage
          }]);

          // Incluso con error, avanzamos al estado de formulario completado
          setFormCompleted(true);
        }
      } else {
        // Si no es la última pregunta, avanzamos a la siguiente
        setCurrentQuestion(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error general en el formulario:', error);
      setEnterpriseChatMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, ocurrió un error inesperado. Por favor, intenta nuevamente o contacta a soporte."
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para cerrar el formulario empresarial
  const closeEnterpriseForm = () => {
    setShowEnterpriseForm(false);
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
                      onClick={() => service.id === 'enterprise' ? openEnterpriseForm() : startHiringProcess(service.id)}
                      disabled={isLoading || cargandoPromociones || cargandoPrecios}
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3.8 6h16.4M16 10a4 4 0 1 1-8 0" />
                        </svg>
                      }
                    >
                      {service.id === 'enterprise' ? 'Contactar' :
                        cargandoPrecios || cargandoPromociones ? 'Cargando...' :
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

                <PopupAddOnsGrid>
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
                </PopupAddOnsGrid>

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

      {/* Modal de Chat Empresarial */}
      <AnimatePresence>
        {showEnterpriseChatModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '550px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              <CloseButton onClick={closeEnterpriseChat}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>

              <ModalTitle style={{ textAlign: 'center', marginBottom: '1rem' }}>
                Consulta Plan Empresarial
              </ModalTitle>

              {/* Contenedor de mensajes */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px'
              }}>
                {enterpriseChatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '0.8rem 1rem',
                    borderRadius: msg.role === 'user' ? '15px 15px 5px 15px' : '15px 15px 15px 5px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)'
                      : 'rgba(20, 20, 20, 0.8)',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
                    color: msg.role === 'user' ? 'white' : 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    {msg.content}
                  </div>
                ))}
                {isProcessing && (
                  <div style={{
                    alignSelf: 'flex-start',
                    padding: '0.5rem 1rem',
                    background: 'rgba(20, 20, 20, 0.8)',
                    borderRadius: '15px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFFF', animation: 'pulse 1s infinite' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF00FF', animation: 'pulse 1s infinite 0.3s' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FFFF', animation: 'pulse 1s infinite 0.6s' }}></span>
                      <span>Escribiendo</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulario de entrada */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendEnterpriseMessage()}
                  placeholder="Escribe tu respuesta..."
                  style={{
                    flex: 1,
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.95rem'
                  }}
                  disabled={isProcessing}
                />
                <button
                  onClick={sendEnterpriseMessage}
                  disabled={isProcessing || !userInput.trim()}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '8px',
                    background: isProcessing || !userInput.trim()
                      ? 'rgba(0, 255, 255, 0.2)'
                      : 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
                    border: 'none',
                    color: 'white',
                    cursor: isProcessing || !userInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Modal de Formulario Empresarial */}
      <AnimatePresence>
        {showEnterpriseForm && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '800px',
                width: '90%',
                maxHeight: '90vh',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                padding: '2.5rem'
              }}
            >
              <CloseButton onClick={closeEnterpriseForm}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>

              <ModalTitle style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Plan Empresarial Personalizado
              </ModalTitle>

              {formCompleted ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  gap: '2rem'
                }}>
                  <div style={{
                    background: 'rgba(0, 255, 255, 0.1)',
                    borderRadius: '50%',
                    width: '100px',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.8rem', color: '#00FFFF', marginBottom: '1rem' }}>
                    ¡Gracias por tu interés!
                  </h3>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '500px' }}>
                    Hemos recibido tus respuestas y un asesor especializado se pondrá en contacto contigo a la brevedad para discutir en detalle tu proyecto empresarial.
                  </p>
                  <Button
                    primary
                    onClick={closeEnterpriseForm}
                    style={{ marginTop: '1rem', minWidth: '180px' }}
                  >
                    Entendido
                  </Button>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'space-between'
                }}>
                  {/* Pregunta actual */}
                  <div>
                    <h3 style={{
                      fontSize: '1.5rem',
                      color: '#FFFFFF',
                      marginBottom: '1.5rem',
                      fontWeight: '600'
                    }}>
                      {currentQuestion + 1}. {enterpriseQuestions[currentQuestion]}
                    </h3>

                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={`Escribe tu respuesta aquí...`}
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Botones de navegación */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '2rem'
                  }}>
                    <Button
                      outline
                      onClick={() => {
                        if (currentQuestion > 0) {
                          setCurrentQuestion(prev => prev - 1);
                          setUserInput(userResponses[currentQuestion - 1] || "");
                        }
                      }}
                      disabled={currentQuestion === 0 || isProcessing}
                      style={{ minWidth: '120px' }}
                    >
                      Anterior
                    </Button>

                    <Button
                      primary
                      onClick={submitEnterpriseResponse}
                      disabled={isProcessing || !userInput.trim()}
                      style={{ minWidth: '120px' }}
                    >
                      {isProcessing ? 'Procesando...' : currentQuestion < enterpriseQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </Button>
                  </div>

                  {/* Indicador de progreso */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '2rem'
                  }}>
                    {enterpriseQuestions.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: idx === currentQuestion ?
                            'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' :
                            idx < currentQuestion ?
                              'rgba(0, 255, 255, 0.5)' :
                              'rgba(255, 255, 255, 0.2)',
                          margin: '0 4px',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </ServicesSection>
  );
};

export default Services; 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GlobalBackground from '../components/ui/GlobalBackground';
import { useAuth } from '../context/AuthContext';
import ProjectQuestionnaire from '../components/payment/ProjectQuestionnaire';
import { API_BASE_URL } from '../config/apiConfig';

// Estilos
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1.5rem;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    align-items: flex-start;
    padding-top: 2rem;
  }
`;

const Card = styled(motion.div)`
  background-color: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  max-height: 90vh;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    border-radius: 12px;
    max-height: 85vh;
    margin-bottom: 2rem;
  }
`;

const MercadoPagoLogo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  
  img {
    height: 30px;
    margin-right: 10px;
  }
`;

const Header = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SecurePaymentBadge = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  
  img {
    height: 16px;
    margin-right: 8px;
  }
  
  span {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const OrderSummary = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  @media (max-width: 768px) {
    margin: 1rem 1.5rem;
    padding: 1.2rem;
  }
  
  @media (max-width: 480px) {
    margin: 1rem;
    padding: 1rem;
  }
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  
  &:last-child {
    margin-bottom: 0;
    padding-top: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const OrderLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const OrderValue = styled.span`
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
`;

const OrderTotal = styled.span`
  color: #FF00FF;
  font-weight: 600;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.p`
  color: #ff4d4d;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  text-align: center;
`;

const PaymentContainer = styled.div`
  padding: 0 2rem 2rem 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 0 1rem 1rem 1rem;
  }
`;

const PaymentTitle = styled.h3`
  font-size: 1.2rem;
  color: white;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
    color: #009ee3;
  }
`;

const PaymentSubtitle = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
`;

const BrickContainer = styled.div`
  margin-bottom: 1rem;
  position: relative;
  border-radius: 8px;
  z-index: 100;
  width: 100%;
  background-color: transparent;
  padding: 1px; /* Prevenir colapso de márgenes */
  
  /* Estilos específicos para aislar el iframe */
  iframe {
    border: none !important;
    min-height: 20px !important;
    width: 100% !important;
    z-index: 100 !important;
  }
  
  /* Contenedor del Brick con aislamiento */
  [data-mercadopago] {
    width: 100% !important;
    overflow: visible !important;
    background-color: transparent !important;
    isolation: isolate; /* Aislar contexto de apilamiento */
  }

  /* Crear un contenedor con reset de estilos */
  .brick-reset-container {
    all: initial; /* Reset todos los estilos */
    display: block;
    width: 100%;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
`;

const PaymentFooter = styled.div`
  text-align: center;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  p {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 1rem;
  }
  
  .auth-notice {
    background: rgba(0, 158, 227, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      margin-right: 0.5rem;
      color: #009ee3;
    }
  }
  
  .security-badges {
    display: flex;
    justify-content: center;
    gap: 2rem;
    
    .badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 0.7;
      
      svg {
        height: 24px;
        margin-bottom: 0.5rem;
      }
      
      span {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
`;

// Componente de carga
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  
  .loader {
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #00FFFF;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
  }
`;

// Definir el componente Button
const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Componente principal
const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { serviceId: routeServiceId } = useParams<{ serviceId?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryServiceId = queryParams.get('service');
  const addOnsParam = queryParams.get('addons');
  const { user } = useAuth(); // Usar el hook de autenticación

  // Usar el serviceId de la ruta o del query param
  const serviceId = routeServiceId || queryServiceId;

  // Procesar los add-ons desde el parámetro de URL
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  
  // Estados para seguimiento de abandono de carrito
  const [cartSessionId] = useState(() => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [hasTrackedAbandon, setHasTrackedAbandon] = useState(false);

  // Estados para checkout como invitado
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestData, setGuestData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestDataValidation, setGuestDataValidation] = useState({
    email: true,
    firstName: true,
    lastName: true,
    phone: true
  });

  // Estados para gestionar el pago
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [preferenceId, setPreferenceId] = useState('');
  const [mpLoaded, setMpLoaded] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<{ title: string; price: number }>({ title: '', price: 0 });
  const [addOnsInfo, setAddOnsInfo] = useState<Array<{ id: string, name: string, price: number }>>([]);

  // Estado para el cuestionario de proyecto
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);

  // Estado para servicios del usuario - Usamos _ para indicar que estas variables son usadas aunque no sea visible
  const [_userServices, setUserServices] = useState<any[]>([]);
  const [_loadingServices, setLoadingServices] = useState(false);

  // Obtener información del usuario (modificado para soportar invitados)
  const userEmail = user?.email || (isGuestCheckout ? guestData.email : '');
  const userName = user?.name || (isGuestCheckout ? `${guestData.firstName} ${guestData.lastName}` : (userEmail ? userEmail.split('@')[0] : 'Usuario'));

  // Referencias para MercadoPago
  const mpRef = useRef<any>(null);
  const brickRef = useRef<any>(null);

  // Si no tenemos serviceId en la URL, intentar obtenerlo del localStorage
  useEffect(() => {
    // Procesar los add-ons desde la URL
    if (addOnsParam) {
      try {
        const addOns = addOnsParam.split(',');
        setSelectedAddOns(addOns);
        console.log('Add-ons recuperados de URL:', addOns);
      } catch (error) {
        console.error('Error al procesar add-ons desde URL:', error);
      }
    }

    if (!serviceId) {
      try {
        const pendingPurchase = localStorage.getItem('pending_purchase');
        if (pendingPurchase) {
          const purchaseData = JSON.parse(pendingPurchase);
          if (purchaseData.serviceId) {
            // Redirigir a la misma página pero con el serviceId incluido
            console.log('Recuperando serviceId desde localStorage:', purchaseData.serviceId);

            // También recuperar los add-ons si existen
            const urlParams = new URLSearchParams();
            urlParams.append('service', purchaseData.serviceId);

            if (purchaseData.addOns && purchaseData.addOns.length > 0) {
              urlParams.append('addons', purchaseData.addOns.join(','));
              setSelectedAddOns(purchaseData.addOns);
              console.log('Add-ons recuperados de localStorage:', purchaseData.addOns);
            }

            navigate(`/payment?${urlParams.toString()}`, { replace: true });

            // Eliminar el pendingPurchase para evitar redirecciones futuras
            // localStorage.removeItem('pending_purchase');
          }
        }
      } catch (error) {
        console.error('Error al recuperar la compra pendiente:', error);
      }
    }
  }, [serviceId, navigate, addOnsParam]);

  // Efecto para tracking de abandono de carrito
  useEffect(() => {
    if (serviceId && !hasTrackedAbandon) {
      // Registrar inicio de sesión de pago
      const cartData = {
        sessionId: cartSessionId,
        serviceId,
        selectedAddOns,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Guardar datos del carrito
      localStorage.setItem('current_cart_session', JSON.stringify(cartData));

      // Configurar timer para detectar abandono (5 minutos)
      const abandonTimer = setTimeout(() => {
        if (!hasTrackedAbandon) {
          trackCartAbandonment(cartData);
          setHasTrackedAbandon(true);
        }
      }, 5 * 60 * 1000); // 5 minutos

      // Limpiar timer si el componente se desmonta o se completa el pago
      return () => {
        clearTimeout(abandonTimer);
      };
    }
  }, [serviceId, cartSessionId, selectedAddOns, hasTrackedAbandon]);

  // Función para trackear abandono de carrito
  const trackCartAbandonment = async (cartData: any) => {
    try {
      console.log('🛒 Carrito abandonado detectado:', cartData);
      
      // Enviar datos al backend
      await fetch('/api/analytics/cart-abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cartData,
          abandonedAt: new Date().toISOString(),
          timeOnPage: Date.now() - new Date(cartData.timestamp).getTime()
        })
      });

      // Programar email de recuperación (se enviará desde el backend)
      console.log('📧 Email de recuperación programado para:', cartData.sessionId);
      
    } catch (error) {
      console.error('Error tracking cart abandonment:', error);
    }
  };

  // Función para validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Función para validar datos de invitado
  const validateGuestData = (): boolean => {
    const validation = {
      email: guestData.email.trim() !== '' && isValidEmail(guestData.email),
      firstName: guestData.firstName.trim() !== '',
      lastName: guestData.lastName.trim() !== '',
      phone: guestData.phone.trim() !== ''
    };
    
    setGuestDataValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Función para manejar el checkout como invitado
  const handleGuestCheckout = async () => {
    if (validateGuestData()) {
      try {
        setLoading(true);
        
        // Crear usuario temporal en el backend
        const guestUserResult = await createGuestUser();
        
        if (guestUserResult.success) {
          // Guardar token temporalmente si es necesario
          if (guestUserResult.token) {
            localStorage.setItem('guest_token', guestUserResult.token);
          }
          
          setIsGuestCheckout(true);
          setShowGuestForm(false);
          
          console.log('✅ Usuario invitado creado exitosamente:', guestUserResult.user);
        } else {
          if (guestUserResult.shouldLogin) {
            setError('Este email ya está registrado. Por favor, inicia sesión.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            setError(guestUserResult.error || 'Error al procesar los datos');
          }
        }
      } catch (error) {
        console.error('Error al crear usuario invitado:', error);
        setError('Error al procesar tu información. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para crear usuario temporal
  const createGuestUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/guest-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestData.email,
          firstName: guestData.firstName,
          lastName: guestData.lastName,
          phone: guestData.phone,
          serviceId: serviceId,
          userAgent: navigator.userAgent,
          ipAddress: 'client-side', // El servidor obtendrá la IP real
          deviceFingerprint: generateDeviceFingerprint()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error('Error al crear usuario temporal');
      }
    } catch (error) {
      console.error('Error en createGuestUser:', error);
      throw error;
    }
  };

  // Función para generar device fingerprint básico
  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      timestamp: Date.now()
    };
    
    return btoa(JSON.stringify(fingerprint)).substring(0, 32);
  };

  // Obtener datos de los add-ons seleccionados desde la API
  const getAddOnsData = async () => {
    console.log('Buscando datos para los add-ons:', selectedAddOns);

    if (!selectedAddOns.length) {
      return [];
    }

    try {
      // Obtener todos los add-ons desde la API
      const response = await fetch(`${API_BASE_URL}/addons`);

      if (response.ok) {
        const availableAddOns = await response.json();
        console.log('Add-ons obtenidos desde la API:', availableAddOns);

        // Filtrar sólo los add-ons seleccionados
        const selectedAddOnsData = availableAddOns.filter((addon: any) =>
          selectedAddOns.includes(addon.id)
        ).map((addon: any) => ({
          id: addon.id,
          name: addon.name || addon.title,
          price: addon.price || addon.precio || 0
        }));

        console.log('Datos de add-ons recuperados desde API:', selectedAddOnsData);
        return selectedAddOnsData;
      } else {
        console.error('Error al obtener add-ons desde la API:', response.status);
      }
    } catch (error) {
      console.error('Error de red al obtener add-ons desde la API:', error);
    }

    // ❌ SEGURIDAD CRÍTICA: NO usar fallbacks con precios hardcodeados
    // En una agencia real, esto podría causar pérdidas económicas
    console.error('🚨 CRÍTICO: No se pudieron obtener precios de add-ons desde la API');
    console.error('🚨 Por seguridad financiera, NO se permitirá la compra');

    // Retornar array vacío para indicar fallo crítico
    return [];
  };

  // Obtener datos del servicio seleccionado desde la API
  const getServiceData = async () => {
    console.log('Buscando datos para el servicio:', serviceId);

    if (!serviceId) {
      console.warn('No se proporcionó un ID de servicio válido');
      return { title: 'No se ha seleccionado un servicio válido', price: 0 };
    }

    try {
      // 1. Intentar obtener el servicio desde la API
      const response = await fetch(`${API_BASE_URL}/servicios/${serviceId}`);

      if (response.ok) {
        const servicio = await response.json();
        console.log('Servicio obtenido desde la API:', servicio);
        return {
          title: servicio.title || servicio.name,
          price: servicio.price || servicio.precio || 0
        };
      } else if (response.status === 404) {
        console.warn('Servicio no encontrado en la API, intentando con localStorage');
      } else {
        console.error('Error al obtener servicio desde la API:', response.status);
      }
    } catch (error) {
      console.error('Error de red al obtener servicio desde la API:', error);
    }

    // 2. Fallback: Intentar obtener datos del servicio desde localStorage
    try {
      // Verificar si hay una compra pendiente en localStorage
      const pendingPurchase = localStorage.getItem('pending_purchase');
      if (pendingPurchase) {
        const purchaseData = JSON.parse(pendingPurchase);
        if (purchaseData.serviceId === serviceId && purchaseData.price) {
          console.log('Datos de servicio encontrados en pending_purchase:', purchaseData);
          return {
            title: purchaseData.title || purchaseData.serviceTitle || 'Servicio',
            price: purchaseData.price
          };
        }
      }

      // Verificar en localStorage si hay datos del último servicio
      const lastService = localStorage.getItem('last_payment_service');
      const lastAmount = localStorage.getItem('last_payment_amount');
      const lastTitle = localStorage.getItem('last_payment_service_title');

      if (lastService === serviceId && lastAmount && lastTitle) {
        console.log('Datos de servicio encontrados en localStorage:', {
          service: lastService,
          title: lastTitle,
          price: parseInt(lastAmount, 10)
        });

        return {
          title: lastTitle,
          price: parseInt(lastAmount, 10)
        };
      }
    } catch (error) {
      console.error('Error al recuperar datos del servicio desde localStorage:', error);
    }

    // 3. Último fallback: intentar obtener todos los servicios y buscar el correcto
    try {
      const response = await fetch(`${API_BASE_URL}/servicios`);
      if (response.ok) {
        const servicios = await response.json();
        const servicio = servicios.find((s: any) => s.id === serviceId);
        if (servicio) {
          console.log('Servicio encontrado en lista completa:', servicio);
          return {
            title: servicio.title || servicio.name,
            price: servicio.price || servicio.precio || 0
          };
        }
      }
    } catch (error) {
      console.error('Error al obtener lista completa de servicios:', error);
    }

    // ❌ SEGURIDAD CRÍTICA: NO retornar precios por defecto
    // En una agencia real, esto podría causar pérdidas económicas
    console.error('🚨 CRÍTICO: No se pudo obtener precio del servicio desde la API');
    console.error('🚨 Por seguridad financiera, NO se permitirá la compra');
    return { title: 'Error: Precio no disponible', price: -1 }; // -1 indica error crítico
  };

  // Efecto para cargar los datos del servicio y add-ons al montar el componente
  useEffect(() => {
    const loadServiceAndAddOnsData = async () => {
      try {
        setLoading(true);

        // Cargar datos del servicio
        const serviceData = await getServiceData();
        setServiceInfo(serviceData);

        // 🚨 VALIDACIÓN CRÍTICA: Verificar que se obtuvo un precio válido
        if (serviceData.price <= 0) {
          console.error('🚨 CRÍTICO: Precio de servicio inválido o no disponible');
          console.error('🚨 SEGURIDAD: Compra bloqueada para serviceId:', serviceId, 'precio recibido:', serviceData.price);

          // Log de seguridad para auditoría
          const securityLog = {
            timestamp: new Date().toISOString(),
            event: 'PURCHASE_BLOCKED_INVALID_PRICE',
            serviceId: serviceId,
            receivedPrice: serviceData.price,
            userEmail: userEmail,
            reason: 'API_PRICE_INVALID_OR_UNAVAILABLE'
          };
          console.error('🚨 SECURITY_LOG:', JSON.stringify(securityLog));

          setError('Error crítico: No se pudo obtener el precio del servicio. Por seguridad, la compra está bloqueada. Contacta soporte.');
          setLoading(false);
          return;
        }

        // Cargar los datos de los add-ons
        const addOnsData = await getAddOnsData();
        setAddOnsInfo(addOnsData);

        // 🚨 VALIDACIÓN CRÍTICA: Si hay add-ons seleccionados pero no se pudieron cargar
        if (selectedAddOns.length > 0 && addOnsData.length === 0) {
          console.error('🚨 CRÍTICO: Add-ons seleccionados pero no se pudieron obtener precios');
          setError('Error crítico: No se pudieron obtener los precios de los complementos. Por seguridad, la compra está bloqueada. Contacta soporte.');
          setLoading(false);
          return;
        }

      } catch (error) {
        console.error('Error al cargar datos del servicio y add-ons:', error);
        setError('Error al cargar información del servicio');
      } finally {
        setLoading(false);
      }
    };

    loadServiceAndAddOnsData();

    // Si llegamos a esta página por redirección de MP con un estado en la URL
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('status');
    if (paymentStatus) {
      console.log('Estado de pago detectado en URL:', paymentStatus);
      // En lugar de redirigir, procesamos el pago directamente en esta página
      if (paymentStatus === 'approved' || paymentStatus === 'success') {
        setPaymentStatus('success');

        // Guardar la información del pago en localStorage para trackeo
        const paymentId = params.get('payment_id') || params.get('collection_id');
        if (paymentId) {
          localStorage.setItem('last_payment_id', paymentId);
          localStorage.setItem('last_payment_status', paymentStatus);

          // Registrar el servicio para el usuario si tenemos todos los datos necesarios
          if (user && user.id && serviceId) {
            const registerService = async () => {
              try {
                // Obtener el token de autenticación
                const token = localStorage.getItem('auth_token');
                if (!token) {
                  console.error('No se encontró token de autenticación');
                  return;
                }

                // URL de la API para registrar servicios
                const apiUrl = `${API_BASE_URL}/users/services`;

                // Datos del servicio a registrar
                const serviceData = {
                  serviceId: serviceId,
                  serviceType: serviceId,
                  userId: user.id,
                  name: serviceInfo.title,
                  price: serviceInfo.price,
                  status: 'paid',
                  paymentId: paymentId,
                  paymentStatus: paymentStatus,
                  userEmail: userEmail,
                  amount: parseFloat(localStorage.getItem('last_payment_amount') || '0'),
                  details: {
                    serviceTitle: localStorage.getItem('last_payment_service_title'),
                    paymentDate: new Date().toISOString(),
                    addOns: selectedAddOns // Incluir los add-ons seleccionados
                  }
                };

                console.log('📤 Enviando datos del servicio:', serviceData);

                // Hacer la petición a la API
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(serviceData)
                });

                // Procesar la respuesta
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ Servicio registrado correctamente:', data);

                  // Guardar el ID del servicio registrado
                  if (data.service && data.service.id) {
                    localStorage.setItem('last_service_id', data.service.id);
                  }

                  // Actualizar la bandera para completar el pago en localStorage
                  localStorage.setItem('project_payment_completed', 'true');

                  // Cargar servicios actualizados
                  loadUserServices();

                  // Mostrar el cuestionario automáticamente
                  setShowQuestionnaire(true);
                } else {
                  const errorData = await response.json();
                  console.error('❌ Error al registrar servicio:', errorData);
                }
              } catch (error) {
                console.error('❌ Error general al registrar servicio:', error);
              }
            };

            // Llamar a la función para registrar el servicio
            registerService();
          }
        }

        return;
      } else if (paymentStatus === 'rejected' || paymentStatus === 'failure') {
        setPaymentStatus('error');
        setError('El pago fue rechazado. Por favor, intenta nuevamente.');
        return;
      } else if (paymentStatus === 'pending') {
        setPaymentStatus('processing');
        return;
      }
    }
  }, [serviceId, location, navigate, user, selectedAddOns]);

  // Crear preferencia y cargar el SDK de Mercado Pago
  useEffect(() => {
    // 🚨 VALIDACIONES CRÍTICAS DE SEGURIDAD
    if (!serviceId) {
      console.error('🚨 CRÍTICO: No hay serviceId válido');
      return;
    }

    if (serviceInfo.price <= 0) {
      console.error('🚨 CRÍTICO: Precio de servicio inválido:', serviceInfo.price);
      setError('Error crítico: Precio no válido. Por seguridad, la compra está bloqueada.');
      setLoading(false);
      return;
    }

    // 🚨 VALIDACIÓN: Verificar que no hay add-ons seleccionados sin precios
    if (selectedAddOns.length > 0) {
      const addOnsWithoutPrice = addOnsInfo.filter(addon => addon.price <= 0);
      if (addOnsWithoutPrice.length > 0) {
        console.error('🚨 CRÍTICO: Add-ons con precios inválidos:', addOnsWithoutPrice);
        setError('Error crítico: Algunos complementos no tienen precios válidos. Por seguridad, la compra está bloqueada.');
        setLoading(false);
        return;
      }
    }

    // 1. Crear preferencia en el backend
    const createPreference = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar errores previos

        // 🚨 VALIDACIÓN CRÍTICA: Verificar precios antes de calcular total
        if (serviceInfo.price <= 0) {
          throw new Error('🚨 CRÍTICO: Precio de servicio inválido al crear preferencia');
        }

        // Verificar que todos los add-ons tienen precios válidos
        const invalidAddOns = addOnsInfo.filter(addon => addon.price <= 0);
        if (invalidAddOns.length > 0) {
          throw new Error(`🚨 CRÍTICO: Add-ons con precios inválidos: ${invalidAddOns.map(a => a.name).join(', ')}`);
        }

        // Calcular el precio total incluyendo add-ons
        const addOnsTotal = addOnsInfo.reduce((sum, addon) => sum + addon.price, 0);
        const totalPrice = serviceInfo.price + addOnsTotal;

        // 🚨 VALIDACIÓN CRÍTICA: Verificar que el total es válido
        if (totalPrice <= 0) {
          throw new Error('🚨 CRÍTICO: Precio total inválido calculado');
        }

        console.log('Creando preferencia para:', {
          serviceId: serviceId,
          serviceTitle: serviceInfo.title,
          servicePrice: serviceInfo.price,
          addOns: selectedAddOns,
          addOnsInfo: addOnsInfo,
          addOnsTotal: addOnsTotal,
          totalPrice: totalPrice,
          userName
        });

        // Guardar información del servicio en localStorage para recuperarla después de la redirección
        localStorage.setItem('last_payment_service', serviceId);
        localStorage.setItem('last_payment_amount', totalPrice.toString());
        localStorage.setItem('last_payment_service_title', serviceInfo.title);

        // También guardar los add-ons seleccionados
        if (selectedAddOns.length > 0) {
          localStorage.setItem('last_payment_addons', JSON.stringify(selectedAddOns));
        }

        // URL API con fallback
        const apiUrl = `${API_BASE_URL}/payments/preference`;
        console.log('URL de la API:', apiUrl);

        // Datos para enviar a la API
        const paymentData = {
          serviceId: serviceId,
          serviceTitle: serviceInfo.title,
          servicePrice: serviceInfo.price,
          addOns: selectedAddOns.map(id => {
            const addon = addOnsInfo.find(a => a.id === id);
            return {
              id,
              name: addon?.name || id,
              price: addon?.price || 0
            };
          }),
          totalPrice: totalPrice,
          userName: userName,
          email: userEmail
        };

        console.log('Enviando datos a la API:', paymentData);

        // Intentar crear preferencia varias veces en caso de error
        let attempts = 0;
        let success = false;
        let responseData = null;

        while (!success && attempts < 3) {
          attempts++;

          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(paymentData),
              credentials: 'include' // Permitir cookies para cross-origin
            });

            const responseText = await response.text();

            try {
              responseData = JSON.parse(responseText);
              console.log(`Intento ${attempts} - Respuesta de la API:`, responseData);
            } catch (jsonError) {
              console.error(`Error al parsear respuesta JSON (intento ${attempts}):`, responseText);
              throw new Error(`Error al parsear respuesta del servidor: ${responseText}`);
            }

            if (!response.ok) {
              console.error(`Error en respuesta de API (intento ${attempts}):`, responseData);
              throw new Error(responseData.error || responseData.message || `Error ${response.status}: ${response.statusText}`);
            }

            if (!responseData.id) {
              throw new Error('El servidor no devolvió un ID de preferencia válido');
            }

            success = true;
          } catch (error) {
            console.error(`Error en intento ${attempts}:`, error);

            // Si ya alcanzamos el máximo de intentos, propagar el error
            if (attempts >= 3) {
              throw error;
            }

            // Esperar antes del próximo intento
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        setPreferenceId(responseData.id);

        // Usar una clave pública por defecto si no se recibe de la API
        const publicKey = responseData.public_key || import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc';

        if (!publicKey) {
          console.warn('Advertencia: No se recibió clave pública de MercadoPago, usando valor por defecto');
        }

        // Solo iniciamos la carga cuando hemos terminado de cargar la preferencia
        setLoading(false);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener preferencia:', error);
        setError(`No se pudo crear la preferencia de pago: ${errorMessage}`);
        setLoading(false);
      }
    };

    createPreference();
  }, [serviceInfo, serviceId, userName, userEmail, addOnsInfo, selectedAddOns]);

  // Memoizar loadUserServices para evitar recreaciones innecesarias
  const loadUserServices = useCallback(async () => {
    try {
      setLoadingServices(true);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No se encontró token de autenticación');
        return;
      }

      const apiUrl = `${API_BASE_URL}/users/services`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error al cargar servicios: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Servicios cargados correctamente:', data);

      if (data.services) {
        setUserServices(data.services);
      }
    } catch (error) {
      console.error('❌ Error al cargar servicios:', error);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // Manejar la finalización del cuestionario
  const handleQuestionnaireComplete = async (answers: Record<string, any>) => {
    try {
      console.log('Respuestas del cuestionario:', answers);

      // Obtener datos necesarios
      const token = localStorage.getItem('auth_token');
      let serviceId = localStorage.getItem('last_service_id') || '';

      if (!token) {
        console.error('❌ Error: No se encontró token de autenticación');
        throw new Error('No se encontró token de autenticación. Inicia sesión nuevamente.');
      }

      if (!serviceId) {
        console.error('❌ Error: No se encontró ID del servicio');
        throw new Error('No se encontró ID del servicio. Intenta recargar la página.');
      }

      console.log('🆔 ID del servicio utilizado:', serviceId);

      // Primero, verificar si el servicio existe consultando la lista de servicios
      try {
        // Obtener la lista de servicios del usuario para validar el ID
        const servicesApiUrl = `${API_BASE_URL}/users/services`;
        console.log('🔄 Verificando servicios disponibles:', servicesApiUrl);

        const servicesResponse = await fetch(servicesApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!servicesResponse.ok) {
          throw new Error(`Error al verificar servicios: ${servicesResponse.status}`);
        }

        const servicesData = await servicesResponse.json();
        console.log('📋 Servicios disponibles:', servicesData);

        // Comprobar si el servicio existe en la lista
        const serviceExists = servicesData.services &&
          servicesData.services.some((service: any) => service.id === serviceId);

        if (!serviceExists && servicesData.services && servicesData.services.length > 0) {
          console.warn(`⚠️ El servicio con ID ${serviceId} no existe. Usando el primer servicio disponible en su lugar.`);
          // Usar el primer servicio disponible si no existe el que estamos buscando
          serviceId = servicesData.services[0].id;
          console.log('🆔 ID del servicio actualizado:', serviceId);
          localStorage.setItem('last_service_id', serviceId);
        } else if (!serviceExists) {
          console.error(`❌ Error: No se encontraron servicios disponibles para el usuario`);
          throw new Error('No tienes servicios activos. Intenta realizar un pago primero.');
        }

        // Actualizar la información del servicio en el backend
        const apiUrl = `${API_BASE_URL}/users/services/${serviceId}/details`;
        console.log('🔗 URL de la API:', apiUrl);

        console.log('📤 Enviando actualización al servidor:', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ projectDetails: answers })
        });

        // Intentar con método PUT primero
        try {
          console.log('🔄 Intentando método PUT...');
          const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ projectDetails: answers })
          });

          // Verificar si la respuesta es exitosa
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error HTTP ${response.status} con método PUT: ${errorText}`);

            // Si PUT falla, intentar con POST como alternativa
            console.log('🔄 PUT falló, intentando con método POST...');
            const postResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ projectDetails: answers })
            });

            if (!postResponse.ok) {
              const postErrorText = await postResponse.text();
              console.error(`❌ Error HTTP ${postResponse.status} con método POST: ${postErrorText}`);
              throw new Error(`Error al guardar detalles con POST (${postResponse.status}): ${postErrorText}`);
            }

            // Si POST tiene éxito, usar esa respuesta
            const data = await postResponse.json();
            console.log('✅ Detalles del proyecto guardados correctamente con POST:', data);

            // Marcar que se ha registrado un nuevo servicio para que Dashboard lo detecte
            localStorage.setItem('new_service_registered', 'true');

            // Cargar los servicios actualizados
            await loadUserServices();

            // Marcar como completado y ocultar el cuestionario
            setQuestionnaireCompleted(true);
            setShowQuestionnaire(false);

            return; // Salir si POST tiene éxito
          }

          const data = await response.json();
          console.log('✅ Detalles del proyecto guardados correctamente con PUT:', data);

          // Marcar que se ha registrado un nuevo servicio para que Dashboard lo detecte
          localStorage.setItem('new_service_registered', 'true');

          // Cargar los servicios actualizados
          await loadUserServices();

          // Marcar como completado y ocultar el cuestionario
          setQuestionnaireCompleted(true);
          setShowQuestionnaire(false);
        } catch (fetchError) {
          console.error('❌ Error de red al actualizar detalles:', fetchError);
          throw fetchError;
        }
      } catch (fetchError) {
        console.error('❌ Error de red al actualizar detalles:', fetchError);
        throw fetchError;
      }

    } catch (error) {
      console.error('❌ Error al enviar respuestas del cuestionario:', error);

      // Mostrar un mensaje de error pero igual marcar como completado para no bloquear al usuario
      alert(`Hubo un problema al guardar los detalles del proyecto: ${error instanceof Error ? error.message : 'Error desconocido'}`);

      // Aún así, avanzar para no bloquear al usuario
      setQuestionnaireCompleted(true);
      setShowQuestionnaire(false);
    }
  };

  // Efecto para crear preferencia y cargar MercadoPago
  useEffect(() => {
    // Verificar si estamos en la página de pagos
    if (!window.location.pathname.includes('/payment')) {
      return; // No inicializar si no estamos en la página de pagos
    }

    // Solo procedemos si tenemos una preferencia válida y email del usuario
    if (!preferenceId || !serviceInfo.price || !userEmail) {
      console.log('⚠️ No se puede inicializar MercadoPago:', {
        preferenceId,
        price: serviceInfo.price,
        userEmail: userEmail || '(vacío)'
      });
      return;
    }

    console.log('🚀 Inicializando MercadoPago para preferencia:', preferenceId);
    console.log('📧 Email que se usará en payer:', userEmail);

    let sdkCheckAttempts = 0;
    const maxSDKCheckAttempts = 30; // Máximo de intentos (6 segundos)

    // Timeout general para evitar carga infinita
    const generalTimeout = setTimeout(() => {
      console.error('❌ Timeout general: La carga del sistema de pagos tardó demasiado');
      setError('El sistema de pagos está tardando en cargar. Intenta recargar la página o verifica tu conexión a internet.');
      setLoading(false);
    }, 30000); // 30 segundos timeout general

    // Función para verificar si el SDK de MercadoPago está cargado
    const checkMercadoPagoSDK = () => {
      sdkCheckAttempts++;

      if (typeof window.MercadoPago !== 'function') {
        if (sdkCheckAttempts < maxSDKCheckAttempts) {
          console.log(`⏳ Esperando a que cargue el SDK de MercadoPago... (intento ${sdkCheckAttempts})`);
          setTimeout(checkMercadoPagoSDK, 200); // Verificar cada 200ms
        } else {
          clearTimeout(generalTimeout);
          console.error('❌ Error: No se pudo cargar el SDK de MercadoPago después de varios intentos');
          setError('No se pudo cargar el procesador de pagos. Verifica tu conexión a internet y recarga la página.');
          setLoading(false);
        }
        return;
      }

      // SDK cargado exitosamente, limpiar timeout
      clearTimeout(generalTimeout);

      // El SDK está cargado, proceder con la inicialización
      console.log('✅ SDK de MercadoPago detectado, inicializando...');

      try {
        // Inicializar el SDK con la clave pública
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-064a6d85-da9f-4dea-9587-d0e7da336abc';
        console.log('🔑 Usando clave pública:', publicKey);

        // Crear instancia de MercadoPago con configuración específica para Argentina
        const mp = new window.MercadoPago(publicKey, {
          locale: 'es-AR',
          advancedConfiguration: {
            siteId: 'MLA', // Sitio de Argentina
            marketplace: false // Establece a false para habilitar todas las opciones de pago
          }
        });

        // Guardar referencia a la instancia de MP
        mpRef.current = mp;
        console.log('✅ Instancia de MercadoPago creada correctamente');

        // Verificar si el contenedor está disponible
        setTimeout(() => {
          const container = document.getElementById('payment-brick-container');

          if (!container) {
            console.error('❌ No se encontró el contenedor payment-brick-container tras el delay');
            setError('Error al inicializar el formulario de pago. Intenta recargar.');
            setLoading(false);
            return;
          }

          console.log('✅ Contenedor payment-brick-container encontrado tras delay');

          try {
            // Asegurarse de desmontar cualquier instancia previa si existe
            if (brickRef.current && typeof brickRef.current.unmount === 'function') {
              try {
                console.log('🧹 Desmontando instancia previa de Payment Brick');
                brickRef.current.unmount();
              } catch (e) {
                console.warn('⚠️ Error al desmontar Payment Brick previo:', e);
              }
            }

            // Simplificar la configuración al mínimo necesario
            const simpleBrickSettings = {
              initialization: {
                amount: serviceInfo.price,
                preferenceId: preferenceId,
                payer: {
                  email: userEmail && userEmail.includes('@') ? userEmail : undefined
                }
              },
              customization: {
                visual: {
                  style: {
                    theme: 'dark', // Usar solo el tema dark sin personalización adicional
                  },
                  hideFormTitle: true,
                },
                paymentMethods: {
                  creditCard: "all",
                  debitCard: "all",
                  ticket: "all",
                  bankTransfer: "all",
                  atm: "all",
                  mercadoPago: "all", // Renombrado de wallet_purchase a mercadoPago
                  creditCardOnly: {
                    maxInstallments: 12 // Permitir hasta 12 cuotas
                  }
                },
                // Siempre mostrar billetera de MercadoPago
                wallet: {
                  showButton: true
                }
              },
              callbacks: {
                onReady: () => {
                  console.log('✅ Payment Brick listo y cargado correctamente');
                  console.log('📧 Email de usuario autenticado:', userEmail || 'No hay usuario autenticado');
                  console.log('📧 Email configurado en payer:', userEmail || '');
                  setMpLoaded(true);
                  setLoading(false);
                },
                onError: (error: any) => {
                  console.error('❌ Error en Payment Brick:', error);

                  // Mensajes de error más específicos
                  let errorMessage = 'Error al procesar el pago';
                  if (error.message) {
                    if (error.message.includes('bin')) {
                      errorMessage = 'Número de tarjeta no reconocido';
                    } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
                      errorMessage = 'Pago cancelado por el usuario';
                    } else if (error.message.includes('timeout')) {
                      errorMessage = 'El pago tardó demasiado tiempo. Intenta nuevamente';
                    } else if (error.message.includes('network') || error.message.includes('connection')) {
                      errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente';
                    } else {
                      errorMessage = `Error: ${error.message}`;
                    }
                  }

                  setError(errorMessage);
                  setPaymentStatus('error');
                  setLoading(false);
                },
                onSubmit: () => {
                  console.log('📝 Formulario de pago enviado');
                  setPaymentStatus('processing');

                  // Agregar timeout para evitar que se quede cargando indefinidamente
                  const paymentTimeout = setTimeout(() => {
                    console.warn('⏰ Timeout del pago - tomó demasiado tiempo');
                    setError('El pago está tardando más de lo esperado. Si el problema persiste, intenta nuevamente o contacta soporte.');
                    setPaymentStatus('error');
                    setLoading(false);
                  }, 60000); // 60 segundos timeout

                  return new Promise<void>((resolve, reject) => {
                    // Simular procesamiento con posibilidad de cancelación
                    const processingTimer = setTimeout(() => {
                      clearTimeout(paymentTimeout);
                      resolve();
                    }, 1500);

                    // Permitir cancelación manual
                    const cancelHandler = () => {
                      clearTimeout(processingTimer);
                      clearTimeout(paymentTimeout);
                      console.log('🚫 Pago cancelado por el usuario');
                      setError('Pago cancelado');
                      setPaymentStatus('error');
                      setLoading(false);
                      reject(new Error('Pago cancelado por el usuario'));
                    };

                    // Agregar listener para cancelación (opcional)
                    window.addEventListener('beforeunload', cancelHandler, { once: true });

                    // Limpiar listener después del procesamiento
                    setTimeout(() => {
                      window.removeEventListener('beforeunload', cancelHandler);
                    }, 2000);
                  });
                }
              }
            };

            // Depurar configuración antes de inicializar
            console.log('⚙️ Configuración del Brick:', JSON.stringify(simpleBrickSettings, null, 2));

            // Usar la configuración simplificada
            brickRef.current = mp.bricks().create("payment", "payment-brick-container", simpleBrickSettings);
            console.log('✅ Payment Brick inicializado correctamente');
          } catch (e) {
            console.error('❌ Error al inicializar Payment Brick:', e);
            setError(`Error al inicializar el formulario de pago: ${e instanceof Error ? e.message : 'Error desconocido'}`);
            setLoading(false);
          }
        }, 100); // Delay de 100ms

      } catch (error) {
        console.error('❌ Error general al inicializar MercadoPago:', error);
        setError('Error al inicializar el procesador de pagos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        setLoading(false);
      }
    };

    // Iniciar verificación de carga del SDK
    checkMercadoPagoSDK();

    return () => {
      // Limpiar recursos
      if (brickRef.current && typeof brickRef.current.unmount === 'function') {
        try {
          console.log('🧹 Desmontando Payment Brick');
          brickRef.current.unmount();
        } catch (e) {
          console.warn('⚠️ Error al desmontar Payment Brick:', e);
        }
      }
    };
  }, [preferenceId, serviceInfo.price, userEmail]);

  // Exponer la función de simulación en el objeto window para acceso desde consola
  useEffect(() => {
    // Función para simular un pago exitoso (solo para desarrollo)
    const simulatePayment = () => {
      console.log('🚀 Simulando pago exitoso...');
      setPaymentStatus('processing');

      // Guardar información del pago simulado en localStorage
      const paymentId = 'sim_' + Math.floor(Math.random() * 1000000);
      const paymentData = {
        id: paymentId,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'simulated_payment',
        payment_type_id: 'simulated',
        transaction_amount: serviceInfo.price,
        date_created: new Date().toISOString(),
        service: {
          id: serviceId,
          title: serviceInfo.title,
          price: serviceInfo.price
        }
      };

      // Guardar datos del pago simulado para recuperarlos
      localStorage.setItem('last_payment_data', JSON.stringify(paymentData));
      localStorage.setItem('last_payment_id', paymentId);
      localStorage.setItem('last_payment_status', 'approved');

      // Crear un ID único para el servicio simulado
      const serviceUniqueId = `service_sim_${Date.now()}`;
      console.log('🆔 ID único generado para el servicio:', serviceUniqueId);
      localStorage.setItem('last_service_id', serviceUniqueId);

      // Simular procesamiento (2 segundos)
      setTimeout(() => {
        setPaymentStatus('success');

        // Registrar servicio para el usuario (usar API real)
        if (user && user.id) {
          // Obtener el token de autenticación
          const token = localStorage.getItem('auth_token');
          if (!token) {
            console.error('No se encontró token de autenticación');
            return;
          }

          // URL de la API para registrar servicios
          const apiUrl = `${API_BASE_URL}/users/services`;

          // Datos del servicio a registrar
          const serviceData = {
            serviceId: serviceUniqueId,
            serviceType: serviceId,
            userId: user.id,
            name: serviceInfo.title,  // Asegurar que se incluya el nombre del servicio
            price: serviceInfo.price, // Incluir el precio directamente
            status: 'paid',           // Cambiar a 'paid' que es un estado mejor para el backend
            paymentId: paymentId,
            paymentStatus: 'approved',
            userEmail: userEmail,
            amount: serviceInfo.price,
            details: {
              serviceTitle: serviceInfo.title,
              paymentDate: new Date().toISOString()
            }
          };

          console.log('📤 Registrando servicio simulado en el backend:', serviceData);

          // Registrar el servicio en el backend
          fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(serviceData)
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Error al registrar servicio: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              console.log('✅ Servicio registrado correctamente:', data);

              // Guardar el ID del servicio registrado (manejando diferentes estructuras de respuesta)
              const registeredServiceId = data?.service?.id || data?.id || data?._id;
              if (registeredServiceId) {
                console.log('🆔 ID del servicio recibido del backend:', registeredServiceId);

                // IMPORTANTE: Actualizar último ID de servicio registrado para el cuestionario
                localStorage.setItem('last_service_id', registeredServiceId);
                console.log('🔄 ID de servicio actualizado en localStorage:', registeredServiceId);

                // Marcar que se ha registrado un nuevo servicio para que Dashboard lo detecte
                localStorage.setItem('new_service_registered', 'true');
              } else {
                console.warn('⚠️ No se pudo extraer ID del servicio de la respuesta:', data);
              }

              // Cargar servicios actualizados
              loadUserServices();

              // Mostrar el cuestionario automáticamente
              setShowQuestionnaire(true);
            })
            .catch(error => {
              console.error('❌ Error al registrar servicio simulado:', error);
              // Intentar mostrar el cuestionario de todos modos
              setShowQuestionnaire(true);
            });
        } else {
          // Si no hay usuario, mostrar el cuestionario de todos modos
          setShowQuestionnaire(true);
        }
      }, 2000);
    };

    // Crear o actualizar la función global
    (window as any).simulatePayment = simulatePayment;

    // Mensaje en consola para informar al desarrollador
    console.log('💡 Para simular un pago exitoso, ejecuta window.simulatePayment() en la consola');

    // Limpieza al desmontar
    return () => {
      delete (window as any).simulatePayment;
    };
  }, [serviceInfo, serviceId, user]);

  // Efecto para verificar estado del pago
  useEffect(() => {
    console.log('🔍 Verificando estado del pago, usuario actual:', user);

    // Verificar si venimos de una redirección después de un pago (parámetros no usados actualmente)

    // Cargar los servicios del usuario al iniciar
    if (user && user.id) {
      console.log('🔄 Cargando servicios para el usuario:', user.id);
      loadUserServices();
    }
  }, [user, location, loadUserServices]);

  // Mostrar mensaje según estado del pago
  const renderPaymentStatus = () => {
    // Usamos un ID único para el contenedor de MercadoPago
    const paymentBrickId = "payment-brick-container";

    switch (paymentStatus) {
      case 'processing':
        return (
          <LoadingContainer>
            <div className="loader"></div>
            <p>Procesando tu pago...</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
              Esto puede tomar unos momentos...
            </p>
            <button
              onClick={() => {
                console.log('🚫 Usuario canceló el pago manualmente');
                setError('Pago cancelado por el usuario');
                setPaymentStatus('error');
                setLoading(false);
              }}
              style={{
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 77, 77, 0.2)',
                border: '1px solid #ff4d4d',
                borderRadius: '4px',
                color: '#ff4d4d',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 77, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 77, 0.2)';
              }}
            >
              Cancelar pago
            </button>
          </LoadingContainer>
        );
      case 'success':
        return (
          <div style={{ textAlign: 'center' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 1rem' }}>
                <circle cx="12" cy="12" r="10" stroke="#00FFFF" strokeWidth="1.5" />
                <path d="M8 12L11 15L16 9" stroke="#00FFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>

            <h3 style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: '#00FFFF' }}>
              ¡Pago Exitoso!
            </h3>

            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem' }}>
              Tu pago ha sido procesado correctamente. ¡Gracias por confiar en nosotros!
            </p>

            {questionnaireCompleted ? (
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem' }}>
                  Hemos recibido toda la información necesaria para comenzar con tu proyecto.
                  Pronto nos pondremos en contacto contigo.
                </p>

                <Link to="/dashboard" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(0, 255, 255, 0.3)',
                  transition: 'all 0.2s ease',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Ir a mi Dashboard
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                  ¡Un paso más! Para comenzar con tu proyecto, necesitamos algunos detalles importantes.
                </p>

                <Button onClick={() => setShowQuestionnaire(true)} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0, 255, 255, 0.3)',
                  transition: 'all 0.2s ease',
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                  Completar información del proyecto
                </Button>
              </div>
            )}
          </div>
        );
      case 'error':
        return (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#FF4E4E' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
            </svg>
            <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>Error al procesar el pago</p>
            {error && <p>{error}</p>}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'rgba(0, 158, 227, 0.2)',
                border: '1px solid #009ee3',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        );
      default:
        if (loading) {
          return (
            <LoadingContainer>
              <div className="loader" style={{ borderTopColor: '#009ee3' }}></div>
              <p>Cargando opciones de pago...</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
                Si esto tarda mucho, intenta recargar la página
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(0, 158, 227, 0.2)',
                  border: '1px solid #009ee3',
                  borderRadius: '4px',
                  color: '#009ee3',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 158, 227, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 158, 227, 0.2)';
                }}
              >
                Recargar página
              </button>
            </LoadingContainer>
          );
        }

        if (error) {
          return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#FF4E4E' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
              </svg>
              <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>No se pudo cargar el formulario de pago</p>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(0, 158, 227, 0.2)',
                  border: '1px solid #009ee3',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            </div>
          );
        }

        // Solo en este caso mostramos el contenedor para el brick de MercadoPago
        return (
          <BrickContainer className="BrickContainer">
            <div className="brick-reset-container">
              <div id={paymentBrickId} style={{ width: '100%', position: 'relative' }}>
                {!mpLoaded && <LoadingContainer><p>Cargando formulario...</p></LoadingContainer>}
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Usa una tarjeta de prueba como 4509 9535 6623 3704, vto 12/25, CVV 123
            </div>
          </BrickContainer>
        );
    }
  };

  // Componente principal
  const renderPaymentComponent = () => {
    // Renderizado condicional según estado del servicio
    if (!serviceInfo) {
      return (
        <Card>
          <Header>
            <Title>Servicio no encontrado</Title>
          </Header>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>No se encontró información del servicio seleccionado.</p>
            <Link to="/#servicios" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Volver a servicios
            </Link>
          </div>
        </Card>
      );
    }

    // Si no hay usuario autenticado o está en proceso de verificación
    if (!userEmail && !error) {
      return (
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Header>
            <Title>Verificando cuenta</Title>
          </Header>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="loader" style={{
              margin: '0 auto 1.5rem',
              borderTopColor: '#009ee3'
            }}></div>
            <p>Verificando tu cuenta para proceder con el pago...</p>
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '1rem'
            }}>
              Para realizar pagos es necesario iniciar sesión.
            </p>
          </div>
        </Card>
      );
    }

    // Componente principal de pago
    return (
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Header>
          <Title>Finalizar Compra</Title>
          <SecurePaymentBadge>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            </svg>
            <span>Pago Seguro</span>
          </SecurePaymentBadge>
        </Header>

        {/* 🚨 VALIDACIONES CRÍTICAS DE SEGURIDAD ANTES DE MOSTRAR COMPRA */}
        {!serviceId || serviceInfo.price <= 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            {serviceInfo.price === -1 ? (
              // Error crítico: no se pudo obtener precio de la API
              <>
                <div style={{
                  background: 'rgba(255, 77, 77, 0.1)',
                  border: '1px solid #ff4d4d',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#ff4d4d" viewBox="0 0 16 16" style={{ marginBottom: '1rem' }}>
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                  </svg>
                  <h3 style={{ color: '#ff4d4d', marginBottom: '1rem' }}>⚠️ Compra Bloqueada por Seguridad</h3>
                  <p style={{ color: '#ff4d4d', marginBottom: '1rem' }}>
                    No se pudieron obtener los precios actuales desde nuestro sistema.
                    Por seguridad financiera, la compra está temporalmente bloqueada.
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Esto protege tanto a ti como a nuestra empresa de transacciones con precios incorrectos.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(0, 158, 227, 0.2)',
                      border: '1px solid #009ee3',
                      borderRadius: '8px',
                      color: '#009ee3',
                      cursor: 'pointer',
                      marginRight: '1rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    🔄 Reintentar
                  </button>
                  <Link
                    to="/#servicios"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    ← Volver a servicios
                  </Link>
                </div>
              </>
            ) : (
              // Servicio no seleccionado
              <>
                <p>No se ha seleccionado un servicio válido.</p>
                <Link to="/">Volver al inicio</Link>
              </>
            )}
          </div>
        ) : (
          <>
            <OrderSummary>
              <OrderItem>
                <OrderLabel>Servicio:</OrderLabel>
                <OrderValue>{serviceInfo.title}</OrderValue>
              </OrderItem>

              {addOnsInfo.length > 0 && (
                <>
                  <OrderItem style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <OrderLabel>Complementos:</OrderLabel>
                    <OrderValue></OrderValue>
                  </OrderItem>

                  {addOnsInfo.map((addon) => (
                    <OrderItem key={addon.id} style={{ paddingLeft: '1rem' }}>
                      <OrderLabel>{addon.name}</OrderLabel>
                      <OrderValue>${addon.price.toLocaleString()}</OrderValue>
                    </OrderItem>
                  ))}
                </>
              )}

              <OrderItem>
                <OrderLabel>Cliente:</OrderLabel>
                <OrderValue>{userName}</OrderValue>
              </OrderItem>

              <OrderItem>
                <OrderLabel>Total:</OrderLabel>
                <OrderTotal>
                  ${(serviceInfo.price + addOnsInfo.reduce((sum, addon) => sum + addon.price, 0)).toLocaleString()}
                </OrderTotal>
              </OrderItem>
            </OrderSummary>

            <PaymentContainer>
              <MercadoPagoLogo>
                <img
                  src="images/MercadoPago.logo.svg"
                  alt="Mercado Pago"
                />
              </MercadoPagoLogo>

              <PaymentTitle>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H0V4zm11.5 1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-2zM0 11v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1H0z" />
                </svg>
                Método de pago
              </PaymentTitle>
              <PaymentSubtitle>
                Elige cómo quieres pagar tu compra
              </PaymentSubtitle>

              {renderPaymentStatus()}

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <PaymentFooter>
                <p>Tu información de pago está protegida con encriptación de 256 bits</p>

                <div className="auth-notice">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  </svg>
                  <span>Para realizar pagos es necesario iniciar sesión</span>
                </div>

                <div className="security-badges">
                  <div className="badge">
                    <img
                      src="images/MercadoPago.svg"
                      alt="Mercado Pago"
                      width="44"
                    />
                    <span>Tecnología verificada</span>
                  </div>
                  <div className="badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#32CCBC" viewBox="0 0 16 16">
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                    </svg>
                    <span>Conexión Segura</span>
                  </div>
                  <div className="badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#009ee3" viewBox="0 0 16 16">
                      <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z" />
                      <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                    <span>Pagos Protegidos</span>
                  </div>
                </div>
              </PaymentFooter>
            </PaymentContainer>
          </>
        )}
      </Card>
    );
  };

  // Componente para el formulario de invitado
  const renderGuestForm = () => (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Header>
        <Title>Información de Contacto</Title>
        <SecurePaymentBadge>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <span>Datos Seguros</span>
        </SecurePaymentBadge>
      </Header>

      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            Completa tu información para continuar
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            Necesitamos estos datos para procesar tu pedido de forma segura
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                Nombre *
              </label>
              <input
                type="text"
                value={guestData.firstName}
                onChange={(e) => setGuestData(prev => ({ ...prev, firstName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${guestDataValidation.firstName ? 'rgba(255,255,255,0.3)' : '#ff4d4d'}`,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '1rem'
                }}
                placeholder="Tu nombre"
              />
              {!guestDataValidation.firstName && (
                <span style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>Nombre requerido</span>
              )}
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                color: '#fff', 
                marginBottom: '0.5rem',
                fontSize: '0.9rem'
              }}>
                Apellido *
              </label>
              <input
                type="text"
                value={guestData.lastName}
                onChange={(e) => setGuestData(prev => ({ ...prev, lastName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: `1px solid ${guestDataValidation.lastName ? 'rgba(255,255,255,0.3)' : '#ff4d4d'}`,
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '1rem'
                }}
                placeholder="Tu apellido"
              />
              {!guestDataValidation.lastName && (
                <span style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>Apellido requerido</span>
              )}
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              color: '#fff', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Email *
            </label>
            <input
              type="email"
              value={guestData.email}
              onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${guestDataValidation.email ? 'rgba(255,255,255,0.3)' : '#ff4d4d'}`,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '1rem'
              }}
              placeholder="tu@email.com"
            />
            {!guestDataValidation.email && (
              <span style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>Email válido requerido</span>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              color: '#fff', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Teléfono *
            </label>
            <input
              type="tel"
              value={guestData.phone}
              onChange={(e) => setGuestData(prev => ({ ...prev, phone: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${guestDataValidation.phone ? 'rgba(255,255,255,0.3)' : '#ff4d4d'}`,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '1rem'
              }}
              placeholder="+54 11 1234-5678"
            />
            {!guestDataValidation.phone && (
              <span style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>Teléfono requerido</span>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleGuestCheckout}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'linear-gradient(135deg, #009ee3 0%, #0077b3 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Continuar como Invitado
          </button>
          
          <button
            onClick={() => {
              setShowGuestForm(false);
              navigate('/login');
            }}
            style={{
              padding: '1rem 1.5rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Iniciar Sesión
          </button>
        </div>

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(0, 158, 227, 0.1)',
          border: '1px solid rgba(0, 158, 227, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#009ee3" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            <span style={{ color: '#009ee3', fontWeight: '600', fontSize: '0.9rem' }}>
              ¿Por qué necesitamos esta información?
            </span>
          </div>
          <ul style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0, paddingLeft: '1.2rem' }}>
            <li>Para procesar tu pago de forma segura</li>
            <li>Para enviarte la confirmación de compra</li>
            <li>Para contactarte si hay algún problema</li>
            <li>Cumplimiento con regulaciones AFIP</li>
          </ul>
        </div>
      </div>
    </Card>
  );

  // Componente para selección de tipo de checkout
  const renderCheckoutSelection = () => (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Header>
        <Title>¿Cómo quieres continuar?</Title>
        <SecurePaymentBadge>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <span>Pago Seguro</span>
        </SecurePaymentBadge>
      </Header>

      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Opción de Checkout como Invitado - MÁS PROMINENTE */}
          <div
            onClick={() => setShowGuestForm(true)}
            style={{
              padding: '1.5rem',
              border: '2px solid #009ee3',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 158, 227, 0.1) 0%, rgba(0, 119, 179, 0.1) 100%)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #009ee3 0%, #0077b3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
                  <path d="M13 14s1 0 1-1-1-4-6-4-6 3-6 4 1 1 1 1h10zm-9.995-.944v-.002.002zM3.022 13h9.956a.274.274 0 0 0 .014-.002l.008-.002c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664a1.05 1.05 0 0 0 .022.004zm9.974.056v-.002.002zM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Continuar como Invitado
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
                  Rápido y fácil. Solo necesitamos tu email y datos básicos.
                </p>
              </div>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#009ee3',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}>
                RECOMENDADO
              </div>
            </div>
          </div>

          {/* Opción de Iniciar Sesión */}
          <div
            onClick={() => navigate('/login')}
            style={{
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="rgba(255,255,255,0.7)" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h8z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Iniciar Sesión
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' }}>
                  ¿Ya tienes una cuenta? Inicia sesión para un checkout más rápido.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.8rem' }}>
            🔒 Tu información está protegida con encriptación de 256 bits
          </p>
        </div>
      </div>
    </Card>
  );

  // Lógica de renderizado principal (modificada)
  if (!serviceId || serviceInfo.price <= 0) {
    return (
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Header>
          <Title>Error en el Servicio</Title>
        </Header>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No se encontró información del servicio seleccionado.</p>
          <Link to="/#servicios" style={{ display: 'inline-block', marginTop: '1rem' }}>
            Volver a servicios
          </Link>
        </div>
      </Card>
    );
  }

  // Si el usuario no está autenticado y no está en proceso de checkout como invitado
  if (!userEmail && !isGuestCheckout && !error) {
    if (showGuestForm) {
      return renderGuestForm();
    }
    return renderCheckoutSelection();
  }

  return (
    <PageContainer>
      <GlobalBackground />

      <ContentContainer>
        {renderPaymentComponent()}
      </ContentContainer>

      {/* Cuestionario de proyecto */}
      <ProjectQuestionnaire
        serviceType={serviceId || 'default'}
        isVisible={showQuestionnaire}
        onComplete={handleQuestionnaireComplete}
        onClose={() => setShowQuestionnaire(false)}
      />
    </PageContainer>
  );
}

export default Payment; 
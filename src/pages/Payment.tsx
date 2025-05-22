import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import GlobalBackground from '../components/ui/GlobalBackground';
import { useAuth } from '../context/AuthContext';
import ProjectQuestionnaire from '../components/payment/ProjectQuestionnaire';
import { API_BASE_URL } from '../config/apiConfig';

// Declarar el tipo MercadoPago para TypeScript
declare global {
  interface Window {
    MercadoPago: any;
  }
}

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
  const { user } = useAuth(); // Usar el hook de autenticación

  // Usar el serviceId de la ruta o del query param
  const serviceId = routeServiceId || queryServiceId;

  // Estados para gestionar el pago
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [preferenceId, setPreferenceId] = useState('');
  const [mpLoaded, setMpLoaded] = useState(false);
  const [serviceInfo, setServiceInfo] = useState<{ title: string; price: number }>({ title: '', price: 0 });

  // Estado para el cuestionario de proyecto
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [projectData, setProjectData] = useState<Record<string, any>>({});

  // Estado para servicios del usuario
  const [userServices, setUserServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Obtener información del usuario
  const userEmail = user?.email;
  const userName = user?.name || (userEmail ? userEmail.split('@')[0] : 'Usuario');

  // Referencias para MercadoPago
  const mpRef = useRef<any>(null);
  const brickRef = useRef<any>(null);

  // Obtener datos del servicio seleccionado
  const getServiceData = () => {
    // Esta es una versión simplificada, debes adaptarla a tu lógica de negocio
    const services = {
      'landing': { title: 'Landing Page', price: 0 },
      'web5': { title: 'Página Web 5 Rutas', price: 30000 },
      'web7': { title: 'Página Web 7+ Rutas', price: 50000 }
    };

    const defaultService = { title: 'Servicio no reconocido', price: 0 };

    // Si el serviceId es null o undefined, devolver servicio por defecto
    if (!serviceId) return defaultService;

    // @ts-ignore - Ignorar error de tipado por índice dinámico
    return services[serviceId] || defaultService;
  };

  // Efecto para cargar los datos del servicio al montar el componente
  useEffect(() => {
    const data = getServiceData();
    setServiceInfo(data);

    // Si llegamos a esta página por redirección de MP con un estado en la URL
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) {
      console.log('Estado de pago detectado en URL:', status);
      // En lugar de redirigir, procesamos el pago directamente en esta página
      if (status === 'approved' || status === 'success') {
        setPaymentStatus('success');

        // Guardar la información del pago en localStorage para trackeo
        const paymentId = params.get('payment_id') || params.get('collection_id');
        if (paymentId) {
          localStorage.setItem('last_payment_id', paymentId);
          localStorage.setItem('last_payment_status', status);

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
                  name: serviceInfo.title,  // Asegurar que se incluya el nombre del servicio
                  price: serviceInfo.price, // Incluir el precio directamente
                  status: 'paid',           // Cambiar a 'paid' que es un estado mejor para el backend
                  paymentId: paymentId,
                  paymentStatus: status,
                  userEmail: userEmail,
                  amount: parseFloat(localStorage.getItem('last_payment_amount') || '0'),
                  details: {
                    serviceTitle: localStorage.getItem('last_payment_service_title'),
                    paymentDate: new Date().toISOString()
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
      } else if (status === 'rejected' || status === 'failure') {
        setPaymentStatus('error');
        setError('El pago fue rechazado. Por favor, intenta nuevamente.');
        return;
      } else if (status === 'pending') {
        setPaymentStatus('processing');
        return;
      }
    }
  }, [serviceId, location, navigate, user]);

  // Crear preferencia y cargar el SDK de Mercado Pago
  useEffect(() => {
    if (!serviceId || serviceInfo.price <= 0) return;

    // 1. Crear preferencia en el backend
    const createPreference = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar errores previos

        console.log('Creando preferencia para:', {
          serviceId: serviceId,
          serviceTitle: serviceInfo.title,
          servicePrice: serviceInfo.price,
          userName
        });

        // Guardar información del servicio en localStorage para recuperarla después de la redirección
        localStorage.setItem('last_payment_service', serviceId);
        localStorage.setItem('last_payment_amount', serviceInfo.price.toString());
        localStorage.setItem('last_payment_service_title', serviceInfo.title);

        // URL API con fallback
        const apiUrl = `${API_BASE_URL}/payments/preference`;
        console.log('URL de la API:', apiUrl);

        // Datos para enviar a la API
        const paymentData = {
          serviceId: serviceId,
          serviceTitle: serviceInfo.title,
          servicePrice: serviceInfo.price,
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
  }, [serviceInfo, serviceId, userName, userEmail]);

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
      setProjectData(answers);

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
    const maxSDKCheckAttempts = 20; // Máximo de intentos (4 segundos)

    // Función para verificar si el SDK de MercadoPago está cargado
    const checkMercadoPagoSDK = () => {
      sdkCheckAttempts++;

      if (typeof window.MercadoPago !== 'function') {
        if (sdkCheckAttempts < maxSDKCheckAttempts) {
          console.log(`⏳ Esperando a que cargue el SDK de MercadoPago... (intento ${sdkCheckAttempts})`);
          setTimeout(checkMercadoPagoSDK, 200); // Verificar cada 200ms
        } else {
          console.error('❌ Error: No se pudo cargar el SDK de MercadoPago después de varios intentos');
          setError('No se pudo cargar el procesador de pagos. Por favor, recarga la página');
          setLoading(false);
        }
        return;
      }

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

                  // Mensajes de error simplificados
                  let errorMessage = 'Error al procesar el pago';
                  if (error.message) {
                    if (error.message.includes('bin')) {
                      errorMessage = 'Número de tarjeta no reconocido';
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
                  return new Promise<void>((resolve) => setTimeout(resolve, 1500));
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

    // Verificar si venimos de una redirección después de un pago
    const status = new URLSearchParams(location.search).get('status');
    const paymentId = new URLSearchParams(location.search).get('payment_id');

    // Cargar los servicios del usuario al iniciar
    if (user && user.id) {
      console.log('🔄 Cargando servicios para el usuario:', user.id);
      loadUserServices();
    }
  }, [user, location, loadUserServices]);

  // Renderizado condicional según estado del servicio
  if (!serviceInfo) {
    return (
      <PageContainer>
        <GlobalBackground />
        <ContentContainer>
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
        </ContentContainer>
      </PageContainer>
    );
  }

  // Si no hay usuario autenticado o está en proceso de verificación
  if (!userEmail && !error) {
    return (
      <PageContainer>
        <GlobalBackground />
        <ContentContainer>
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
        </ContentContainer>
      </PageContainer>
    );
  }

  // Mostrar mensaje según estado del pago
  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <LoadingContainer>
            <div className="loader"></div>
            <p>Procesando tu pago...</p>
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
              <div className="brick-reset-container">
                <div id="payment-brick-container" style={{ width: '100%', position: 'relative' }}>
                  {!mpLoaded && !loading && <LoadingContainer><p>Cargando formulario...</p></LoadingContainer>}
                </div>
              </div>
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
              <div className="brick-reset-container">
                <div id="payment-brick-container" style={{ width: '100%', position: 'relative' }}>
                  {!mpLoaded && !loading && <LoadingContainer><p>Cargando formulario...</p></LoadingContainer>}
                </div>
              </div>
            </div>
          );
        }

        return (
          <BrickContainer className="BrickContainer">
            <div className="brick-reset-container">
              <div id="payment-brick-container" style={{ width: '100%', position: 'relative' }}>
                {!mpLoaded && !loading && <LoadingContainer><p>Cargando formulario...</p></LoadingContainer>}
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

  return (
    <PageContainer>
      <GlobalBackground />

      <ContentContainer>
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

          {/* Si no hay servicio seleccionado, mostrar mensaje */}
          {!serviceId || serviceInfo.price === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>No se ha seleccionado un servicio válido.</p>
              <Link to="/">Volver al inicio</Link>
            </div>
          ) : (
            <>
              <OrderSummary>
                <OrderItem>
                  <OrderLabel>Servicio:</OrderLabel>
                  <OrderValue>{serviceInfo.title}</OrderValue>
                </OrderItem>
                <OrderItem>
                  <OrderLabel>Cliente:</OrderLabel>
                  <OrderValue>{userName}</OrderValue>
                </OrderItem>
                <OrderItem>
                  <OrderLabel>Total:</OrderLabel>
                  <OrderTotal>${serviceInfo.price.toLocaleString()}</OrderTotal>
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
};

export default Payment; 
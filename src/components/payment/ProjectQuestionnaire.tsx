import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Props para el componente
interface ProjectQuestionnaireProps {
  serviceType: string;
  onComplete: (answers: Record<string, any>) => void;
  onClose?: () => void;
  isVisible: boolean;
}

// Estilos
const OverlayContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(5px);
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
  }
`;

const QuestionnaireCard = styled(motion.div)`
  background: rgba(25, 25, 25, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    border-radius: 12px;
    max-height: 85vh;
    margin-bottom: 2rem;
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
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const StepIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const StepDot = styled.div<{ active: boolean, completed: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props =>
    props.completed ? '#00FFFF' :
      props.active ? 'rgba(0, 255, 255, 0.5)' :
        'rgba(255, 255, 255, 0.2)'
  };
  transition: all 0.3s ease;
`;

const Body = styled.div`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Question = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #f5f5f5;
`;

const Description = styled.p`
  font-size: 0.9rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.7);
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.2);
  }
  
  option {
    background: #222;
    color: white;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CheckboxGroup = styled.div`
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    margin-bottom: 0.8rem;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  cursor: pointer;
  line-height: 1.4;
  
  input {
    margin-right: 0.5rem;
    margin-top: 0.2rem;
    accent-color: #00FFFF;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 0.8rem;
    font-size: 0.95rem;
  }
`;

const RadioGroup = styled.div`
  margin-bottom: 1rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.8rem;
  cursor: pointer;
  line-height: 1.4;
  
  input {
    margin-right: 0.5rem;
    margin-top: 0.2rem;
    accent-color: #00FFFF;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }
`;

const ColorPicker = styled.input`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }
`;

const ErrorMessage = styled.p`
  color: #FF5555;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`;

const InfoMessage = styled.p`
  color: rgba(0, 255, 255, 0.8);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  background: rgba(0, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #00FFFF;
`;

// Definiciones de preguntas por tipo de servicio
const questionsByServiceType: Record<string, Array<{
  id: string;
  question: string;
  description?: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'color';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
}>> = {
  // Preguntas comunes para todos los servicios
  common: [
    {
      id: 'businessName',
      question: '¿Cuál es el nombre de tu negocio o proyecto?',
      description: 'Este nombre se utilizará en títulos, encabezados y metadata del sitio.',
      type: 'text',
      required: true,
      placeholder: 'Ej. Cafetería El Aroma'
    },
    {
      id: 'contactPhone',
      question: '¿Cuál es tu número de contacto?',
      description: 'Necesitamos tu número para comunicarnos contigo durante el desarrollo del proyecto en caso de dudas o aclaraciones.',
      type: 'text',
      required: true,
      placeholder: 'Ej. +54 9 11 1234-5678 o 11 1234-5678'
    },
    {
      id: 'businessDescription',
      question: 'Describe brevemente tu negocio o proyecto',
      description: 'Una descripción concisa de lo que haces, tus servicios o productos.',
      type: 'textarea',
      required: true,
      placeholder: 'Somos una cafetería especializada en café de origen con opciones veganas y orgánicas...'
    },
    {
      id: 'targetAudience',
      question: '¿Cuál es tu público objetivo?',
      description: 'Conocer tu audiencia nos ayuda a diseñar una experiencia más efectiva.',
      type: 'textarea',
      placeholder: 'Ej. Jóvenes profesionales entre 25-40 años, amantes del café de especialidad...'
    },
    {
      id: 'socialNetworks',
      question: '¿Cuáles son tus redes sociales?',
      description: 'Comparte tus enlaces de redes sociales para entender mejor tu identidad de marca y establecer conexiones.',
      type: 'textarea',
      placeholder: 'Instagram: @ejemplo\nFacebook: /ejemplo\nTikTok: @ejemplo\nLinkedIn: /in/ejemplo'
    },
    {
      id: 'colorPreference',
      question: '¿Tienes preferencias de colores para tu sitio?',
      description: 'Selecciona el color principal para tu marca (puedes ajustarlo después).',
      type: 'color',
      placeholder: '#3a7bd5'
    }
  ],

  // Preguntas específicas para landing page
  landing: [
    {
      id: 'callToAction',
      question: '¿Cuál es la acción principal que quieres que tomen los visitantes?',
      description: 'Esto nos ayudará a diseñar un llamado a la acción efectivo.',
      type: 'select',
      options: [
        { value: 'contact', label: 'Contactar para más información' },
        { value: 'buy', label: 'Comprar un producto' },
        { value: 'subscribe', label: 'Suscribirse a newsletter/servicio' },
        { value: 'download', label: 'Descargar un recurso' },
        { value: 'visit', label: 'Visitar ubicación física' },
        { value: 'other', label: 'Otro (especificar en comentarios)' }
      ],
      required: true
    },
    {
      id: 'keyFeatures',
      question: '¿Qué características o beneficios principales quieres destacar?',
      description: 'Enumera hasta 3-5 puntos clave que quieres que tus visitantes conozcan.',
      type: 'textarea',
      placeholder: 'Ej. 1. Café de especialidad\n2. Opciones veganas\n3. Ambiente cálido y acogedor'
    },
    {
      id: 'landingSections',
      question: '¿Qué secciones te gustaría incluir en tu landing page?',
      description: 'Describe las secciones que quieres incluir y cómo te gustaría organizarlas.',
      type: 'textarea',
      placeholder: 'Ej. 1. Header con logo y menú\n2. Banner principal con imagen y llamado a la acción\n3. Sección Sobre Nosotros\n4. Galería de productos/servicios\n5. Testimonios\n6. Formulario de contacto\n7. Footer con información de contacto'
    }
  ],

  // Preguntas para sitios web de 5 rutas
  web5: [
    {
      id: 'desiredPages',
      question: '¿Qué 5 páginas te gustaría incluir en tu sitio web?',
      description: 'Selecciona exactamente 5 páginas que conformarán tu sitio web.',
      type: 'checkbox',
      options: [
        { value: 'home', label: 'Inicio' },
        { value: 'about', label: 'Nosotros/Quienes Somos' },
        { value: 'services', label: 'Servicios' },
        { value: 'products', label: 'Productos/Catálogo' },
        { value: 'portfolio', label: 'Portfolio/Trabajos' },
        { value: 'testimonials', label: 'Testimonios/Reseñas' },
        { value: 'faq', label: 'Preguntas Frecuentes' },
        { value: 'blog', label: 'Blog/Noticias' },
        { value: 'contact', label: 'Contacto' }
      ]
    },
    {
      id: 'websiteStyle',
      question: '¿Qué estilo prefieres para tu sitio web?',
      description: 'Esto nos dará una idea de la dirección de diseño.',
      type: 'radio',
      options: [
        { value: 'minimal', label: 'Minimalista y clean' },
        { value: 'corporate', label: 'Corporativo y profesional' },
        { value: 'creative', label: 'Creativo y llamativo' },
        { value: 'luxury', label: 'Elegante y de lujo' },
        { value: 'playful', label: 'Divertido e informal' }
      ]
    },
    {
      id: 'competitors',
      question: '¿Tienes ejemplos de sitios web que te gusten o competidores?',
      description: 'Esto nos ayudará a entender mejor tu visión.',
      type: 'textarea',
      placeholder: 'URLs o nombres de sitios que te gusten como referencia'
    }
  ],

  // Preguntas para sitios web de 7+ rutas
  web7: [
    {
      id: 'desiredPages',
      question: '¿Qué páginas te gustaría incluir en tu sitio web?',
      description: 'Selecciona todas las páginas que deseas para tu sitio web (mínimo 7).',
      type: 'checkbox',
      options: [
        { value: 'home', label: 'Inicio' },
        { value: 'about', label: 'Nosotros/Quienes Somos' },
        { value: 'services', label: 'Servicios' },
        { value: 'products', label: 'Productos/Catálogo' },
        { value: 'portfolio', label: 'Portfolio/Trabajos' },
        { value: 'testimonials', label: 'Testimonios/Reseñas' },
        { value: 'faq', label: 'Preguntas Frecuentes' },
        { value: 'blog', label: 'Blog/Noticias' },
        { value: 'contact', label: 'Contacto' },
        { value: 'team', label: 'Equipo/Personal' },
        { value: 'pricing', label: 'Precios/Planes' },
        { value: 'clients', label: 'Clientes/Casos de Éxito' },
        { value: 'locations', label: 'Ubicaciones/Sucursales' },
        { value: 'gallery', label: 'Galería' },
        { value: 'events', label: 'Eventos/Calendario' }
      ]
    },
    {
      id: 'customPages',
      question: '¿Necesitas páginas personalizadas adicionales?',
      description: 'Describe cualquier página específica que necesites y que no esté en la lista anterior.',
      type: 'textarea',
      placeholder: 'Ej. Página de reservas, área de miembros, calculadora de presupuestos, etc.'
    },
    {
      id: 'websiteStyle',
      question: '¿Qué estilo prefieres para tu sitio web?',
      description: 'Esto nos dará una idea de la dirección de diseño.',
      type: 'radio',
      options: [
        { value: 'minimal', label: 'Minimalista y clean' },
        { value: 'corporate', label: 'Corporativo y profesional' },
        { value: 'creative', label: 'Creativo y llamativo' },
        { value: 'luxury', label: 'Elegante y de lujo' },
        { value: 'playful', label: 'Divertido e informal' }
      ]
    },
    {
      id: 'additionalFeatures',
      question: '¿Qué funcionalidades especiales necesitas?',
      description: 'Selecciona cualquier característica adicional que deseas.',
      type: 'checkbox',
      options: [
        { value: 'members', label: 'Área de miembros/usuarios' },
        { value: 'bookings', label: 'Sistema de reservas/citas' },
        { value: 'gallery', label: 'Galería avanzada' },
        { value: 'multilanguage', label: 'Soporte multiidioma' },
        { value: 'forms', label: 'Formularios personalizados' },
        { value: 'search', label: 'Buscador avanzado' },
        { value: 'map', label: 'Mapa interactivo' }
      ]
    },
    {
      id: 'competitors',
      question: '¿Tienes ejemplos de sitios web que te gusten o competidores?',
      description: 'Esto nos ayudará a entender mejor tu visión.',
      type: 'textarea',
      placeholder: 'URLs o nombres de sitios que te gusten como referencia'
    }
  ],

  // Preguntas para blog
  blog: [
    {
      id: 'blogTopics',
      question: '¿Sobre qué temas principales escribirás en tu blog?',
      description: 'Esto nos ayuda a configurar categorías y diseño adecuados.',
      type: 'textarea',
      placeholder: 'Ej. Recetas, consejos de nutrición, estilo de vida saludable'
    },
    {
      id: 'blogFeatures',
      question: '¿Qué características necesitas en tu blog?',
      description: 'Selecciona las funcionalidades que consideras importantes.',
      type: 'checkbox',
      options: [
        { value: 'categories', label: 'Categorías y etiquetas' },
        { value: 'search', label: 'Buscador' },
        { value: 'comments', label: 'Sistema de comentarios' },
        { value: 'subscriptions', label: 'Suscripciones por email' },
        { value: 'featured', label: 'Posts destacados' },
        { value: 'social', label: 'Integración con redes sociales' }
      ]
    }
  ],

  // Preguntas para tiendas online
  ecommerce: [
    {
      id: 'productTypes',
      question: '¿Qué tipo de productos venderás?',
      description: 'Una descripción general de tus productos.',
      type: 'textarea',
      placeholder: 'Ej. Ropa artesanal, productos digitales, accesorios de cocina'
    },
    {
      id: 'paymentMethods',
      question: '¿Qué métodos de pago te gustaría ofrecer?',
      description: 'Selecciona todas las opciones que te interesen.',
      type: 'checkbox',
      options: [
        { value: 'mp', label: 'MercadoPago' },
        { value: 'bank', label: 'Transferencia bancaria' },
        { value: 'cash', label: 'Efectivo contra entrega' },
        { value: 'other', label: 'Otro (especificar en comentarios)' }
      ]
    },
    {
      id: 'shippingOptions',
      question: '¿Cómo planeas gestionar el envío?',
      description: 'Información sobre tus métodos de envío.',
      type: 'radio',
      options: [
        { value: 'national', label: 'Envíos nacionales' },
        { value: 'local', label: 'Solo envíos locales' },
        { value: 'pickup', label: 'Retiro en tienda' },
        { value: 'mixed', label: 'Combinación de opciones' }
      ]
    }
  ],

  // Preguntas para portfolio
  portfolio: [
    {
      id: 'showcaseWorks',
      question: '¿Qué tipo de trabajos o proyectos mostrarás?',
      description: 'Una descripción general de lo que incluirás en tu portfolio.',
      type: 'textarea',
      placeholder: 'Ej. Diseños gráficos, fotografías, proyectos de arquitectura'
    },
    {
      id: 'portfolioCategories',
      question: '¿Te gustaría categorizar tus trabajos?',
      description: 'Si tienes múltiples tipos de trabajos, podemos crear categorías.',
      type: 'textarea',
      placeholder: 'Ej. Branding, Diseño Web, Ilustración'
    }
  ]
};

// Función para determinar qué preguntas mostrar basado en el tipo de servicio
const getQuestionsForServiceType = (serviceType: string) => {
  let questions = [...questionsByServiceType.common];

  // Agregar preguntas específicas según el tipo de servicio
  switch (serviceType) {
    case 'landing':
      questions = [...questions, ...questionsByServiceType.landing];
      break;
    case 'web5':
      questions = [...questions, ...questionsByServiceType.web5];
      break;
    case 'web7':
      questions = [...questions, ...questionsByServiceType.web7];
      break;
    case 'blog':
      questions = [...questions, ...questionsByServiceType.blog];
      break;
    case 'ecommerce':
      questions = [...questions, ...questionsByServiceType.ecommerce];
      break;
    case 'portfolio':
      questions = [...questions, ...questionsByServiceType.portfolio];
      break;
    default:
      // Si no hay un tipo específico, solo usar preguntas comunes
      break;
  }

  return questions;
};

// Componente principal
const ProjectQuestionnaire: React.FC<ProjectQuestionnaireProps> = ({
  serviceType,
  onComplete,
  onClose = () => { }, // eslint-disable-line @typescript-eslint/no-unused-vars
  isVisible
}) => {
  // Estado para las respuestas y paso actual
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener las preguntas para este tipo de servicio
  const questions = getQuestionsForServiceType(serviceType);

  // Reiniciar cuando cambia el tipo de servicio
  useEffect(() => {
    setAnswers({});
    setCurrentStep(0);
  }, [serviceType]);

  // Función para actualizar una respuesta
  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Verificar si el paso actual tiene campos requeridos completos
  const isCurrentStepValid = () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion.required) return true;

    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === '') return false;

    if (Array.isArray(answer) && answer.length === 0) return false;

    // Validación especial para número de teléfono
    if (currentQuestion.id === 'contactPhone') {
      const phoneRegex = /^(\+54\s?9?\s?)?(\d{2,4})\s?(\d{4})-?(\d{4})$|^(\+54\s?9?\s?)?(\d{10,11})$/;
      if (!phoneRegex.test(answer.toString().trim())) {
        return false;
      }
    }

    // Validación especial para web5 - exactamente 5 páginas
    if (serviceType === 'web5' &&
      currentQuestion.id === 'desiredPages' &&
      Array.isArray(answer) &&
      answer.length !== 5) {
      return false;
    }

    // Validación especial para web7 - mínimo 7 páginas
    if (serviceType === 'web7' &&
      currentQuestion.id === 'desiredPages' &&
      Array.isArray(answer) &&
      answer.length < 7) {
      return false;
    }

    return true;
  };

  // Manejar el cambio en inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;

      // Caso especial para web5 - limitar a 5 selecciones
      if (serviceType === 'web5' && name === 'desiredPages') {
        const currentSelections = answers[name] || [];

        if (checked) {
          // Si ya hay 5 seleccionadas y quiere añadir otra, no permitirlo
          if (currentSelections.length >= 5) return;

          updateAnswer(name, [...currentSelections, value]);
        } else {
          // Si desmarca una opción, eliminamos de la lista
          updateAnswer(name, currentSelections.filter((v: string) => v !== value));
        }
      } else {
        // Comportamiento normal para otros checkboxes
        updateAnswer(name,
          answers[name]
            ? checked
              ? [...answers[name], value]
              : answers[name].filter((v: string) => v !== value)
            : checked ? [value] : []
        );
      }
    } else {
      updateAnswer(name, value);
    }
  };

  // Avanzar al siguiente paso
  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Es el último paso, enviar respuestas
      submitAnswers();
    }
  };

  // Volver al paso anterior
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Enviar respuestas
  const submitAnswers = async () => {
    setIsSubmitting(true);

    try {
      // Aquí podrías enviar las respuestas a tu backend si fuera necesario

      // Notificar al componente padre que se ha completado
      onComplete(answers);
    } catch (error) {
      console.error('Error al enviar respuestas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar el contenido según el tipo de pregunta actual
  const renderQuestionContent = () => {
    const currentQuestion = questions[currentStep];

    if (!currentQuestion) return null;

    // Establecer valor por defecto si no existe
    if (answers[currentQuestion.id] === undefined) {
      switch (currentQuestion.type) {
        case 'checkbox':
          updateAnswer(currentQuestion.id, []);
          break;
        case 'color':
          updateAnswer(currentQuestion.id, '#3a7bd5');
          break;
        default:
          updateAnswer(currentQuestion.id, '');
      }
    }

    // Mensajes de validación específicos para limites de páginas
    const renderValidationMessage = () => {
      // Validación para número de teléfono
      if (currentQuestion.id === 'contactPhone') {
        const phoneValue = answers[currentQuestion.id] || '';
        const phoneRegex = /^(\+54\s?9?\s?)?(\d{2,4})\s?(\d{4})-?(\d{4})$|^(\+54\s?9?\s?)?(\d{10,11})$/;

        if (phoneValue && !phoneRegex.test(phoneValue.toString().trim())) {
          return <ErrorMessage>Por favor ingresa un número de teléfono válido (ej: 11 1234-5678 o +54 9 11 1234-5678)</ErrorMessage>;
        }

        if (phoneValue && phoneRegex.test(phoneValue.toString().trim())) {
          return <InfoMessage>✓ Número de teléfono válido</InfoMessage>;
        }
      }

      if (serviceType === 'web5' && currentQuestion.id === 'desiredPages') {
        const selected = answers[currentQuestion.id] ? answers[currentQuestion.id].length : 0;
        if (selected === 5) {
          return <InfoMessage>Has seleccionado exactamente 5 páginas. ¡Perfecto!</InfoMessage>;
        } else {
          return <InfoMessage>Tu plan incluye exactamente 5 páginas. Por favor selecciona {5 - selected} página(s) más.</InfoMessage>;
        }
      }

      if (serviceType === 'web7' && currentQuestion.id === 'desiredPages') {
        const selected = answers[currentQuestion.id] ? answers[currentQuestion.id].length : 0;
        if (selected >= 7) {
          return <InfoMessage>Has seleccionado {selected} páginas. ¡Excelente!</InfoMessage>;
        } else {
          return <InfoMessage>Tu plan incluye 7 o más páginas. Por favor selecciona al menos {7 - selected} página(s) más.</InfoMessage>;
        }
      }

      return null;
    };

    switch (currentQuestion.type) {
      case 'text':
        return (
          <InputGroup>
            <TextInput
              name={currentQuestion.id}
              value={answers[currentQuestion.id] || ''}
              onChange={handleInputChange}
              placeholder={currentQuestion.placeholder}
              required={currentQuestion.required}
            />
            {renderValidationMessage()}
          </InputGroup>
        );

      case 'textarea':
        return (
          <InputGroup>
            <TextArea
              name={currentQuestion.id}
              value={answers[currentQuestion.id] || ''}
              onChange={handleInputChange}
              placeholder={currentQuestion.placeholder}
              required={currentQuestion.required}
            />
          </InputGroup>
        );

      case 'select':
        return (
          <InputGroup>
            <SelectInput
              name={currentQuestion.id}
              value={answers[currentQuestion.id] || ''}
              onChange={handleInputChange}
              required={currentQuestion.required}
            >
              <option value="">Selecciona una opción</option>
              {currentQuestion.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </InputGroup>
        );

      case 'checkbox':
        return (
          <CheckboxGroup>
            {currentQuestion.options?.map(option => (
              <CheckboxLabel key={option.value}>
                <input
                  type="checkbox"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option.value)}
                  onChange={handleInputChange}
                />
                {option.label}
              </CheckboxLabel>
            ))}
            {renderValidationMessage()}
          </CheckboxGroup>
        );

      case 'radio':
        return (
          <RadioGroup>
            {currentQuestion.options?.map(option => (
              <RadioLabel key={option.value}>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={handleInputChange}
                />
                {option.label}
              </RadioLabel>
            ))}
          </RadioGroup>
        );

      case 'color':
        return (
          <InputGroup>
            <ColorPicker
              type="color"
              name={currentQuestion.id}
              value={answers[currentQuestion.id] || '#3a7bd5'}
              onChange={handleInputChange}
            />
          </InputGroup>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <OverlayContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <QuestionnaireCard
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Header>
              <Title>Información de tu proyecto</Title>
              <StepIndicator>
                {questions.map((_, index) => (
                  <StepDot
                    key={index}
                    active={index === currentStep}
                    completed={index < currentStep}
                  />
                ))}
              </StepIndicator>
            </Header>

            <Body>
              {questions[currentStep] && (
                <>
                  <Question>{questions[currentStep].question}</Question>
                  {questions[currentStep].description && (
                    <Description>{questions[currentStep].description}</Description>
                  )}

                  {renderQuestionContent()}

                  <ButtonsContainer>
                    <Button
                      onClick={prevStep}
                      disabled={currentStep === 0}
                    >
                      Anterior
                    </Button>

                    <Button
                      primary
                      onClick={nextStep}
                      disabled={!isCurrentStepValid() || isSubmitting}
                    >
                      {currentStep < questions.length - 1 ? 'Siguiente' : 'Finalizar'}
                    </Button>
                  </ButtonsContainer>
                </>
              )}
            </Body>
          </QuestionnaireCard>
        </OverlayContainer>
      )}
    </AnimatePresence>
  );
};

export default ProjectQuestionnaire; 
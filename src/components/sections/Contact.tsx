import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { media } from '../../styles/breakpoints';
import Button from '../ui/Button';

// Interfaces para las props de los componentes estilizados
interface StyledProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

interface InputProps extends StyledProps {
  type?: string;
  id?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-required'?: boolean;
}

interface LabelProps extends StyledProps {
  htmlFor?: string;
}

interface ButtonProps extends StyledProps {
  type?: "button" | "submit" | "reset";
}

interface FormProps extends StyledProps {
  onSubmit?: (e: React.FormEvent) => void;
}

// Componentes estilizados
const ContactSection = styled.section<StyledProps>`
  /* padding: 100px 0; */
  position: relative;
  overflow: hidden;
  color: white;
  padding: 100px 0; /* Padding base */
  
  ${media.lg} {
      padding: 90px 0;
  }
  
  ${media.md} {
    padding: 70px 0; /* Menos padding en tablets */
  }
  
  ${media.xs} {
    padding: 50px 0 30px; /* Menos padding en móviles, un poco menos abajo */
  }
`;

const ContentContainer = styled.div<StyledProps>`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 5;

  @media (max-width: 480px) {
    padding: 0 1rem; /* Reduced padding for very small screens */
  }
`;

const SectionTitle = styled.h2<StyledProps>`
  font-size: clamp(2.5rem, 8vw, 4rem);
  text-align: center;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  ${media.xs} {
    font-size: clamp(2rem, 7vw, 3.5rem); /* Más pequeño en móviles */
    margin-bottom: 1rem;
  }
`;

const SectionSubtitle = styled.p<StyledProps>`
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  
  ${media.md} {
    margin-bottom: 3rem; /* Menos margen en tablets */
    font-size: 1.1rem;
  }
  
  ${media.xs} {
    margin-bottom: 2rem; /* Menos margen en móviles */
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const ContactGrid = styled.div<StyledProps>`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 4rem;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  
  ${media.xs} {
    gap: 2.5rem;
  }
`;

const ContactInfoContainer = styled.div<StyledProps>`
  display: flex;
  flex-direction: column;
  /* El gap se gestiona en ContactInfoList */
`;

// Contenedor para lista de ContactItem con espaciado uniforme
const ContactInfoList = styled(motion.div) <StyledProps>`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  ${media.xs} {
    gap: 1rem;
  }
`;

const ContactItem = styled(motion.div) <StyledProps>`
  display: flex;
  align-items: flex-start;
  min-height: 60px;
  gap: 1.5rem;
  
  ${media.xs} {
    gap: 1rem; /* Menos espacio entre icono y texto */
  }
`;

const IconContainer = styled.div<StyledProps>`
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 0, 255, 0.2) 0%, rgba(0, 255, 255, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
  
  ${media.xs} {
    width: 50px; /* Más pequeño en móviles */
    height: 50px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const InfoContent = styled.div<StyledProps>`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span<StyledProps>`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.3rem;
`;

const InfoValue = styled.span<StyledProps>`
  font-size: 1.1rem;
  color: white;
`;

const SocialLinks = styled.div<StyledProps>`
  display: flex;
  gap: 1rem;
  margin-top: 3rem;
  
  ${media.xs} {
    margin-top: 2rem;
    justify-content: center; /* Centrar en móviles */
  }
`;

const ContactIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  margin: 0 0.5rem;
  color: white;
  text-decoration: none;
  font-size: 1.2rem;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
  
  &:focus {
    outline: 3px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover::before {
    transform: translateX(100%);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ContactForm = styled(motion.form) <FormProps>`
  background: rgba(17, 17, 17, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    padding: 2rem;
  }
  
  ${media.xs} {
    padding: 1.2rem; /* Reducir padding un poco más */
    border-radius: 12px;
  }
`;

const FormTitle = styled.h3<StyledProps>`
  font-size: 1.8rem;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #00FFFF 0%, #FFFF00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  ${media.xs} {
    font-size: 1.4rem; /* Reducir más el título */
    margin-bottom: 1.2rem;
    text-align: center; 
  }
`;

const InputGroup = styled.div<StyledProps>`
  margin-bottom: 1.5rem;
  
  ${media.xs} {
    margin-bottom: 1rem; /* Reducir margen */
  }
`;

const FormLabel = styled.label<LabelProps>`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  
  ${media.xs} {
    font-size: 0.8rem; /* Reducir label */
    margin-bottom: 0.4rem;
  }
`;

const FormInput = styled.input<InputProps>`
  width: 100%;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  ${media.xs} {
    padding: 0.8rem 1rem; /* Ajustar padding */
    font-size: 0.9rem;
    min-height: 44px; 
    height: auto; 
  }
`;

const FormTextarea = styled.textarea<InputProps>`
  width: 100%;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #00FFFF;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  ${media.xs} {
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
    min-height: 100px; /* Reducir altura mínima */
    height: auto; 
  }
`;

// Mensaje de feedback tras submit
const FeedbackMessage = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  text-align: center;
`;

// Animaciones
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const Contact: React.FC = () => {
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // URL del backend (se puede configurar con VITE_CORS_BACK en .env)
      const url = window.location.port
        ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
        : import.meta.env.VITE_CORS_BACK || `${window.location.protocol}//${window.location.hostname}`;
      const res = await fetch(`${url}/api/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      // Intentamos parsear la respuesta JSON sin guardar en variable innecesaria
      await res.json().catch(e => console.warn('No se pudo parsear JSON de respuesta:', e));
      if (res.ok) {
        setFeedbackMessage('¡Gracias! Te contestaremos pronto.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFeedbackMessage('¡Gracias! Te contestaremos pronto.');
      }
    } catch (error) {
      setFeedbackMessage('¡Gracias! Te contestaremos pronto.');
    }
  };

  return (
    <ContactSection id="contacto">
      <ContentContainer>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle>Contáctanos</SectionTitle>
          <SectionSubtitle>
            ¿Tienes un proyecto en mente? Estamos aquí para ayudarte a transformar
            tus ideas en soluciones digitales exitosas. Contáctanos para una consulta gratuita.
          </SectionSubtitle>
        </motion.div>

        <ContactGrid>
          <ContactInfoContainer>
            <ContactInfoList
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <ContactItem variants={fadeInUpVariants}>
                <IconContainer>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </IconContainer>
                <InfoContent>
                  <InfoLabel>Email Comercial</InfoLabel>
                  <InfoValue>contacto@circuitprompt.com</InfoValue>
                </InfoContent>
              </ContactItem>

              <ContactItem variants={fadeInUpVariants}>
                <IconContainer>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </IconContainer>
                <InfoContent>
                  <InfoLabel>Ubicación</InfoLabel>
                  <InfoValue>Buenos Aires, Argentina</InfoValue>
                </InfoContent>
              </ContactItem>

              <ContactItem variants={fadeInUpVariants}>
                <IconContainer>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </IconContainer>
                <InfoContent>
                  <InfoLabel>Horario de Atención</InfoLabel>
                  <InfoValue>Lunes a Viernes: 9:00 - 18:00 (GMT-3)</InfoValue>
                </InfoContent>
              </ContactItem>

              <ContactItem variants={fadeInUpVariants}>
                <IconContainer>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </IconContainer>
                <InfoContent>
                  <InfoLabel>Respuesta Garantizada</InfoLabel>
                  <InfoValue>Respondemos en menos de 24 horas</InfoValue>
                </InfoContent>
              </ContactItem>

              <SocialLinks>
                <ContactIcon
                  href="https://github.com/Lucas-Dono"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </ContactIcon>

                <ContactIcon
                  href="https://www.linkedin.com/in/lucas-dono-6990a9142/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </ContactIcon>

                <ContactIcon
                  href="https://twitter.com/circuitprompt"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </ContactIcon>

                <ContactIcon
                  href="https://instagram.com/circuitprompt"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </ContactIcon>
              </SocialLinks>
            </ContactInfoList>
          </ContactInfoContainer>

          <ContactForm
            onSubmit={handleSubmit}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUpVariants}
          >
            <FormTitle>Solicita una Consulta Gratuita</FormTitle>

            <InputGroup>
              <FormLabel htmlFor="name">Nombre de la empresa o contacto</FormLabel>
              <FormInput
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre de tu empresa"
                required
                aria-required={true}
              />
            </InputGroup>

            <InputGroup>
              <FormLabel htmlFor="email">Correo electrónico corporativo</FormLabel>
              <FormInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contacto@tuempresa.com"
                required
                aria-required={true}
              />
            </InputGroup>

            <InputGroup>
              <FormLabel htmlFor="subject">Tipo de proyecto</FormLabel>
              <FormInput
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Ej: Desarrollo web, E-commerce, Aplicación móvil"
                required
                aria-required={true}
              />
            </InputGroup>

            <InputGroup>
              <FormLabel htmlFor="message">Describe tu proyecto</FormLabel>
              <FormTextarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Cuéntanos sobre tu proyecto, objetivos, presupuesto estimado y timeline..."
                required
                aria-required={true}
              />
            </InputGroup>

            <div>
              <Button
                type="submit"
                primary={true}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  marginTop: '1rem',
                  padding: '1rem 2rem'
                }}
              >
                Enviar Solicitud
              </Button>
            </div>

            {feedbackMessage && (
              <FeedbackMessage role="alert" aria-live="polite">
                {feedbackMessage}
              </FeedbackMessage>
            )}
          </ContactForm>
        </ContactGrid>
      </ContentContainer>
    </ContactSection>
  );
};

export default Contact; 
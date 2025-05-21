import React, { ReactNode, MouseEvent } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  primary?: boolean;
  outline?: boolean;
  icon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  small?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'special' | 'danger' | 'success';
  style?: React.CSSProperties;
}

interface StyledButtonProps {
  $primary?: boolean;
  $outline?: boolean;
  $small?: boolean;
  $variant?: string;
}

const StyledButton = styled(motion.button)<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: ${(props) => (props.$small ? '0.5rem 1rem' : '0.8rem 1.8rem')};
  font-size: ${(props) => (props.$small ? '0.875rem' : '1rem')};
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  border: 2px solid transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  /* Enfoque mejorado para accesibilidad */
  &:focus {
    outline: 3px solid rgba(255, 255, 255, 0.6);
    outline-offset: 2px;
  }

  ${({ $primary, $outline }) => {
    if (!$outline) {
      if ($primary) {
        return css`
          background: linear-gradient(135deg, #FF00FF 0%, #00DDFF 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.8);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          letter-spacing: 0.5px;

          &:hover:not(:disabled) {
            filter: brightness(1.1);
            box-shadow: 0 6px 20px rgba(255, 0, 255, 0.4);
          }
        `;
      } else {
        return css`
          background: rgba(40, 40, 40, 0.95);
          color: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

          &:hover:not(:disabled) {
            background: rgba(60, 60, 60, 0.95);
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
          }
        `;
      }
    } else {
      if ($primary) {
        return css`
          background: rgba(20, 20, 20, 0.8);
          border: 2px solid #FF33FF;
          color: #FF33FF;
          text-shadow: 0 0 8px rgba(255, 0, 255, 0.3);

          &:hover:not(:disabled) {
            background: rgba(30, 30, 30, 0.95);
            border-color: #FF66FF;
            box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
          }
        `;
      } else {
        return css`
          background: rgba(30, 30, 30, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.6);
          color: rgba(255, 255, 255, 0.9);

          &:hover:not(:disabled) {
            background: rgba(50, 50, 50, 0.95);
            border-color: rgba(255, 255, 255, 0.8);
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          }
        `;
      }
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(70%);
    box-shadow: none;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
  }
  &:active:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(0.95);
  }
  
  .ripple {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .icon {
    display: inline-flex;
    align-items: center;
  }
`;

const Button: React.FC<ButtonProps> = ({
  children,
  primary = true,
  outline = false,
  icon,
  onClick,
  className,
  small = false,
  disabled = false,
  type = 'button',
  variant = 'default',
  style,
}) => {
  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    const rect = button.getBoundingClientRect();
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(circle);
    
    const handleAnimationEnd = () => {
        if (circle.parentNode) {
        circle.remove();
      }
    };
    circle.addEventListener('animationend', handleAnimationEnd, { once: true });
  };
  
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    if (onClick) onClick(event);
  };
  
  return (
    <StyledButton
      className={className}
      $primary={primary}
      $outline={outline}
      $small={small}
      $variant={variant}
      onClick={handleClick}
      disabled={disabled}
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      aria-disabled={disabled}
      style={style}
    >
      {icon && <span className="icon">{icon}</span>}
      {children}
    </StyledButton>
  );
};

export default Button; 
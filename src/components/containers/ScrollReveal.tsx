import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface ScrollRevealProps {
  children: React.ReactNode;
  margin?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
}

// Define tus variantes de animación
const revealVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  margin = '-50px',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  triggerOnce = true,
  className = ''
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: triggerOnce,
    threshold: threshold,
    rootMargin: margin
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else if (!triggerOnce) {
      // Si triggerOnce es false, puedes hacer que la animación se revierta cuando el elemento no esté en vista
      controls.start('hidden');
    }
  }, [controls, inView, triggerOnce]);

  // Define los props para el componente motion.div
  //const revealProps = {
    //ref: ref,
    //initial: "hidden",
    //animate: controls,
    //variants: revealVariants,
    //transition: { duration: duration, delay: delay }
  //};

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={revealVariants}
      transition={{ duration: duration, delay: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal; 
import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useGameLoop } from './useGameLoop';

// Modal contenedor con estilo neón
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled(motion.div)`
  position: relative;
  width: 800px;
  max-width: 90vw;
  height: 600px;
  max-height: 80vh;
  background-color: #0a0a0a;
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  /* Efecto de borde neón */
  box-shadow: 0 0 10px #FF00FF, 0 0 20px rgba(0, 255, 255, 0.5);
  border: 1px solid rgba(255, 0, 255, 0.5);
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 0, 255, 0.3);
`;

const GameTitle = styled.h2`
  color: #FF00FF;
  font-size: 1.2rem;
  margin: 0;
  text-shadow: 0 0 5px rgba(255, 0, 255, 0.7);
`;

const CloseButton = styled(motion.button)`
  background: none;
  border: none;
  color: #00FFFF;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #FF00FF;
  }
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const GameCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  background-color: #000000;
`;

// Estilos para la tienda de mejoras
const UpgradeShopOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 0, 255, 0.5);
`;

const PointsDisplay = styled.div`
  color: #FFFF00;
  font-size: 16px;
  text-shadow: 0 0 5px #FFFF00;
  margin-right: 15px;
`;

const UpgradeButton = styled.button<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? '#444' : '#222'};
  color: ${props => props.disabled ? '#888' : '#00FFFF'};
  border: 1px solid ${props => props.disabled ? '#666' : '#00FFFF'};
  border-radius: 4px;
  padding: 5px 8px;
  margin: 0 5px;
  font-size: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  text-shadow: ${props => props.disabled ? 'none' : '0 0 5px #00FFFF'};
  box-shadow: ${props => props.disabled ? 'none' : '0 0 5px #00FFFF'};
  
  &:hover {
    background-color: ${props => props.disabled ? '#444' : '#004444'};
  }
`;

// Estilos para el ranking
const RankingContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 500px;
  background-color: rgba(0, 0, 0, 0.9);
  border: 1px solid #FF00FF;
  box-shadow: 0 0 10px #FF00FF, 0 0 20px rgba(0, 255, 255, 0.5);
  border-radius: 8px;
  padding: 20px;
  color: white;
  z-index: 100;
`;

const RankingTitle = styled.h3`
  color: #FF00FF;
  text-align: center;
  margin-top: 0;
  font-size: 1.5rem;
  text-shadow: 0 0 5px #FF00FF;
`;

const RankingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  
  th, td {
    padding: 8px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 0, 255, 0.3);
  }
  
  th {
    color: #00FFFF;
    font-weight: bold;
    text-shadow: 0 0 5px #00FFFF;
  }
  
  tr:nth-child(even) {
    background-color: rgba(0, 255, 255, 0.05);
  }
  
  tr:hover {
    background-color: rgba(255, 0, 255, 0.1);
  }
`;

const InputContainer = styled.div`
  display: flex;
  margin: 15px 0;
  
  input {
    flex: 1;
    background-color: #111;
    border: 1px solid #00FFFF;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    margin-right: 10px;
    
    &:focus {
      outline: none;
      box-shadow: 0 0 5px #00FFFF;
    }
  }
`;

const SaveButton = styled(UpgradeButton)`
  width: 100px;
`;

// Popup para modo infinito
const InfiniteModeContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 450px;
  background-color: rgba(0, 0, 0, 0.9);
  border: 2px solid #FF00FF;
  box-shadow: 0 0 20px #FF00FF, 0 0 30px rgba(0, 255, 255, 0.5);
  border-radius: 8px;
  padding: 25px;
  color: white;
  z-index: 200;
  text-align: center;
`;

const InfiniteModeTitle = styled.h3`
  color: #FF00FF;
  text-align: center;
  margin-top: 0;
  font-size: 1.7rem;
  text-shadow: 0 0 5px #FF00FF;
`;

const InfiniteModeText = styled.p`
  font-size: 1.1rem;
  margin: 15px 0;
  line-height: 1.5;
`;

const InfiniteModeButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 25px;
`;

const InfiniteModeButton = styled(UpgradeButton)`
  padding: 10px 20px;
  font-size: 1rem;
  width: 140px;
`;

// Estilos para controles móviles
const MobileControlsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.3));
  display: none;
  padding: 10px;
  z-index: 10;
  
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;

const MobileControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
`;

const MobileButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props =>
    props.variant === 'primary' ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' :
      props.variant === 'danger' ? 'linear-gradient(135deg, #FF0040 0%, #FF8000 100%)' :
        'linear-gradient(135deg, #333 0%, #555 100%)'
  };
  border: 1px solid ${props =>
    props.variant === 'primary' ? '#FF00FF' :
      props.variant === 'danger' ? '#FF0040' :
        '#666'
  };
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  padding: 8px 12px;
  min-width: 60px;
  height: 45px;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const MovementControls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const ActionControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const DirectionButton = styled(MobileButton) <{ pressed?: boolean }>`
  width: 50px;
  height: 45px;
  background: ${props => props.pressed ?
    'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)' :
    'linear-gradient(135deg, #333 0%, #555 100%)'
  };
  border-color: ${props => props.pressed ? '#FF00FF' : '#666'};
  box-shadow: ${props => props.pressed ?
    '0 0 10px rgba(255, 0, 255, 0.5)' :
    '0 2px 8px rgba(0, 0, 0, 0.3)'
  };
`;

// Tipo para las propiedades del componente
type RetroGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Tipo para los puntajes de jugadores
type PlayerScore = {
  name: string;
  score: number;
  date: string;
};

// Interfaces para los elementos del juego
interface Star {
  x: number;
  y: number;
  size: number;
}

interface GameElement {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  active: boolean;
  damage?: number;
  smallEnemyImageSrc?: string;
  mediumEnemyImageSrc?: string;
  largeEnemyImageSrc?: string;
  smallEnemyHealth?: number;
  mediumEnemyHealth?: number;
  largeEnemyHealth?: number;
}

interface Player extends GameElement {
  isMovingLeft: boolean;
  isMovingRight: boolean;
  shootCooldown: number;
  lastShootTime: number;
  lives: number;
  isInvulnerable: boolean;
  invulnerabilityTime: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  horizontalSpeed?: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  type: 'small' | 'medium' | 'large';
  color: string;
}

// Interfaz para las explosiones
interface Explosion {
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  duration: number; // Duración en milisegundos
}

// Interfaz para el sistema de mejoras
interface UpgradeSystem {
  savedPoints: number;
  multipleShots: number; // Cantidad de disparos simultáneos (1-3)
  multipleShotPrice: number; // Precio para la siguiente mejora
  maxLives: number; // Máximo de vidas (3-7)
  maxLivesPrice: number; // Precio para la siguiente mejora
  hasBomb: boolean; // Si tiene bomba disponible
  bombPrice: number; // Precio fijo de la bomba
}

// Interfaz para la configuración del nivel
interface LevelConfig {
  smallEnemySpeed: number;
  mediumEnemySpeed: number;
  largeEnemySpeed: number;
  smallEnemySpawnRate: number;
  mediumEnemySpawnRate: number;
  largeEnemySpawnRate: number;
  smallEnemyHealth: number;
  mediumEnemyHealth: number;
  largeEnemyHealth: number;
}

// Header responsivo para score, nivel y vidas
const HeaderInfoContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 5;
  pointer-events: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 0 8px #000, 0 0 4px #00ffff;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 2px;
    font-size: 1rem;
    align-items: flex-start;
    left: 10px;
    width: calc(100% - 20px);
  }
`;

// Popup centrado para la tienda en mobile
const UpgradeShopPopup = styled(UpgradeShopOverlay)`
  @media (max-width: 600px) {
    position: absolute;
    top: 50%;
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translate(-50%, -50%);
    width: 95vw;
    max-width: 340px;
    flex-direction: column;
    align-items: stretch;
    padding: 18px 10px 10px 10px;
    border-radius: 12px;
    box-shadow: 0 0 30px #00ffff99;
    z-index: 20;
  }

  & > div {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 10px 0;
  }
`;

// Mejorar layout de Game Over en mobile
const GameOverText = styled.div`
  @media (max-width: 600px) {
    padding: 18px 0 0 0;
    font-size: 1.1rem;
    text-align: center;
    line-height: 1.5;
    > * { margin-bottom: 8px; }
  }
`;

const RetroGameModal: React.FC<RetroGameModalProps> = ({ isOpen, onClose }) => {
  // Referencias al canvas y contenedor
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Referencias para los elementos del juego (no usan useState para evitar re-renders)
  const gameWidthRef = useRef<number>(800);
  const gameHeightRef = useRef<number>(500);
  const starsRef = useRef<Star[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);

  // Referencias a las imágenes
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const enemy1ImageRef = useRef<HTMLImageElement | null>(null);
  const enemy2ImageRef = useRef<HTMLImageElement | null>(null);
  const enemy3ImageRef = useRef<HTMLImageElement | null>(null);
  const explosionImageRef = useRef<HTMLImageElement | null>(null);

  // Referencia para las explosiones
  const explosionsRef = useRef<Explosion[]>([]);

  // Referencia para el sistema de mejoras
  const upgradesRef = useRef<UpgradeSystem>({
    savedPoints: 0,
    multipleShots: 1,
    multipleShotPrice: 300,
    maxLives: 3,
    maxLivesPrice: 500,
    hasBomb: false,
    bombPrice: 1000
  });

  // Referencias para la cinemática final
  const isEndingCinematicRef = useRef<boolean>(false);
  const cinematicPhaseRef = useRef<number>(0); // 0: Inactivo, 1: Aproximación, 2: Aterrizaje, 3: Reunión, 4: Mensaje Final
  const cinematicTimerRef = useRef<number>(0);
  const isInfiniteMode = useRef<boolean>(false);

  // Referencia para el intervalo de disparo automático
  const autoFireIntervalRef = useRef<number | null>(null);

  // Referencia para el puntaje y estado del juego
  const scoreRef = useRef<number>(0);
  const gameOverRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  // Estado para mostrar el puntaje y estado del juego en la UI
  const [score, setScore] = useState<number>(0);
  const [savedPoints, setSavedPoints] = useState<number>(0);
  const [showUpgradeShop, setShowUpgradeShop] = useState<boolean>(false);
  const [showRanking, setShowRanking] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');
  const [highScores, setHighScores] = useState<PlayerScore[]>([]);
  const [scoreSubmitted, setScoreSubmitted] = useState<boolean>(false);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [showInfiniteMode, setShowInfiniteMode] = useState<boolean>(false);

  // Estados para controles móviles
  const [mobileControls, setMobileControls] = useState({
    leftPressed: false,
    rightPressed: false,
    shootPressed: false
  });

  // Detectar si es dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 50,
    height: 30,
    lives: 3,
    speed: 5,
    health: 1,
    active: true,
    isMovingLeft: false,
    isMovingRight: false,
    shootCooldown: 0,
    lastShootTime: 0,
    isInvulnerable: false,
    invulnerabilityTime: 0
  });

  // Estado solo para controlar las teclas (menos actualizaciones)
  const [, setKeysPressed] = useState({
    left: false,
    right: false,
    space: false
  });

  // Referencias para el nivel y configuración de dificultad
  const currentLevelRef = useRef<number>(1);
  const enemyKillCountRef = useRef<number>(0);
  const killsForNextLevelRef = useRef<number>(15); // Enemigos a matar para subir de nivel

  // Configuración base de nivel que se ajustará dinámicamente
  const getLevelConfig = (level: number): LevelConfig => {
    // Factor de escalado basado en el nivel
    const scaleFactor = 1 + (level - 1) * 0.1; // +10% por nivel

    return {
      // Velocidades (aumentan con el nivel)
      smallEnemySpeed: 1 * scaleFactor,
      mediumEnemySpeed: 0.7 * scaleFactor,
      largeEnemySpeed: 0.5 * scaleFactor,

      // Tasas de aparición (disminuyen con el nivel = aparecen más rápido)
      smallEnemySpawnRate: Math.max(1500 - (level - 1) * 100, 500), // ms entre spawns
      mediumEnemySpawnRate: Math.max(3500 - (level - 1) * 150, 1200),
      largeEnemySpawnRate: Math.max(5500 - (level - 1) * 200, 2500),

      // Salud (aumenta con el nivel)
      smallEnemyHealth: 1,
      mediumEnemyHealth: 1 + Math.floor((level - 1) / 2), // +1 cada 2 niveles
      largeEnemyHealth: 2 + Math.floor(level / 2) // Empieza en 2, +1 cada 2 niveles
    };
  };

  // Colores para los diferentes tipos de enemigos
  const enemyColors = {
    small: '#55aaff', // Azul (cangrejo)
    medium: '#ffdd00', // Amarillo (calamar)
    large: '#ff5555'  // Rojo (nave nodriza)
  };

  // Referencias para los tiempos de spawn de cada tipo de enemigo
  const lastSmallEnemySpawnTimeRef = useRef<number>(0);
  const lastMediumEnemySpawnTimeRef = useRef<number>(0);
  const lastLargeEnemySpawnTimeRef = useRef<number>(0);

  // Manejadores de eventos de teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Asegurarnos de que solo procesamos eventos cuando el modal está abierto
    if (!isOpen) return;

    console.log('KeyDown:', e.key);

    // Si el juego ha terminado y se presiona espacio, reiniciar
    if (gameOverRef.current && e.key === ' ') {
      e.preventDefault();
      resetGame();
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      playerRef.current.isMovingLeft = true;
      setKeysPressed(prev => ({ ...prev, left: true }));
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      playerRef.current.isMovingRight = true;
      setKeysPressed(prev => ({ ...prev, right: true }));
    } else if (e.key === ' ') {
      // Prevenir el comportamiento predeterminado de la barra espaciadora
      e.preventDefault();
      console.log('Espacio presionado - estableciendo estado a true');

      // Si no hay un intervalo de disparo automático ya establecido, crear uno
      if (!autoFireIntervalRef.current) {
        // Disparar inmediatamente al presionar
        createBullet();

        // Crear intervalo para disparos continuos
        autoFireIntervalRef.current = window.setInterval(() => {
          createBullet();
        }, 200); // Intervalo de 200ms entre disparos

        console.log('Intervalo de auto-disparo iniciado');
      }

      setKeysPressed(prev => ({ ...prev, space: true }));
    } else if (e.key === 'g' || e.key === 'G') {
      // Usar bomba al presionar "G"
      e.preventDefault();

      if (!gameOverRef.current && !isPausedRef.current) {
        // Primero verificar si ya tiene bomba
        if (upgradesRef.current.hasBomb) {
          const result = useBomb();
          if (result) {
            console.log('¡Bomba utilizada con éxito!');
          } else {
            console.log('Error al usar la bomba');
          }
        } else {
          // Si no tiene bomba, intentar comprarla automáticamente
          if (upgradesRef.current.savedPoints >= upgradesRef.current.bombPrice) {
            // Comprar la bomba
            upgradesRef.current.savedPoints -= upgradesRef.current.bombPrice;
            upgradesRef.current.hasBomb = true;
            setSavedPoints(upgradesRef.current.savedPoints);

            console.log('Bomba comprada automáticamente');

            // Y usarla inmediatamente
            useBomb();
            console.log('¡Bomba utilizada inmediatamente después de comprarla!');
          } else {
            console.log('No hay bomba disponible ni puntos suficientes para comprarla');
          }
        }
      }
    } else if (e.key === 's' || e.key === 'S') {
      // Mostrar/ocultar tienda al presionar "S"
      e.preventDefault();

      // Actualizar UI con los puntos guardados actuales
      setSavedPoints(upgradesRef.current.savedPoints);

      // Cerrar ranking si está abierto
      if (showRanking) {
        setShowRanking(false);
      }

      // Alternar visibilidad de la tienda
      setShowUpgradeShop(prev => !prev);
    } else if (e.key === 'r' || e.key === 'R') {
      // Mostrar/ocultar ranking al presionar "R"
      e.preventDefault();

      // Si estamos en Game Over, mostrar el ranking
      if (gameOverRef.current) {
        // Cerrar tienda si está abierta
        if (showUpgradeShop) {
          setShowUpgradeShop(false);
        }

        // Alternar visibilidad del ranking
        setShowRanking(prev => !prev);
      }
    } else if (e.key === 'Escape') {
      // Pausar/reanudar el juego con ESC
      e.preventDefault();

      // Solo permitir pausar si el juego está activo (no en game over ni cinemática)
      if (!gameOverRef.current && !isEndingCinematicRef.current) {
        isPausedRef.current = !isPausedRef.current;
        console.log(isPausedRef.current ? 'Juego pausado' : 'Juego reanudado');
      }
    }
  }, [isOpen]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Asegurarnos de que solo procesamos eventos cuando el modal está abierto
    if (!isOpen) return;

    console.log('KeyUp:', e.key);

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      playerRef.current.isMovingLeft = false;
      setKeysPressed(prev => ({ ...prev, left: false }));
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      playerRef.current.isMovingRight = false;
      setKeysPressed(prev => ({ ...prev, right: false }));
    } else if (e.key === ' ') {
      // Prevenir el comportamiento predeterminado de la barra espaciadora
      e.preventDefault();
      console.log('Espacio liberado - estableciendo estado a false');

      // Limpiar el intervalo de disparo automático cuando se suelta la tecla
      if (autoFireIntervalRef.current) {
        clearInterval(autoFireIntervalRef.current);
        autoFireIntervalRef.current = null;
        console.log('Intervalo de auto-disparo detenido');
      }

      setKeysPressed(prev => ({ ...prev, space: false }));
    }
  }, [isOpen]);

  // Función para generar estrellas
  const generateStars = (width: number, height: number): Star[] => {
    const stars: Star[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5
      });
    }
    return stars;
  };

  // Función para ajustar el tamaño del canvas y reinicializar el juego
  const resizeCanvas = useCallback(() => {
    if (containerRef.current && canvasRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();

      // Actualizar tamaño del canvas
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      // Actualizar referencias
      gameWidthRef.current = width;
      gameHeightRef.current = height;

      // Reposicionar nave
      playerRef.current = {
        ...playerRef.current,
        x: width / 2 - playerRef.current.width / 2,
        y: height - 50
      };

      // Regenerar estrellas
      starsRef.current = generateStars(width, height);
    }
  }, []);

  // Crear una nueva bala
  const createBullet = () => {
    const player = playerRef.current;
    const now = Date.now();

    // Verificar tiempo de enfriamiento entre disparos
    if (now - player.lastShootTime < player.shootCooldown) {
      return;
    }

    // Actualizar tiempo del último disparo
    player.lastShootTime = now;

    // Determinar cuántos disparos simultáneos crear según la mejora
    const shotCount = upgradesRef.current.multipleShots;

    if (shotCount === 1) {
      // Disparar una sola bala (centrada)
      const bullet: Bullet = {
        x: player.x + player.width / 2 - 3, // Centrada horizontalmente
        y: player.y, // Desde la punta de la nave
        width: 6,
        height: 14,
        speed: 10,
        color: '#00FFFF' // Cyan neón
      };

      // Añadir a la lista de balas
      bulletsRef.current.push(bullet);
    } else if (shotCount === 2) {
      // Disparar dos balas hacia el frente
      const bulletSpacing = 8;

      // Bala izquierda
      const leftBullet: Bullet = {
        x: player.x + player.width / 2 - bulletSpacing,
        y: player.y,
        width: 6,
        height: 14,
        speed: 10,
        color: '#00FFFF'
      };

      // Bala derecha
      const rightBullet: Bullet = {
        x: player.x + player.width / 2 + bulletSpacing - 6,
        y: player.y,
        width: 6,
        height: 14,
        speed: 10,
        color: '#00FFFF'
      };

      // Añadir a la lista de balas
      bulletsRef.current.push(leftBullet, rightBullet);
    } else if (shotCount === 3) {
      // Disparar tres balas (una al centro y dos en diagonal)

      // Bala central (recta)
      const centerBullet: Bullet = {
        x: player.x + player.width / 2 - 3,
        y: player.y,
        width: 6,
        height: 14,
        speed: 10,
        color: '#00FFFF'
      };

      // Parámetros para las diagonales
      const diagonalSpeed = 9; // Ligeramente menor velocidad vertical para compensar el movimiento diagonal
      const horizontalSpeed = 3; // Velocidad de desplazamiento horizontal

      // Bala diagonal izquierda (45° izquierda)
      const leftBullet: Bullet = {
        x: player.x + player.width / 2 - 10,
        y: player.y + 5,
        width: 6,
        height: 14,
        speed: diagonalSpeed,
        color: '#00FFFF',
        horizontalSpeed: -horizontalSpeed // Velocidad negativa = movimiento a la izquierda
      };

      // Bala diagonal derecha (45° derecha)
      const rightBullet: Bullet = {
        x: player.x + player.width / 2 + 4,
        y: player.y + 5,
        width: 6,
        height: 14,
        speed: diagonalSpeed,
        color: '#00FFFF',
        horizontalSpeed: horizontalSpeed // Velocidad positiva = movimiento a la derecha
      };

      // Añadir a la lista de balas
      bulletsRef.current.push(centerBullet, leftBullet, rightBullet);
    }

    console.log('Balas creadas. Total balas:', bulletsRef.current.length);
  };

  // Actualizar posiciones de las balas y eliminar las que salen de la pantalla
  const updateBullets = () => {
    // Filtrar las balas que siguen en pantalla
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      // Mover la bala hacia arriba
      bullet.y -= bullet.speed;

      // Si la bala tiene velocidad horizontal, moverla lateralmente
      if (bullet.horizontalSpeed) {
        bullet.x += bullet.horizontalSpeed;
      }

      // Mantener solo las balas que están en pantalla
      return bullet.y + bullet.height > 0 &&
        bullet.x > -bullet.width &&
        bullet.x < gameWidthRef.current;
    });
  };

  // Actualizar posición de la nave
  const updatePlayerPosition = (/*deltaTime: number*/) => {
    if (playerRef.current.isMovingLeft) {
      playerRef.current.x -= playerRef.current.speed;
    }
    if (playerRef.current.isMovingRight) {
      playerRef.current.x += playerRef.current.speed;
    }

    // Limitar la posición a los bordes del canvas
    playerRef.current.x = Math.max(0, Math.min(playerRef.current.x,
      gameWidthRef.current - playerRef.current.width));
  };

  // Actualizar posición de las estrellas
  const updateStars = (deltaTime: number) => {
    for (let i = 0; i < starsRef.current.length; i++) {
      const star = starsRef.current[i];
      star.y += (star.size + 0.5) * deltaTime * 50;

      // Si la estrella sale por abajo, reubicarla arriba
      if (star.y > gameHeightRef.current) {
        star.y = 0;
        star.x = Math.random() * gameWidthRef.current;
      }
    }
  };

  // Crear una explosión en la posición especificada
  const createExplosion = (x: number, y: number, width: number, height: number) => {
    const explosion: Explosion = {
      x,
      y,
      width,
      height,
      startTime: Date.now(),
      duration: 500 // 500ms de duración
    };

    explosionsRef.current.push(explosion);
  };

  // Usar la bomba para destruir todos los enemigos en pantalla
  const useBomb = () => {
    // Verificar si tenemos bomba disponible
    if (!upgradesRef.current.hasBomb) {
      console.log('No hay bomba disponible');
      return false;
    }

    // Crear una explosión grande en el centro de la pantalla
    createExplosion(
      gameWidthRef.current / 2 - 100,
      gameHeightRef.current / 2 - 100,
      200,
      200
    );

    // Crear explosiones pequeñas para cada enemigo
    enemiesRef.current.forEach(enemy => {
      createExplosion(
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height
      );

      // Calcular puntos según el tipo (nuevo sistema: 10, 20 o 30 puntos)
      let points = 0;
      switch (enemy.type) {
        case 'small': points = 10; break;
        case 'medium': points = 20; break;
        case 'large': points = 30; break;
      }

      scoreRef.current += points;
      setScore(scoreRef.current);

      // Actualizar contador de muertes para subir de nivel
      enemyKillCountRef.current += 1;
    });

    // Eliminar todos los enemigos
    const enemyCount = enemiesRef.current.length;
    enemiesRef.current = [];

    // Consumir la bomba
    upgradesRef.current.hasBomb = false;

    // Verificar si hemos avanzado de nivel
    if (enemyKillCountRef.current >= killsForNextLevelRef.current) {
      levelUp();
    }

    console.log(`¡Bomba usada! ${enemyCount} enemigos destruidos`);
    return true;
  };

  // Función para cambiar de nivel
  const levelUp = () => {
    const newLevel = currentLevelRef.current + 1;

    // Verificar si hemos alcanzado el nivel final (15)
    if (newLevel === 16 && !isInfiniteMode.current) {
      console.log("¡Nivel 15 completado! Iniciando cinemática final...");
      isEndingCinematicRef.current = true;
      cinematicPhaseRef.current = 1; // Iniciar fase 1: Aproximación
      cinematicTimerRef.current = Date.now();
      // Detener spawns (aunque ya no deberían ocurrir si no hay updateGame normal)
      enemiesRef.current = []; // Limpiar enemigos restantes
      bulletsRef.current = []; // Limpiar balas
      // Mantener la posición actual de la nave para una transición más natural
      playerRef.current.isInvulnerable = true;
      // La posición se ajustará gradualmente durante la animación
      return; // Salir para no incrementar nivel ni reiniciar contador
    }

    // Si no es el nivel final, o estamos en modo infinito, proceder normalmente
    currentLevelRef.current = newLevel;

    // Aumentar dificultad para siguiente nivel - Ahora requiere más enemigos
    // En modo infinito, la dificultad sigue aumentando gradualmente
    if (isInfiniteMode.current) {
      killsForNextLevelRef.current = 15 + (newLevel - 1) * 8 + Math.floor((newLevel - 16) * 2); // Incremento adicional en modo infinito
    } else {
      killsForNextLevelRef.current = 15 + (newLevel - 1) * 8; // Incremento normal
    }

    enemyKillCountRef.current = 0;

    // Mostrar mensaje de nuevo nivel
    console.log(`¡Nivel ${newLevel}${isInfiniteMode.current ? " (Modo Infinito)" : ""} alcanzado!`);
  };

  // Función para activar el modo infinito después de la cinemática
  const startInfiniteMode = () => {
    console.log("¡Iniciando modo infinito!");

    setShowInfiniteMode(false);  // Ocultar el popup

    // Reiniciar variables importantes pero mantener puntaje
    isEndingCinematicRef.current = false;
    isInfiniteMode.current = true;
    gameOverRef.current = false;

    // Reiniciar enemigos y posición de la nave
    enemiesRef.current = [];
    bulletsRef.current = [];
    explosionsRef.current = [];
    playerRef.current.isInvulnerable = true; // Dar invulnerabilidad inicial
    playerRef.current.invulnerabilityTime = Date.now();

    // Colocar la nave en la parte inferior
    playerRef.current.x = gameWidthRef.current / 2 - playerRef.current.width / 2;
    playerRef.current.y = gameHeightRef.current - 70;

    // Iniciar en "nivel 16" para el modo infinito
    currentLevelRef.current = 16;
    enemyKillCountRef.current = 0;
    killsForNextLevelRef.current = 15 + 15 * 8 + 2; // Nivel 16 base
  };

  // Crear un nuevo enemigo (actualizado para soportar diferentes tipos)
  const createEnemy = () => {
    const now = Date.now();
    const config = getLevelConfig(currentLevelRef.current);

    // Intentar generar enemigo pequeño
    if (now - lastSmallEnemySpawnTimeRef.current > config.smallEnemySpawnRate) {
      spawnEnemy('small', config);
      lastSmallEnemySpawnTimeRef.current = now;
    }

    // Intentar generar enemigo mediano (solo a partir del nivel 2)
    if (currentLevelRef.current >= 2 &&
      now - lastMediumEnemySpawnTimeRef.current > config.mediumEnemySpawnRate) {
      spawnEnemy('medium', config);
      lastMediumEnemySpawnTimeRef.current = now;
    }

    // Intentar generar enemigo grande (solo a partir del nivel 4)
    if (currentLevelRef.current >= 4 &&
      now - lastLargeEnemySpawnTimeRef.current > config.largeEnemySpawnRate) {
      spawnEnemy('large', config);
      lastLargeEnemySpawnTimeRef.current = now;
    }
  };

  // Generar un enemigo específico
  const spawnEnemy = (type: 'small' | 'medium' | 'large', config: LevelConfig) => {
    // Determinar características según el tipo
    let width, height, speed, health;

    switch (type) {
      case 'small':
        width = 30;
        height = 30;
        speed = config.smallEnemySpeed;
        health = config.smallEnemyHealth;
        break;
      case 'medium':
        width = 60;
        height = 60;
        speed = config.mediumEnemySpeed;
        health = config.mediumEnemyHealth;
        break;
      case 'large':
        width = 80;
        height = 80;
        speed = config.largeEnemySpeed;
        health = config.largeEnemyHealth;
        break;
    }

    // Generar posición X aleatoria
    const x = Math.random() * (gameWidthRef.current - width);

    // Crear enemigo
    const enemy: Enemy = {
      x,
      y: -height, // Iniciar fuera de la pantalla por arriba
      width,
      height,
      speed,
      health,
      maxHealth: health,
      type,
      color: enemyColors[type]
    };

    // Añadir a la lista de enemigos
    enemiesRef.current.push(enemy);
  };

  // Verificar colisiones entre balas y enemigos (actualizado para enemigos con salud)
  const checkCollisions = () => {
    let scoreAdded = 0;
    let enemiesDestroyed = 0;

    // Filtrar las balas que no han colisionado
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      // Verificar si esta bala colisiona con algún enemigo
      let hasCollided = false;

      // Recorrer los enemigos
      for (let i = 0; i < enemiesRef.current.length; i++) {
        const enemy = enemiesRef.current[i];

        // Agregar un margen de colisión para facilitar los disparos 
        // (especialmente útil para enemigos más pequeños)
        const collisionMargin = enemy.type === 'small' ? 5 : 0;

        // Verificar si hay colisión entre esta bala y este enemigo
        const collision = (
          bullet.x < enemy.x + enemy.width + collisionMargin &&
          bullet.x + bullet.width > enemy.x - collisionMargin &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        );

        // Si hay colisión
        if (collision) {
          hasCollided = true;
          enemy.health -= 1;

          // Si el enemigo se queda sin vida
          if (enemy.health <= 0) {
            // Calcular puntos según el tipo (nuevo sistema: 10, 20 o 30 puntos)
            let points = 0;
            switch (enemy.type) {
              case 'small': points = 10; break;
              case 'medium': points = 20; break;
              case 'large': points = 30; break;
            }

            scoreAdded += points;
            enemiesDestroyed += 1;

            // Crear una explosión donde murió el enemigo
            createExplosion(
              enemy.x,
              enemy.y,
              enemy.width,
              enemy.height
            );

            // Eliminar el enemigo
            enemiesRef.current.splice(i, 1);
            i--; // Ajustar índice
          }

          break; // Salir del bucle
        }
      }

      return !hasCollided; // Si no colisionó, mantener la bala
    });

    // Actualizar el puntaje si se destruyó algún enemigo
    if (scoreAdded > 0) {
      scoreRef.current += scoreAdded;
      setScore(scoreRef.current);

      // Actualizar contador de muertes para subir de nivel
      enemyKillCountRef.current += enemiesDestroyed;

      // Verificar si hemos avanzado de nivel
      if (enemyKillCountRef.current >= killsForNextLevelRef.current) {
        levelUp();
      }
    }
  };

  // Verificar colisiones entre el jugador y los enemigos
  const checkPlayerCollisions = () => {
    const player = playerRef.current;

    // Si el jugador está en estado de invulnerabilidad, no procesar colisiones
    if (player.isInvulnerable) {
      // Verificar si el tiempo de invulnerabilidad ha terminado
      const now = Date.now();
      if (now - player.invulnerabilityTime > 2000) { // 2 segundos de invulnerabilidad
        player.isInvulnerable = false;
      }
      return;
    }

    // Verificar colisiones con enemigos
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      // Verificar colisión con el jugador
      const collisionWithPlayer = (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      );

      // Verificar si el enemigo pasó al jugador (llegó al fondo de la pantalla)
      const passedPlayer = enemy.y + enemy.height > gameHeightRef.current;

      // Si hay colisión con el jugador o el enemigo pasó la línea inferior
      if (collisionWithPlayer || passedPlayer) {
        decreasePlayerLife();
        return false; // Eliminar enemigo
      }

      return true; // Mantener enemigo
    });
  };

  // Disminuir vidas del jugador
  const decreasePlayerLife = () => {
    const player = playerRef.current;

    // Si el jugador es invulnerable, no reducir vida
    if (player.isInvulnerable) return;

    // Reducir vida
    player.lives--;

    // Hacer al jugador invulnerable temporalmente
    player.isInvulnerable = true;
    player.invulnerabilityTime = Date.now();

    // Verificar si el juego ha terminado
    if (player.lives <= 0) {
      gameOverRef.current = true;

      // Guardar puntos cuando termina el juego
      const pointsToSave = Math.floor(scoreRef.current * 0.5); // Guardamos 50% de los puntos
      upgradesRef.current.savedPoints += pointsToSave;

      console.log(`Game Over. Puntuación final: ${scoreRef.current}. Guardados ${pointsToSave} puntos.`);
    }
  };

  // Reiniciar el juego (actualizado para reiniciar nivel)
  const resetGame = () => {
    // Reiniciar estado del juego
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    isPausedRef.current = false; // Asegurar que el juego no esté pausado al reiniciar
    isInfiniteMode.current = false; // Salir del modo infinito

    // Reiniciar nivel
    currentLevelRef.current = 1;
    enemyKillCountRef.current = 0;
    killsForNextLevelRef.current = 15; // Valor inicial aumentado

    // Reiniciar tiempos de spawn
    lastSmallEnemySpawnTimeRef.current = 0;
    lastMediumEnemySpawnTimeRef.current = 0;
    lastLargeEnemySpawnTimeRef.current = 0;

    // Reiniciar jugador
    playerRef.current.lives = upgradesRef.current.maxLives; // Usar máximo de vidas de las mejoras
    playerRef.current.isInvulnerable = false;
    playerRef.current.x = gameWidthRef.current / 2 - playerRef.current.width / 2;
    playerRef.current.y = gameHeightRef.current - 70; // Asegurar posición Y correcta

    // Limpiar enemigos y balas
    enemiesRef.current = [];
    bulletsRef.current = [];
    explosionsRef.current = [];

    // Reiniciar estado de cinemática
    isEndingCinematicRef.current = false;
    cinematicPhaseRef.current = 0;

    // Reiniciar estado de envío de puntaje
    setScoreSubmitted(false);
    setPlayerName('');

    // Ocultar popup de modo infinito si estuviera visible
    setShowInfiniteMode(false);
  };

  // Comprar mejora de disparos múltiples
  const buyMultipleShot = () => {
    const upgrades = upgradesRef.current;

    // Verificar si ya tenemos el máximo de disparos
    if (upgrades.multipleShots >= 3) {
      console.log("Ya tienes el máximo de disparos (3)");
      return false;
    }

    // Verificar si tenemos suficientes puntos
    if (upgrades.savedPoints < upgrades.multipleShotPrice) {
      console.log("No hay suficientes puntos para comprar esta mejora");
      return false;
    }

    // Realizar la compra
    upgrades.savedPoints -= upgrades.multipleShotPrice;
    upgrades.multipleShots += 1;

    // Actualizar precio para la siguiente compra (x2)
    upgrades.multipleShotPrice *= 2;

    // Actualizar UI
    setSavedPoints(upgrades.savedPoints);

    console.log(`Mejora de disparos comprada. Ahora tienes ${upgrades.multipleShots} disparos.`);
    return true;
  };

  // Comprar mejora de vidas máximas
  const buyMaxLives = () => {
    const upgrades = upgradesRef.current;

    // Verificar si ya tenemos el máximo de vidas
    if (upgrades.maxLives >= 7) {
      console.log("Ya tienes el máximo de vidas (7)");
      return false;
    }

    // Verificar si tenemos suficientes puntos
    if (upgrades.savedPoints < upgrades.maxLivesPrice) {
      console.log("No hay suficientes puntos para comprar esta mejora");
      return false;
    }

    // Realizar la compra
    upgrades.savedPoints -= upgrades.maxLivesPrice;
    upgrades.maxLives += 1;

    // Actualizar precio para la siguiente compra (x1.5)
    upgrades.maxLivesPrice = Math.floor(upgrades.maxLivesPrice * 1.5);

    // Actualizar vidas del jugador si está jugando
    if (!gameOverRef.current) {
      playerRef.current.lives += 1;
    }

    // Actualizar UI
    setSavedPoints(upgrades.savedPoints);

    console.log(`Mejora de vidas comprada. Ahora tienes ${upgrades.maxLives} vidas máximas.`);
    return true;
  };

  // Comprar bomba
  const buyBomb = () => {
    const upgrades = upgradesRef.current;

    // Verificar si ya tenemos una bomba
    if (upgrades.hasBomb) {
      console.log("Ya tienes una bomba");
      return false;
    }

    // Verificar si tenemos suficientes puntos
    if (upgrades.savedPoints < upgrades.bombPrice) {
      console.log("No hay suficientes puntos para comprar la bomba");
      return false;
    }

    // Realizar la compra
    upgrades.savedPoints -= upgrades.bombPrice;
    upgrades.hasBomb = true;

    // Actualizar UI
    setSavedPoints(upgrades.savedPoints);

    console.log("¡Bomba comprada! Presiona 'G' para usarla durante el juego.");
    return true;
  };

  // Dibujar vidas del jugador
  const drawLives = (ctx: CanvasRenderingContext2D) => {
    const lives = playerRef.current.lives;

    ctx.save();

    // Configurar estilo de texto
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // Añadir efecto de brillo neón
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dibujar texto
    ctx.fillText(`Lives: ${lives}`, gameWidthRef.current - 20, 20);

    ctx.restore();
  };

  // Dibujar pantalla de Game Over
  const drawGameOver = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Fondo semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, gameWidthRef.current, gameHeightRef.current);

    // Texto de Game Over
    ctx.fillStyle = '#FF00FF';
    ctx.font = 'bold 48px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 15;
    ctx.fillText('GAME OVER', gameWidthRef.current / 2, gameHeightRef.current / 2 - 60);

    // Mostrar puntaje final
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px "Montserrat", sans-serif';
    ctx.fillText(`Final Score: ${scoreRef.current}`, gameWidthRef.current / 2, gameHeightRef.current / 2);

    // Mostrar puntos guardados
    ctx.fillStyle = '#FFFF00';
    ctx.font = '20px "Montserrat", sans-serif';
    const pointsSaved = Math.floor(scoreRef.current * 0.5); // Usar el mismo cálculo que en decreasePlayerLife
    ctx.fillText(`Puntos guardados: +${pointsSaved} (Total: ${upgradesRef.current.savedPoints})`,
      gameWidthRef.current / 2, gameHeightRef.current / 2 + 35);

    // Indicación para reiniciar y ver tienda/ranking
    ctx.fillStyle = '#00FFFF';
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.fillText('Presiona ESPACIO para reiniciar',
      gameWidthRef.current / 2, gameHeightRef.current / 2 + 70);

    ctx.fillText('Presiona S para la tienda o R para el ranking',
      gameWidthRef.current / 2, gameHeightRef.current / 2 + 100);

    ctx.restore();
  };

  // Dibujar el nivel actual
  const drawLevel = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Configurar estilo de texto
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Añadir efecto de brillo neón
    ctx.shadowColor = '#FFFF00'; // Amarillo para el nivel
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Si estamos en modo infinito, mostrar un texto diferente
    if (isInfiniteMode.current) {
      ctx.fillStyle = '#FF00FF'; // Color especial para modo infinito
      ctx.shadowColor = '#FF00FF';
      ctx.fillText(`Nivel ∞: ${currentLevelRef.current - 15}`, gameWidthRef.current / 2, 20);
    } else {
      // Dibujar texto del nivel con indicación de progreso total
      ctx.fillText(`Nivel: ${currentLevelRef.current}/15`, gameWidthRef.current / 2, 20);
    }

    // Mostrar progreso para el siguiente nivel
    const progressText = `${enemyKillCountRef.current}/${killsForNextLevelRef.current}`;
    ctx.font = '14px "Montserrat", sans-serif';
    ctx.fillText(progressText, gameWidthRef.current / 2, 45);

    ctx.restore();
  };

  // Dibujar pantalla de pausa
  const drawPauseScreen = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Fondo semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, gameWidthRef.current, gameHeightRef.current);

    // Texto de PAUSA
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 48px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 15;
    ctx.fillText('PAUSA', gameWidthRef.current / 2, gameHeightRef.current / 2 - 30);

    // Instrucciones
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Montserrat", sans-serif';
    ctx.fillText('Presiona ESC para continuar', gameWidthRef.current / 2, gameHeightRef.current / 2 + 30);

    ctx.restore();
  };

  // Dibujar el puntaje en el canvas
  const drawScore = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // Configurar estilo de texto
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Añadir efecto de brillo neón
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dibujar texto de puntuación
    ctx.fillText(`Score: ${scoreRef.current}`, 20, 20);

    // Dibujar récord actual (si hay)
    if (maxScore > 0) {
      ctx.fillStyle = '#FFFF00'; // Color amarillo para el récord
      ctx.shadowColor = '#FFFF00';
      ctx.font = '14px "Montserrat", sans-serif';
      ctx.fillText(`Récord: ${maxScore}`, 20, 45);
    }

    ctx.restore();
  };

  // Actualizar posiciones de los enemigos y eliminar los que salen de la pantalla
  const updateEnemies = (deltaTime: number) => {
    // Filtrar los enemigos que siguen en pantalla
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      // Mover el enemigo hacia abajo
      enemy.y += enemy.speed * deltaTime * 60; // Ajustar velocidad basada en deltaTime

      // Mantener solo los enemigos que no han salido por la parte inferior
      return enemy.y < gameHeightRef.current;
    });
  };

  // Actualizar explosiones y eliminar las que han terminado
  const updateExplosions = () => {
    const now = Date.now();
    explosionsRef.current = explosionsRef.current.filter(explosion => {
      // Mantener solo las explosiones que no han terminado
      return now - explosion.startTime < explosion.duration;
    });
  };

  // Dibujar las estrellas
  const drawStars = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'white';
    for (const star of starsRef.current) {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  };

  // Dibujar las balas
  const drawBullets = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    bulletsRef.current.forEach(bullet => {
      // Dibujar rectángulo de la bala
      ctx.fillStyle = bullet.color;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

      // Añadir efecto de brillo
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.restore();
  };

  // Dibujar los enemigos con las imágenes SVG
  const drawEnemies = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    enemiesRef.current.forEach(enemy => {
      // Seleccionar imagen según el tipo
      let enemyImage = null;
      switch (enemy.type) {
        case 'small':
          enemyImage = enemy1ImageRef.current;
          break;
        case 'medium':
          enemyImage = enemy2ImageRef.current;
          break;
        case 'large':
          enemyImage = enemy3ImageRef.current;
          break;
      }

      if (enemyImage) {
        // Dibujar la imagen SVG
        ctx.drawImage(
          enemyImage,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height
        );
      } else {
        // Fallback: dibujar forma básica si la imagen no está disponible
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Añadir efecto de brillo
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      }

      // Dibujar barra de vida solo si tiene más de 1 punto de vida máximo
      if (enemy.maxHealth > 1) {
        const healthBarWidth = enemy.width;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.maxHealth;

        // Fondo de la barra (gris oscuro)
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.shadowBlur = 0; // Desactivar brillo para el fondo
        ctx.fillRect(
          enemy.x,
          enemy.y - healthBarHeight - 2,
          healthBarWidth,
          healthBarHeight
        );

        // Parte llena de la barra (color según tipo de enemigo)
        ctx.fillStyle = enemy.color;
        ctx.fillRect(
          enemy.x,
          enemy.y - healthBarHeight - 2,
          healthBarWidth * healthPercentage,
          healthBarHeight
        );
      }
    });

    ctx.restore();
  };

  // Dibujar la nave del jugador (actualizado para mostrar estado de invulnerabilidad)
  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const { x, y, width, height, isInvulnerable } = playerRef.current;

    // Si el jugador está invulnerable, hacer que parpadee
    if (isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      return; // Saltar un frame para crear efecto de parpadeo
    }

    ctx.save();

    if (playerImageRef.current) {
      // Dibujar imagen de la nave
      ctx.drawImage(
        playerImageRef.current,
        x,
        y,
        width,
        height
      );
    } else {
      // Código de respaldo para dibujar triángulo
      ctx.fillStyle = '#FF00FF'; // Magenta neón
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y); // Punta
      ctx.lineTo(x, y + height); // Esquina inferior izquierda
      ctx.lineTo(x + width, y + height); // Esquina inferior derecha
      ctx.closePath();
      ctx.fill();

      // Borde brillante
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Efecto de brillo
      ctx.shadowColor = '#FF00FF';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Dibujar explosiones
  const drawExplosions = (ctx: CanvasRenderingContext2D) => {
    if (!explosionImageRef.current) return;

    ctx.save();

    // Dibujar cada explosión
    explosionsRef.current.forEach(explosion => {
      ctx.drawImage(
        explosionImageRef.current!,
        explosion.x,
        explosion.y,
        explosion.width,
        explosion.height
      );
    });

    ctx.restore();
  };

  // --- Lógica y Dibujo de la Cinemática Final ---

  const updateEndingCinematic = (deltaTime: number) => {
    const now = Date.now();
    // Calculamos el tiempo transcurrido desde el inicio de la cinemática
    const totalElapsedTime = (now - cinematicTimerRef.current) / 1000; // en segundos

    // La cinemática completa dura 10 segundos (5 segundos de animación + tiempos adicionales)
    const totalDuration = 10; // segundos

    if (totalElapsedTime >= totalDuration) {
      // Cuando termina la cinemática, mostrar popup de modo infinito
      isEndingCinematicRef.current = false;
      setShowInfiniteMode(true);
      return;
    }

    // Actualizar las estrellas con velocidad reducida para dar efecto de movimiento suave
    updateStars(deltaTime * 0.3);
  };

  const drawEndingCinematic = (ctx: CanvasRenderingContext2D) => {
    const now = Date.now();
    // Tiempo transcurrido desde que inició la cinemática (en segundos)
    const elapsedTime = (now - cinematicTimerRef.current) / 1000;

    // Constantes para la animación
    const player = playerRef.current;
    const canvasWidth = gameWidthRef.current;
    const canvasHeight = gameHeightRef.current;
    const planetRadius = canvasWidth * 0.8;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Dibujar estrellas (fondo)
    drawStars(ctx);

    // Calculamos la fase actual en base al tiempo transcurrido
    // Fase 1 (0-2s): Planeta aparece lejos (arriba) y se acerca, nave se centra abajo
    // Fase 2 (2-4s): Planeta sigue acercándose (más grande y más abajo), nave estable
    // Fase 3 (4-6s): Planeta muy cerca, dibujamos superficie, nave desciende para aterrizar
    // Fase 4 (6-8s): Figuras apareciendo y reuniéndose en la superficie
    // Fase 5 (8-10s): Mensaje final

    let planetSize, planetY, playerY, playerScale, playerX;

    // --- Fase 1 (0-2s) --- 
    if (elapsedTime < 2) {
      const progress = elapsedTime / 2;

      // Planeta: Empieza más arriba y más grande, se mueve hacia abajo y crece
      planetSize = planetRadius * (0.2 + progress * 0.2); // Empieza al 20%, termina al 40%
      planetY = canvasHeight * (0.1 + progress * 0.2); // Empieza al 10% (arriba), termina al 30%

      // Nave: Se mueve suavemente al centro X, se mantiene abajo en Y
      playerX = player.x + (canvasWidth / 2 - player.width / 2 - player.x) * progress;
      playerY = canvasHeight * 0.8; // Posición Y fija en la parte inferior
      playerScale = 1.0;

      // Dibujar planeta con detalles simples
      drawPlanetWithDetails(ctx, canvasWidth / 2, planetY, planetSize);

      // Dibujar nave
      drawPlayerScaled(ctx, playerX, playerY, playerScale);

      // --- Fase 2 (2-4s) --- 
    } else if (elapsedTime < 4) {
      const progress = (elapsedTime - 2) / 2;

      // Planeta: Continúa acercándose y creciendo
      planetSize = planetRadius * (0.4 + progress * 0.3); // Empieza al 40%, termina al 70%
      planetY = canvasHeight * (0.3 + progress * 0.2); // Empieza al 30%, termina al 50%

      // Nave: Ya centrada, se mantiene abajo
      playerX = canvasWidth / 2 - player.width / 2;
      playerY = canvasHeight * 0.8; // Sigue en la parte inferior
      playerScale = 1.0;

      // Dibujar planeta con más detalles
      drawPlanetWithDetails(ctx, canvasWidth / 2, planetY, planetSize);

      // Dibujar nave
      drawPlayerScaled(ctx, playerX, playerY, playerScale);

      // --- Fase 3 (4-6s) --- 
    } else if (elapsedTime < 6) {
      const progress = (elapsedTime - 4) / 2;

      // Dibujar superficie del planeta que "sube"
      // El planeta en sí ya no se dibuja, solo su superficie
      drawPlanetSurface(ctx, canvasWidth, canvasHeight, progress);

      // Nave: Desciende gradualmente para aterrizar sobre la superficie
      playerX = canvasWidth / 2 - player.width / 2;
      // Comienza en Y=0.8 y termina en Y=0.75 (posición de aterrizaje final)
      playerY = canvasHeight * (0.8 - progress * 0.05);
      playerScale = 1.0 - progress * 0.2; // Se hace un poco más pequeña al acercarse

      // Dibujar nave descendiendo
      drawPlayerScaled(ctx, playerX, playerY, playerScale);

      // --- Fase 4 (6-8s) --- 
    } else if (elapsedTime < 8) {
      const progress = (elapsedTime - 6) / 2;

      // Dibujar superficie del planeta completa
      drawPlanetSurface(ctx, canvasWidth, canvasHeight, 1.0);

      // Posición fija de la nave aterrizada
      playerX = canvasWidth / 2 - player.width / 2;
      const landedY = canvasHeight * 0.75; // Posición Y final del aterrizaje
      drawPlayerScaled(ctx, playerX, landedY, 0.8); // Escala final más pequeña

      // Dibujar figuras saliendo de la nave y encontrándose
      drawReunionScene(ctx, progress);

      // --- Fase 5 (8-10s) --- 
    } else {
      const progress = (elapsedTime - 8) / 2;

      // Fondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#152142');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Texto principal que aparece gradualmente
      ctx.globalAlpha = Math.min(1, progress * 3);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("¡Gracias por jugar!", canvasWidth / 2, canvasHeight / 2 - 30);

      // Texto secundario
      if (progress > 0.3) {
        ctx.globalAlpha = Math.min(1, (progress - 0.3) * 3);
        ctx.font = '20px "Montserrat", sans-serif';
        ctx.fillText("Has completado la aventura", canvasWidth / 2, canvasHeight / 2 + 20);
      }

      ctx.globalAlpha = 1.0;
    }

    // Mostrar tiempo de la cinemática (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Tiempo: ${elapsedTime.toFixed(1)}s`, 10, 20);
    }
  };

  // Funciones auxiliares para dibujar elementos de la cinemática

  // Dibujar jugador con escala personalizada
  const drawPlayerScaled = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const scaledWidth = playerRef.current.width * scale;
    const scaledHeight = playerRef.current.height * scale;

    // Dibujar nave
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#4B9FE1';

    // Cuerpo de la nave
    ctx.beginPath();
    ctx.moveTo(0, -scaledHeight / 2); // Punta
    ctx.lineTo(-scaledWidth / 2, scaledHeight / 2); // Esquina izq
    ctx.lineTo(scaledWidth / 2, scaledHeight / 2); // Esquina der
    ctx.closePath();
    ctx.fill();

    // Añadir detalles
    ctx.fillStyle = '#2A77B5';
    ctx.fillRect(-scaledWidth / 3, 0, 2 * scaledWidth / 3, scaledHeight / 2);

    // Añadir brillo/resplandor
    ctx.shadowColor = '#4B9FE1';
    ctx.shadowBlur = 10 * scale;
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = '#7FBEF9';
    ctx.stroke();

    // Dibujar propulsión si está aterrizando
    if (cinematicPhaseRef.current === 2) {
      ctx.fillStyle = '#FF6347';
      // Eliminamos la referencia a thrustWidth que no se usa

      // Fuego de propulsión
      ctx.beginPath();
      ctx.moveTo(-scaledWidth / 3, scaledHeight / 2);
      ctx.lineTo(0, scaledHeight / 2 + scaledHeight * 0.7 * Math.random());
      ctx.lineTo(scaledWidth / 3, scaledHeight / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  // Dibujar planeta con detalles
  const drawPlanetWithDetails = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    // Color base del planeta
    ctx.fillStyle = '#3a5c98';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Detalles del planeta (continentes)
    ctx.fillStyle = '#4f7f3b'; // Verde para tierra

    // Continente 1
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.3, y - radius * 0.2, radius * 0.3, radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Continente 2
    ctx.beginPath();
    ctx.ellipse(x + radius * 0.4, y + radius * 0.3, radius * 0.25, radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Atmósfera
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = radius * 0.03;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.05, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Dibujar superficie del planeta
  const drawPlanetSurface = (ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    // Cielo del planeta (gradiente)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#152142'); // Azul oscuro arriba
    skyGradient.addColorStop(0.7, '#3a5c98'); // Azul medio
    skyGradient.addColorStop(1, '#4f7f3b');   // Verde al horizonte

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Suelo/horizonte
    ctx.fillStyle = '#4f7f3b'; // Verde para tierra

    // El horizonte sube con el progreso
    const horizonHeight = height - height * 0.2 * progress;
    ctx.fillRect(0, horizonHeight, width, height);

    // Montañas simples en el horizonte
    ctx.fillStyle = '#3b5f2d'; // Verde más oscuro
    ctx.beginPath();
    ctx.moveTo(0, horizonHeight);

    // Generar montañas
    const mountainCount = 5;
    const segmentWidth = width / mountainCount;

    for (let i = 0; i <= mountainCount; i++) {
      const x = i * segmentWidth;
      const y = i % 2 === 0
        ? horizonHeight - 20 - Math.random() * 30
        : horizonHeight - 10 - Math.random() * 15;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, horizonHeight);
    ctx.fill();
  };

  // Dibujar escena de reunión
  const drawReunionScene = (ctx: CanvasRenderingContext2D, progress: number) => {
    // Posiciones de referencia
    const groundY = gameHeightRef.current - 30;
    const centerX = gameWidthRef.current / 2;

    // Dibujar directamente las dos figuras juntas
    const figureHeight = 35;
    const figureWidth = 15;

    // Posiciones fijas de las figuras (cercanas entre sí)
    const figure1X = centerX - 20;
    const figure2X = centerX + 5;

    // Dibujar figuras
    ctx.fillStyle = '#222222'; // Siluetas oscuras

    // Figura 1 (piloto)
    ctx.fillRect(figure1X, groundY - figureHeight, figureWidth, figureHeight);

    // Figura 2 (pareja)
    ctx.fillRect(figure2X, groundY - figureHeight, figureWidth, figureHeight);

    // Dibujar corazón
    const heartSize = 15;
    const heartX = (figure1X + figure2X + figureWidth) / 2;
    const heartY = groundY - figureHeight - 20;

    ctx.fillStyle = '#ff3366';
    ctx.globalAlpha = Math.min(1, progress * 2); // Aparece gradualmente

    // Círculo izquierdo
    ctx.beginPath();
    ctx.arc(heartX - heartSize / 4, heartY, heartSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Círculo derecho
    ctx.beginPath();
    ctx.arc(heartX + heartSize / 4, heartY, heartSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Triángulo inferior
    ctx.beginPath();
    ctx.moveTo(heartX - heartSize / 2, heartY);
    ctx.lineTo(heartX + heartSize / 2, heartY);
    ctx.lineTo(heartX, heartY + heartSize / 1.5);
    ctx.fill();

    ctx.globalAlpha = 1.0;

    // Texto 
    if (progress > 0.3) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, (progress - 0.3) * 5);
      ctx.fillText("¡Por fin juntos!", centerX, 50);
      ctx.globalAlpha = 1.0;
    }
  };

  // --- FIN Cinemática Final ---

  // Función principal de actualización
  const updateGame = ({ deltaTime }: { deltaTime: number }) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // --- Manejo de Cinemática Final ---
    if (isEndingCinematicRef.current) {
      updateEndingCinematic(deltaTime);
      drawEndingCinematic(ctx);
      return; // Detener el flujo normal del juego
    }
    // --- Fin Manejo Cinemática ---

    // Si el juego ha terminado, mostrar pantalla de game over y detener actualización
    if (gameOverRef.current) {
      drawGameOver(ctx);
      return;
    }

    // Si el juego está pausado, mostrar pantalla de pausa y no actualizar
    if (isPausedRef.current) {
      drawPauseScreen(ctx);
      return;
    }

    // Intentar generar nuevos enemigos
    createEnemy();

    // Actualizar posiciones
    updatePlayerPosition();
    updateStars(deltaTime);
    updateBullets();
    updateEnemies(deltaTime);
    updateExplosions();

    // Verificar colisiones
    checkCollisions();
    checkPlayerCollisions();

    // Limpiar canvas
    ctx.clearRect(0, 0, gameWidthRef.current, gameHeightRef.current);

    // Dibujar elementos
    drawStars(ctx);
    drawBullets(ctx);
    drawEnemies(ctx);
    drawPlayer(ctx);
    drawScore(ctx);
    drawLives(ctx);
    drawLevel(ctx);
    drawExplosions(ctx);

    // Mostrar información de ayuda (sólo en los primeros niveles)
    if (currentLevelRef.current <= 2) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '14px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Presiona S para abrir la tienda', gameWidthRef.current / 2, gameHeightRef.current - 10);
      ctx.restore();
    }
  };

  // Inicializar el juego
  useEffect(() => {
    if (!isOpen) return;

    // Cargar imágenes
    const loadImages = () => {
      // Cargar imagen del jugador
      const playerImage = new Image();
      playerImage.src = '/game/Plane.png';
      playerImage.onload = () => {
        playerImageRef.current = playerImage;
        console.log('Imagen del jugador cargada');
      };

      // Cargar imágenes de enemigos
      const enemy1Image = new Image();
      enemy1Image.src = '/game/Enemy.svg';
      enemy1Image.onload = () => {
        enemy1ImageRef.current = enemy1Image;
        console.log('Imagen del enemigo 1 (cangrejo) cargada');
      };
      enemy1Image.onerror = () => {
        console.error('Error al cargar imagen del enemigo 1');
      };

      const enemy2Image = new Image();
      enemy2Image.src = '/game/Enemy2.png';
      enemy2Image.onload = () => {
        enemy2ImageRef.current = enemy2Image;
        console.log('Imagen del enemigo 2 (calamar) cargada');
      };
      enemy2Image.onerror = () => {
        console.error('Error al cargar imagen del enemigo 2');
      };

      const enemy3Image = new Image();
      enemy3Image.src = '/game/Enemy3.png';
      enemy3Image.onload = () => {
        enemy3ImageRef.current = enemy3Image;
        console.log('Imagen del enemigo 3 (nave nodriza) cargada');
      };
      enemy3Image.onerror = () => {
        console.error('Error al cargar imagen del enemigo 3');
      };

      // Cargar imagen de explosión
      const explosionImage = new Image();
      explosionImage.src = '/game/explotion.gif';
      explosionImage.onload = () => {
        explosionImageRef.current = explosionImage;
        console.log('Imagen de explosión cargada');
      };
      explosionImage.onerror = () => {
        console.error('Error al cargar imagen de explosión');
      };
    };

    // Función para prevenir el desplazamiento con la barra espaciadora
    const preventSpacebarScroll = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        return false;
      }
    };

    // Inicializar estrellas si aún no se ha hecho
    if (starsRef.current.length === 0) {
      starsRef.current = generateStars(gameWidthRef.current, gameHeightRef.current);
    }

    // Cargar imágenes
    loadImages();

    // Hacer resize inicial
    resizeCanvas();

    // Agregar event listeners con captura para que se ejecuten antes
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    // Agregar evento a nivel de documento para evitar completamente el scroll con espacio
    document.addEventListener('keydown', preventSpacebarScroll, { capture: true });

    // Limpiar
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('keydown', preventSpacebarScroll, { capture: true });
    };
  }, [isOpen, resizeCanvas, handleKeyDown, handleKeyUp]);

  // Iniciar el bucle del juego
  useGameLoop({
    enabled: isOpen,
    updateFn: updateGame,
    targetFps: 60
  });

  // Efecto para exponer función de desarrollo en la consola
  useEffect(() => {
    if (isOpen && process.env.NODE_ENV === 'development') {
      const addDevPoints = (amount: number) => {
        if (typeof amount === 'number' && amount > 0) {
          upgradesRef.current.savedPoints += amount;
          setSavedPoints(upgradesRef.current.savedPoints);
          console.log(`[DEV] ${amount} puntos añadidos. Total: ${upgradesRef.current.savedPoints}`);
          return `Added ${amount} points. New total: ${upgradesRef.current.savedPoints}`;
        } else {
          console.error('[DEV] Debes proporcionar un número positivo de puntos.');
          return 'Invalid amount';
        }
      };

      // Función para activar la cinemática final
      const triggerEndingCinematic = () => {
        if (isEndingCinematicRef.current || gameOverRef.current) {
          console.warn('[DEV] No se puede activar la cinemática si ya terminó el juego o ya está activa.');
          return 'Cinematic cannot be triggered now.';
        }

        console.log("[DEV] Activando cinemática final manualmente...");
        isEndingCinematicRef.current = true;
        cinematicPhaseRef.current = 1; // Iniciar fase 1: Aproximación
        cinematicTimerRef.current = Date.now();
        enemiesRef.current = [];
        bulletsRef.current = [];
        // La nave se mantiene en su posición actual y se pone invulnerable
        playerRef.current.isInvulnerable = true;
        // No centramos la nave al inicio, dejamos que la animación lo haga gradualmente

        return 'Ending cinematic triggered.';
      };

      // Exponer las funciones en window
      (window as any).addDevPoints = addDevPoints;
      (window as any).triggerEndingCinematic = triggerEndingCinematic;
      console.log('[DEV] Funciones addDevPoints(amount) y triggerEndingCinematic() disponibles en la consola.');

      // Limpieza al desmontar o cerrar modal
      return () => {
        delete (window as any).addDevPoints;
        delete (window as any).triggerEndingCinematic;
        console.log('[DEV] Funciones de desarrollo eliminadas de la consola.');
      };
    }
  }, [isOpen]);

  // Asegurar que se limpia el intervalo cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (autoFireIntervalRef.current) {
        clearInterval(autoFireIntervalRef.current);
        autoFireIntervalRef.current = null;
      }
    };
  }, []);

  // Reiniciar el juego cuando se vuelve a abrir el modal
  useEffect(() => {
    if (isOpen) {
      resetGame();

      // Sincronizar UI con valores actuales
      setSavedPoints(upgradesRef.current.savedPoints);

      // Cargar los puntajes guardados del localStorage
      loadHighScores();

      // Obtener el puntaje más alto para mostrar como récord
      getHighestScore();
    }
  }, [isOpen]);

  // Cargar puntajes del localStorage
  const loadHighScores = () => {
    try {
      const savedScores = localStorage.getItem('spaceShooterHighScores');
      if (savedScores) {
        const scores = JSON.parse(savedScores) as PlayerScore[];
        setHighScores(scores.sort((a, b) => b.score - a.score).slice(0, 10)); // Ordenar y limitar a 10
      }
    } catch (error) {
      console.error('Error al cargar puntajes:', error);
      setHighScores([]);
    }
  };

  // Guardar puntaje actual
  const saveScore = () => {
    if (!playerName.trim()) {
      alert('Por favor, introduce tu nombre');
      return;
    }

    const newScore: PlayerScore = {
      name: playerName.trim(),
      score: scoreRef.current,
      date: new Date().toLocaleDateString()
    };

    try {
      // Cargar puntajes actuales
      const savedScores = localStorage.getItem('spaceShooterHighScores');
      let scores: PlayerScore[] = savedScores ? JSON.parse(savedScores) : [];

      // Añadir el nuevo puntaje
      scores.push(newScore);

      // Ordenar por puntuación y limitar a 10
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);

      // Guardar de vuelta al localStorage
      localStorage.setItem('spaceShooterHighScores', JSON.stringify(scores));

      // Actualizar el estado
      setHighScores(scores);
      setScoreSubmitted(true);

      // Actualizar el récord si este puntaje es el más alto
      if (scores.length > 0 && scores[0].score > maxScore) {
        setMaxScore(scores[0].score);
      }
    } catch (error) {
      console.error('Error al guardar puntaje:', error);
      alert('Error al guardar puntaje. Inténtalo de nuevo.');
    }
  };

  // Obtener el puntaje más alto de los registros guardados
  const getHighestScore = () => {
    try {
      const savedScores = localStorage.getItem('spaceShooterHighScores');
      if (savedScores) {
        const scores = JSON.parse(savedScores) as PlayerScore[];
        if (scores.length > 0) {
          // Ordenar por puntaje de mayor a menor y obtener el primero
          const highestScore = scores.sort((a, b) => b.score - a.score)[0].score;
          setMaxScore(highestScore);
        }
      }
    } catch (error) {
      console.error('Error al obtener el puntaje más alto:', error);
    }
  };

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  // Animaciones de entrada y salida del modal
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const contentVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.1 } },
    exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } }
  };

  // Funciones para controles móviles
  const handleMobileMovement = useCallback((direction: 'left' | 'right', pressed: boolean) => {
    if (direction === 'left') {
      playerRef.current.isMovingLeft = pressed;
      setMobileControls(prev => ({ ...prev, leftPressed: pressed }));
    } else {
      playerRef.current.isMovingRight = pressed;
      setMobileControls(prev => ({ ...prev, rightPressed: pressed }));
    }
  }, []);

  const handleMobileShoot = useCallback((pressed: boolean) => {
    setMobileControls(prev => ({ ...prev, shootPressed: pressed }));

    if (pressed) {
      // Si no hay un intervalo de disparo automático ya establecido, crear uno
      if (!autoFireIntervalRef.current) {
        // Disparar inmediatamente al presionar
        createBullet();

        // Crear intervalo para disparos continuos
        autoFireIntervalRef.current = window.setInterval(() => {
          createBullet();
        }, 200); // Intervalo de 200ms entre disparos
      }
    } else {
      // Limpiar el intervalo de disparo automático cuando se suelta
      if (autoFireIntervalRef.current) {
        clearInterval(autoFireIntervalRef.current);
        autoFireIntervalRef.current = null;
      }
    }
  }, []);

  const handleMobileShop = useCallback(() => {
    setShowUpgradeShop(!showUpgradeShop);
  }, [showUpgradeShop]);

  const handleMobileBomb = useCallback(() => {
    if (upgradesRef.current.hasBomb) {
      useBomb();
    }
  }, []);

  return (
    <ModalOverlay
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={overlayVariants}
      onClick={onClose}
    >
      <ModalContent
        variants={contentVariants}
        onClick={(e) => e.stopPropagation()} // Prevenir que clicks dentro cierren el modal
      >
        <GameHeader>
          <GameTitle>Space Shooter - Score: {score}</GameTitle>
          <CloseButton
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ×
          </CloseButton>
        </GameHeader>

        <CanvasContainer ref={containerRef}>
          <GameCanvas ref={canvasRef} />

          {/* Tienda de mejoras */}
          {showUpgradeShop && (
            <UpgradeShopPopup>
              <div>
                <PointsDisplay>Puntos: {savedPoints}</PointsDisplay>

                <div>
                  <UpgradeButton
                    onClick={buyMultipleShot}
                    disabled={
                      upgradesRef.current.multipleShots >= 3 ||
                      savedPoints < upgradesRef.current.multipleShotPrice
                    }
                  >
                    {upgradesRef.current.multipleShots === 1
                      ? "Disparos: 1 → 2 rectos"
                      : upgradesRef.current.multipleShots === 2
                        ? "Disparos: 2 → 3 en abanico"
                        : "Disparos: Máximo (3)"} ({upgradesRef.current.multipleShotPrice} pts)
                  </UpgradeButton>

                  <UpgradeButton
                    onClick={buyMaxLives}
                    disabled={
                      upgradesRef.current.maxLives >= 7 ||
                      savedPoints < upgradesRef.current.maxLivesPrice
                    }
                  >
                    Vidas: {upgradesRef.current.maxLives}/7 ({upgradesRef.current.maxLivesPrice} pts)
                  </UpgradeButton>

                  <UpgradeButton
                    onClick={buyBomb}
                    disabled={
                      upgradesRef.current.hasBomb ||
                      savedPoints < upgradesRef.current.bombPrice
                    }
                  >
                    Bomba: {upgradesRef.current.hasBomb ? 'Disponible' : 'No'} ({upgradesRef.current.bombPrice} pts)
                  </UpgradeButton>
                </div>
              </div>

              <UpgradeButton onClick={() => setShowUpgradeShop(false)}>
                Cerrar
              </UpgradeButton>
            </UpgradeShopPopup>
          )}

          {/* Ranking de jugadores */}
          {showRanking && gameOverRef.current && (
            <RankingContainer>
              <RankingTitle>🏆 Ranking de Jugadores 🏆</RankingTitle>

              {!scoreSubmitted ? (
                <>
                  <p>¡Has conseguido {scoreRef.current} puntos! Guarda tu puntuación:</p>

                  <InputContainer>
                    <input
                      type="text"
                      placeholder="Introduce tu nombre"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={15}
                    />
                    <SaveButton onClick={saveScore}>Guardar</SaveButton>
                  </InputContainer>
                </>
              ) : (
                <p>¡Puntuación guardada! Tu puesto en el ranking:</p>
              )}

              {highScores.length > 0 ? (
                <RankingTable>
                  <thead>
                    <tr>
                      <th>Puesto</th>
                      <th>Jugador</th>
                      <th>Puntos</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highScores.map((score, index) => (
                      <tr key={index} style={
                        score.name === playerName && score.score === scoreRef.current
                          ? { backgroundColor: 'rgba(255, 0, 255, 0.2)' }
                          : {}
                      }>
                        <td>{index + 1}</td>
                        <td>{score.name}</td>
                        <td>{score.score}</td>
                        <td>{score.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </RankingTable>
              ) : (
                <p>Aún no hay puntuaciones guardadas.</p>
              )}

              <SaveButton onClick={() => setShowRanking(false)}>Cerrar</SaveButton>
            </RankingContainer>
          )}

          {/* Popup para preguntar si iniciar modo infinito */}
          {showInfiniteMode && (
            <InfiniteModeContainer>
              <InfiniteModeTitle>¡Juego Completado!</InfiniteModeTitle>

              <InfiniteModeText>
                Has completado los 15 niveles del juego. ¡Felicitaciones!
              </InfiniteModeText>

              <InfiniteModeText>
                ¿Quieres continuar jugando en Modo Infinito para conseguir más puntos?
              </InfiniteModeText>

              <InfiniteModeButtonsContainer>
                <InfiniteModeButton onClick={startInfiniteMode}>
                  Continuar
                </InfiniteModeButton>

                <InfiniteModeButton onClick={() => {
                  setShowInfiniteMode(false);
                  gameOverRef.current = true;
                }}>
                  Terminar
                </InfiniteModeButton>
              </InfiniteModeButtonsContainer>
            </InfiniteModeContainer>
          )}

          {/* Controles móviles */}
          {isMobile && (
            <MobileControlsContainer>
              <MobileControlsRow>
                <MovementControls>
                  <DirectionButton
                    pressed={mobileControls.leftPressed}
                    onTouchStart={() => handleMobileMovement('left', true)}
                    onTouchEnd={() => handleMobileMovement('left', false)}
                    onMouseDown={() => handleMobileMovement('left', true)}
                    onMouseUp={() => handleMobileMovement('left', false)}
                    onMouseLeave={() => handleMobileMovement('left', false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                  </DirectionButton>

                  <DirectionButton
                    pressed={mobileControls.rightPressed}
                    onTouchStart={() => handleMobileMovement('right', true)}
                    onTouchEnd={() => handleMobileMovement('right', false)}
                    onMouseDown={() => handleMobileMovement('right', true)}
                    onMouseUp={() => handleMobileMovement('right', false)}
                    onMouseLeave={() => handleMobileMovement('right', false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                  </DirectionButton>
                </MovementControls>

                <ActionControls>
                  <MobileButton
                    variant="secondary"
                    onClick={handleMobileShop}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Tienda
                  </MobileButton>

                  {upgradesRef.current.hasBomb && (
                    <MobileButton
                      variant="danger"
                      onClick={handleMobileBomb}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="M4.93 4.93l1.41 1.41"></path>
                        <path d="M17.66 17.66l1.41 1.41"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="M6.34 6.34l-1.41-1.41"></path>
                        <path d="M19.07 19.07l-1.41-1.41"></path>
                      </svg>
                      Misil
                    </MobileButton>
                  )}
                </ActionControls>
              </MobileControlsRow>

              <MobileControlsRow>
                <div></div>
                <MobileButton
                  variant="primary"
                  style={{
                    minWidth: '120px',
                    background: mobileControls.shootPressed
                      ? 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%)'
                      : 'linear-gradient(135deg, #333 0%, #555 100%)',
                    borderColor: mobileControls.shootPressed ? '#FF00FF' : '#666'
                  }}
                  onTouchStart={() => handleMobileShoot(true)}
                  onTouchEnd={() => handleMobileShoot(false)}
                  onMouseDown={() => handleMobileShoot(true)}
                  onMouseUp={() => handleMobileShoot(false)}
                  onMouseLeave={() => handleMobileShoot(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  DISPARAR
                </MobileButton>
                <div></div>
              </MobileControlsRow>
            </MobileControlsContainer>
          )}
        </CanvasContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default RetroGameModal;
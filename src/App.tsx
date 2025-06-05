import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import GlobalStyles from './styles/GlobalStyles';
import { ScrollProvider, useScroll } from './contexts/ScrollContext';
import Intro from './components/sections/Intro';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Projects from './components/sections/Projects';
import Services from './components/sections/Services';
import Contact from './components/sections/Contact';
import Navbar from './components/ui/Navbar';
import ScrollProgress from './components/ui/ScrollProgress';
import GlobalBackground from './components/ui/GlobalBackground';
import RevealGrid from './components/ui/RevealGrid';
import { AnimatePresence } from 'framer-motion';
import GithubCallback from './pages/GithubCallback';
import { isAuthenticated as checkAuthentication, initializeAuthStorage } from '../src/services/auth';

// Importaciones perezosas para mejorar performance
const Chat = lazy(() => import('./components/Chat'));
// Importación perezosa del juego
const RetroGameModal = lazy(() => import('./components/game/RetroGameModal'));
// Importación perezosa del dashboard
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
// Importación perezosa del panel de administración
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
// Importación perezosa de la página de login de administradores
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
// Importaciones perezosas de las nuevas páginas
const Register = lazy(() => import('./pages/Register'));
const Payment = lazy(() => import('./pages/Payment'));
// Importar Login
const Login = lazy(() => import('./pages/Login'));
// Importar la página de éxito de pago
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
// Importar la página de error de pago
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
// Importar la página de pago pendiente
const PaymentPending = lazy(() => import('./pages/PaymentPending'));
// Importar la página de depuración de MercadoPago
const PaymentDebug = lazy(() => import('./pages/PaymentDebug'));
// Importar página de 404
const NotFoundPage = lazy(() => import('./pages/NotFound'));
// Importar página de términos y condiciones
const Terms = lazy(() => import('./pages/Terms'));

// Lista de secciones disponibles en el sitio (debe coincidir con los IDs en el DOM)
const SECTIONS = ['inicio', 'services', 'projects', 'sobre-nosotros', 'contacto'];

// Componente contenedor con el contenido principal
const MainContent = () => {
  const { scrollTo } = useScroll();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [, setOpenProject] = useState<string | null>(null);

  // Estado para controlar la visibilidad del modal del juego
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Función para navegación con el contexto ScrollProvider
  const handleNavigation = (section: string) => {
    scrollTo(section);
  };

  // Función para abrir/cerrar el modal del juego
  const toggleGameModal = () => {
    setIsGameModalOpen(prev => !prev);
  };

  return (
    // Contenedor principal que tendrá las variables CSS
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Capa de Fondo (detrás de todo) */}
      <GlobalBackground />

      {/* Capa de Contenido Principal (encima del fondo) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Barras UI */}
        <ScrollProgress isVertical={true} />
        <Navbar
          showAfterScroll={100}
          onNavigate={handleNavigation}
          toggleChat={() => setIsChatOpen(!isChatOpen)}
          toggleGame={toggleGameModal}
        />

        {/* Secciones */}
        <Hero />
        <Services />
        <Projects />
        <About />
        <Contact />

        {/* Chat (puede necesitar su propio z-index si debe estar sobre RevealGrid/Spotlight) */}
        <Suspense fallback={null}>
          <Chat
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            setOpenProject={setOpenProject}
            onNavigate={handleNavigation}
          />
        </Suspense>
      </div>

      {/* Modal del juego */}
      <AnimatePresence>
        {isGameModalOpen && (
          <Suspense fallback={null}>
            <RetroGameModal
              isOpen={isGameModalOpen}
              onClose={toggleGameModal}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Capas de Efectos (encima del contenido) cargada con Suspense para mejorar performance */}
      {isMounted && (
        <Suspense fallback={null}>
          <RevealGrid />
        </Suspense>
      )}

    </div>
  );
};

// Componente ProtectedRoute para rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Verificar autenticación usando el servicio auth
  const userIsAuthenticated = checkAuthentication();
  const hasAuthToken = !!localStorage.getItem('auth_token');
  const hasSessionToken = !!sessionStorage.getItem('auth_token');
  const hasUserData = !!localStorage.getItem('auth_user') || !!sessionStorage.getItem('auth_user');

  // Verificar también en cookies para máxima compatibilidad
  const hasTokenCookie = document.cookie.includes('auth_token=');
  const isAuthFlag = localStorage.getItem('isAuthenticated') === 'true' ||
    sessionStorage.getItem('isAuthenticated') === 'true' ||
    document.cookie.includes('isAuthenticated=true');

  console.log('Estado de autenticación (ProtectedRoute):', {
    isAuthenticated: userIsAuthenticated,
    hasAuthToken,
    hasSessionToken,
    hasTokenCookie,
    hasUserData,
    isAuthFlag,
    pathname: location.pathname,
  });

  // Intentar múltiples fuentes de autenticación antes de decidir redirigir
  if (!userIsAuthenticated && !hasAuthToken && !hasSessionToken && !hasTokenCookie && !isAuthFlag) {
    console.log('Acceso a ruta protegida: Requiere iniciar sesión - Redirigiendo a login');

    // Guardar la URL actual para redirigir después del login
    const currentPath = `${location.pathname}${location.search}`;
    localStorage.setItem('auth_redirect_url', currentPath);

    // Verificar si hay tokens o información parcial para recuperar la sesión
    if (hasUserData) {
      console.log('⚠️ Hay datos de usuario pero sin token válido, intentando recuperar sesión');

      // Podríamos intentar obtener un nuevo token usando los datos de usuario
      // Pero por ahora solo redirigirnos al login
      return <Navigate to="/login" replace state={{ from: location, hasUserData: true }} />;
    }

    // Redireccionar a la página de login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si el usuario tiene token pero no está marcado como autenticado, establecerlo
  if (!userIsAuthenticated && (hasAuthToken || hasSessionToken || hasTokenCookie)) {
    console.log('Usuario con token: Estableciendo autenticación automática');

    // Establecer el flag en todas las formas de almacenamiento
    localStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('isAuthenticated', 'true');
    document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;
  }

  return children;
};

// Componente AdminRoute para rutas que requieren permisos de administrador
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const hasAuthToken = !!localStorage.getItem('auth_token');

  // Verificar si el usuario tiene permisos de administrador
  // En un entorno real, esto se haría verificando roles en el token o consultando a la API
  const isAdmin = localStorage.getItem('user_role') === 'admin';

  console.log('Estado de autenticación (AdminRoute):', {
    isAuthenticated,
    hasAuthToken,
    isAdmin,
    userRole: localStorage.getItem('user_role'),
    sessionUserRole: sessionStorage.getItem('user_role'),
    pathname: window.location.pathname,
  });

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated && !hasAuthToken) {
    console.log('Acceso al panel admin: Requiere iniciar sesión - Redirigiendo a login');
    return <Navigate to="/admin/login" replace />;
  }

  // Si está autenticado pero no es administrador, mostrar mensaje de error
  if ((isAuthenticated || hasAuthToken) && !isAdmin) {
    console.log('Acceso al panel admin: Usuario autenticado pero sin permisos de administrador');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        color: '#f5f5f5',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#FF5252', marginBottom: '1rem' }}>Acceso Denegado</h1>
        <p style={{ marginBottom: '2rem' }}>No tienes permisos de administrador para acceder a esta sección.</p>
        <button
          onClick={() => window.location.href = '/admin/login'}
          style={{
            background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
            color: 'white',
            border: 'none',
            padding: '0.85rem 1.5rem',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return children;
};

// Componente AdminVerify para la página de verificación de token
const AdminVerify = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setError('No se encontró un token de verificación válido');
        return;
      }

      try {
        console.log('🔐 Verificando token de administrador:', token.substring(0, 10) + '...');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/admin/verify/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success && data.token) {
          console.log('✅ Verificación exitosa, autenticando administrador');

          // Guardar el token JWT en todas las formas de almacenamiento
          localStorage.setItem('auth_token', data.token);
          sessionStorage.setItem('auth_token', data.token);
          document.cookie = `auth_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
          localStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('isAuthenticated', 'true');
          document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;

          // Guardar rol de administrador
          localStorage.setItem('user_role', 'admin');
          sessionStorage.setItem('user_role', 'admin');

          // Guardar información del usuario administrador
          if (data.user) {
            localStorage.setItem('user_info', JSON.stringify(data.user));
            sessionStorage.setItem('user_info', JSON.stringify(data.user));
          }

          // Redirigir al panel de administración
          console.log('🚀 Redirigiendo al panel de administración');
          navigate('/admin', { replace: true });
        } else {
          console.error('❌ Error en verificación:', data.error);

          // Verificar si el error es por token expirado
          const errorMessage = data.error || '';
          if (errorMessage.includes('expirado') || errorMessage.includes('expired')) {
            setIsTokenExpired(true);
            setError('El enlace de verificación ha expirado. Los enlaces de verificación son válidos por solo 10 minutos por razones de seguridad.');
          } else {
            setError(data.error || 'Token de verificación inválido o expirado');
          }
        }
      } catch (error) {
        console.error('❌ Error al verificar token:', error);
        setError('Error de conexión. Por favor, intenta de nuevo.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#121212',
      color: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        padding: '2rem',
        width: '100%',
        maxWidth: '450px',
        backdropFilter: 'blur(10px)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          marginBottom: '1.5rem',
          color: '#00FFFF'
        }}>
          {verifying ? 'Verificando Acceso' : error ? 'Error de Verificación' : 'Acceso Verificado'}
        </h1>

        {verifying ? (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #333',
              borderTop: '4px solid #00FFFF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Verificando token de autenticación...</p>
          </div>
        ) : error ? (
          <div>
            <p style={{ color: '#FF5252', marginBottom: '1.5rem' }}>{error}</p>
            {isTokenExpired && (
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1.5rem'
              }}>
                Puedes solicitar un nuevo enlace de verificación desde la página de inicio de sesión.
              </p>
            )}
            <button
              onClick={() => navigate('/admin/login')}
              style={{
                background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
                color: 'white',
                border: 'none',
                padding: '0.85rem 1.5rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isTokenExpired ? 'Solicitar Nuevo Enlace' : 'Volver al inicio de sesión'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#4CAF50', marginBottom: '1.5rem' }}>
              ¡Verificación exitosa! Redirigiendo al panel de administración...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente AppRoutes con acceso a location
const AppRoutes = () => {
  const [showIntro, setShowIntro] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  // Solo mostrar la intro en la primera carga y verificar autenticación
  useEffect(() => {
    // Manejo de la intro
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
    } else {
      sessionStorage.setItem('hasSeenIntro', 'true');
    }

    // Verificar autenticación de múltiples fuentes al inicio
    const authToken = localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token');
    const tokenCookie = document.cookie.match(new RegExp(`(^| )auth_token=([^;]+)`));
    const hasToken = !!authToken || !!tokenCookie;

    console.log('🔄 Verificando tokens al iniciar AppRoutes:', {
      hasLocalToken: !!localStorage.getItem('auth_token'),
      hasSessionToken: !!sessionStorage.getItem('auth_token'),
      hasCookieToken: !!tokenCookie,
      currentRoute: location.pathname
    });

    // Si hay token, asegurar que isAuthenticated esté establecido
    if (hasToken) {
      console.log('✅ Token encontrado al iniciar, estableciendo estado autenticado');
      localStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('isAuthenticated', 'true');
      document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;

      // Si hay un token pero estamos en /login, podríamos redirigir al dashboard
      if (location.pathname === '/login') {
        console.log('⚠️ Usuario ya autenticado en /login, redirigiendo a /dashboard');
        setTimeout(() => navigate('/dashboard'), 100);
      }
    }

    // Verificar si viene de un pago exitoso
    const paymentStatus = new URLSearchParams(location.search).get('status');
    const isPaymentSuccess = paymentStatus === 'approved' || paymentStatus === 'success';
    const isPaymentRoute = location.pathname.includes('/payment/success');

    // Si el usuario completó un pago y no está en la ruta de éxito, redirigir al dashboard
    if (isPaymentSuccess && !isPaymentRoute) {
      console.log('Pago exitoso detectado, redirigiendo al dashboard...');
      // Guardar que el pago fue exitoso
      localStorage.setItem('project_payment_completed', 'true');
      navigate('/dashboard');
    }

    setInitialAuthChecked(true);
  }, [location, navigate]);

  useEffect(() => {
    // Obtener token y userId de los parámetros de URL (desde callback de OAuth)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userId = params.get('userId');

    // Si hay token y userId en los parámetros, autenticar al usuario
    if (token && userId) {
      console.log('🔑 Token recibido, autenticando usuario');

      // Guardar el token y la información del usuario en todas las formas de almacenamiento
      localStorage.setItem('auth_token', token);
      sessionStorage.setItem('auth_token', token);
      document.cookie = `auth_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
      localStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('isAuthenticated', 'true');
      document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;

      // Eliminar los parámetros de la URL para limpiarla
      window.history.replaceState({}, document.title, window.location.pathname);

      // Comprobar si hay una URL de redirección de pago pendiente o github redireccionamiento
      const paymentRedirectUrl = localStorage.getItem('payment_redirect_url');
      const githubRedirectUrl = localStorage.getItem('github_auth_redirect');

      console.log('📋 Verificando redirecciones pendientes:');
      console.log('- URL de pago pendiente:', paymentRedirectUrl || 'No disponible');
      console.log('- URL de GitHub redirect:', githubRedirectUrl || 'No disponible');

      // Priorizar primero la URL de pago pendiente
      if (paymentRedirectUrl) {
        console.log('✅ Autenticación exitosa, redirigiendo a URL de pago pendiente:', paymentRedirectUrl);

        // Limpiar la URL almacenada para evitar loops
        localStorage.removeItem('payment_redirect_url');

        // Verificar si es una redirección circular
        if (paymentRedirectUrl.includes('/login')) {
          console.warn('⚠️ Detectada redirección circular a /login, cambiando a /dashboard');

          // Redirigir al dashboard como fallback seguro
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          // Redirigir a la página de pago con un pequeño retraso
          // para asegurar que el token se ha guardado correctamente
          setTimeout(() => {
            // Usar window.location para forzar recarga completa
            window.location.href = paymentRedirectUrl;
          }, 500);
        }
      }
      // Si no hay URL de pago pendiente pero sí una de GitHub
      else if (githubRedirectUrl) {
        console.log('✅ Autenticación exitosa, redirigiendo a URL desde GitHub auth:', githubRedirectUrl);

        // Limpiar la URL almacenada para evitar loops
        localStorage.removeItem('github_auth_redirect');

        // Verificar si es una redirección circular
        if (githubRedirectUrl.includes('/login')) {
          console.warn('⚠️ Detectada redirección circular a /login, cambiando a /dashboard');

          // Redirigir al dashboard como fallback seguro
          setTimeout(() => {
            navigate('/dashboard');
          }, 500);
        } else {
          // Redirigir a la URL desde GitHub
          setTimeout(() => {
            // Usar window.location para forzar recarga completa
            window.location.href = githubRedirectUrl;
          }, 500);
        }
      }
    }

    // Comprobar si hay un error de autenticación
    const error = params.get('error');
    if (error) {
      console.error('Error de autenticación:', error);
      // También limpiar el parámetro de error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search, navigate]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <Routes>
      <Route path="/" element={
        <>
          {/* Intro animada */}
          {showIntro && <Intro onComplete={handleIntroComplete} />}

          {/* Contenido principal */}
          {!showIntro && (
            <ScrollProvider sections={SECTIONS}>
              <MainContent />
            </ScrollProvider>
          )}
        </>
      } />

      {/* Ruta para la página de registro */}
      <Route path="/register/:serviceId" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Register />
        </Suspense>
      } />

      {/* Ruta para la página de pago con parámetro en la ruta */}
      <Route path="/payment/:serviceId" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Payment />
        </Suspense>
      } />

      {/* Ruta para la página de pago con parámetros de consulta */}
      <Route path="/payment" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Payment />
        </Suspense>
      } />

      {/* Rutas para resultados de pago */}
      <Route path="/payment/success" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <PaymentSuccess />
        </Suspense>
      } />

      <Route path="/payment/failure" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <PaymentFailure />
        </Suspense>
      } />

      {/* Ruta para pagos pendientes */}
      <Route path="/payment/pending" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <PaymentPending />
        </Suspense>
      } />

      {/* Ruta para depuración de MercadoPago */}
      <Route path="/payment/debug" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <PaymentDebug />
        </Suspense>
      } />

      <Route path="/login" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Login />
        </Suspense>
      } />

      <Route path="/register" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Register />
        </Suspense>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Suspense fallback={<div>Cargando...</div>}>
            <Dashboard userName="Usuario de Prueba" />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Ruta para el login de administradores */}
      <Route path="/admin/login" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <AdminLogin />
        </Suspense>
      } />

      {/* Ruta para el panel de administración */}
      <Route path="/admin" element={
        <AdminRoute>
          <Suspense fallback={<div>Cargando panel de administración...</div>}>
            <AdminPanel />
          </Suspense>
        </AdminRoute>
      } />

      {/* Ruta para el callback de GitHub */}
      <Route path="/api/auth/github" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <GithubCallback />
        </Suspense>
      } />

      {/* Ruta para la página de verificación de token */}
      <Route path="/admin/verify/:token" element={<AdminVerify />} />

      {/* Ruta para la página de términos y condiciones */}
      <Route path="/terms" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Terms />
        </Suspense>
      } />

      {/* Ruta para página 404 */}
      <Route path="*" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <NotFoundPage />
        </Suspense>
      } />
    </Routes>
  );
};

// La configuración global ya está en main.tsx, pero aquí mantenemos los estilos específicos de la aplicación
function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  // Inicializar el sistema de autenticación al cargar la aplicación
  useEffect(() => {
    console.log('🚀 Inicializando App y sistema de autenticación');

    // Inicializar sistema de almacenamiento para autenticación
    initializeAuthStorage();

    // Verificar si hay autenticación y guardarla en todos los almacenamientos si existe
    const isAuth = checkAuthentication();

    console.log('🔐 Estado inicial de autenticación:', isAuth);

    // Si hay errores con fuentes principales de almacenamiento, intentar verificar
    // la autenticación desde otras fuentes al iniciar
    if (isAuth) {
      console.log('✅ Usuario autenticado, asegurando persistencia en todos los almacenamientos');
    }

    // Marcar que ya se realizó la verificación inicial
    setInitialAuthChecked(true);
  }, []);

  // Verificar si estamos en una ruta protegida y no autenticado
  useEffect(() => {
    if (initialAuthChecked) {
      const isAuth = checkAuthentication();
      const currentPath = location.pathname;

      // Solo redirigir a login si NO está autenticado y está en /dashboard
      if (!isAuth && currentPath === '/dashboard') {
        localStorage.setItem('auth_redirect_url', currentPath);
        navigate('/login', { replace: true });
      }
      // En cualquier otro caso, nunca redirigir a login
    }
  }, [initialAuthChecked, location.pathname, navigate]);

  return (
    <>
      <GlobalStyles />
      <AppRoutes />
    </>
  );
}

export default App;

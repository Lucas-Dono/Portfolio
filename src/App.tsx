import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
const SECTIONS = ['inicio', 'sobre-mi', 'projects', 'servicios', 'contacto'];

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
        <About />
        <Projects />
        <Services />
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
  // Verificar si el usuario está autenticado de cualquier manera
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const hasAuthToken = !!localStorage.getItem('auth_token');
  const hasUserData = !!localStorage.getItem('auth_user');

  console.log('Estado de autenticación (ProtectedRoute):', {
    isAuthenticated,
    hasAuthToken,
    hasUserData,
    pathname: window.location.pathname,
  });

  // Acceso permitido si tiene sesión iniciada por cualquier método
  if (!isAuthenticated && !hasAuthToken) {
    console.log('Acceso al dashboard: Requiere iniciar sesión - Redirigiendo a login');
    // Redireccionar a la página de login
    return <Navigate to="/login" replace />;
  }

  // Si el usuario tiene token pero no está marcado como autenticado, establecerlo
  if (!isAuthenticated && hasAuthToken) {
    console.log('Usuario con token: Estableciendo autenticación automática');
    localStorage.setItem('isAuthenticated', 'true');
  }

  // Verificar si no tiene datos de usuario pero está autenticado
  if ((isAuthenticated || hasAuthToken) && !hasUserData) {
    console.log('⚠️ Usuario autenticado sin datos: Posible error de autenticación');
    console.warn('La creación automática de datos ficticios está desactivada para depurar errores');
    // No crear datos ficticios para poder ver y resolver los errores reales
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
    pathname: window.location.pathname,
  });

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated && !hasAuthToken) {
    console.log('Acceso al panel admin: Requiere iniciar sesión - Redirigiendo a login');
    return <Navigate to="/admin/login" replace />;
  }


  return children;
};

// Componente AdminVerify para la página de verificación de token
const AdminVerify = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Redirigir a la página de login con el token en la URL
    // El componente AdminLogin se encargará de procesar el token
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      navigate(`/admin/login?token=${token}`, { replace: true });
    } else {
      setVerifying(false);
      setError('No se encontró un token de verificación válido');
    }
  }, [location, navigate]);

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
        }}>Verificando Acceso</h1>

        {verifying ? (
          <p>Verificando token de autenticación...</p>
        ) : (
          <div>
            <p style={{ color: '#FF5252' }}>{error}</p>
            <button
              onClick={() => navigate('/admin/login')}
              style={{
                background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
                color: 'white',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '1.5rem'
              }}
            >
              Volver al inicio de sesión
            </button>
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

  // Solo mostrar la intro en la primera carga
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      setShowIntro(false);
    } else {
      sessionStorage.setItem('hasSeenIntro', 'true');
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
  }, [location, navigate]);

  useEffect(() => {
    // Obtener token y userId de los parámetros de URL (desde callback de OAuth)
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userId = params.get('userId');

    // Si hay token y userId en los parámetros, autenticar al usuario
    if (token && userId) {
      console.log('🔑 Token recibido, autenticando usuario');

      // Guardar el token y la información del usuario
      localStorage.setItem('auth_token', token);

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
      <Route path="/admin/verify" element={<AdminVerify />} />

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
  return (
    <>
      <GlobalStyles />
      <AppRoutes />
    </>
  );
}

export default App;

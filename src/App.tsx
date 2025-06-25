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
import { API_BASE_URL } from './config/apiConfig';
import { useAuth } from './context/AuthContext';

// Importaciones perezosas para mejorar performance
const Chat = lazy(() => import('./components/Chat'));
// Importación perezosa del juego
const RetroGameModal = lazy(() => import('./components/game/RetroGameModal'));
// Importación perezosa del dashboard con manejo de errores
const DashboardComponent = lazy(() => import('./components/dashboard/Dashboard')
  .catch(error => {
    console.error('Error al cargar el componente Dashboard:', error);
    // Devolver un componente de fallback simple
    return {
      default: () => (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          background: '#121212',
          color: '#f5f5f5'
        }}>
          <h2>Error al cargar el Dashboard</h2>
          <p>Ha ocurrido un error al cargar el panel de control. Por favor, intenta recargar la página.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              marginTop: '1rem',
              background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recargar página
          </button>
        </div>
      )
    };
  })
);

// Alias para los componentes importados perezosamente
const Dashboard = DashboardComponent;
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const Payment = lazy(() => import('./pages/Payment'));
const Login = lazy(() => import('./pages/Login'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const PaymentPending = lazy(() => import('./pages/PaymentPending'));
const Error310TestComponent = lazy(() => import('./components/debug/Error310TestComponent'));
const PaymentDebug = lazy(() => import('./pages/PaymentDebug'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Terms = lazy(() => import('./pages/Terms'));

// Lista de secciones disponibles en el sitio (debe coincidir con los IDs en el DOM)
const SECTIONS = ['inicio', 'services', 'projects', 'sobre-nosotros', 'contacto'];

// Componente wrapper para el Dashboard que utiliza el contexto de autenticación
const DashboardWrapper = () => {
  const { user } = useAuth();
  
  // Obtener el nombre del usuario desde el contexto, o usar fallback
  const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';
  
  return <Dashboard userName={userName} />;
};

// Componente contenedor con el contenido principal
const MainContent = () => {
  const { scrollTo } = useScroll();
  const [isChatOpen, setIsChatOpen] = useState(true); // Chat protagonista - abierto por defecto
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

  // Si estamos en modo desarrollo, podemos ser más permisivos
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

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

  // Evitar múltiples redirecciones en poco tiempo
  const lastRedirect = localStorage.getItem('last_auth_redirect');
  const now = Date.now();
  const redirectionThreshold = 5000; // 5 segundos

  console.log('Estado de autenticación (ProtectedRoute):', {
    isAuthenticated: userIsAuthenticated,
    hasAuthToken,
    hasSessionToken,
    hasTokenCookie,
    hasUserData,
    isAuthFlag,
    isDevelopment,
    pathname: location.pathname,
    lastRedirect: lastRedirect ? new Date(parseInt(lastRedirect)).toISOString() : 'none',
    timeSinceLastRedirect: lastRedirect ? now - parseInt(lastRedirect) : 'n/a'
  });

  // En modo desarrollo, permitir acceso si hay algún indicio de autenticación
  if (isDevelopment && (hasAuthToken || hasSessionToken || hasTokenCookie || hasUserData)) {
    console.log('🔧 Modo desarrollo: permitiendo acceso a ruta protegida con autenticación parcial');
    return children;
  }

  // Intentar múltiples fuentes de autenticación antes de decidir redirigir
  if (!userIsAuthenticated && !hasAuthToken && !hasSessionToken && !hasTokenCookie && !isAuthFlag) {
    // Evitar bucles de redirección comprobando el tiempo desde la última redirección
    if (lastRedirect && (now - parseInt(lastRedirect)) < redirectionThreshold) {
      console.warn('⚠️ Evitando bucle de redirección, ya se redirigió hace menos de 5 segundos');
      return <div>Verificando autenticación...</div>;
    }

    console.log('Acceso a ruta protegida: Requiere iniciar sesión - Redirigiendo a login');

    // Registrar esta redirección
    localStorage.setItem('last_auth_redirect', now.toString());

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

        const responseText = await response.text(); // Leer la respuesta como texto primero

        // Si la respuesta no fue exitosa (ej: 404, 500, 502)
        if (!response.ok) {
          console.error(`❌ El servidor respondió con un error de estado: ${response.status} ${response.statusText}`);
          console.error('📝 Contenido de la respuesta del servidor (texto):', responseText);
          // Intentar parsear como JSON para obtener un mensaje de error si existe
          try {
            const errorData = JSON.parse(responseText);
            setError(errorData.error || `Error del servidor: ${response.status}`);
          } catch (e) {
            // Si el parseo falla, es probablemente una página de error HTML de Nginx/proxy
            setError(`Error del servidor (${response.status}). La respuesta no es JSON. Revisa los logs del servidor y la consola del navegador.`);
          }
          return; // Detener ejecución
        }

        // Si la respuesta fue exitosa (2xx), intentar parsearla como JSON
        try {
          const data = JSON.parse(responseText);

          if (data.success && data.token) {
            console.log('✅ Verificación exitosa, autenticando administrador');
            // ... (resto de la lógica de éxito) ...
            localStorage.setItem('auth_token', data.token);
            sessionStorage.setItem('auth_token', data.token);
            document.cookie = `auth_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
            localStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('isAuthenticated', 'true');
            document.cookie = `isAuthenticated=true; path=/; max-age=2592000; SameSite=Lax`;
            localStorage.setItem('user_role', 'admin');
            sessionStorage.setItem('user_role', 'admin');
            if (data.user) {
              localStorage.setItem('user_info', JSON.stringify(data.user));
              sessionStorage.setItem('user_info', JSON.stringify(data.user));
            }
            navigate('/admin', { replace: true });
          } else {
            console.error('❌ Error en verificación (lógica de negocio):', data.error);
            const errorMessage = data.error || '';
            if (errorMessage.includes('expirado')) {
              setIsTokenExpired(true);
              setError('El enlace de verificación ha expirado.');
            } else {
              setError(data.error || 'Token de verificación inválido.');
            }
          }
        } catch (jsonError) {
          console.error('❌ Error: La respuesta del servidor fue exitosa (2xx) pero no era JSON válido.');
          console.error('📝 Contenido de la respuesta (texto):', responseText);
          console.error('Error de parseo:', jsonError);
          setError('El servidor envió una respuesta inesperada. Revisa la consola.');
        }

      } catch (networkError: any) {
        console.error('❌ Error de red o CORS al verificar token:', networkError);
        let detailedError = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.';
        if (networkError.name === 'TypeError' && networkError.message.includes('Failed to fetch')) {
          detailedError = 'Error de red o CORS. El servidor no es accesible desde tu navegador. Contacta al soporte técnico.';
        }
        setError(detailedError);
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

      {/* Ruta para debugging del error 310 */}
      <Route path="/debug/error310" element={
        <Suspense fallback={<div>Cargando...</div>}>
          <Error310TestComponent testMode="normal" />
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
            <DashboardWrapper />
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
          <NotFound />
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

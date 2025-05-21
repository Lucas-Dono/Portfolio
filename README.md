# Portfolio - Circuit Prompt

Un sistema integral de gestión para servicios tecnológicos, con soporte para autenticación, pagos, seguimiento de servicios y más.

## Características

- **Sistema de autenticación**: Registro, login y gestión de usuarios
- **Panel de administración**: Gestión de servicios y clientes
- **Pasarela de pagos**: Integración con Mercado Pago
- **Notificaciones**: Sistema de correo electrónico y WhatsApp
- **API RESTful**: Endpoints para gestionar servicios, pagos y usuarios
- **Frontend moderno**: Interfaz de usuario responsiva y atractiva

## Tecnologías Utilizadas

- **Backend**: Node.js, Express
- **Frontend**: React, Vite
- **Base de datos**: PostgreSQL, Sequelize ORM
- **Autenticación**: JWT
- **Integración de pagos**: Mercado Pago API
- **Contenedores**: Docker, Docker Compose
- **Despliegue**: Nginx como proxy inverso, Certbot para SSL

## Requisitos

- Node.js 18+
- Docker y Docker Compose
- PostgreSQL (o usar la versión en contenedor)

## Configuración y Despliegue

### Entorno de Desarrollo

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/portfolio.git
   cd portfolio
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear archivo .env basado en .env.example:
   ```bash
   cp .env.example .env
   ```

4. Iniciar en modo desarrollo con Docker:
   ```bash
   ./docker-portfolio.sh start
   ```

   O sin Docker:
   ```bash
   npm run dev
   ```

### Entorno de Producción

Para desplegar en producción:

1. Configurar variables de entorno en .env.prod
2. Ejecutar:
   ```bash
   ./docker-prod.sh start
   ```

Para más detalles, consulta el archivo [DONWEB_DEPLOY_INSTRUCTIONS.md](DONWEB_DEPLOY_INSTRUCTIONS.md).

## Estructura del Proyecto

```
portfolio/
├── config/           # Configuración de la base de datos y servicios
├── controllers/      # Controladores para las rutas API
├── models/           # Modelos de datos
├── routes/           # Definición de rutas API
├── src/              # Código fuente del frontend
│   ├── assets/       # Recursos estáticos
│   ├── components/   # Componentes React
│   ├── pages/        # Páginas de la aplicación
│   └── services/     # Servicios para comunicación con el API
├── utils/            # Utilidades compartidas
├── docker-compose-prod.yml  # Configuración para producción
├── docker-portfolio.sh      # Script para desarrollo
├── docker-prod.sh           # Script para producción
└── Dockerfile.prod          # Configuración de contenedor para producción
```

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

# Portfolio Profesional

Este proyecto es un portfolio profesional moderno desarrollado con React + TypeScript + Vite, diseñado para mostrar proyectos, habilidades y servicios de manera interactiva y visualmente atractiva.

## Características

- Diseño moderno y responsive
- Animaciones fluidas con Framer Motion
- Secciones interactivas para proyectos, servicios y contacto
- Chatbot interactivo para comunicación directa
- Juego retro como easter egg
- Panel de administración para gestionar contenido

## Tecnologías utilizadas

- React 18
- TypeScript
- Vite
- Styled Components
- Framer Motion
- React Router
- Contexto de React para gestión de estado

## Panel de Administración

El portfolio incluye un panel de administración para gestionar estadísticas, proyectos y mensajes:

- Accesible en la ruta `/dashboard`
- Protegido con autenticación simple
- Muestra estadísticas de visitas, proyectos y mensajes
- Gestión de proyectos con diferentes estados
- Visualización de mensajes recibidos

## Integración de Pagos con Mercado Pago

El sitio incluye una integración completa con Mercado Pago mediante Payment Brick, permitiendo procesar pagos de manera segura y con una experiencia de usuario optimizada.

### Características principales:

1. **Experiencia visual profesional y personalizada**
   - Diseño adaptado a la identidad visual del sitio con gradientes #FF00FF a #00FFFF
   - Formulario de pago integrado con la estética del sitio
   - Elementos visuales de confianza (iconos de seguridad, mensajes sobre encriptación)

2. **Múltiples métodos de pago**
   - Tarjetas de crédito/débito
   - Dinero en cuenta de Mercado Pago
   - Configuración de cuotas (hasta 12 cuotas)

3. **Flujo de pago completo y amigable**
   - Página de pago con resumen de pedido
   - Página de éxito con detalles de la transacción
   - Página de error con consejos para resolver problemas de pago
   - Redirecciones automáticas según el resultado del pago

4. **Seguridad**
   - Procesamiento seguro por parte de Mercado Pago
   - El frontend no maneja datos sensibles
   - Configuración adecuada de CORS y CSP en el servidor
   - Validación de firmas y tokens

### Tecnologías utilizadas:

- SDK de Mercado Pago v2 (JavaScript)
- Payment Brick para renderizar formularios de pago
- API REST para comunicación con el backend
- Styled-components para el diseño adaptado
- React Router para navegación entre páginas

### Archivos principales:

- `src/pages/Payment.tsx`: Componente principal que muestra el formulario de pago
- `src/pages/PaymentSuccess.tsx`: Página de confirmación para pagos exitosos
- `src/pages/PaymentFailure.tsx`: Página de error para pagos rechazados
- `controllers/paymentController.js`: Controlador de backend para integración con Mercado Pago
- `routes/paymentRoutes.js`: Definición de endpoints de API para procesar pagos

Para configurar la integración, se deben definir las siguientes variables de entorno:

```
VITE_MP_PUBLIC_KEY=<Tu clave pública de Mercado Pago>
MP_ACCESS_TOKEN=<Tu token de acceso de Mercado Pago>
```

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Navegar al directorio del proyecto
cd portfolio

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Estructura del proyecto

```
/src
  /components
    /dashboard     # Componentes del panel de administración
    /game          # Componentes del juego retro
    /sections      # Secciones principales del portfolio
    /ui            # Componentes de interfaz reutilizables
  /contexts        # Contextos de React para estado global
  /hooks           # Hooks personalizados
  /styles          # Estilos globales
  /utils           # Utilidades y funciones auxiliares
```

## Licencia

MIT

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

# Aceptación de Términos y Condiciones

Para cumplir con requisitos legales y garantizar que los usuarios acepten los términos y condiciones antes de usar el servicio, hemos implementado un sistema de verificación de aceptación de términos durante el registro.

## Características implementadas

- Campo `termsAccepted` (booleano) en el modelo de usuario que indica si el usuario ha aceptado los términos.
- Campo `termsAcceptedAt` (fecha) que registra cuándo se aceptaron los términos.
- Validación durante el registro para asegurar que los términos sean aceptados.
- Soporte para aceptación de términos en todos los métodos de autenticación (email, Google, GitHub).
- Migración SQL para añadir los campos a la base de datos existente.

## Cómo aplicar la migración

Para aplicar los cambios a la base de datos:

```bash
# Mediante la terminal de psql (reemplaza postgres_user con tu usuario de PostgreSQL)
psql -U postgres_user -d portfolio -f migrations/add_terms_accepted_fields.sql

# O desde el contenedor Docker (si usas Docker)
docker exec -i postgres psql -U postgres -d portfolio -f /app/migrations/add_terms_accepted_fields.sql
```

## Cambios en el API

El API ahora espera un campo `termsAccepted: true` en las solicitudes de registro. En caso de no proporcionarlo, se devolverá un error:

```json
{
  "success": false,
  "error": "Debes aceptar los términos y condiciones para crear una cuenta"
}
```

Para autenticación OAuth (Google, GitHub), si es un usuario nuevo que intenta registrarse sin aceptar los términos, se devolverá:

```json
{
  "success": false,
  "error": "Debes aceptar los términos y condiciones para crear una cuenta",
  "requiresTermsAcceptance": true
}
```

Este flag `requiresTermsAcceptance` permite al frontend mostrar un diálogo de aceptación de términos y condiciones y luego reintentar la autenticación con el parámetro `termsAccepted: true`.

## Funcionalidades de Seguridad Implementadas

### Verificación de Email
- Todos los usuarios deben verificar su dirección de correo electrónico al registrarse
- Se envía un correo electrónico con un enlace de verificación válido por 24 horas
- En desarrollo, la verificación es automática para facilitar las pruebas

### Autenticación de Dos Factores (2FA)
- Implementación de autenticación TOTP basada en tiempo usando el estándar RFC 6238
- Generación de códigos QR para configurar aplicaciones como Google Authenticator, Authy, etc.
- Códigos de respaldo generados para acceso de emergencia
- Almacenamiento seguro de códigos de respaldo usando hashing SHA-256

### Aceptación de Términos y Condiciones
- Obligatorio para todos los usuarios, incluyendo autenticación con Google y GitHub
- Verificación en cada inicio de sesión
- Registro de la fecha y hora de aceptación

### Base de Datos PostgreSQL
- Modelo de datos optimizado con campos específicos para seguridad
- Migraciones SQL para facilitar la actualización del esquema de base de datos
- Soporte para almacenamiento y validación de tokens de seguridad

### Seguridad de Contraseñas
- Hashing de contraseñas con bcrypt y saltos aleatorios
- No se almacenan contraseñas en texto plano
- Validación robusta de credenciales

### Protección de Rutas
- Middleware de autenticación para proteger rutas sensibles
- Validación de permisos basada en roles (user/admin)
- Gestión de sesiones con tokens JWT

### Sistemas de Respaldo
- Fallback a archivos JSON solo en entorno de desarrollo
- En producción, única fuente de verdad es PostgreSQL

## Uso de Autenticación de Dos Factores

### Activación de 2FA
1. Iniciar sesión en la aplicación
2. Ir a la configuración de seguridad
3. Activar la opción de autenticación de dos factores
4. Escanear el código QR con una aplicación TOTP (Google Authenticator, Authy, etc.)
5. Ingresar el código generado para verificar la configuración
6. Guardar los códigos de respaldo en un lugar seguro

### Inicio de Sesión con 2FA
1. Ingresar credenciales normales (email/contraseña)
2. En el segundo paso, ingresar el código temporal de la aplicación TOTP o un código de respaldo
3. Acceder a la aplicación después de la verificación correcta

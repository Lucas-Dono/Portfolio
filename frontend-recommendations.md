# Recomendaciones para la implementación del Frontend de Aceptación de Términos y Condiciones

## Componentes necesarios

1. **Checkbox de aceptación de términos en formulario de registro**
   - Debe estar visible y claramente destacado
   - Debe enlazar a la página de términos completos
   - El botón de registro debe estar desactivado hasta que se acepten los términos

2. **Modal de términos y condiciones para OAuth**
   - Cuando un usuario nuevo intenta registrarse con Google o GitHub
   - Se debe mostrar si la API devuelve `requiresTermsAcceptance: true`
   - Debe tener botones "Aceptar" y "Rechazar"
   - Al aceptar, reintenta la autenticación con `termsAccepted: true`

3. **Página completa de términos y condiciones**
   - Texto completo de los términos en formato legible
   - Enlace desde el formulario de registro y el modal de OAuth
   - Accesible desde el pie de página del sitio

## Flujo de usuario con OAuth (Google/GitHub)

```
Usuario -> Clic en "Continuar con Google/GitHub" -> Autenticación OAuth ->
  -> ¿Usuario nuevo? -> 
     -> SÍ -> Mostrar modal de términos -> 
         -> ¿Aceptado? -> 
             -> SÍ -> Reenviar solicitud con termsAccepted=true -> Registrar y acceder
             -> NO -> Cancelar registro
     -> NO -> Acceder directamente
```

## Ejemplo de implementación para el componente de términos en registro

```tsx
// Componente para formulario de registro
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    termsAccepted: false,
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      // Manejar respuesta...
    } catch (error) {
      console.error('Error al registrar:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Otros campos del formulario */}
      
      <div className="terms-checkbox">
        <input
          type="checkbox"
          id="termsAccepted"
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleChange}
          required
        />
        <label htmlFor="termsAccepted">
          Acepto los <Link to="/terms" target="_blank">términos y condiciones</Link> del servicio.
        </label>
      </div>
      
      <button 
        type="submit" 
        disabled={!formData.termsAccepted}
      >
        Registrarse
      </button>
    </form>
  );
}
```

## Ejemplo de implementación para el modal de OAuth

```tsx
// Componente Modal para aceptación de términos en OAuth
import { useState } from 'react';
import Modal from './Modal'; // Componente de modal genérico

export default function TermsModal({ isOpen, onAccept, onReject }) {
  return (
    <Modal isOpen={isOpen} onClose={onReject}>
      <h2>Términos y Condiciones</h2>
      
      <div className="terms-content">
        <p>Para continuar con el registro, debes aceptar nuestros términos y condiciones.</p>
        
        <div className="terms-scroll-box">
          {/* Texto de términos y condiciones resumido */}
          <p>Este servicio proporciona...</p>
          <p>Al utilizar nuestra plataforma, aceptas...</p>
          {/* Más texto aquí */}
        </div>
        
        <p>
          <a href="/terms" target="_blank">
            Leer términos completos
          </a>
        </p>
      </div>
      
      <div className="modal-actions">
        <button onClick={onReject} className="btn-secondary">
          Rechazar
        </button>
        <button onClick={onAccept} className="btn-primary">
          Aceptar términos
        </button>
      </div>
    </Modal>
  );
}
```

## Ejemplo de uso en componente de autenticación OAuth

```tsx
// Componente para autenticación con OAuth
import { useState } from 'react';
import TermsModal from './TermsModal';

export default function OAuthLogin({ provider }) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [oauthData, setOauthData] = useState(null);
  
  const handleOAuthLogin = async (token) => {
    try {
      const response = await fetch(`/api/auth/${provider.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (data.requiresTermsAcceptance) {
        // Guardar datos para reenviar después de aceptar términos
        setOauthData({ token });
        setShowTermsModal(true);
        return;
      }
      
      // Autenticación exitosa, guardar token y redirigir
      localStorage.setItem('auth_token', data.token);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(`Error al autenticar con ${provider}:`, error);
    }
  };
  
  const handleAcceptTerms = async () => {
    setShowTermsModal(false);
    
    // Reenviar solicitud con términos aceptados
    try {
      const response = await fetch(`/api/auth/${provider.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...oauthData,
          termsAccepted: true,
        }),
      });
      
      const data = await response.json();
      
      // Autenticación exitosa, guardar token y redirigir
      localStorage.setItem('auth_token', data.token);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error(`Error al autenticar con ${provider} (términos aceptados):`, error);
    }
  };
  
  const handleRejectTerms = () => {
    setShowTermsModal(false);
    setOauthData(null);
    // Informar al usuario que no puede usar el servicio sin aceptar los términos
  };
  
  return (
    <>
      <button 
        onClick={() => handleOAuthProvider(provider)}
        className={`oauth-button ${provider.toLowerCase()}`}
      >
        Continuar con {provider}
      </button>
      
      <TermsModal 
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onReject={handleRejectTerms}
      />
    </>
  );
}
```

## Estilos recomendados

- El checkbox de aceptación de términos debe estar en un estilo contrastante para destacar
- El modal de términos debe tener una altura máxima con scroll para no ocupar toda la pantalla
- El botón de aceptación en el modal debe tener un color destacado y diferente al de rechazo
- Los enlaces a la página completa de términos deben ser claramente visibles

## Consideraciones de accesibilidad

- Asegurarse de que el checkbox pueda activarse con teclado
- Añadir atributos ARIA a los elementos interactivos
- El modal debe ser cerrable con ESC y haciendo clic fuera
- El texto de los términos debe tener suficiente contraste con el fondo 
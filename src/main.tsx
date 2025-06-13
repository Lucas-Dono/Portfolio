import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { oauthConfig } from './config/oauth';
import { GlobalStyle } from './styles/StyledComponentsConfig'
import { ThemeProvider } from 'styled-components'
import { theme } from './styles/theme'
// Eliminar la importación problemática por ahora

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={oauthConfig.google.clientId}>
    <ThemeProvider theme={theme}>
          {/* Comentaremos esta línea temporalmente hasta resolver el problema */}
          {/* <FontStyles /> */}
    <GlobalStyle />
          <AuthProvider>
    <App />
          </AuthProvider>
    </ThemeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

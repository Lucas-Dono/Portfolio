// Configuración para OAuth
// Depurar variables de entorno
console.log('🔍 Cargando configuración OAuth:');
console.log('- Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? 
  `${import.meta.env.VITE_GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'No disponible');
console.log('- GitHub Client ID:', import.meta.env.VITE_GITHUB_CLIENT_ID ? 
  import.meta.env.VITE_GITHUB_CLIENT_ID : 'No disponible');

export const oauthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "SIMULADO_CLIENTE_ID_GOOGLE",
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "SIMULADO_CLIENTE_SECRET_GOOGLE",
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || "SIMULADO_CLIENTE_ID_GITHUB",
    clientSecret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || "SIMULADO_CLIENTE_SECRET_GITHUB",
  }
}; 
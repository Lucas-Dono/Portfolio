import express from 'express';
import {
  register,
  login,
  googleAuth,
  githubAuth,
  getMe,
  authMiddleware,
  requestTwoFactorAuth,
  verifyTwoFactorToken,
  verifyEmail,
  verifyLoginTwoFactor,
  updateUserTwoFactorSettings,
  getTokensStatus,
  guestCheckout,
  captureLeadFromChat
} from '../controllers/authController.js';

const router = express.Router();

// Rutas públicas de autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/github', githubAuth);
router.get('/me', authMiddleware, getMe);
router.get('/verify-email/:token', verifyEmail);
router.get('/verify-login/:token', verifyLoginTwoFactor);

// Ruta para checkout como invitado
router.post('/guest-checkout', guestCheckout);

// Ruta para captura de leads del chat
router.post('/leads', captureLeadFromChat);

// Rutas para verificación de dos pasos del admin
router.post('/admin/request-verification', requestTwoFactorAuth);
router.get('/admin/verify/:token', verifyTwoFactorToken);

// Ruta para debugging de tokens (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.get('/admin/tokens-status', getTokensStatus);
}

export default router; 
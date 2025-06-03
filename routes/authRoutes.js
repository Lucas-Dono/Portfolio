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
  updateUserTwoFactorSettings
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

// Rutas para verificación de dos pasos del admin
router.post('/admin/request-verification', requestTwoFactorAuth);
router.get('/admin/verify/:token', verifyTwoFactorToken);

export default router; 
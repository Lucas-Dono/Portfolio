import express from 'express';
import {
    register,
    login,
    googleAuth,
    googleLogin,
    googleCallback,
    githubAuth,
    getMe,
    authMiddleware,
    adminMiddleware,
    verifyEmail,
    resendVerificationEmail,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    generateTwoFactorBackupCodes,
    completeTwoFactorAuth
} from '../controllers/authControllerSql.js';

const router = express.Router();

// Rutas públicas de autenticación
router.post('/register', register);
router.post('/login', login);
router.get('/google/login', googleLogin); // Para redirección inicial a Google OAuth
router.get('/google/callback', googleCallback); // Para manejar el callback de Google OAuth
router.post('/google', googleAuth);
router.post('/github', githubAuth);
router.get('/github', githubAuth); // Para manejar el callback de GitHub

// Rutas de verificación de email
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Ruta para completar autenticación de dos factores
router.post('/2fa/complete', completeTwoFactorAuth);

// Rutas protegidas (requieren autenticación)
router.get('/me', authMiddleware, getMe);

// Rutas de autenticación de dos factores
router.post('/2fa/enable', authMiddleware, enableTwoFactor);
router.post('/2fa/verify', authMiddleware, verifyTwoFactor);
router.post('/2fa/disable', authMiddleware, disableTwoFactor);
router.get('/2fa/backup-codes', authMiddleware, generateTwoFactorBackupCodes);

// En este punto, implementaríamos el resto de las rutas:
// - Verificación de email
// - Autenticación de dos factores
// - Etc.

export default router; 
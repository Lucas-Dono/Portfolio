import express from 'express';
import {
  getUserConversations,
  getOrCreateConversation,
  sendMessage,
  switchConversationType,
  markMessagesAsRead,
  getUnreadNotifications,
  getAdminConversations
} from '../controllers/hybridChatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas para usuarios autenticados
router.get('/conversations/:userId', authenticateToken, getUserConversations);
router.post('/conversations', authenticateToken, getOrCreateConversation);
router.post('/messages', authenticateToken, sendMessage);
router.put('/conversations/switch-type', authenticateToken, switchConversationType);
router.put('/messages/mark-read', authenticateToken, markMessagesAsRead);
router.get('/notifications/:userId', authenticateToken, getUnreadNotifications);

// Rutas para admin (requieren autenticación de admin)
router.get('/admin/conversations', authenticateToken, getAdminConversations);

// Middleware para validar admin (se puede agregar después)
const requireAdmin = (req, res, next) => {
  // Por ahora permitimos todos los usuarios autenticados
  // En el futuro se puede validar rol de admin
  next();
};

export default router; 
import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStats
} from '../controllers/notificationController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación admin a todas las rutas
router.use(authenticateToken);
router.use(isAdmin);

// GET /api/notifications - Obtener notificaciones con filtros y paginación
router.get('/', getNotifications);

// GET /api/notifications/stats - Obtener estadísticas de notificaciones
router.get('/stats', getStats);

// PUT /api/notifications/:id/read - Marcar notificación como leída
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Marcar todas las notificaciones como leídas
router.put('/read-all', markAllAsRead);

// DELETE /api/notifications/:id - Eliminar notificación específica
router.delete('/:id', deleteNotification);

export default router; 
import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStats,
  clearTestNotifications
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

// POST /api/notifications/clear-test - Limpiar notificaciones de prueba
router.post('/clear-test', (req, res) => {
  try {
    clearTestNotifications();
    res.json({ success: true, message: 'Notificaciones de prueba eliminadas' });
  } catch (error) {
    console.error('Error limpiando notificaciones de prueba:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router; 
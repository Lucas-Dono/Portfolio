const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStats
} = require('../controllers/notificationController');
const { verifyAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticación admin a todas las rutas
router.use(verifyAdmin);

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

module.exports = router; 
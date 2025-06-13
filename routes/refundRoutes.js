import express from 'express';
import * as refundController from '../controllers/refundController.js';
import { authMiddleware } from '../controllers/authController.js';

const router = express.Router();

// Rutas públicas (accesibles por usuarios autenticados)
// Ruta para solicitar un reembolso (cliente)
router.post('/request', authMiddleware, refundController.requestRefund);

// Ruta para verificar el estado de un reembolso (cliente)
router.get('/status/:refundId', authMiddleware, refundController.getRefundStatus);

// Rutas privadas (solo para administradores)
// Ruta para listar todas las solicitudes de reembolso
router.get('/admin/requests', authMiddleware, refundController.getRefundRequests);

// Ruta para aprobar un reembolso
router.post('/admin/approve/:refundId', authMiddleware, refundController.approveRefund);

// Ruta para rechazar un reembolso
router.post('/admin/reject/:refundId', authMiddleware, refundController.rejectRefund);

// Ruta para obtener estadísticas de reembolsos
router.get('/admin/stats', authMiddleware, refundController.getRefundStats);

export default router; 
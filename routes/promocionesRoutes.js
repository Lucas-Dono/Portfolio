import express from 'express';
import * as promocionesController from '../controllers/promocionesController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (para frontend)
// Obtener estado de promociones para mostrar en Services
router.get('/estado', promocionesController.obtenerEstadoPromociones);

// Obtener promoción activa para un servicio específico
router.get('/servicio/:servicioId', promocionesController.obtenerPromocionPorServicio);

// Rutas protegidas para admin
// Obtener todas las promociones (admin)
router.get('/', authenticateToken, isAdmin, promocionesController.obtenerPromociones);

// Obtener una promoción por ID (admin)
router.get('/:id', authenticateToken, isAdmin, promocionesController.obtenerPromocionPorId);

// Crear nueva promoción (admin)
router.post('/', authenticateToken, isAdmin, promocionesController.crearPromocion);

// Actualizar promoción existente (admin)
router.put('/:id', authenticateToken, isAdmin, promocionesController.actualizarPromocion);

// Eliminar promoción (admin)
router.delete('/:id', authenticateToken, isAdmin, promocionesController.eliminarPromocion);

// Usar promoción (incrementar contador - para cuando se aplica en una compra)
router.post('/:id/usar', authenticateToken, promocionesController.usarPromocion);

// Reactivar promoción (admin)
router.post('/:id/reactivar', authenticateToken, isAdmin, promocionesController.reactivarPromocion);

export default router; 
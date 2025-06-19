import express from 'express';
import { trackCartAbandonment } from '../controllers/analyticsController.js';

const router = express.Router();

// Ruta para tracking de abandono de carrito
router.post('/cart-abandon', trackCartAbandonment);

export default router; 
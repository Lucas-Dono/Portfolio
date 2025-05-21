import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// Ruta para procesar pagos con Card Payment
router.post('/process', paymentController.processPayment);

// Ruta para crear preferencias de pago (Checkout Pro)
router.post('/preference', paymentController.createPreference);

// Ruta para recibir webhooks de Mercado Pago
router.post('/webhook', paymentController.handleWebhook);
router.get('/webhook', paymentController.handleWebhook);

// Ruta para notificar intentos de pago desde el frontend
router.post('/notify-attempt', paymentController.notifyPaymentAttempt);

// Rutas para reembolsos
router.post('/refunds/request', paymentController.requestRefund);
router.post('/refunds/process', paymentController.processRefund);
router.get('/refunds', paymentController.getRefundsList);

export default router; 
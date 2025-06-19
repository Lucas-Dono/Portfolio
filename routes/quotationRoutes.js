import express from 'express';
import { generateQuotation, getQuotation } from '../controllers/quotationController.js';

const router = express.Router();

// Generar cotización automática
router.post('/generate', generateQuotation);

// Obtener cotización por ID
router.get('/:quotationId', getQuotation);

export default router; 
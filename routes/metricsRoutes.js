import express from 'express';
import { 
  getBusinessMetrics, 
  getPerformanceMetrics, 
  getBusinessInsights 
} from '../controllers/metricsController.js';

const router = express.Router();

// Obtener métricas generales del negocio
router.get('/business', getBusinessMetrics);

// Obtener métricas de rendimiento
router.get('/performance', getPerformanceMetrics);

// Obtener insights y recomendaciones
router.get('/insights', getBusinessInsights);

export default router; 
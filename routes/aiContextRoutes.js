import express from 'express';
import { 
  getUserContext, 
  updateUserContext, 
  getPersonalizedRecommendations 
} from '../controllers/aiContextController.js';

const router = express.Router();

// Obtener contexto de usuario
router.get('/context/:userId', getUserContext);

// Actualizar contexto de usuario
router.post('/context/:userId', updateUserContext);

// Obtener recomendaciones personalizadas
router.get('/recommendations/:userId', getPersonalizedRecommendations);

export default router; 
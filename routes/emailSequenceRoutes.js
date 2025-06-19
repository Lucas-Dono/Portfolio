import express from 'express';
import { 
  startEmailSequence, 
  stopEmailSequence, 
  getSequenceStats 
} from '../controllers/emailSequenceController.js';

const router = express.Router();

// Iniciar secuencia de email
router.post('/start', startEmailSequence);

// Detener secuencia específica
router.post('/stop/:sequenceId', stopEmailSequence);

// Obtener estadísticas de sequences
router.get('/stats', getSequenceStats);

export default router; 
// Rutas para gestionar usuarios y sus servicios
import express from 'express';
import * as userServicesController from '../controllers/userServicesController.js';

const router = express.Router();

// Rutas para gestionar los servicios de los usuarios
router.get('/services', userServicesController.getUserServices);
router.post('/services', userServicesController.registerUserService);
router.patch('/services/:serviceId/progress', userServicesController.updateServiceProgress);

// Rutas para actualizar detalles - soportar tanto PATCH como PUT para mayor compatibilidad
router.patch('/services/:serviceId/details', userServicesController.updateServiceDetails);
router.put('/services/:serviceId/details', userServicesController.updateServiceDetails);

export default router; 
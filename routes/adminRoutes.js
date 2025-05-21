import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Ruta para obtener todos los proyectos (para el panel de administración)
router.get('/projects', adminController.getAdminProjects);

// Ruta para subir imágenes de vista previa
router.post('/projects/:projectId/images', adminController.uploadProjectImage);

// Ruta para actualizar el progreso de un proyecto
router.put('/projects/:projectId/progress', adminController.updateProjectProgress);

// Ruta para crear un enlace temporal para compartir con clientes
router.post('/projects/:projectId/temp-link', adminController.createProjectTempLink);

// Ruta para eliminar una imagen
router.delete('/projects/:projectId/images/:imageId', adminController.deleteProjectImage);

export default router; 
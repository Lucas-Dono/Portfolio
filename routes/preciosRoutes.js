import express from 'express';
import * as preciosController from '../controllers/preciosController.js';

const router = express.Router();

// Rutas para servicios
router.get('/servicios', preciosController.obtenerServicios);
router.get('/servicios/tipo/:tipo', preciosController.obtenerServiciosPorTipo);
router.get('/servicios/:id', preciosController.obtenerServicioPorId);
router.post('/servicios', preciosController.crearServicio);
router.put('/servicios/:id', preciosController.actualizarServicio);
router.put('/servicios/:id/precio', preciosController.actualizarPrecioServicio);
router.put('/servicios/:id/precios', preciosController.actualizarPreciosServicio);

// Rutas para addons
router.get('/addons', preciosController.obtenerAddons);
router.get('/addons/:id', preciosController.obtenerAddonPorId);
router.put('/addons/:id/precio', preciosController.actualizarPrecioAddon);

export default router; 
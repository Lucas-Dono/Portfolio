import express from 'express';
import * as preciosController from '../controllers/preciosController.js';

const router = express.Router();

// Variable para el timestamp de última actualización
let lastUpdateTimestamp = Date.now().toString();

// Endpoint específico para timestamp de última actualización
router.get('/servicios/last-updated', (req, res) => {
    // Devolvemos el timestamp guardado
    res.json({
        lastUpdated: lastUpdateTimestamp,
        message: 'Timestamp de última actualización de precios'
    });
});

// Endpoint para notificar actualizaciones de precios
router.post('/servicios/notificar-actualizacion', (req, res) => {
    // Actualizar el timestamp
    lastUpdateTimestamp = Date.now().toString();
    console.log(`✅ Timestamp de precios actualizado: ${lastUpdateTimestamp}`);
    res.json({ success: true, timestamp: lastUpdateTimestamp });
});

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
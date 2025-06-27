import express from 'express';
import { 
    loginAsDevUser, 
    getDevUserInfo, 
    devCallback,
    ensureDevUser 
} from '../controllers/devUserController.js';

const router = express.Router();

// Solo permitir estas rutas en modo desarrollo
router.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
            success: false,
            error: 'Rutas dev solo disponibles en modo desarrollo'
        });
    }
    next();
});

// Rutas del usuario dev
router.post('/login', loginAsDevUser);
router.get('/user', getDevUserInfo);
router.get('/callback', devCallback);

// Ruta para inicializar usuario dev (llamada automáticamente al iniciar servidor)
router.post('/init', async (req, res) => {
    try {
        const devUser = await ensureDevUser();
        if (devUser) {
            res.json({
                success: true,
                message: 'Usuario dev inicializado',
                user: {
                    id: devUser.id,
                    name: devUser.name,
                    email: devUser.email
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'No se pudo inicializar usuario dev'
            });
        }
    } catch (error) {
        console.error('Error al inicializar usuario dev:', error);
        res.status(500).json({
            success: false,
            error: 'Error al inicializar usuario dev'
        });
    }
});

export default router; 
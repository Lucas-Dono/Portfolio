import jwt from 'jsonwebtoken';

// Middleware para autenticar token JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, decoded) => {
        if (err) {
            console.error('Error al verificar token:', err);
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Normalizar la estructura del usuario para compatibilidad
        req.user = {
            id: decoded.userId || decoded.id,
            userId: decoded.userId || decoded.id,
            role: decoded.role || 'user',
            isAdmin: decoded.role === 'admin',
            provider: decoded.provider || 'email'
        };
        next();
    });
};

// Middleware para verificar permisos de administrador
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    // Verificar si el usuario tiene permisos de administrador
    if (req.user.role !== 'admin' && req.user.isAdmin !== true) {
        return res.status(403).json({
            success: false,
            message: 'Permisos de administrador requeridos'
        });
    }

    next();
};

// Middleware opcional para verificar si el usuario es propietario del recurso
export const isOwnerOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    const resourceUserId = req.params.userId || req.body.userId;

    // Permitir si es admin o si es el propietario del recurso
    if (req.user.role === 'admin' || req.user.isAdmin === true || req.user.id === resourceUserId || req.user.userId === resourceUserId) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a este recurso'
        });
    }
}; 
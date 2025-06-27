import { UserSql } from '../models/UserSql.js';
import jwt from 'jsonwebtoken';

// Datos del usuario de desarrollo
const DEV_USER_DATA = {
    id: 'dev-user-001',
    name: 'Usuario Desarrollo',
    email: 'dev@circuitprompt.com.ar',
    provider: 'dev',
    providerId: 'dev-001',
    avatar: 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=DEV',
    role: 'user',
    emailVerified: true,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    lastLogin: new Date()
};

// Función para generar token JWT
const generateToken = (userId, provider = 'dev', role = 'user') => {
    return jwt.sign(
        { 
            userId, 
            provider, 
            role,
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
        },
        process.env.JWT_SECRET || 'dev-jwt-secret'
    );
};

// Crear o actualizar usuario dev en la base de datos
export const ensureDevUser = async () => {
    try {
        // Solo en modo desarrollo
        if (process.env.NODE_ENV !== 'development') {
            return null;
        }

        let devUser = await UserSql.findOne({
            where: {
                provider: 'dev',
                providerId: 'dev-001'
            }
        });

        if (!devUser) {
            console.log('🔧 Creando usuario de desarrollo...');
            devUser = await UserSql.create(DEV_USER_DATA);
            console.log('✅ Usuario de desarrollo creado:', devUser.email);
        } else {
            // Actualizar última conexión
            devUser.lastLogin = new Date();
            await devUser.save();
            console.log('✅ Usuario de desarrollo actualizado');
        }

        return devUser;
    } catch (error) {
        console.error('❌ Error al crear usuario de desarrollo:', error);
        return null;
    }
};

// Login automático con usuario dev
export const loginAsDevUser = async (req, res) => {
    try {
        // Solo permitir en modo desarrollo
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                error: 'Usuario dev solo disponible en modo desarrollo'
            });
        }

        // Asegurar que el usuario dev existe
        const devUser = await ensureDevUser();
        
        if (!devUser) {
            return res.status(500).json({
                success: false,
                error: 'No se pudo crear usuario de desarrollo'
            });
        }

        // Generar token JWT
        const jwtToken = generateToken(devUser.id, 'dev', devUser.role);

        // Responder con datos del usuario
        return res.json({
            success: true,
            message: 'Login dev exitoso',
            user: {
                id: devUser.id,
                name: devUser.name,
                email: devUser.email,
                avatar: devUser.avatar,
                role: devUser.role,
                provider: devUser.provider
            },
            token: jwtToken,
            isNewUser: false
        });

    } catch (error) {
        console.error('❌ Error en login dev:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al hacer login como usuario dev'
        });
    }
};

// Endpoint para obtener info del usuario dev
export const getDevUserInfo = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                error: 'Usuario dev solo disponible en modo desarrollo'
            });
        }

        const devUser = await ensureDevUser();
        
        if (!devUser) {
            return res.status(404).json({
                success: false,
                error: 'Usuario dev no encontrado'
            });
        }

        return res.json({
            success: true,
            user: {
                id: devUser.id,
                name: devUser.name,
                email: devUser.email,
                avatar: devUser.avatar,
                role: devUser.role,
                provider: devUser.provider,
                emailVerified: devUser.emailVerified,
                termsAccepted: devUser.termsAccepted,
                lastLogin: devUser.lastLogin
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener info del usuario dev:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener información del usuario dev'
        });
    }
};

// Endpoint para callback dev (simula OAuth callback)
export const devCallback = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            return res.status(403).json({
                success: false,
                error: 'Callback dev solo disponible en modo desarrollo'
            });
        }

        const devUser = await ensureDevUser();
        
        if (!devUser) {
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('No se pudo crear usuario dev')}`;
            return res.redirect(errorUrl);
        }

        // Generar token JWT
        const jwtToken = generateToken(devUser.id, 'dev', devUser.role);

        // Redireccionar al callback HTML con los datos del usuario
        const callbackUrl = `/html/auth-callback.html?token=${encodeURIComponent(jwtToken)}&userid=${encodeURIComponent(devUser.id)}&name=${encodeURIComponent(devUser.name)}&email=${encodeURIComponent(devUser.email)}&avatar=${encodeURIComponent(devUser.avatar)}&provider=dev&isnew=false`;
        
        console.log('✅ Autenticación dev exitosa, redirigiendo a:', callbackUrl);
        res.redirect(callbackUrl);

    } catch (error) {
        console.error('❌ Error en callback dev:', error);
        const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error en autenticación dev')}`;
        res.redirect(errorUrl);
    }
}; 
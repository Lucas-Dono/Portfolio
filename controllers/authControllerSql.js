import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import UserSql from '../models/UserSql.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendEmailVerification, sendTwoFactorEmail } from '../utils/emailManager.js';
import {
    generateSecret,
    generateQRCode,
    verifyToken,
    generateBackupCodes,
    hashBackupCodes,
    verifyBackupCode
} from '../utils/twoFactorAuth.js';

dotenv.config();

// Constantes de configuración
const JWT_SECRET = process.env.JWT_SECRET || 'secreto-desarrollo-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Almacenamiento para tokens de verificación de dos pasos
const twoFactorTokens = new Map();
// Almacenamiento para tokens de verificación de usuarios
const userVerificationTokens = new Map();

// Función para generar un token JWT
const generateToken = (userId, provider = 'email', role = 'user') => {
    return jwt.sign({
        userId,
        provider,
        role
    }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

// Función para generar un token único para verificación de dos pasos
const generateTwoFactorToken = () => {
    // Generar un token de 64 caracteres hexadecimales aleatorios
    return crypto.randomBytes(32).toString('hex');
};

// Función para generar un token de verificación de email
const generateEmailVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Función para formatear la respuesta de usuario
const formatUserResponse = (user, token) => {
    return {
        success: true,
        user: {
            id: user.id, // Sequelize usa 'id' directamente
            name: user.name,
            email: user.email,
            provider: user.provider,
            avatar: user.avatar,
            role: user.role
        },
        token
    };
};

// Controller para registro de usuarios
export const register = async (req, res) => {
    try {
        const { name, email, password, termsAccepted } = req.body;

        // Validar datos de entrada
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Por favor, proporciona todos los campos requeridos'
            });
        }

        // Validar aceptación de términos y condiciones
        if (!termsAccepted) {
            return res.status(400).json({
                success: false,
                error: 'Debes aceptar los términos y condiciones para crear una cuenta'
            });
        }

        // Verificar si el email ya está registrado
        const existingUser = await UserSql.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        // Generar token de verificación de email
        const verificationToken = generateEmailVerificationToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Crear nuevo usuario con verificación de email pendiente
        const user = await UserSql.create({
            name,
            email,
            password, // El hash se crea automáticamente a través del hook beforeCreate
            provider: 'email',
            emailVerified: false,
            verificationToken,
            verificationTokenExpires,
            termsAccepted: true,
            termsAcceptedAt: new Date()
        });

        // Enviar correo de verificación
        const emailSent = await sendEmailVerification(email, verificationToken, true);

        if (!emailSent) {
            console.error('❌ Error al enviar correo de verificación');

            // En modo desarrollo, verificar automáticamente
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️ MODO DESARROLLO: Verificando email automáticamente');
                user.emailVerified = true;
                user.verificationToken = null;
                user.verificationTokenExpires = null;
                await user.save();

                // Generar token JWT
                const token = generateToken(user.id, 'email', user.role);

                return res.status(201).json({
                    success: true,
                    message: 'Usuario registrado y verificado automáticamente (modo desarrollo)',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        provider: user.provider,
                        role: user.role,
                        emailVerified: user.emailVerified
                    },
                    token
                });
            }
        }

        // Devolver respuesta sin token JWT (se otorgará después de verificar email)
        return res.status(201).json({
            success: true,
            message: 'Usuario registrado. Por favor, verifica tu correo electrónico para activar tu cuenta.',
            requiresEmailVerification: true,
            user: {
                name: user.name,
                email: user.email,
                emailVerified: false
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);

        // Manejo de errores de validación de Sequelize
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Controller para login con credenciales
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos de entrada
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Por favor, proporciona email y contraseña'
            });
        }

        // Buscar usuario por email
        const user = await UserSql.findOne({ where: { email } });

        // Verificar si el usuario existe
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar si la contraseña es correcta
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar si el email está verificado (excepto en desarrollo)
        if (!user.emailVerified && process.env.NODE_ENV !== 'development') {
            // Generar nuevo token de verificación
            const verificationToken = generateEmailVerificationToken();
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

            // Actualizar usuario con nuevo token
            user.verificationToken = verificationToken;
            user.verificationTokenExpires = verificationTokenExpires;
            await user.save();

            // Enviar correo de verificación
            await sendEmailVerification(email, verificationToken, false);

            return res.status(403).json({
                success: false,
                error: 'Tu cuenta no está verificada. Se ha enviado un nuevo correo de verificación.',
                requiresEmailVerification: true
            });
        }

        // Verificar si el usuario ha aceptado los términos y condiciones
        if (!user.termsAccepted) {
            return res.status(403).json({
                success: false,
                error: 'Debes aceptar los términos y condiciones para continuar',
                requiresTermsAcceptance: true
            });
        }

        // Si el usuario tiene habilitado 2FA
        if (user.twoFactorEnabled && user.twoFactorVerified) {
            const twoFactorToken = generateTwoFactorToken();

            // Almacenar token temporalmente (esto debería manejarse con Redis en producción)
            twoFactorTokens.set(twoFactorToken, {
                userId: user.id,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
            });

            return res.status(200).json({
                success: true,
                message: 'Primer paso de autenticación exitoso, se requiere segundo factor',
                requiresTwoFactor: true,
                twoFactorToken: twoFactorToken,
                user: {
                    name: user.name,
                    email: user.email
                }
            });
        }

        // Actualizar último inicio de sesión
        user.lastLogin = new Date();
        await user.save();

        // Generar token JWT
        const token = generateToken(user.id, user.provider, user.role);

        return res.status(200).json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled
            },
            token
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Controller para redirección a Google OAuth
export const googleLogin = async (req, res) => {
    try {
        // Configurar URL de callback según el entorno
        let redirectUri;
        
        if (process.env.NODE_ENV === 'production') {
            // En producción, usar siempre HTTPS y el dominio principal
            redirectUri = 'https://circuitprompt.com.ar/api/auth/google/callback';
        } else {
            // En desarrollo, usar la URL configurada o localhost
            const protocol = req.protocol;
            const host = req.get('host');
            redirectUri = `${protocol}://${host}/api/auth/google/callback`;
            
            // Si estamos en desarrollo y no es localhost, usar el dominio principal
            if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
                redirectUri = 'https://circuitprompt.com.ar/api/auth/google/callback';
            }
        }
        
        // Construir URL de redirección de Google OAuth
        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
        googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
        googleAuthUrl.searchParams.append('response_type', 'code');
        googleAuthUrl.searchParams.append('scope', 'openid email profile');
        googleAuthUrl.searchParams.append('access_type', 'offline');
        googleAuthUrl.searchParams.append('prompt', 'consent');

        console.log('🔗 Redirigiendo a Google OAuth:', googleAuthUrl.toString());
        console.log('🔄 Redirect URI:', redirectUri);
        
        // Redireccionar a Google OAuth
        res.redirect(googleAuthUrl.toString());
    } catch (error) {
        console.error('Error al iniciar autenticación con Google:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al iniciar autenticación con Google'
        });
    }
};

// Controller para callback de Google OAuth
export const googleCallback = async (req, res) => {
    try {
        const { code, error, state } = req.query;

        if (error) {
            console.error('Error de Google OAuth:', error);
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent(error)}`;
            return res.redirect(errorUrl);
        }

        if (!code) {
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('No se recibió código de autorización')}`;
            return res.redirect(errorUrl);
        }

        // Intercambiar código por token de acceso
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.NODE_ENV === 'production' 
                    ? 'https://circuitprompt.com.ar/api/auth/google/callback'
                    : `${req.protocol}://${req.get('host')}/api/auth/google/callback`
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.error('Error al obtener token de Google:', tokenData);
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error al obtener token de acceso')}`;
            return res.redirect(errorUrl);
        }

        // Obtener información del usuario de Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        if (!userInfoResponse.ok) {
            console.error('Error al obtener información del usuario de Google');
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error al obtener información del usuario')}`;
            return res.redirect(errorUrl);
        }

        const googleUserInfo = await userInfoResponse.json();

        // Buscar si el usuario ya existe
        let user = await UserSql.findOne({
            where: {
                provider: 'google',
                providerId: googleUserInfo.sub
            }
        });

        let isNewUser = false;

        if (user) {
            // Actualizar información si es necesario
            if (googleUserInfo.picture && user.avatar !== googleUserInfo.picture) {
                user.avatar = googleUserInfo.picture;
                await user.save();
            }
        } else {
            // Intentar buscar el usuario por email
            user = await UserSql.findOne({
                where: { email: googleUserInfo.email }
            });

            if (user) {
                // Usuario encontrado con el mismo email, actualizar para vincular a Google
                user.provider = 'google';
                user.providerId = googleUserInfo.sub;
                if (googleUserInfo.picture) {
                    user.avatar = googleUserInfo.picture;
                }
                await user.save();
            } else {
                // Crear nuevo usuario
                isNewUser = true;
                user = await UserSql.create({
                    name: googleUserInfo.name,
                    email: googleUserInfo.email,
                    provider: 'google',
                    providerId: googleUserInfo.sub,
                    avatar: googleUserInfo.picture || '',
                    emailVerified: true, // Los usuarios de Google ya tienen el email verificado
                    termsAccepted: true, // Asumir que los términos fueron aceptados en el frontend
                    termsAcceptedAt: new Date()
                });
            }
        }

        // Actualizar la fecha de último login
        user.lastLogin = new Date();
        await user.save();

        // Generar token JWT
        const jwtToken = generateToken(user.id, 'google', user.role);

        // Redireccionar al callback HTML con los datos del usuario
        const callbackUrl = `/html/auth-callback.html?token=${encodeURIComponent(jwtToken)}&userid=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&avatar=${encodeURIComponent(user.avatar || '')}&provider=google`;
        
        console.log('✅ Autenticación con Google exitosa, redirigiendo a:', callbackUrl);
        res.redirect(callbackUrl);

    } catch (error) {
        console.error('Error en callback de Google OAuth:', error);
        const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error en el proceso de autenticación')}`;
        res.redirect(errorUrl);
    }
};

// Controller para autenticación con Google
export const googleAuth = async (req, res) => {
    try {
        const { token, termsAccepted } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        // Verificar el token con Google OAuth
        let googleUserInfo;
        try {
            // Primero intentar obtener la información del usuario con el token de acceso
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!userInfoResponse.ok) {
                // Si falla, intentar verificarlo como id_token
                throw new Error('Token de acceso inválido, intentando como id_token');
            }

            googleUserInfo = await userInfoResponse.json();
        } catch (error) {
            console.log('Error al verificar token de acceso, intentando como id_token', error.message);

            try {
                // Intentar verificar como id_token
                const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

                if (!tokenInfoResponse.ok) {
                    throw new Error('Token de ID inválido');
                }

                googleUserInfo = await tokenInfoResponse.json();
            } catch (error) {
                console.error('Error al verificar token de ID de Google', error);
                return res.status(401).json({
                    success: false,
                    error: 'Token de Google inválido'
                });
            }
        }

        // Buscar si el usuario ya existe (por providerId de Google)
        let user = await UserSql.findOne({
            where: {
                provider: 'google',
                providerId: googleUserInfo.sub
            }
        });

        let isNewUser = false;

        if (user) {
            // Actualizar información si es necesario
            if (googleUserInfo.picture && user.avatar !== googleUserInfo.picture) {
                user.avatar = googleUserInfo.picture;
                await user.save();
            }
        } else {
            // Intentar buscar el usuario por email (para vincular cuentas)
            user = await UserSql.findOne({
                where: { email: googleUserInfo.email }
            });

            if (user) {
                // Usuario encontrado con el mismo email, actualizar para vincular a Google
                user.provider = 'google';
                user.providerId = googleUserInfo.sub;
                if (googleUserInfo.picture) {
                    user.avatar = googleUserInfo.picture;
                }
                await user.save();
            } else {
                // Es un usuario nuevo, verificar que ha aceptado los términos y condiciones
                isNewUser = true;

                if (!termsAccepted) {
                    return res.status(400).json({
                        success: false,
                        error: 'Debes aceptar los términos y condiciones para crear una cuenta',
                        requiresTermsAcceptance: true
                    });
                }

                // Crear nuevo usuario si no existe
                user = await UserSql.create({
                    name: googleUserInfo.name,
                    email: googleUserInfo.email,
                    provider: 'google',
                    providerId: googleUserInfo.sub,
                    avatar: googleUserInfo.picture || '',
                    emailVerified: true, // Los usuarios de Google ya tienen el email verificado
                    termsAccepted: true,
                    termsAcceptedAt: new Date()
                });
            }
        }

        // Actualizar la fecha de último login
        user.lastLogin = new Date();
        await user.save();

        // Generar token JWT
        const jwtToken = generateToken(user.id, 'google', user.role);

        // Devolver respuesta con usuario y token
        return res.json({
            ...formatUserResponse(user, jwtToken),
            isNewUser
        });
    } catch (error) {
        console.error('Error en autenticación con Google:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en autenticación con Google'
        });
    }
};

// Controller para redirección a GitHub OAuth
export const githubLogin = async (req, res) => {
    try {
        // Configurar URL de callback según el entorno
        let redirectUri;
        
        if (process.env.NODE_ENV === 'production') {
            // En producción, usar siempre HTTPS y el dominio principal
            redirectUri = 'https://circuitprompt.com.ar/api/auth/github/callback';
        } else {
            // En desarrollo, usar la URL configurada o localhost
            const protocol = req.protocol;
            const host = req.get('host');
            redirectUri = `${protocol}://${host}/api/auth/github/callback`;
            
            // Si estamos en desarrollo y no es localhost, usar el dominio principal
            if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
                redirectUri = 'https://circuitprompt.com.ar/api/auth/github/callback';
            }
        }
        
        // Construir URL de redirección de GitHub OAuth
        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
        githubAuthUrl.searchParams.append('redirect_uri', redirectUri);
        githubAuthUrl.searchParams.append('scope', 'user:email');
        githubAuthUrl.searchParams.append('state', 'github-auth');
        
        console.log('🔗 Redirigiendo a GitHub OAuth:', githubAuthUrl.toString());
        
        // Redireccionar a GitHub OAuth
        res.redirect(githubAuthUrl.toString());
    } catch (error) {
        console.error('Error de GitHub OAuth:', error);
        const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent(error)}`;
        res.redirect(errorUrl);
    }
};

// Controller para callback de GitHub OAuth
export const githubCallback = async (req, res) => {
    try {
        const { code, error } = req.query;
        
        if (error) {
            console.error('Error de GitHub OAuth:', error);
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent(error)}`;
            return res.redirect(errorUrl);
        }
        
        if (!code) {
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('No se recibió código de autorización')}`;
            return res.redirect(errorUrl);
        }

        // Intercambiar el código por un token de acceso
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error al obtener token de acceso')}`;
            return res.redirect(errorUrl);
        }

        // Obtener información del usuario de GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${tokenData.access_token}`
            }
        });

        if (!userResponse.ok) {
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error al obtener información del usuario')}`;
            return res.redirect(errorUrl);
        }

        const githubUserInfo = await userResponse.json();

        // Obtener el email si no viene en la información básica
        let userEmail = githubUserInfo.email;

        if (!userEmail) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `token ${tokenData.access_token}`
                }
            });

            if (emailsResponse.ok) {
                const emails = await emailsResponse.json();
                const primaryEmail = emails.find(email => email.primary);
                userEmail = primaryEmail ? primaryEmail.email : emails[0]?.email;
            }
        }

        if (!userEmail) {
            const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('No se pudo obtener un email de la cuenta de GitHub')}`;
            return res.redirect(errorUrl);
        }

        // Buscar si el usuario ya existe (por providerId de GitHub)
        let user = await UserSql.findOne({
            where: {
                provider: 'github',
                providerId: githubUserInfo.id.toString()
            }
        });

        let isNewUser = false;

        if (user) {
            // Actualizar información si es necesario
            if (githubUserInfo.avatar_url && user.avatar !== githubUserInfo.avatar_url) {
                user.avatar = githubUserInfo.avatar_url;
                await user.save();
            }
        } else {
            // Intentar buscar el usuario por email (para vincular cuentas)
            user = await UserSql.findOne({
                where: { email: userEmail }
            });

            if (user) {
                // Usuario encontrado con el mismo email, actualizar para vincular a GitHub
                user.provider = 'github';
                user.providerId = githubUserInfo.id.toString();
                if (githubUserInfo.avatar_url) {
                    user.avatar = githubUserInfo.avatar_url;
                }
                await user.save();
            } else {
                // Es un usuario nuevo - crear con términos aceptados por defecto para OAuth
                isNewUser = true;

                // Crear nuevo usuario si no existe
                user = await UserSql.create({
                    name: githubUserInfo.name || githubUserInfo.login,
                    email: userEmail,
                    provider: 'github',
                    providerId: githubUserInfo.id.toString(),
                    avatar: githubUserInfo.avatar_url || '',
                    emailVerified: true, // Los usuarios de GitHub ya tienen el email verificado
                    termsAccepted: true,
                    termsAcceptedAt: new Date()
                });
            }
        }

        // Actualizar la fecha de último login
        user.lastLogin = new Date();
        await user.save();

        // Generar token JWT
        const jwtToken = generateToken(user.id, 'github', user.role);

        // Redireccionar al callback HTML con los datos del usuario
        const callbackUrl = `/html/auth-callback.html?token=${encodeURIComponent(jwtToken)}&userid=${encodeURIComponent(user.id)}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&avatar=${encodeURIComponent(user.avatar || '')}&provider=github&isnew=${isNewUser}`;
        
        console.log('✅ Autenticación con GitHub exitosa, redirigiendo a:', callbackUrl);
        res.redirect(callbackUrl);

    } catch (error) {
        console.error('Error en callback de GitHub OAuth:', error);
        const errorUrl = `/html/auth-callback.html?error=${encodeURIComponent('Error en el proceso de autenticación')}`;
        res.redirect(errorUrl);
    }
};

// Controller para autenticación con GitHub (POST - para el frontend)
export const githubAuth = async (req, res) => {
    try {
        const { code, termsAccepted } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Código de autorización no proporcionado'
            });
        }

        // Intercambiar el código por un token de acceso
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            return res.status(401).json({
                success: false,
                error: 'Error al obtener token de GitHub',
                details: tokenData.error_description || 'Sin detalles'
            });
        }

        // Obtener información del usuario de GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${tokenData.access_token}`
            }
        });

        if (!userResponse.ok) {
            return res.status(401).json({
                success: false,
                error: 'Error al obtener información de usuario de GitHub'
            });
        }

        const githubUserInfo = await userResponse.json();

        // Obtener el email si no viene en la información básica
        let userEmail = githubUserInfo.email;

        if (!userEmail) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `token ${tokenData.access_token}`
                }
            });

            if (emailsResponse.ok) {
                const emails = await emailsResponse.json();
                const primaryEmail = emails.find(email => email.primary);
                userEmail = primaryEmail ? primaryEmail.email : emails[0]?.email;
            }
        }

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                error: 'No se pudo obtener un email de la cuenta de GitHub'
            });
        }

        // Buscar si el usuario ya existe (por providerId de GitHub)
        let user = await UserSql.findOne({
            where: {
                provider: 'github',
                providerId: githubUserInfo.id.toString()
            }
        });

        let isNewUser = false;

        if (user) {
            // Actualizar información si es necesario
            if (githubUserInfo.avatar_url && user.avatar !== githubUserInfo.avatar_url) {
                user.avatar = githubUserInfo.avatar_url;
                await user.save();
            }
        } else {
            // Intentar buscar el usuario por email (para vincular cuentas)
            user = await UserSql.findOne({
                where: { email: userEmail }
            });

            if (user) {
                // Usuario encontrado con el mismo email, actualizar para vincular a GitHub
                user.provider = 'github';
                user.providerId = githubUserInfo.id.toString();
                if (githubUserInfo.avatar_url) {
                    user.avatar = githubUserInfo.avatar_url;
                }
                await user.save();
            } else {
                // Es un usuario nuevo, verificar que ha aceptado los términos y condiciones
                isNewUser = true;

                if (!termsAccepted) {
                    return res.status(400).json({
                        success: false,
                        error: 'Debes aceptar los términos y condiciones para crear una cuenta',
                        requiresTermsAcceptance: true
                    });
                }

                // Crear nuevo usuario si no existe
                user = await UserSql.create({
                    name: githubUserInfo.name || githubUserInfo.login,
                    email: userEmail,
                    provider: 'github',
                    providerId: githubUserInfo.id.toString(),
                    avatar: githubUserInfo.avatar_url || '',
                    emailVerified: true, // Los usuarios de GitHub ya tienen el email verificado
                    termsAccepted: true,
                    termsAcceptedAt: new Date()
                });
            }
        }

        // Actualizar la fecha de último login
        user.lastLogin = new Date();
        await user.save();

        // Generar token JWT
        const jwtToken = generateToken(user.id, 'github', user.role);

        // Devolver respuesta con usuario y token
        return res.json({
            ...formatUserResponse(user, jwtToken),
            isNewUser
        });
    } catch (error) {
        console.error('Error en autenticación con GitHub:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en autenticación con GitHub',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
};

// Controller para obtener el usuario actual (adaptado para Sequelize)
export const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const provider = req.user.provider;
        const role = req.user.role;

        // 1. Manejo especial para 'admin-user' SIN consultar BD
        if (userId === 'admin-user') {
            console.log('⚙️ authController.getMe: Usuario "admin-user" detectado. Devolviendo datos mock/administrativos.');
            return res.json({
                success: true,
                user: {
                    id: 'admin-user',
                    name: 'Administrador del Sistema (Dev)',
                    email: 'admin@example.com',
                    role: role || 'admin',
                    provider: provider || 'admin-special',
                    avatar: null
                }
            });
        }

        // 2. Buscar usuario en la base de datos SQL
        let user;

        try {
            user = await UserSql.findByPk(userId);
        } catch (error) {
            console.error(`❌ Error al buscar usuario con ID ${userId}:`, error);
        }

        // Si no se encuentra, intentar por providerId para usuarios OAuth
        if (!user && (provider === 'google' || provider === 'github')) {
            // Extraer providerId si el userId es algo como "google-123456"
            const providerId = userId.includes('-') ? userId.split('-').slice(1).join('-') : null;

            if (providerId) {
                user = await UserSql.findOne({
                    where: {
                        provider,
                        providerId
                    }
                });
            }
        }

        // Si aún no se encuentra y tenemos email en el token, buscar por email
        if (!user && req.user.email) {
            user = await UserSql.findOne({
                where: { email: req.user.email }
            });
        }

        if (!user) {
            console.log(`❌ authControllerSql.getMe: Usuario no encontrado para userId: ${userId}, provider: ${provider}`);
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Devolver información del usuario desde la BD
        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                avatar: user.avatar,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuario actual (getMe):', error);
        // Evitar enviar detalles del error de servidor al cliente en producción
        const errorMessage = process.env.NODE_ENV === 'production' ? 'Error en el servidor' : error.message;
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor al obtener datos del usuario.',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
};

// Middleware para verificar autenticación
export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error en verificación de token:', error);
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
        });
    }
};

// Middleware para verificar rol de administrador
export const adminMiddleware = (req, res, next) => {
    try {
        // Primero verificar que el usuario está autenticado
        authMiddleware(req, res, async () => {
            try {
                const userId = req.user.userId;

                // Verificación especial para 'admin-user' (evitamos consulta a BD)
                if (userId === 'admin-user') {
                    return next();
                }

                // Buscar el usuario por ID
                const user = await UserSql.findByPk(userId);

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        error: 'Usuario no encontrado'
                    });
                }

                // Verificar si el usuario es administrador
                if (user.role !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        error: 'Acceso denegado. Se requiere rol de administrador'
                    });
                }

                // Si es administrador, permitir el acceso
                next();
            } catch (error) {
                console.error('Error verificando rol de administrador:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Error en el servidor'
                });
            }
        });
    } catch (error) {
        // Capturar errores en el middleware de autenticación
        return res.status(401).json({
            success: false,
            error: 'No autorizado'
        });
    }
};

// Verificar token de email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token de verificación requerido'
            });
        }

        // Buscar usuario con el token de verificación
        const user = await UserSql.findOne({
            where: {
                verificationToken: token,
                verificationTokenExpires: {
                    [sequelize.Op.gt]: new Date() // Token no expirado
                },
                emailVerified: false
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Token de verificación inválido o expirado'
            });
        }

        // Actualizar usuario como verificado
        user.emailVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();

        // Generar token JWT
        const jwtToken = generateToken(user.id, user.provider, user.role);

        return res.status(200).json({
            success: true,
            message: 'Email verificado correctamente',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                role: user.role,
                emailVerified: user.emailVerified
            },
            token: jwtToken
        });
    } catch (error) {
        console.error('Error al verificar email:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Reenviar correo de verificación
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email requerido'
            });
        }

        // Buscar usuario por email
        const user = await UserSql.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si el email ya está verificado
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está verificado'
            });
        }

        // Generar nuevo token de verificación
        const verificationToken = generateEmailVerificationToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Actualizar usuario con nuevo token
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;
        await user.save();

        // Enviar correo de verificación
        const emailSent = await sendEmailVerification(email, verificationToken, true);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                error: 'Error al enviar correo de verificación'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Correo de verificación enviado correctamente'
        });
    } catch (error) {
        console.error('Error al reenviar correo de verificación:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Habilitar autenticación de dos factores
export const enableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar usuario
        const user = await UserSql.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Generar secreto para autenticación de dos factores
        const secret = generateSecret();

        // Generar código QR
        const qrCode = await generateQRCode(secret.base32, user.email);

        // Guardar secreto en el usuario (temporalmente hasta verificación)
        user.twoFactorSecret = secret.base32;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Código QR generado correctamente',
            secret: secret.base32,
            qrCode
        });
    } catch (error) {
        console.error('Error al habilitar autenticación de dos factores:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Verificar autenticación de dos factores
export const verifyTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token requerido'
            });
        }

        // Buscar usuario
        const user = await UserSql.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                error: 'Autenticación de dos factores no configurada'
            });
        }

        // Verificar token
        const isValid = verifyToken(user.twoFactorSecret, token);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido'
            });
        }

        // Si aún no está habilitado 2FA, habilitar y generar códigos de respaldo
        if (!user.twoFactorEnabled || !user.twoFactorVerified) {
            // Generar códigos de respaldo
            const backupCodes = generateBackupCodes();
            const hashedCodes = hashBackupCodes(backupCodes);

            // Actualizar usuario
            user.twoFactorEnabled = true;
            user.twoFactorVerified = true;
            user.backupCodes = hashedCodes;
            user.lastTwoFactorAuth = new Date();
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Autenticación de dos factores habilitada correctamente',
                backupCodes
            });
        }

        // Si ya está habilitado, solo actualizar última autenticación
        user.lastTwoFactorAuth = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Verificación exitosa'
        });
    } catch (error) {
        console.error('Error al verificar autenticación de dos factores:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Deshabilitar autenticación de dos factores
export const disableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, password } = req.body;

        if (!token && !password) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere token o contraseña para deshabilitar 2FA'
            });
        }

        // Buscar usuario
        const user = await UserSql.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si 2FA está habilitado
        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                error: 'Autenticación de dos factores no está habilitada'
            });
        }

        let isAuthorized = false;

        // Verificar token si fue proporcionado
        if (token) {
            isAuthorized = verifyToken(user.twoFactorSecret, token);

            // Verificar si es un código de respaldo
            if (!isAuthorized && user.backupCodes && user.backupCodes.length > 0) {
                const backupCheck = verifyBackupCode(token, user.backupCodes);
                isAuthorized = backupCheck.valid;
            }
        }

        // Verificar contraseña si fue proporcionada
        if (!isAuthorized && password) {
            isAuthorized = await user.comparePassword(password);
        }

        if (!isAuthorized) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado para deshabilitar 2FA'
            });
        }

        // Deshabilitar 2FA
        user.twoFactorEnabled = false;
        user.twoFactorVerified = false;
        user.twoFactorSecret = null;
        user.backupCodes = [];
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Autenticación de dos factores deshabilitada correctamente'
        });
    } catch (error) {
        console.error('Error al deshabilitar autenticación de dos factores:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Generar nuevos códigos de respaldo
export const generateTwoFactorBackupCodes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token requerido'
            });
        }

        // Buscar usuario
        const user = await UserSql.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si 2FA está habilitado
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                error: 'Autenticación de dos factores no está habilitada'
            });
        }

        // Verificar token
        const isValid = verifyToken(user.twoFactorSecret, token);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido'
            });
        }

        // Generar nuevos códigos de respaldo
        const backupCodes = generateBackupCodes();
        const hashedCodes = hashBackupCodes(backupCodes);

        // Actualizar usuario
        user.backupCodes = hashedCodes;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Nuevos códigos de respaldo generados correctamente',
            backupCodes
        });
    } catch (error) {
        console.error('Error al generar códigos de respaldo:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
};

// Completar autenticación con dos factores
export const completeTwoFactorAuth = async (req, res) => {
    try {
        const { twoFactorToken, otpToken, backupCode } = req.body;

        if (!twoFactorToken) {
            return res.status(400).json({
                success: false,
                error: 'Token de autenticación de dos factores requerido'
            });
        }

        if (!otpToken && !backupCode) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere código OTP o código de respaldo'
            });
        }

        // Verificar token temporal
        const tokenInfo = twoFactorTokens.get(twoFactorToken);
        if (!tokenInfo || new Date() > tokenInfo.expiresAt) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        // Obtener usuario
        const userId = tokenInfo.userId;
        const user = await UserSql.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        let isValid = false;

        // Verificar OTP
        if (otpToken) {
            isValid = verifyToken(user.twoFactorSecret, otpToken);
        }

        // Verificar código de respaldo
        if (!isValid && backupCode && user.backupCodes && user.backupCodes.length > 0) {
            const backupCheck = verifyBackupCode(backupCode, user.backupCodes);
            isValid = backupCheck.valid;

            // Si el código de respaldo es válido, eliminarlo
            if (isValid) {
                // Filtrar el código usado
                const newBackupCodes = [...user.backupCodes];
                newBackupCodes.splice(backupCheck.index, 1);
                user.backupCodes = newBackupCodes;
                await user.save();
            }
        }

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Código inválido'
            });
        }

        // Autenticación exitosa
        // Eliminar token temporal
        twoFactorTokens.delete(twoFactorToken);

        // Actualizar último inicio de sesión
        user.lastLogin = new Date();
        user.lastTwoFactorAuth = new Date();
        await user.save();

        // Generar token JWT
        const token = generateToken(user.id, user.provider, user.role);

        return res.status(200).json({
            success: true,
            message: 'Autenticación de dos factores exitosa',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled
            },
            token
        });
    } catch (error) {
        console.error('Error en autenticación de dos factores:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
}; 
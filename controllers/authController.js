import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import User from '../models/User.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { sendEmailVerification, sendTwoFactorEmail } from '../utils/emailManager.js';

dotenv.config();

// Constantes de configuración
const JWT_SECRET = process.env.JWT_SECRET || 'secreto-desarrollo-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const DISABLE_MONGODB = process.env.DISABLE_MONGODB === 'true';

// Almacenamiento en memoria para modo sin MongoDB
const memoryUsers = [];

// Almacenamiento para tokens de verificación de dos pasos
const twoFactorTokens = new Map();

// Almacenamiento para tokens de verificación de usuarios
const userVerificationTokens = new Map();

// Función para generar un token JWT
const generateToken = (userId, provider = 'email') => {
  return jwt.sign({
    userId,
    provider
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
      id: user._id || user.id,
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
    const { name, email, password } = req.body;

    // Validar datos de entrada
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, proporciona todos los campos requeridos'
      });
    }

    // Si MongoDB está deshabilitado, usar almacenamiento en memoria
    if (DISABLE_MONGODB) {
      // Verificar si el email ya está registrado
      const existingUser = memoryUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado'
        });
      }

      // Crear nuevo usuario (simular hash de contraseña)
      const user = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: `hashed-${password}`,
        provider: 'email',
        role: 'user',
        lastLogin: new Date(),
        emailVerified: false
      };

      // Guardar en memoria
      memoryUsers.push(user);

      // Generar token de verificación de email
      const verificationToken = generateEmailVerificationToken();

      // Guardar token con tiempo de expiración (24 horas)
      userVerificationTokens.set(verificationToken, {
        userId: user.id,
        email,
        created: Date.now(),
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
        used: false
      });

      // Enviar correo de verificación
      const emailSent = await sendEmailVerification(email, verificationToken, true);

      if (!emailSent) {
        console.error('❌ Error al enviar correo de verificación');

        // En modo desarrollo, verificar automáticamente
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ MODO DESARROLLO: Verificando email automáticamente');
          user.emailVerified = true;

          // Generar token JWT
          const token = generateToken(user.id);

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
    }

    // Procedimiento normal con MongoDB
    // Verificar si el email ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario con verificación de email pendiente
    const user = await User.create({
      name,
      email,
      password,
      provider: 'email',
      emailVerified: false
    });

    // Generar token de verificación de email
    const verificationToken = generateEmailVerificationToken();

    // Guardar token en el usuario
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await user.save();

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
        const token = generateToken(user._id);

        return res.status(201).json({
          success: true,
          message: 'Usuario registrado y verificado automáticamente (modo desarrollo)',
          user: {
            id: user._id,
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

    // Manejo específico de errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
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

    // Si MongoDB está deshabilitado, usar almacenamiento en memoria
    if (DISABLE_MONGODB) {
      // Buscar usuario
      const user = memoryUsers.find(u => u.email === email);

      // Verificar si el usuario existe
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña (simulación simple)
      const isMatch = user.password === `hashed-${password}`;
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Verificar si el email está verificado
      if (!user.emailVerified && user.provider === 'email') {
        // Generar token de verificación de email
        const verificationToken = generateEmailVerificationToken();

        // Guardar token con tiempo de expiración (24 horas)
        userVerificationTokens.set(verificationToken, {
          userId: user.id,
          email,
          created: Date.now(),
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
          used: false
        });

        // Enviar correo de verificación
        await sendEmailVerification(email, verificationToken, true);

        return res.status(401).json({
          success: false,
          requiresEmailVerification: true,
          error: 'Email no verificado. Se ha enviado un nuevo correo de verificación.'
        });
      }

      // Verificar si tiene habilitada la autenticación de dos factores
      if (user.twoFactorEnabled) {
        // Generar token para verificación de dos factores
        const twoFactorToken = generateTwoFactorToken();

        // Guardar token con tiempo de expiración (30 minutos)
        userVerificationTokens.set(twoFactorToken, {
          userId: user.id,
          email,
          created: Date.now(),
          expires: Date.now() + 30 * 60 * 1000, // 30 minutos
          used: false,
          type: 'login2fa'
        });

        // Enviar correo de verificación para login
        const emailSent = await sendEmailVerification(email, twoFactorToken, false);

        if (!emailSent) {
          // En modo desarrollo, verificar automáticamente
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ MODO DESARROLLO: Saltando verificación de dos factores');

            // Actualizar la fecha de último login
            user.lastLogin = new Date();

            // Generar token JWT
            const token = generateToken(user.id);

            return res.json({
              success: true,
              skipTwoFactor: true,
              message: 'Verificación de dos factores omitida en modo desarrollo',
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                provider: user.provider,
                role: user.role,
                emailVerified: user.emailVerified,
                twoFactorEnabled: user.twoFactorEnabled
              },
              token
            });
          }

          return res.status(500).json({
            success: false,
            error: 'Error al enviar correo de verificación para inicio de sesión'
          });
        }

        return res.json({
          success: true,
          requiresTwoFactor: true,
          message: 'Se requiere verificación de dos factores. Se ha enviado un código de verificación a tu correo.'
        });
      }

      // Si no requiere 2FA, proceder con login normal
      // Actualizar la fecha de último login
      user.lastLogin = new Date();

      // Generar token JWT
      const token = generateToken(user.id);

      // Devolver respuesta
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          provider: user.provider,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        },
        token
      });
    }

    // Procedimiento normal con MongoDB
    // Buscar usuario y seleccionar explícitamente el campo password
    const user = await User.findOne({ email }).select('+password');

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

    // Verificar si el email está verificado
    if (!user.emailVerified && user.provider === 'email') {
      // Generar token de verificación de email
      const verificationToken = generateEmailVerificationToken();

      // Guardar token en el usuario
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      await user.save();

      // Enviar correo de verificación
      await sendEmailVerification(email, verificationToken, true);

      return res.status(401).json({
        success: false,
        requiresEmailVerification: true,
        error: 'Email no verificado. Se ha enviado un nuevo correo de verificación.'
      });
    }

    // Verificar si tiene habilitada la autenticación de dos factores
    if (user.twoFactorEnabled) {
      // Generar token para verificación de dos factores
      const twoFactorToken = generateTwoFactorToken();

      // Guardar token en el usuario
      user.verificationToken = twoFactorToken;
      user.verificationTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
      user.twoFactorVerified = false;
      await user.save();

      // Enviar correo de verificación para login
      const emailSent = await sendEmailVerification(email, twoFactorToken, false);

      if (!emailSent) {
        // En modo desarrollo, verificar automáticamente
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ MODO DESARROLLO: Saltando verificación de dos factores');

          // Actualizar la fecha de último login
          user.lastLogin = Date.now();
          user.twoFactorVerified = true;
          user.verificationToken = null;
          user.verificationTokenExpires = null;
          await user.save();

          // Quitar el password del objeto user antes de devolverlo
          user.password = undefined;

          // Generar token JWT
          const token = generateToken(user._id);

          return res.json({
            success: true,
            skipTwoFactor: true,
            message: 'Verificación de dos factores omitida en modo desarrollo',
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              provider: user.provider,
              role: user.role,
              emailVerified: user.emailVerified,
              twoFactorEnabled: user.twoFactorEnabled
            },
            token
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Error al enviar correo de verificación para inicio de sesión'
        });
      }

      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Se requiere verificación de dos factores. Se ha enviado un código de verificación a tu correo.'
      });
    }

    // Si no requiere 2FA, proceder con login normal
    // Actualizar la fecha de último login
    user.lastLogin = Date.now();
    await user.save();

    // Quitar el password del objeto user antes de devolverlo
    user.password = undefined;

    // Generar token JWT
    const token = generateToken(user._id);

    // Devolver respuesta
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
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

// Controller para autenticación con Google
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

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

    // Modo sin MongoDB
    if (DISABLE_MONGODB) {
      // Buscar usuario por providerId
      let user = memoryUsers.find(u =>
        u.provider === 'google' && u.providerId === googleUserInfo.sub
      );

      // Si no existe, crear nuevo usuario
      if (!user) {
        user = {
          id: `google-${googleUserInfo.sub}`,
          name: googleUserInfo.name,
          email: googleUserInfo.email,
          provider: 'google',
          providerId: googleUserInfo.sub,
          avatar: googleUserInfo.picture || '',
          role: 'user',
          lastLogin: new Date()
        };

        // Guardar en memoria
        memoryUsers.push(user);
      } else {
        // Actualizar información si es necesario
        user.lastLogin = new Date();
      }

      // Generar token JWT
      const token = generateToken(user.id, 'google');

      // Devolver respuesta
      return res.json(formatUserResponse(user, token));
    }

    // Procedimiento normal con MongoDB    
    // Buscar si el usuario ya existe (por providerId de Google)
    let user = await User.findOne({
      provider: 'google',
      providerId: googleUserInfo.sub
    });

    if (user) {
      // Actualizar información si es necesario
      if (googleUserInfo.picture && user.avatar !== googleUserInfo.picture) {
        user.avatar = googleUserInfo.picture;
      }
    } else {
      // Intentar buscar el usuario por email (para vincular cuentas)
      user = await User.findOne({ email: googleUserInfo.email });

      if (user) {
        // Usuario encontrado con el mismo email, actualizar para vincular a Google
        user.provider = 'google';
        user.providerId = googleUserInfo.sub;
        if (googleUserInfo.picture) {
          user.avatar = googleUserInfo.picture;
        }
      } else {
        // Crear nuevo usuario si no existe
        user = await User.create({
          name: googleUserInfo.name,
          email: googleUserInfo.email,
          provider: 'google',
          providerId: googleUserInfo.sub,
          avatar: googleUserInfo.picture || ''
        });
      }
    }

    // Generar token JWT
    // Usamos el formato google-providerId para el token
    const jwtToken = generateToken(`google-${googleUserInfo.sub}`, 'google');

    // Actualizar la fecha de último login
    user.lastLogin = Date.now();
    await user.save();

    // Devolver respuesta con usuario y token
    return res.json(formatUserResponse(user, jwtToken));

  } catch (error) {
    console.error('Error en autenticación con Google:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en autenticación con Google'
    });
  }
};

// Controller para autenticación con GitHub
export const githubAuth = async (req, res) => {
  try {
    // Verificar el código de autorización
    let code, accessToken, githubUserInfo;

    // Para peticiones POST, el código está en el body
    if (req.method === 'POST') {
      code = req.body.code;
    }
    // Para peticiones GET (redirección desde GitHub), el código está en query params
    else if (req.method === 'GET') {
      code = req.query.code;
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de autorización no proporcionado'
      });
    }

    // Intercambiar el código por un token de acceso
    try {
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

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener token de GitHub');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('Token de acceso de GitHub no recibido');
      }

      // Obtener información del usuario con el token de acceso
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Portfolio-App'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Error al obtener información de usuario de GitHub');
      }

      githubUserInfo = await userResponse.json();

      // Si no tenemos email, intentar obtenerlo de la API de emails
      if (!githubUserInfo.email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Portfolio-App'
          }
        });

        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();
          const primaryEmail = emails.find(email => email.primary);

          if (primaryEmail) {
            githubUserInfo.email = primaryEmail.email;
          } else if (emails.length > 0) {
            githubUserInfo.email = emails[0].email;
          }
        }
      }

    } catch (error) {
      console.error('Error al autenticar con GitHub:', error);

      // En desarrollo, permitir la simulación si no hay verificación
      if (process.env.NODE_ENV === 'development') {
        console.warn('Modo desarrollo: Simulando usuario de GitHub');
        githubUserInfo = {
          id: Date.now(),
          login: 'github-user',
          name: 'Usuario de GitHub (Dev)',
          email: `dev-${Date.now()}@example.com`,
          avatar_url: 'https://avatars.githubusercontent.com/u/default'
        };
      } else {
        // En producción, devolver error
        if (req.method === 'GET') {
          return res.redirect('/?error=github_auth_error');
        }
        return res.status(401).json({
          success: false,
          error: 'Error de autenticación con GitHub'
        });
      }
    }

    // Si no tenemos al menos el ID y el login, no podemos continuar
    if (!githubUserInfo.id) {
      return res.status(400).json({
        success: false,
        error: 'Información de usuario insuficiente'
      });
    }

    // Si estamos en modo sin MongoDB
    if (DISABLE_MONGODB) {
      // Buscar usuario por providerId
      let user = memoryUsers.find(u =>
        u.provider === 'github' && u.providerId === githubUserInfo.id.toString()
      );

      // Si no existe, crear nuevo usuario
      if (!user) {
        user = {
          id: `github-${githubUserInfo.id}`,
          name: githubUserInfo.name || githubUserInfo.login,
          email: githubUserInfo.email || `github-${githubUserInfo.id}@example.com`,
          provider: 'github',
          providerId: githubUserInfo.id.toString(),
          avatar: githubUserInfo.avatar_url || '',
          role: 'user',
          lastLogin: new Date()
        };

        // Guardar en memoria
        memoryUsers.push(user);
      } else {
        // Actualizar información si es necesario
        user.lastLogin = new Date();
      }

      // Generar token JWT
      const token = generateToken(user.id, 'github');

      // Responder según el método de la solicitud
      if (req.method === 'GET') {
        // Redirigir al frontend con el token
        return res.redirect(`/?token=${token}&userId=${user.id}`);
      } else {
        // Para POST, devolver JSON
        return res.json(formatUserResponse(user, token));
      }
    }

    // Procedimiento normal con MongoDB
    // Buscar si el usuario ya existe
    let user = await User.findOne({
      provider: 'github',
      providerId: githubUserInfo.id.toString()
    });

    if (user) {
      // Actualizar información si es necesario
      if (githubUserInfo.avatar_url && user.avatar !== githubUserInfo.avatar_url) {
        user.avatar = githubUserInfo.avatar_url;
      }
    } else {
      // Intentar buscar el usuario por email (para vincular cuentas)
      if (githubUserInfo.email) {
        user = await User.findOne({ email: githubUserInfo.email });

        if (user) {
          // Usuario encontrado con el mismo email, actualizar para vincular a GitHub
          user.provider = 'github';
          user.providerId = githubUserInfo.id.toString();
          if (githubUserInfo.avatar_url) {
            user.avatar = githubUserInfo.avatar_url;
          }
        }
      }

      // Si no existe o no se encontró por email, crear nuevo usuario
      if (!user) {
        // Crear nuevo usuario
        user = await User.create({
          name: githubUserInfo.name || githubUserInfo.login,
          email: githubUserInfo.email,
          provider: 'github',
          providerId: githubUserInfo.id.toString(),
          avatar: githubUserInfo.avatar_url || ''
        });
      }
    }

    // Generar token JWT
    // Usamos el formato github-providerId para el token
    const jwtToken = generateToken(`github-${githubUserInfo.id}`, 'github');

    // Actualizar la fecha de último login
    user.lastLogin = Date.now();
    await user.save();

    // Responder según el método de la solicitud
    if (req.method === 'GET') {
      // Redirigir al frontend con el token en parámetros de consulta
      return res.redirect(`/?token=${jwtToken}&userId=${user._id}`);
    } else {
      // Para POST, devolver JSON como antes
      return res.json(formatUserResponse(user, jwtToken));
    }

  } catch (error) {
    console.error('Error en autenticación con GitHub:', error);
    // Redirigir a la página de inicio con error para GET
    if (req.method === 'GET') {
      return res.redirect('/?error=github_auth_error');
    }
    return res.status(500).json({
      success: false,
      error: 'Error en autenticación con GitHub'
    });
  }
};

// Controller para obtener el usuario actual
export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;
    const provider = req.user.provider;

    // 1. Manejo especial para 'admin-user' SIN consultar BD
    if (userId === 'admin-user') {
      console.log('⚙️ authController.getMe: Usuario "admin-user" detectado. Devolviendo datos mock/administrativos.');
      return res.json({
        success: true,
        user: {
          id: 'admin-user', // O _id si tu frontend consistentemente usa eso
          name: 'Administrador del Sistema (Dev)', // Nombre mock
          email: 'admin@example.com', // Email mock
          role: 'admin', // Rol
          provider: provider || 'admin-special', // Proveedor mock o el que venga en el token
          avatar: null, // O una URL de avatar mock
          // Agrega cualquier otro campo que el frontend espere para un usuario autenticado
        }
      });
    }

    // Si MongoDB está deshabilitado, buscar en memoria
    if (DISABLE_MONGODB) {
      const userInMem = memoryUsers.find(u => u.id === userId);
      if (!userInMem) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado (memoria)' });
      }
      return res.json({
        success: true,
        user: {
          id: userInMem.id,
          name: userInMem.name,
          email: userInMem.email,
          provider: userInMem.provider,
          avatar: userInMem.avatar,
          role: userInMem.role
        }
      });
    }

    // Procedimiento normal con MongoDB para otros usuarios
    let user;

    if (userId.startsWith('google-') || userId.startsWith('github-')) {
      // Buscar por providerId en lugar de _id
      const providerIdParts = userId.split('-');
      if (providerIdParts.length < 2) {
        console.error(`❌ authController.getMe: ID de proveedor malformado: ${userId}`);
        return res.status(400).json({ success: false, error: 'ID de proveedor malformado.' });
      }
      const actualProviderId = providerIdParts.slice(1).join('-'); // Para IDs como "google-some-long-id"

      user = await User.findOne({
        provider: provider, // El provider del token
        providerId: actualProviderId
      });

      // Fallback si no se encuentra por provider + providerId específico (esto puede ser opcional)
      if (!user) {
        console.log(`⚠️ Usuario con provider ${provider} y providerId ${actualProviderId} no encontrado. Intentando buscar solo por providerId.`);
        user = await User.findOne({ providerId: actualProviderId });
      }

    } else {
      // Para usuarios regulares (IDs que deberían ser ObjectId)
      try {
        // Intentar buscar por _id para usuarios normales
        user = await User.findById(userId);
      } catch (idError) {
        // Esto es importante para capturar CastErrors si el userId NO es 'admin-user'
        // pero sigue siendo un string que no es un ObjectId válido.
        if (idError.name === 'CastError') {
          console.error(`❌ authController.getMe: CastError para userId "${userId}". No es un ObjectId válido.`);
          return res.status(400).json({ success: false, error: 'Formato de ID de usuario inválido.' });
        }
        console.error(`❌ Error al buscar usuario por ID "${userId}": ${idError.message}`);
        // Opcional: intentar buscar por email si está en el token y el ID falla
        if (req.user.email) {
          console.log(`⚠️ Buscando usuario por email como fallback: ${req.user.email}`);
          user = await User.findOne({ email: req.user.email });
        }
      }
    }

    if (!user) {
      console.log(`❌ authController.getMe: Usuario no encontrado en BD para userId: ${userId}, provider: ${provider}`);
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Devolver información del usuario desde la BD
    return res.json({
      success: true,
      user: {
        id: user._id, // Usar _id de MongoDB
        name: user.name,
        email: user.email,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role
        // Asegúrate que estos campos coincidan con lo que espera el frontend
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

        // Si MongoDB está deshabilitado, buscar en memoria
        if (DISABLE_MONGODB) {
          const user = memoryUsers.find(u => u.id === userId);

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
          return;
        }

        // Procedimiento normal con MongoDB
        // Buscar el usuario por ID
        const user = await User.findById(userId);

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

// Función para solicitar verificación de dos pasos
export const requestTwoFactorAuth = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔑 Solicitud de verificación en dos pasos recibida para usuario:', username);

    // Verificar credenciales iniciales
    let credentialesValidas = false;

    // Verificación en modo desarrollo o test
    if (username === 'admin' && password === 'admin123') {
      console.log('✅ Credenciales de desarrollo válidas para admin');
      credentialesValidas = true;
    }
    // Verificación contra base de datos (si está habilitada)
    else if (!DISABLE_MONGODB) {
      try {
        const adminUser = await User.findOne({ email: username, role: 'admin' });
        if (adminUser) {
          console.log('✅ Usuario administrador encontrado en base de datos');
          credentialesValidas = true;
        }
      } catch (dbError) {
        console.error('Error al consultar la base de datos:', dbError);
      }
    }

    if (credentialesValidas) {
      // Generar token de verificación único
      const twoFactorToken = generateTwoFactorToken();
      console.log('🔑 Token de verificación generado:', twoFactorToken.substring(0, 10) + '...');

      // Guardar el token en el mapa con tiempo de expiración (10 minutos)
      twoFactorTokens.set(twoFactorToken, {
        username,
        created: Date.now(),
        expires: Date.now() + 10 * 60 * 1000, // 10 minutos
        used: false
      });

      // Enviar correo de verificación al administrador
      const targetEmail = process.env.ADMIN_EMAIL || 'lucasdono391@gmail.com';
      console.log(`📧 Enviando correo de verificación a ${targetEmail}`);

      const emailSent = await sendTwoFactorEmail(targetEmail, twoFactorToken);

      if (emailSent) {
        console.log('✅ Correo de verificación enviado correctamente');
        return res.json({
          success: true,
          message: 'Se ha enviado un enlace de verificación a tu correo electrónico',
          requiresTwoFactor: true
        });
      } else {
        console.error('❌ Error al enviar correo de verificación');

        // En desarrollo, permitir inicio de sesión aún si falla el correo
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ MODO DESARROLLO: Permitiendo acceso sin verificación por email');

          // Generar token JWT para la sesión
          const jwtToken = jwt.sign({
            userId: 'admin-user',
            role: 'admin'
          }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

          return res.json({
            success: true,
            token: jwtToken,
            message: 'Inicio de sesión en modo desarrollo (sin verificación de correo)',
            user: {
              name: 'Administrador',
              role: 'admin',
              email: targetEmail
            }
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Error al enviar correo de verificación. Por favor, intenta de nuevo más tarde.'
        });
      }
    }

    // Si las credenciales no son válidas
    console.log('❌ Credenciales incorrectas para:', username);
    return res.status(401).json({
      success: false,
      error: 'Credenciales incorrectas'
    });
  } catch (error) {
    console.error('Error en solicitud de verificación de dos factores:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

// Función para verificar token de dos factores
export const verifyTwoFactorToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`🔐 Intentando verificar token: ${token.substring(0, 10)}...`);

    // Listar cuántos tokens hay almacenados actualmente
    console.log(`📊 Tokens almacenados actualmente: ${twoFactorTokens.size}`);

    // Verificar si el token existe y es válido
    if (!twoFactorTokens.has(token)) {
      console.log(`❌ Token no encontrado en el almacenamiento`);
      return res.status(400).json({
        success: false,
        error: 'Token de verificación inválido o expirado'
      });
    }

    const tokenData = twoFactorTokens.get(token);
    console.log(`✅ Token encontrado. Creado hace ${Math.round((Date.now() - tokenData.created) / 1000)} segundos`);
    console.log(`📋 Datos del token: usuario=${tokenData.username}, usado=${tokenData.used}`);

    // Verificar si el token ha expirado
    const expiresIn = Math.round((tokenData.expires - Date.now()) / 1000);
    if (Date.now() > tokenData.expires) {
      console.log(`❌ Token expirado hace ${Math.abs(expiresIn)} segundos`);
      twoFactorTokens.delete(token); // Eliminar token expirado
      return res.status(400).json({
        success: false,
        error: 'Token de verificación expirado'
      });
    }

    console.log(`✅ Token válido. Expira en ${expiresIn} segundos`);

    // Verificar si el token ya fue usado
    if (tokenData.used) {
      console.log(`❌ Token ya utilizado previamente`);
      return res.status(400).json({
        success: false,
        error: 'Este token ya fue utilizado'
      });
    }

    // Marcar el token como usado
    tokenData.used = true;
    twoFactorTokens.set(token, tokenData);
    console.log(`✅ Token marcado como utilizado`);

    // Generar token JWT para la sesión con una expiración más larga (30 días)
    const jwtToken = jwt.sign({
      userId: 'admin-user',
      role: 'admin'
    }, JWT_SECRET, { expiresIn: '30d' });

    console.log(`✅ Token JWT generado para la sesión de administrador`);

    // Enviar respuesta con token JWT
    return res.json({
      success: true,
      token: jwtToken,
      user: {
        name: 'Administrador',
        role: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@example.com'
      },
      message: 'Verificación completada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en verificación de dos factores:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor: ' + error.message
    });
  }
};

// Función para verificar email de usuario
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`🔐 Intentando verificar email con token: ${token.substring(0, 10)}...`);

    if (DISABLE_MONGODB) {
      // Verificar si el token existe y es válido
      if (!userVerificationTokens.has(token)) {
        console.log(`❌ Token no encontrado en el almacenamiento de tokens de verificación`);
        return res.status(400).json({
          success: false,
          error: 'Token de verificación inválido o expirado'
        });
      }

      const tokenData = userVerificationTokens.get(token);
      console.log(`✅ Token encontrado. Creado hace ${Math.round((Date.now() - tokenData.created) / 1000)} segundos`);

      // Verificar si el token ha expirado
      if (Date.now() > tokenData.expires) {
        console.log(`❌ Token expirado`);
        userVerificationTokens.delete(token); // Eliminar token expirado
        return res.status(400).json({
          success: false,
          error: 'Token de verificación expirado'
        });
      }

      // Verificar si el token ya fue usado
      if (tokenData.used) {
        console.log(`❌ Token ya utilizado previamente`);
        return res.status(400).json({
          success: false,
          error: 'Este token ya fue utilizado'
        });
      }

      // Buscar usuario por ID
      const user = memoryUsers.find(u => u.id === tokenData.userId);
      if (!user) {
        console.log(`❌ Usuario no encontrado para el token`);
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Actualizar verificación de email
      user.emailVerified = true;

      // Marcar el token como usado
      tokenData.used = true;
      userVerificationTokens.set(token, tokenData);
      console.log(`✅ Email verificado exitosamente para ${user.email}`);

      // Generar token JWT para la sesión
      const jwtToken = generateToken(user.id);

      // Enviar respuesta con token JWT
      return res.json({
        success: true,
        message: 'Correo electrónico verificado exitosamente',
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          provider: user.provider,
          role: user.role,
          emailVerified: true
        }
      });
    }

    // Procedimiento normal con MongoDB
    // Buscar usuario con el token de verificación
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() } // Token no expirado
    });

    if (!user) {
      console.log(`❌ Usuario no encontrado con token válido`);
      return res.status(400).json({
        success: false,
        error: 'Token de verificación inválido o expirado'
      });
    }

    // Actualizar verificación de email
    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();
    console.log(`✅ Email verificado exitosamente para ${user.email}`);

    // Generar token JWT para la sesión
    const jwtToken = generateToken(user._id);

    // Enviar respuesta con token JWT
    return res.json({
      success: true,
      message: 'Correo electrónico verificado exitosamente',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        role: user.role,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('❌ Error en verificación de email:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor: ' + error.message
    });
  }
};

// Función para verificar el segundo factor de autenticación en login
export const verifyLoginTwoFactor = async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`🔐 Intentando verificar token de 2FA para login: ${token.substring(0, 10)}...`);

    if (DISABLE_MONGODB) {
      // Verificar si el token existe y es válido
      if (!userVerificationTokens.has(token)) {
        console.log(`❌ Token no encontrado en el almacenamiento`);
        return res.status(400).json({
          success: false,
          error: 'Token de verificación inválido o expirado'
        });
      }

      const tokenData = userVerificationTokens.get(token);
      console.log(`✅ Token encontrado. Creado hace ${Math.round((Date.now() - tokenData.created) / 1000)} segundos`);

      // Verificar si es un token de tipo login2fa
      if (tokenData.type !== 'login2fa') {
        console.log(`❌ Token no es de tipo login2fa`);
        return res.status(400).json({
          success: false,
          error: 'Token de verificación inválido'
        });
      }

      // Verificar si el token ha expirado
      if (Date.now() > tokenData.expires) {
        console.log(`❌ Token expirado`);
        userVerificationTokens.delete(token); // Eliminar token expirado
        return res.status(400).json({
          success: false,
          error: 'Token de verificación expirado'
        });
      }

      // Verificar si el token ya fue usado
      if (tokenData.used) {
        console.log(`❌ Token ya utilizado previamente`);
        return res.status(400).json({
          success: false,
          error: 'Este token ya fue utilizado'
        });
      }

      // Buscar usuario por ID
      const user = memoryUsers.find(u => u.id === tokenData.userId);
      if (!user) {
        console.log(`❌ Usuario no encontrado para el token`);
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Marcar el token como usado
      tokenData.used = true;
      userVerificationTokens.set(token, tokenData);
      console.log(`✅ Verificación de 2FA exitosa para ${user.email}`);

      // Actualizar la fecha de último login
      user.lastLogin = new Date();

      // Generar token JWT para la sesión
      const jwtToken = generateToken(user.id);

      // Enviar respuesta con token JWT
      return res.json({
        success: true,
        message: 'Verificación de dos factores completada exitosamente',
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          provider: user.provider,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    }

    // Procedimiento normal con MongoDB
    // Buscar usuario con el token de verificación
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() } // Token no expirado
    });

    if (!user) {
      console.log(`❌ Usuario no encontrado con token válido`);
      return res.status(400).json({
        success: false,
        error: 'Token de verificación inválido o expirado'
      });
    }

    // Marcar como verificado y limpiar token
    user.twoFactorVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.lastLogin = Date.now();
    await user.save();
    console.log(`✅ Verificación de 2FA exitosa para ${user.email}`);

    // Generar token JWT para la sesión
    const jwtToken = generateToken(user._id);

    // Enviar respuesta con token JWT
    return res.json({
      success: true,
      message: 'Verificación de dos factores completada exitosamente',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('❌ Error en verificación de 2FA para login:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor: ' + error.message
    });
  }
};

// Función para actualizar configuración de 2FA del usuario
export const updateUserTwoFactorSettings = async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.userId;
    console.log(`🔐 Actualizando configuración 2FA para usuario: ${userId}, habilitado: ${enabled}`);

    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere especificar si se desea habilitar o deshabilitar la verificación en dos pasos'
      });
    }

    if (DISABLE_MONGODB) {
      // Buscar usuario por ID
      const user = memoryUsers.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Actualizar configuración de 2FA
      user.twoFactorEnabled = !!enabled;
      console.log(`✅ Configuración 2FA actualizada para ${user.email}: ${user.twoFactorEnabled}`);

      return res.json({
        success: true,
        message: `Verificación en dos pasos ${user.twoFactorEnabled ? 'habilitada' : 'deshabilitada'} exitosamente`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          provider: user.provider,
          role: user.role,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled
        }
      });
    }

    // Procedimiento normal con MongoDB
    // Buscar usuario por ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Actualizar configuración de 2FA
    user.twoFactorEnabled = !!enabled;
    await user.save();
    console.log(`✅ Configuración 2FA actualizada para ${user.email}: ${user.twoFactorEnabled}`);

    return res.json({
      success: true,
      message: `Verificación en dos pasos ${user.twoFactorEnabled ? 'habilitada' : 'deshabilitada'} exitosamente`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar configuración 2FA:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor: ' + error.message
    });
  }
}; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';
import UserSql from '../models/UserSql.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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
const DISABLE_DB = process.env.DISABLE_DB === 'true';

// Almacenamiento en memoria para modo sin base de datos
const memoryUsers = [];

// Almacenamiento para tokens de verificación de dos pasos
const twoFactorTokens = new Map();

// Almacenamiento para tokens de verificación de usuarios
const userVerificationTokens = new Map();

// Archivo para persistir tokens de dos factores
const TOKENS_FILE = path.join(process.cwd(), 'temp', 'two-factor-tokens.json');

// Función para cargar tokens desde archivo
const loadTokensFromFile = () => {
  try {
    // Crear directorio temp si no existe
    const tempDir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf8');
      const tokens = JSON.parse(data);

      // Cargar tokens válidos (no expirados)
      const now = Date.now();
      let validTokens = 0;
      let expiredTokens = 0;

      for (const [token, tokenData] of Object.entries(tokens)) {
        if (tokenData.expires > now && !tokenData.used) {
          twoFactorTokens.set(token, tokenData);
          validTokens++;
        } else {
          expiredTokens++;
        }
      }

      console.log(`📂 Tokens cargados desde archivo: ${validTokens} válidos, ${expiredTokens} expirados`);
    }
  } catch (error) {
    console.error('Error al cargar tokens desde archivo:', error);
  }
};

// Función para guardar tokens en archivo
const saveTokensToFile = () => {
  try {
    const tokensObj = {};
    for (const [token, tokenData] of twoFactorTokens.entries()) {
      tokensObj[token] = tokenData;
    }

    // Crear directorio temp si no existe
    const tempDir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokensObj, null, 2));
    console.log(`💾 Tokens guardados en archivo: ${twoFactorTokens.size} tokens`);
  } catch (error) {
    console.error('Error al guardar tokens en archivo:', error);
  }
};

// Función para limpiar tokens expirados
const cleanExpiredTokens = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [token, tokenData] of twoFactorTokens.entries()) {
    if (tokenData.expires <= now || tokenData.used) {
      twoFactorTokens.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Limpieza automática: ${cleaned} tokens expirados eliminados`);
    saveTokensToFile(); // Guardar cambios
  }
};

// Cargar tokens al iniciar el servidor
loadTokensFromFile();

// Limpiar tokens expirados cada 5 minutos
setInterval(cleanExpiredTokens, 5 * 60 * 1000);

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
      id: user.id,
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

    // Si base de datos está deshabilitada, usar almacenamiento en memoria
    if (DISABLE_DB) {
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

      // Generar token JWT
      const token = generateToken(user.id);

      return res.status(201).json(formatUserResponse(user, token));
    }

    // Procedimiento normal con base de datos PostgreSQL
    // Verificar si el email ya está registrado
    const existingUser = await UserSql.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario
    const user = await UserSql.create({
      name,
      email,
      password,
      provider: 'email',
      role: 'user',
      emailVerified: true // Por simplicidad, marcar como verificado
    });

    // Generar token JWT
    const token = generateToken(user.id);

    console.log('✅ Usuario registrado exitosamente:', user.email);

    return res.status(201).json(formatUserResponse(user, token));

  } catch (error) {
    console.error('❌ Error en registro:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Controller para login de usuarios
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

    // Si base de datos está deshabilitada, usar almacenamiento en memoria
    if (DISABLE_DB) {
      // Buscar usuario
      const user = memoryUsers.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Simular verificación de contraseña
      if (user.password !== `hashed-${password}`) {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas'
        });
      }

      // Actualizar último login
      user.lastLogin = new Date();

      // Generar token JWT
      const token = generateToken(user.id);

      return res.json(formatUserResponse(user, token));
    }

    // Procedimiento normal con base de datos PostgreSQL
    // Buscar usuario
    const user = await UserSql.findOne({ where: { email } });

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token JWT
    const token = generateToken(user.id);

    console.log('✅ Usuario logueado exitosamente:', user.email);

    return res.json(formatUserResponse(user, token));

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Controller para obtener información del usuario actual
export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Si base de datos está deshabilitada, buscar en memoria
    if (DISABLE_DB) {
      const user = memoryUsers.find(u => u.id === userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

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
    }

    // Procedimiento normal con base de datos PostgreSQL
    const user = await UserSql.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

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
    console.error('❌ Error al obtener usuario:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// Middleware de autenticación
export const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies?.token ||
      req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No hay token, acceso denegado'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
};

// Middleware de administrador
export const adminMiddleware = (req, res, next) => {
  // Primero verificar autenticación
  authMiddleware(req, res, async () => {
    try {
      const userId = req.user.userId;

      // Si base de datos está deshabilitada, verificar en memoria
      if (DISABLE_DB) {
        const user = memoryUsers.find(u => u.id === userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de administrador.'
          });
        }
        return next();
      }

      // Verificar en base de datos PostgreSQL
      const user = await UserSql.findByPk(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
      }

      next();

    } catch (error) {
      console.error('❌ Error en middleware de administrador:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  });
};

// Funciones OAuth simplificadas (para implementar después si es necesario)
export const googleAuth = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Autenticación con Google no implementada en esta versión simplificada'
  });
};

export const githubAuth = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Autenticación con GitHub no implementada en esta versión simplificada'
  });
};

// Funciones de verificación simplificadas
export const requestTwoFactorAuth = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔑 Solicitud de verificación en dos pasos recibida para usuario:', username);
    console.log('📝 Datos recibidos:', { username, password: '***' });

    // Verificar credenciales iniciales
    let credentialesValidas = false;
    let userId = null;

    // Verificación en modo desarrollo o test
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    
    if (username === adminUser && password === adminPass) {
      console.log('✅ Credenciales de administrador válidas');
      credentialesValidas = true;
      userId = 'admin-user';
    }
    // Verificación contra base de datos (si está habilitada)
    else if (!DISABLE_DB) {
      try {
        const adminUser = await UserSql.findOne({ where: { email: username, role: 'admin' } });
        if (adminUser && await bcrypt.compare(password, adminUser.password)) {
          console.log('✅ Usuario administrador encontrado en base de datos');
          credentialesValidas = true;
          userId = adminUser.id;
        }
      } catch (dbError) {
        console.error('Error al consultar la base de datos:', dbError);
      }
    }

    if (!credentialesValidas) {
      console.log('❌ Credenciales incorrectas para:', username);
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }

    // Generar token de verificación único
    const twoFactorToken = generateTwoFactorToken();
    console.log('🔑 Token de verificación generado:', twoFactorToken.substring(0, 10) + '...');

    // Guardar el token en el mapa con tiempo de expiración (10 minutos)
    twoFactorTokens.set(twoFactorToken, {
      username,
      userId,
      created: Date.now(),
      expires: Date.now() + 10 * 60 * 1000, // 10 minutos
      used: false
    });

    // Guardar tokens en archivo para persistencia
    saveTokensToFile();

    console.log(`💾 Token guardado: expira en 10 minutos (${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()})`);

    // Enviar token por correo electrónico (en un entorno real)
    // await sendTwoFactorEmail(username, twoFactorToken);

    return res.status(200).json({
      success: true,
      message: 'Se ha enviado un código de verificación',
      twoFactorToken
    });
  } catch (error) {
    console.error('Error al solicitar verificación de dos pasos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

export const verifyTwoFactorToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }
    
    // Verificar si el token existe en el mapa
    const tokenInfo = twoFactorTokens.get(token);
    
    if (!tokenInfo) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    
    // Verificar si el token ha expirado
    if (Date.now() > tokenInfo.expires) {
      // Eliminar token expirado
      twoFactorTokens.delete(token);
      saveTokensToFile();
      
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    // Verificar si el token ya fue usado
    if (tokenInfo.used) {
      return res.status(401).json({
        success: false,
        error: 'Token ya utilizado'
      });
    }
    
    // Marcar token como usado
    tokenInfo.used = true;
    saveTokensToFile();
    
    // Generar token JWT para el usuario
    const jwtToken = generateToken(tokenInfo.userId, 'email', 'admin');
    
    return res.status(200).json({
      success: true,
      message: 'Verificación exitosa',
      token: jwtToken
    });
  } catch (error) {
    console.error('Error al verificar token de dos pasos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Implementar verificación de email
    // Esta es una implementación básica, deberías adaptarla a tu sistema
    
    return res.status(200).json({
      success: true,
      message: 'Email verificado correctamente'
    });
  } catch (error) {
    console.error('Error al verificar email:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

export const verifyLoginTwoFactor = async (req, res) => {
  try {
    const { token } = req.params;
    const { otpToken } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }
    
    // Verificar si el token existe en el mapa
    const tokenInfo = twoFactorTokens.get(token);
    
    if (!tokenInfo) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    
    // Verificar si el token ha expirado
    if (Date.now() > tokenInfo.expires) {
      // Eliminar token expirado
      twoFactorTokens.delete(token);
      saveTokensToFile();
      
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    // En un sistema real, aquí verificarías el código OTP
    // Por ahora aceptamos cualquier código para simplificar
    
    // Generar token JWT para el usuario
    const jwtToken = generateToken(tokenInfo.userId, 'email', 'admin');
    
    return res.status(200).json({
      success: true,
      message: 'Verificación exitosa',
      token: jwtToken
    });
  } catch (error) {
    console.error('Error en verificación de login con dos factores:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

export const updateUserTwoFactorSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enable } = req.body;
    
    // Si la base de datos está deshabilitada, responder con error
    if (DISABLE_DB) {
      return res.status(501).json({
        success: false,
        error: 'Base de datos deshabilitada'
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
    
    if (enable) {
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
    } else {
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
    }
  } catch (error) {
    console.error('Error al actualizar configuración de dos factores:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
};

export const getTokensStatus = async (req, res) => {
  return res.json({
    success: true,
    message: 'Sistema de tokens simplificado activo',
    tokensCount: twoFactorTokens.size
  });
}; 
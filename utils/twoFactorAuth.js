import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

/**
 * Genera una clave secreta para autenticación TOTP (Time-based One-time Password)
 * @returns {Object} Objeto con la clave secreta en diferentes formatos
 */
export const generateSecret = () => {
    return speakeasy.generateSecret({
        name: 'CircuitPrompt',
        length: 20
    });
};

/**
 * Genera una URL para código QR basada en la clave secreta
 * @param {string} secret - Clave secreta en formato base32
 * @param {string} email - Email del usuario 
 * @returns {Promise<string>} URL de datos para el código QR
 */
export const generateQRCode = async (secret, email) => {
    try {
        const otpauth_url = `otpauth://totp/CircuitPrompt:${email}?secret=${secret}&issuer=CircuitPrompt`;
        return await qrcode.toDataURL(otpauth_url);
    } catch (error) {
        console.error('Error al generar código QR:', error);
        throw error;
    }
};

/**
 * Verifica un token TOTP proporcionado por el usuario
 * @param {string} secret - Clave secreta en formato base32
 * @param {string} token - Token proporcionado por el usuario
 * @returns {boolean} True si el token es válido, false en caso contrario
 */
export const verifyToken = (secret, token) => {
    try {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 // Permite una ventana de 1 paso (30 segundos antes/después)
        });
    } catch (error) {
        console.error('Error al verificar token 2FA:', error);
        return false;
    }
};

/**
 * Genera códigos de respaldo para el usuario
 * @param {number} count - Número de códigos a generar (por defecto 8)
 * @returns {Array<string>} Array de códigos de respaldo
 */
export const generateBackupCodes = (count = 8) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
        // Genera un código de 10 caracteres hexadecimales
        const code = crypto.randomBytes(5).toString('hex');
        // Formatea el código en grupos de 5 caracteres para facilitar la lectura
        codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
    }
    return codes;
};

/**
 * Hashea los códigos de respaldo para almacenamiento seguro
 * @param {Array<string>} codes - Códigos de respaldo
 * @returns {Array<string>} Códigos hasheados
 */
export const hashBackupCodes = (codes) => {
    return codes.map(code => {
        // Elimina los guiones para el hash
        const cleanCode = code.replace(/-/g, '');
        return crypto.createHash('sha256').update(cleanCode).digest('hex');
    });
};

/**
 * Verifica un código de respaldo
 * @param {string} providedCode - Código proporcionado por el usuario
 * @param {Array<string>} hashedCodes - Códigos hasheados almacenados
 * @returns {Object} Resultado de la verificación y el índice del código usado
 */
export const verifyBackupCode = (providedCode, hashedCodes) => {
    // Elimina los guiones para la verificación
    const cleanCode = providedCode.replace(/-/g, '');
    const hashedProvidedCode = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const index = hashedCodes.findIndex(code => code === hashedProvidedCode);
    return {
        valid: index !== -1,
        index
    };
};

export default {
    generateSecret,
    generateQRCode,
    verifyToken,
    generateBackupCodes,
    hashBackupCodes,
    verifyBackupCode
}; 
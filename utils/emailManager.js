import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Obtener ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variable para email-templates
let EmailTemplates;
let email;

// Intentar importar email-templates
try {
    // Importación dinámica para evitar bloquear el inicio del servidor
    const importEmailTemplates = async () => {
        try {
            const module = await import('email-templates');
            return module.default;
        } catch (e) {
            console.warn('⚠️ No se pudo importar email-templates:', e.message);
            return null;
        }
    };

    // Configuración pospuesta hasta que tengamos el módulo
    importEmailTemplates().then(EmailTemplatesModule => {
        if (EmailTemplatesModule) {
            EmailTemplates = EmailTemplatesModule;
            setupEmailTemplates();
            console.log('✅ Email-templates cargado correctamente');
        } else {
            console.warn('⚠️ Las funcionalidades de email usarán un fallback simple');
        }
    });
} catch (err) {
    console.warn('⚠️ Error al cargar email-templates, usando fallback para emails:', err.message);
}

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.donweb.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verificar la configuración del transporter
transporter.verify((error) => {
    if (error) {
        console.error('Error al configurar el servidor SMTP:', error);
    } else {
        console.log('✅ Servidor SMTP listo para enviar correos de verificación');
    }
});

// Configurar email-templates cuando esté disponible
function setupEmailTemplates() {
    if (!EmailTemplates) return;

    try {
        email = new EmailTemplates({
            message: {
                from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar'
            },
            transport: transporter,
            views: {
                root: path.join(__dirname, '..', 'templates', 'emails'),
                options: {
                    extension: 'ejs'
                }
            },
            juice: true,
            juiceResources: {
                preserveImportant: true,
                webResources: {
                    relativeTo: path.join(__dirname, '..', 'templates', 'emails')
                }
            },
            preview: process.env.NODE_ENV === 'development',
            send: true,
        });
    } catch (error) {
        console.error('❌ Error al configurar email-templates:', error);
    }
}

// Fallback simple para enviar correos sin plantillas
async function sendSimpleEmail(to, subject, text) {
    try {
        const result = await transporter.sendMail({
            from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
            to,
            subject,
            text
        });
        return true;
    } catch (error) {
        console.error('❌ Error al enviar correo simple:', error);
        return false;
    }
}

/**
 * Envía un correo electrónico de verificación
 * @param {string} email_to - Dirección de correo electrónico del destinatario
 * @param {string} token - Token de verificación
 * @param {boolean} isNewUser - Indica si es un nuevo usuario o un inicio de sesión
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendEmailVerification = async (email_to, token, isNewUser = true) => {
    const baseUrl = process.env.CORS_FRONT || 'http://localhost:3001';
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    try {
        console.log(`📧 Enviando correo de verificación a: ${email_to}`);
        console.log(`🔗 Link de verificación: ${verificationLink}`);

        const subject = isNewUser
            ? 'Verifica tu cuenta en CircuitPrompt'
            : 'Verifica tu inicio de sesión en CircuitPrompt';

        // Si no tenemos email-templates, usar el fallback
        if (!email) {
            console.log('⚠️ Usando fallback de email simple (sin plantilla)');
            const text = `${isNewUser ? '¡Hola y bienvenido a CircuitPrompt!' : '¡Hola!'}\n\n` +
                `${isNewUser ? 'Gracias por registrarte en nuestra plataforma.' : 'Has solicitado iniciar sesión en CircuitPrompt.'}\n\n` +
                `Para continuar, visita el siguiente enlace: ${verificationLink}\n\n` +
                `Este enlace expirará ${isNewUser ? 'en 24 horas' : 'en 30 minutos'} por razones de seguridad.`;

            return await sendSimpleEmail(email_to, subject, text);
        }

        const templateData = {
            subject,
            title: isNewUser ? 'Verificación de Cuenta' : 'Verificación de Inicio de Sesión',
            greeting: isNewUser ? '¡Hola y bienvenido a CircuitPrompt!' : '¡Hola!',
            message: isNewUser
                ? 'Gracias por registrarte en nuestra plataforma. Para completar tu registro y activar tu cuenta, haz clic en el siguiente botón:'
                : 'Has solicitado iniciar sesión en CircuitPrompt. Para continuar, haz clic en el siguiente botón:',
            buttonText: isNewUser ? 'Verificar mi Cuenta' : 'Verificar Inicio de Sesión',
            buttonUrl: verificationLink,
            note: isNewUser
                ? 'Este enlace expirará en 24 horas por razones de seguridad. Si no solicitaste esta cuenta, puedes ignorar este correo.'
                : 'Este enlace expirará en 30 minutos por razones de seguridad. Si no intentaste iniciar sesión, alguien podría estar intentando acceder a tu cuenta. Te recomendamos cambiar tu contraseña.'
        };

        // Enviar correo mediante una plantilla
        const result = await email.send({
            template: 'verification',
            message: {
                to: email_to,
            },
            locals: templateData
        });

        console.log('✅ Correo de verificación enviado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al enviar correo de verificación:', error);
        return false;
    }
};

/**
 * Envía un correo electrónico de verificación para acceso administrativo
 * @param {string} email_to - Dirección de correo electrónico del administrador
 * @param {string} token - Token de verificación
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendTwoFactorEmail = async (email_to, token) => {
    const baseUrl = process.env.CORS_FRONT || 'http://localhost:3001';
    const verificationLink = `${baseUrl}/admin/verify/${token}`;

    try {
        console.log(`🔐 Enviando correo de verificación a: ${email_to}`);
        console.log(`🔗 Link de verificación: ${verificationLink}`);

        // Si no tenemos email-templates, usar el fallback
        if (!email) {
            console.log('⚠️ Usando fallback de email simple (sin plantilla)');
            const text = `Hola Administrador,\n\n` +
                `Has solicitado acceso al panel de administración de CircuitPrompt.\n\n` +
                `Para continuar, visita el siguiente enlace: ${verificationLink}\n\n` +
                `Este enlace expirará en 10 minutos por razones de seguridad.`;

            return await sendSimpleEmail(
                email_to,
                'Verificación Administrador CircuitPrompt',
                text
            );
        }

        // Enviar correo mediante una plantilla
        const result = await email.send({
            template: 'verification',
            message: {
                to: email_to,
            },
            locals: {
                subject: 'Verificación Administrador CircuitPrompt',
                title: 'Verificación de Acceso Administrativo',
                greeting: 'Hola Administrador,',
                message: 'Has solicitado acceso al panel de administración de CircuitPrompt. Para continuar, haz clic en el siguiente botón:',
                buttonText: 'Verificar Acceso',
                buttonUrl: verificationLink,
                note: 'Este enlace expirará en 10 minutos por razones de seguridad. Si no solicitaste este acceso, por favor ignora este correo o contacta al equipo de soporte inmediatamente.'
            }
        });

        console.log('✅ Correo de verificación enviado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al enviar correo de verificación:', error);

        // Información adicional para depuración
        console.error('Datos del envío:');
        console.error('- Email destino:', email_to);
        console.error('- Configuración SMTP disponible:', !!transporter);
        console.error('- ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
        console.error('- EMAIL_PASS configurado:', !!process.env.EMAIL_PASS);

        return false;
    }
};

/**
 * Función genérica para enviar correos electrónicos
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Dirección de destino
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.html - Contenido HTML
 * @param {string} options.text - Contenido de texto plano
 * @returns {Promise} - Promesa con el resultado del envío
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        console.log(`📧 Enviando correo genérico a: ${to}`);
        console.log(`📋 Asunto: ${subject}`);

        const result = await transporter.sendMail({
            from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
            to,
            subject,
            html: html || undefined,
            text: text || undefined
        });

        console.log('✅ Correo enviado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al enviar correo:', error);
        return false;
    }
};

export default {
    sendEmailVerification,
    sendTwoFactorEmail,
    sendEmail
}; 
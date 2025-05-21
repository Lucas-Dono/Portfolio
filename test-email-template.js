import dotenv from 'dotenv';
import { sendEmailVerification, sendTwoFactorEmail } from './utils/emailManager.js';

// Cargar variables de entorno
dotenv.config();

// Correo de prueba
const testEmail = 'lucasdono391@gmail.com'; // Cambia esto por tu email

// Generar un token de verificación simulado
const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Función principal para enviar los correos de prueba
const sendTestEmails = async () => {
    console.log('📧 Iniciando pruebas de envío de correo...');

    // Probamos el email de verificación de registro (nuevo usuario)
    console.log('\n1️⃣ Probando correo de verificación de registro:');
    const registerSuccess = await sendEmailVerification(testEmail, generateToken(), true);

    if (registerSuccess) {
        console.log('✅ Correo de verificación de registro enviado correctamente');
    } else {
        console.error('❌ Error al enviar correo de verificación de registro');
    }

    // Esperar 3 segundos entre envíos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Probamos el email de verificación de login
    console.log('\n2️⃣ Probando correo de verificación de inicio de sesión:');
    const loginSuccess = await sendEmailVerification(testEmail, generateToken(), false);

    if (loginSuccess) {
        console.log('✅ Correo de verificación de inicio de sesión enviado correctamente');
    } else {
        console.error('❌ Error al enviar correo de verificación de inicio de sesión');
    }

    // Esperar 3 segundos entre envíos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Probamos el email de verificación de dos factores
    console.log('\n3️⃣ Probando correo de verificación de acceso administrativo:');
    const adminSuccess = await sendTwoFactorEmail(testEmail, generateToken());

    if (adminSuccess) {
        console.log('✅ Correo de verificación de acceso administrativo enviado correctamente');
    } else {
        console.error('❌ Error al enviar correo de verificación de acceso administrativo');
    }

    console.log('\n📝 Resultados de las pruebas:');
    console.log(`- Verificación de registro: ${registerSuccess ? '✅' : '❌'}`);
    console.log(`- Verificación de inicio de sesión: ${loginSuccess ? '✅' : '❌'}`);
    console.log(`- Verificación de acceso administrativo: ${adminSuccess ? '✅' : '❌'}`);
};

// Ejecutar las pruebas
sendTestEmails().catch(error => {
    console.error('Error general:', error);
}); 
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: 'c2830653.ferozo.com',
  port: 465,
  secure: true, // Para SSL
  auth: {
    user: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
    pass: process.env.EMAIL_PASS
  }
});

// Dirección de correo para prueba
const testEmail = 'lucasdono391@gmail.com'; // Cambia esto a tu dirección de correo para la prueba

// Verificar la configuración
console.log('Verificando configuración SMTP...');
transporter.verify((error) => {
  if (error) {
    console.error('❌ Error al configurar el servidor SMTP:', error);
  } else {
    console.log('✅ Servidor SMTP configurado correctamente. Enviando email de prueba...');

    // Enviar correo de prueba
    transporter.sendMail({
      from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
      to: testEmail,
      subject: 'Email de prueba desde CircuitPrompt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">¡La configuración de correo funciona!</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Este es un correo de prueba enviado desde la configuración de CircuitPrompt utilizando el correo profesional de DonWeb.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="background-color: #00FFFF; color: #000; display: inline-block; padding: 12px 24px; border-radius: 5px; font-weight: bold;">
              ¡Configuración exitosa!
            </p>
          </div>
          <p style="font-size: 14px; color: #777; text-align: center; margin-top: 30px;">
            Ahora podrás enviar correos de verificación de manera profesional.
          </p>
        </div>
      `
    }, (error, info) => {
      if (error) {
        console.error('❌ Error al enviar el correo de prueba:', error);
      } else {
        console.log('✅ Correo enviado exitosamente:', info.messageId);
        console.log('📧 Enviado a:', testEmail);
      }
    });
  }
}); 
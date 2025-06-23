import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

console.log('🔧 Diagnóstico y Corrección de Configuración de Email');
console.log('=' .repeat(60));

// 1. Revisar variables de entorno actuales
console.log('\n📋 Variables de entorno actuales:');
console.log('- SMTP_HOST:', process.env.SMTP_HOST || 'NO DEFINIDO');
console.log('- SMTP_PORT:', process.env.SMTP_PORT || 'NO DEFINIDO');
console.log('- ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NO DEFINIDO');
console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURADO***' : 'NO DEFINIDO');

// 2. Configuraciones SMTP correctas conocidas
const smtpConfigs = {
  ferozo: {
    host: 'c2830653.ferozo.com',
    port: 465,
    secure: true,
    name: 'Ferozo (Recomendado)'
  },
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    name: 'Gmail (Alternativa)'
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    name: 'Outlook (Alternativa)'
  }
};

console.log('\n🌐 Configuraciones SMTP disponibles:');
Object.entries(smtpConfigs).forEach(([key, config]) => {
  console.log(`- ${config.name}: ${config.host}:${config.port} (secure: ${config.secure})`);
});

// 3. Función para probar configuración SMTP
async function testSmtpConfig(config, email, password) {
  console.log(`\n🧪 Probando ${config.name}...`);
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: email,
      pass: password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log(`✅ ${config.name} - Conexión exitosa`);
    return true;
  } catch (error) {
    console.log(`❌ ${config.name} - Error:`, error.message);
    return false;
  }
}

// 4. Función para enviar email de prueba
async function sendTestEmail(config, fromEmail, password, toEmail) {
  console.log(`\n📧 Enviando email de prueba con ${config.name}...`);
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: fromEmail,
      pass: password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const result = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: '🔧 Test de Configuración SMTP - CircuitPrompt',
      html: `
        <h2>🎉 ¡Configuración SMTP Exitosa!</h2>
        <p>Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
        <p><strong>Servidor:</strong> ${config.host}:${config.port}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>CircuitPrompt - Sistema de Email</em></p>
      `,
      text: `¡Configuración SMTP Exitosa! Servidor: ${config.host}:${config.port} - ${new Date().toLocaleString()}`
    });
    
    console.log(`✅ Email enviado exitosamente - Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.log(`❌ Error enviando email:`, error.message);
    return false;
  }
}

// 5. Función principal de diagnóstico
async function diagnoseAndFix() {
  const adminEmail = process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar';
  const emailPass = process.env.EMAIL_PASS || '@04LucasDono17/';
  const testRecipient = 'lucasdono391@gmail.com';

  console.log('\n🔍 Iniciando diagnóstico...');
  
  // Probar cada configuración
  const results = {};
  for (const [key, config] of Object.entries(smtpConfigs)) {
    results[key] = await testSmtpConfig(config, adminEmail, emailPass);
  }

  // Encontrar configuración que funciona
  const workingConfigs = Object.entries(results).filter(([key, works]) => works);
  
  if (workingConfigs.length === 0) {
    console.log('\n❌ Ninguna configuración SMTP funciona');
    console.log('💡 Posibles soluciones:');
    console.log('1. Verificar credenciales de email');
    console.log('2. Verificar que el servidor permite SMTP');
    console.log('3. Considerar usar Gmail con App Password');
    return;
  }

  console.log('\n✅ Configuraciones que funcionan:');
  workingConfigs.forEach(([key, _]) => {
    console.log(`- ${smtpConfigs[key].name}`);
  });

  // Usar la primera configuración que funciona para enviar test
  const [workingKey] = workingConfigs[0];
  const workingConfig = smtpConfigs[workingKey];
  
  console.log(`\n🎯 Usando ${workingConfig.name} para enviar email de prueba...`);
  const emailSent = await sendTestEmail(workingConfig, adminEmail, emailPass, testRecipient);

  if (emailSent) {
    console.log('\n🎉 ¡Email de prueba enviado exitosamente!');
    
    // Actualizar emailManager.js con la configuración correcta
    await updateEmailManagerConfig(workingConfig);
  }
}

// 6. Función para actualizar emailManager.js
async function updateEmailManagerConfig(config) {
  console.log('\n🔧 Actualizando emailManager.js...');
  
  try {
    const emailManagerPath = path.join(process.cwd(), 'utils', 'emailManager.js');
    let content = fs.readFileSync(emailManagerPath, 'utf8');
    
    // Reemplazar la configuración del transporter
    const newTransporterConfig = `// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransporter({
    host: '${config.host}',
    port: ${config.port},
    secure: ${config.secure}, // true para 465, false para otros puertos
    auth: {
        user: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
        pass: process.env.EMAIL_PASS || '@04LucasDono17/'
    },
    tls: {
        rejectUnauthorized: false
    }
});`;

    // Buscar y reemplazar la configuración existente
    content = content.replace(
      /\/\/ Configuración del transporter de nodemailer[\s\S]*?}\);/,
      newTransporterConfig
    );
    
    fs.writeFileSync(emailManagerPath, content);
    console.log('✅ emailManager.js actualizado correctamente');
    
    // Crear archivo de configuración para producción
    const envProductionPath = path.join(process.cwd(), '.env.production.example');
    const envConfig = `# Configuración SMTP Corregida - ${new Date().toISOString()}
SMTP_HOST=${config.host}
SMTP_PORT=${config.port}
SMTP_SECURE=${config.secure}
ADMIN_EMAIL=no_reply@circuitprompt.com.ar
EMAIL_PASS=@04LucasDono17/

# Otras variables importantes
CORS_FRONT=https://circuitprompt.com.ar
VITE_API_URL=https://circuitprompt.com.ar/api
NODE_ENV=production
`;
    
    fs.writeFileSync(envProductionPath, envConfig);
    console.log('✅ .env.production.example creado con configuración correcta');
    
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
  }
}

// 7. Ejecutar diagnóstico
diagnoseAndFix().catch(console.error); 
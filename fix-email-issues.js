#!/usr/bin/env node

/**
 * Script de diagnóstico y corrección del sistema de emails
 * Identifica y soluciona problemas comunes de configuración SMTP
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 DIAGNÓSTICO DEL SISTEMA DE EMAILS\n');
console.log('=====================================\n');

// 1. VERIFICAR VARIABLES DE ENTORNO
console.log('1. 📋 VERIFICANDO VARIABLES DE ENTORNO:');
console.log('----------------------------------------');

const emailConfig = {
    SMTP_HOST: process.env.SMTP_HOST || 'c2830653.ferozo.com',
    SMTP_PORT: process.env.SMTP_PORT || 465,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
    EMAIL_PASS: process.env.EMAIL_PASS || '@04LucasDono17/',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

Object.entries(emailConfig).forEach(([key, value]) => {
    const isPassword = key.includes('PASS');
    const displayValue = isPassword ? (value ? '***CONFIGURADO***' : '❌ NO CONFIGURADO') : value;
    console.log(`   ${key}: ${displayValue}`);
});

console.log('\n2. 🔌 PROBANDO CONEXIÓN SMTP:');
console.log('-----------------------------');

// 2. CREAR Y PROBAR TRANSPORTER
const transporter = nodemailer.createTransport({
    host: emailConfig.SMTP_HOST,
    port: parseInt(emailConfig.SMTP_PORT),
    secure: emailConfig.SMTP_PORT == 465, // true para 465, false para otros
    auth: {
        user: emailConfig.ADMIN_EMAIL,
        pass: emailConfig.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// 3. VERIFICAR CONEXIÓN
try {
    console.log('   Conectando al servidor SMTP...');
    await transporter.verify();
    console.log('   ✅ Conexión SMTP exitosa');
} catch (error) {
    console.log('   ❌ Error de conexión SMTP:');
    console.log(`   Código: ${error.code}`);
    console.log(`   Mensaje: ${error.message}`);
    
    // Diagnóstico específico por tipo de error
    if (error.code === 'EAUTH') {
        console.log('   🔍 DIAGNÓSTICO: Credenciales incorrectas');
        console.log('   💡 SOLUCIÓN: Verificar ADMIN_EMAIL y EMAIL_PASS');
    } else if (error.code === 'ECONNREFUSED') {
        console.log('   🔍 DIAGNÓSTICO: Servidor SMTP no disponible');
        console.log('   💡 SOLUCIÓN: Verificar SMTP_HOST y SMTP_PORT');
    } else if (error.code === 'ETIMEDOUT') {
        console.log('   🔍 DIAGNÓSTICO: Timeout de conexión');
        console.log('   💡 SOLUCIÓN: Verificar firewall o configuración de red');
    }
}

console.log('\n3. 🧪 ENVIANDO EMAIL DE PRUEBA:');
console.log('-------------------------------');

// 4. ENVIAR EMAIL DE PRUEBA
const testEmail = {
    from: emailConfig.ADMIN_EMAIL,
    to: emailConfig.ADMIN_EMAIL, // Enviar a uno mismo para prueba
    subject: '🧪 Test de Sistema de Emails - CircuitPrompt',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">✅ Sistema de Emails Funcionando</h2>
            <p>Este es un email de prueba del sistema de CircuitPrompt.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Configuración Actual:</h3>
                <ul>
                    <li><strong>SMTP Host:</strong> ${emailConfig.SMTP_HOST}</li>
                    <li><strong>SMTP Port:</strong> ${emailConfig.SMTP_PORT}</li>
                    <li><strong>From Email:</strong> ${emailConfig.ADMIN_EMAIL}</li>
                    <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                </ul>
            </div>
            <p style="color: #666; font-size: 14px;">
                Si recibes este email, el sistema de correos está funcionando correctamente.
            </p>
        </div>
    `,
    text: `
Sistema de Emails - Test Exitoso

Este es un email de prueba del sistema de CircuitPrompt.

Configuración:
- SMTP Host: ${emailConfig.SMTP_HOST}
- SMTP Port: ${emailConfig.SMTP_PORT}
- From Email: ${emailConfig.ADMIN_EMAIL}
- Timestamp: ${new Date().toISOString()}

Si recibes este email, el sistema está funcionando correctamente.
    `
};

try {
    console.log(`   Enviando email de prueba a: ${emailConfig.ADMIN_EMAIL}`);
    const result = await transporter.sendMail(testEmail);
    console.log('   ✅ Email de prueba enviado exitosamente');
    console.log(`   📨 Message ID: ${result.messageId}`);
} catch (error) {
    console.log('   ❌ Error enviando email de prueba:');
    console.log(`   ${error.message}`);
}

console.log('\n4. 🔍 VERIFICANDO PLANTILLAS DE EMAIL:');
console.log('--------------------------------------');

// 5. VERIFICAR PLANTILLAS
const templatesPath = path.join(__dirname, 'templates', 'emails');
try {
    const templateDirs = await fs.readdir(templatesPath);
    console.log(`   ✅ Directorio de plantillas encontrado: ${templatesPath}`);
    console.log(`   📁 Plantillas disponibles: ${templateDirs.join(', ')}`);
    
    // Verificar plantilla de verificación
    const verificationPath = path.join(templatesPath, 'verification');
    try {
        const verificationFiles = await fs.readdir(verificationPath);
        console.log(`   ✅ Plantilla de verificación: ${verificationFiles.join(', ')}`);
    } catch (error) {
        console.log('   ⚠️ Plantilla de verificación no encontrada o incompleta');
    }
} catch (error) {
    console.log('   ⚠️ Directorio de plantillas no encontrado');
    console.log('   💡 Creando estructura básica de plantillas...');
    
    // Crear estructura de plantillas si no existe
    await createEmailTemplates();
}

console.log('\n5. 📊 RESUMEN Y RECOMENDACIONES:');
console.log('===============================');

// 6. GENERAR RECOMENDACIONES
console.log('   🔧 PROBLEMAS IDENTIFICADOS:');

// Verificar problemas comunes
const issues = [];

if (!process.env.EMAIL_PASS) {
    issues.push('EMAIL_PASS no está configurado en variables de entorno');
}

if (!process.env.ADMIN_EMAIL) {
    issues.push('ADMIN_EMAIL no está configurado en variables de entorno');
}

if (emailConfig.SMTP_HOST === 'c2830653.ferozo.com' && emailConfig.SMTP_PORT != 465) {
    issues.push('Puerto SMTP incorrecto para Ferozo (debe ser 465)');
}

if (issues.length === 0) {
    console.log('   ✅ No se detectaron problemas de configuración');
} else {
    issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ❌ ${issue}`);
    });
}

console.log('\n   💡 RECOMENDACIONES:');
console.log('   - Verificar que EMAIL_PASS sea la contraseña correcta del email');
console.log('   - Asegurar que el servidor SMTP permita conexiones desde tu IP');
console.log('   - Considerar usar Gmail SMTP si hay problemas con Ferozo');
console.log('   - Verificar que no haya firewall bloqueando el puerto 465');

console.log('\n🎯 DIAGNÓSTICO COMPLETADO\n');

// Función auxiliar para crear plantillas básicas
async function createEmailTemplates() {
    const templatesDir = path.join(__dirname, 'templates', 'emails', 'verification');
    
    try {
        await fs.mkdir(templatesDir, { recursive: true });
        
        // Crear plantillas básicas
        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">{{title}}</h2>
        <p>{{greeting}}</p>
        <p>{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{buttonUrl}}" style="background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                {{buttonText}}
            </a>
        </div>
        <p style="color: #666; font-size: 14px;">{{note}}</p>
    </div>
</body>
</html>
        `;
        
        const textTemplate = `
{{title}}

{{greeting}}

{{message}}

{{buttonText}}: {{buttonUrl}}

{{note}}
        `;
        
        const subjectTemplate = '{{subject}}';
        
        await fs.writeFile(path.join(templatesDir, 'html', 'index.ejs'), htmlTemplate);
        await fs.writeFile(path.join(templatesDir, 'text', 'index.ejs'), textTemplate);
        await fs.writeFile(path.join(templatesDir, 'subject', 'index.ejs'), subjectTemplate);
        
        console.log('   ✅ Plantillas básicas creadas');
    } catch (error) {
        console.log('   ❌ Error creando plantillas:', error.message);
    }
} 
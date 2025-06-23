#!/usr/bin/env node

/**
 * Test completo del sistema de emails de CircuitPrompt
 * Prueba todas las funciones de email utilizadas en la aplicación
 */

import dotenv from 'dotenv';
import { sendEmailVerification, sendTwoFactorEmail, sendEmail } from './utils/emailManager.js';

// Configurar variables de entorno
dotenv.config();

console.log('🧪 TEST COMPLETO DEL SISTEMA DE EMAILS\n');
console.log('=====================================\n');

const testEmail = process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar';

async function runTests() {
    console.log('1. 📧 PROBANDO sendEmailVerification (nuevo usuario):');
    console.log('---------------------------------------------------');
    
    try {
        const result1 = await sendEmailVerification(testEmail, 'test-token-123', true);
        console.log(`   ✅ Resultado: ${result1 ? 'EXITOSO' : 'FALLÓ'}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n2. 📧 PROBANDO sendEmailVerification (login existente):');
    console.log('-----------------------------------------------------');
    
    try {
        const result2 = await sendEmailVerification(testEmail, 'test-token-456', false);
        console.log(`   ✅ Resultado: ${result2 ? 'EXITOSO' : 'FALLÓ'}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n3. 🔐 PROBANDO sendTwoFactorEmail (admin):');
    console.log('------------------------------------------');
    
    try {
        const result3 = await sendTwoFactorEmail(testEmail, 'admin-token-789');
        console.log(`   ✅ Resultado: ${result3 ? 'EXITOSO' : 'FALLÓ'}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n4. 📨 PROBANDO sendEmail (genérico):');
    console.log('-----------------------------------');
    
    try {
        const result4 = await sendEmail({
            to: testEmail,
            subject: '🧪 Test Email Genérico - CircuitPrompt',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Test de Email Genérico</h2>
                    <p>Este es un test de la función sendEmail genérica.</p>
                    <div style="background: linear-gradient(135deg, #FF00FF 0%, #00FFFF 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <strong>Sistema de Emails Funcionando ✅</strong>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        Timestamp: ${new Date().toISOString()}
                    </p>
                </div>
            `,
            text: `
Test de Email Genérico

Este es un test de la función sendEmail genérica.

Sistema de Emails Funcionando ✅

Timestamp: ${new Date().toISOString()}
            `
        });
        console.log(`   ✅ Resultado: ${result4 ? 'EXITOSO' : 'FALLÓ'}`);
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n5. 🔍 PROBANDO ENDPOINTS DE EMAIL:');
    console.log('----------------------------------');
    
    // Test del endpoint de fallback de email
    try {
        console.log('   Probando endpoint /admin/test-email...');
        const response = await fetch('http://localhost:5001/admin/test-email', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${Buffer.from('admin:password_seguro').toString('base64')}`
            }
        });
        
        if (response.ok) {
            const text = await response.text();
            console.log('   ✅ Endpoint test-email funcionando');
            console.log(`   📝 Respuesta: ${text.substring(0, 100)}...`);
        } else {
            console.log(`   ⚠️ Endpoint respondió con status: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Error probando endpoint: ${error.message}`);
    }

    console.log('\n6. 📊 ANÁLISIS DE PLANTILLAS:');
    console.log('-----------------------------');
    
    // Verificar si las plantillas se están cargando correctamente
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        const templatesPath = path.join(__dirname, 'templates', 'emails', 'verification');
        
        const htmlExists = await fs.access(path.join(templatesPath, 'html', 'index.ejs')).then(() => true).catch(() => false);
        const textExists = await fs.access(path.join(templatesPath, 'text', 'index.ejs')).then(() => true).catch(() => false);
        const subjectExists = await fs.access(path.join(templatesPath, 'subject', 'index.ejs')).then(() => true).catch(() => false);
        
        console.log(`   HTML Template: ${htmlExists ? '✅' : '❌'}`);
        console.log(`   Text Template: ${textExists ? '✅' : '❌'}`);
        console.log(`   Subject Template: ${subjectExists ? '✅' : '❌'}`);
        
        if (htmlExists) {
            const htmlContent = await fs.readFile(path.join(templatesPath, 'html', 'index.ejs'), 'utf8');
            console.log(`   📝 HTML Template (${htmlContent.length} caracteres)`);
        }
        
    } catch (error) {
        console.log(`   ❌ Error verificando plantillas: ${error.message}`);
    }

    console.log('\n7. 🔧 DIAGNÓSTICO DE PROBLEMAS COMUNES:');
    console.log('--------------------------------------');
    
    // Verificar configuración de variables de entorno
    const issues = [];
    
    if (!process.env.EMAIL_PASS) {
        issues.push('EMAIL_PASS no configurado');
    }
    
    if (!process.env.ADMIN_EMAIL) {
        issues.push('ADMIN_EMAIL no configurado');
    }
    
    if (!process.env.SMTP_HOST) {
        issues.push('SMTP_HOST no configurado');
    }
    
    if (!process.env.CORS_FRONT) {
        issues.push('CORS_FRONT no configurado (afecta links de verificación)');
    }
    
    if (issues.length === 0) {
        console.log('   ✅ Todas las variables de entorno están configuradas');
    } else {
        console.log('   ⚠️ Problemas encontrados:');
        issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
    }
    
    console.log('\n🎯 TEST COMPLETADO');
    console.log('==================');
    console.log('Si todos los tests son exitosos, el sistema de emails está funcionando correctamente.');
    console.log('Si hay fallos, revisa los logs específicos de cada test para identificar el problema.');
}

// Ejecutar tests
runTests().catch(error => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
}); 
#!/bin/bash

echo "🔧 DIAGNÓSTICO DE EMAILS EN PRODUCCIÓN"
echo "======================================"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "docker-compose-prod.yml" ]; then
    echo "❌ Error: No se encuentra docker-compose-prod.yml"
    echo "   Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

echo "1. 📋 VERIFICANDO CONTENEDOR:"
echo "-----------------------------"
CONTAINER_STATUS=$(docker ps --filter "name=circuitpromptcomar-app-1" --format "table {{.Names}}\t{{.Status}}")
if [ -z "$CONTAINER_STATUS" ]; then
    echo "❌ Contenedor circuitpromptcomar-app-1 no está ejecutándose"
    echo "   Iniciando contenedor..."
    docker-compose -f docker-compose-prod.yml up -d
    sleep 5
else
    echo "✅ Contenedor activo:"
    echo "$CONTAINER_STATUS"
fi

echo ""
echo "2. 🔍 VERIFICANDO VARIABLES DE ENTORNO EN CONTENEDOR:"
echo "----------------------------------------------------"
echo "SMTP_HOST:"
docker exec circuitpromptcomar-app-1 printenv SMTP_HOST || echo "   ⚠️ SMTP_HOST no configurado"

echo "SMTP_PORT:"
docker exec circuitpromptcomar-app-1 printenv SMTP_PORT || echo "   ⚠️ SMTP_PORT no configurado"

echo "ADMIN_EMAIL:"
docker exec circuitpromptcomar-app-1 printenv ADMIN_EMAIL || echo "   ⚠️ ADMIN_EMAIL no configurado"

echo "EMAIL_PASS:"
EMAIL_PASS_SET=$(docker exec circuitpromptcomar-app-1 bash -c 'if [ -n "$EMAIL_PASS" ]; then echo "***CONFIGURADO***"; else echo "❌ NO CONFIGURADO"; fi')
echo "$EMAIL_PASS_SET"

echo ""
echo "3. 📧 PROBANDO CONECTIVIDAD SMTP DESDE CONTENEDOR:"
echo "--------------------------------------------------"
docker exec circuitpromptcomar-app-1 bash -c "
echo 'Probando conexión a c2830653.ferozo.com:465...'
timeout 10 nc -zv c2830653.ferozo.com 465 2>&1 || echo '❌ No se puede conectar al servidor SMTP'
"

echo ""
echo "4. 🧪 EJECUTANDO TEST DE EMAILS EN CONTENEDOR:"
echo "----------------------------------------------"
# Copiar script de test al contenedor si existe
if [ -f "test-email-system.js" ]; then
    echo "Copiando script de test al contenedor..."
    docker cp test-email-system.js circuitpromptcomar-app-1:/app/
    
    echo "Ejecutando test de emails..."
    docker exec circuitpromptcomar-app-1 node test-email-system.js
else
    echo "⚠️ Script test-email-system.js no encontrado localmente"
    echo "   Creando test básico en contenedor..."
    
    docker exec circuitpromptcomar-app-1 bash -c "cat > /app/basic-email-test.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'c2830653.ferozo.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
        pass: process.env.EMAIL_PASS || '@04LucasDono17/'
    },
    tls: {
        rejectUnauthorized: false
    }
});

console.log('🧪 Test básico de email en producción...');
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Error SMTP:', error.message);
    } else {
        console.log('✅ Conexión SMTP exitosa');
        
        // Enviar email de test
        transporter.sendMail({
            from: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
            to: process.env.ADMIN_EMAIL || 'no_reply@circuitprompt.com.ar',
            subject: '🧪 Test Producción - CircuitPrompt',
            text: 'Test de email desde servidor de producción. Timestamp: ' + new Date().toISOString()
        }, (err, info) => {
            if (err) {
                console.log('❌ Error enviando email:', err.message);
            } else {
                console.log('✅ Email enviado exitosamente');
                console.log('📨 Message ID:', info.messageId);
            }
        });
    }
});
EOF"
    
    echo "Ejecutando test básico..."
    docker exec circuitpromptcomar-app-1 node /app/basic-email-test.js
fi

echo ""
echo "5. 📜 REVISANDO LOGS RECIENTES DE EMAIL:"
echo "----------------------------------------"
echo "Logs de los últimos 50 mensajes relacionados con email:"
docker logs circuitpromptcomar-app-1 --tail 50 | grep -i "email\|smtp\|mail\|nodemailer" || echo "   ℹ️ No se encontraron logs relacionados con email"

echo ""
echo "6. 🔧 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN:"
echo "--------------------------------------------"
echo "Verificando utils/emailManager.js en contenedor:"
docker exec circuitpromptcomar-app-1 bash -c "
if [ -f '/app/utils/emailManager.js' ]; then
    echo '✅ emailManager.js encontrado'
    echo 'Configuración SMTP:'
    grep -A 10 'createTransport' /app/utils/emailManager.js | head -15
else
    echo '❌ emailManager.js no encontrado en /app/utils/'
fi
"

echo ""
echo "7. 📊 RESUMEN DEL DIAGNÓSTICO:"
echo "=============================="
echo "Si ves errores arriba, los problemas más comunes son:"
echo "1. Variables de entorno no configuradas en producción"
echo "2. Firewall bloqueando puerto 465"
echo "3. Servidor SMTP no accesible desde la IP del servidor"
echo "4. Credenciales SMTP incorrectas"
echo ""
echo "Para solucionar:"
echo "- Verificar .env.production en el servidor"
echo "- Contactar al proveedor de hosting sobre firewall"
echo "- Verificar credenciales con el proveedor de email"
echo ""
echo "🎯 DIAGNÓSTICO COMPLETADO" 
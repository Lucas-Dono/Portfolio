#!/bin/bash

echo "=== SOLUCIONANDO PROBLEMA SSL DE NGINX ==="
echo "==========================================="

# 1. Subir archivos actualizados al servidor
echo "1. Subiendo archivos al servidor..."
scp -P5289 nginx/conf/default-temp.conf root@179.43.121.187:/home/circuitprompt/htdocs/circuitprompt.com.ar/nginx/conf/

# 2. Conectar al servidor y aplicar solución
echo "2. Aplicando solución en el servidor..."
sshpass -p 'kA/Ef37uSudOwj' ssh -p5289 root@179.43.121.187 << 'EOF'
cd /home/circuitprompt/htdocs/circuitprompt.com.ar

echo "Deteniendo contenedor nginx..."
docker stop circuitpromptcomar-nginx-1

echo "Respaldando configuración SSL original..."
cp nginx/conf/default.conf nginx/conf/default-ssl.conf.backup

echo "Usando configuración temporal sin SSL..."
cp nginx/conf/default-temp.conf nginx/conf/default.conf

echo "Iniciando contenedor nginx con configuración temporal..."
docker start circuitpromptcomar-nginx-1

echo "Esperando que nginx se inicie..."
sleep 10

echo "Verificando estado de contenedores..."
docker ps | grep -E "(nginx|app|postgres)"

echo "Probando conectividad HTTP..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost

echo "Probando conectividad externa..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://circuitprompt.com.ar

echo "=== SOLUCIÓN TEMPORAL APLICADA ==="
echo "El sitio debería funcionar ahora en HTTP"
echo "Para habilitar HTTPS, ejecuta: ./setup-ssl.sh"
EOF

echo "=== PROCESO COMPLETADO ===" 
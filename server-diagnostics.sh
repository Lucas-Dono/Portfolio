#!/bin/bash

echo "=== DIAGNÓSTICO COMPLETO DEL SERVIDOR PORTFOLIO ==="
echo "Fecha: $(date)"
echo "=================================================="

# 1. Estado de contenedores Docker
echo -e "\n1. ESTADO DE CONTENEDORES DOCKER:"
echo "--------------------------------"
docker ps -a | grep -E "(portfolio|postgres|nginx)" || echo "No se encontraron contenedores relacionados"

# 2. Estado de imágenes Docker
echo -e "\n2. IMÁGENES DOCKER DISPONIBLES:"
echo "------------------------------"
docker images | grep -E "(portfolio|postgres|nginx)" || echo "No se encontraron imágenes relacionadas"

# 3. Verificar logs de contenedores
echo -e "\n3. LOGS RECIENTES DE CONTENEDORES:"
echo "--------------------------------"
for container in $(docker ps -a --format "{{.Names}}" | grep -E "(portfolio|postgres|nginx)"); do
    echo "=== Logs de $container ==="
    docker logs --tail=20 "$container" 2>&1 || echo "Error al obtener logs de $container"
done

# 4. Estado de puertos
echo -e "\n4. PUERTOS EN USO:"
echo "----------------"
netstat -tlnp | grep -E ":80|:443|:3000|:5432|:8080" || echo "Netstat no disponible, usando ss"
ss -tlnp | grep -E ":80|:443|:3000|:5432|:8080" || echo "No se pudieron verificar puertos"

# 5. Espacio en disco
echo -e "\n5. ESPACIO EN DISCO:"
echo "------------------"
df -h | grep -E "(/$|/var|/home)" || df -h

# 6. Memoria y CPU
echo -e "\n6. MEMORIA Y CPU:"
echo "---------------"
free -h
echo "CPU Load: $(uptime | cut -d',' -f3-)"

# 7. Verificar archivos importantes
echo -e "\n7. ARCHIVOS DE CONFIGURACIÓN:"
echo "----------------------------"
if [ -f "docker-compose-prod.yml" ]; then
    echo "✅ docker-compose-prod.yml existe"
else
    echo "❌ docker-compose-prod.yml NO EXISTE"
fi

if [ -f ".env.production" ]; then
    echo "✅ .env.production existe"
    echo "Variables configuradas:"
    grep -E "^[A-Z]" .env.production | cut -d'=' -f1 | sort
else
    echo "❌ .env.production NO EXISTE"
fi

# 8. Estado de la base de datos
echo -e "\n8. ESTADO DE BASE DE DATOS:"
echo "-------------------------"
if docker ps | grep -q postgres; then
    echo "✅ Contenedor PostgreSQL ejecutándose"
    # Intentar conexión a la BD
    docker exec -i $(docker ps --format "{{.Names}}" | grep postgres | head -1) psql -U postgres -d circuitprompt -c "\dt" 2>/dev/null && echo "✅ Base de datos accesible" || echo "❌ Error conectando a la base de datos"
else
    echo "❌ Contenedor PostgreSQL NO está ejecutándose"
fi

# 9. Verificar conectividad web
echo -e "\n9. VERIFICAR CONECTIVIDAD WEB:"
echo "-----------------------------"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTiempo respuesta: %{time_total}s\n" http://localhost:80 || echo "❌ No se puede conectar al servidor web"

# 10. Procesos del sistema
echo -e "\n10. PROCESOS RELACIONADOS:"
echo "------------------------"
ps aux | grep -E "(docker|node|nginx|postgres)" | grep -v grep || echo "No se encontraron procesos relacionados"

echo -e "\n=== FIN DEL DIAGNÓSTICO ==="
echo "Para ejecutar acciones correctivas, usa: ./fix-server-issues.sh" 
# 🚀 Instrucciones de Uso - Sistema Unificado CircuitPrompt

## 📋 Comandos Principales

### 🏭 **Modo Producción** (Completo con Docker)
```bash
./manage-server.sh prod
```
- Inicia todos los contenedores (app, nginx, postgres, certbot)
- Usa el puerto 5001 internamente
- URL externa: https://circuitprompt.com.ar

### 🔧 **Modo Desarrollo** (Híbrido)
```bash
./manage-server.sh dev
```
- Mantiene nginx y PostgreSQL en Docker
- Ejecuta la aplicación en el host (puerto 5002)
- URL externa: https://circuitprompt.com.ar (la misma!)

### 📊 **Ver Estado del Servidor**
```bash
./manage-server.sh status
```
- Muestra qué servicios están activos
- Indica si está en modo PRODUCCIÓN o DESARROLLO
- Verifica conectividad del sitio web

### 🛑 **Detener Todo**
```bash
./manage-server.sh stop
```
- Detiene servidor de desarrollo
- Detiene todos los contenedores Docker

### 🔄 **Reiniciar Solo Nginx**
```bash
./manage-server.sh restart-nginx
```
- Útil cuando cambias configuración de nginx
- Mantiene otros servicios corriendo

### 📋 **Ver Logs**
```bash
./manage-server.sh logs
```
- Menú interactivo para ver logs específicos
- Opciones: nginx, app, desarrollo, postgres, todos

### 🎛️ **Menú Interactivo**
```bash
./manage-server.sh
```
- Muestra menú con todas las opciones
- Perfecto para uso interactivo

## 🌐 **URL Unificada**

**¡IMPORTANTE!** Ambos modos usan la misma URL:
- **URL Principal**: https://circuitprompt.com.ar
- **Sin puertos**: No necesitas especificar :5001 o :5002
- **Detección automática**: Nginx detecta qué servidor usar

## 🔄 **Flujo de Trabajo Típico**

### Para Desarrollo:
1. `./manage-server.sh dev` - Iniciar modo desarrollo
2. Editar código en tu editor
3. Los cambios se reflejan automáticamente
4. Probar en https://circuitprompt.com.ar
5. `./manage-server.sh stop` - Detener cuando termines

### Para Producción:
1. `./manage-server.sh prod` - Iniciar modo producción
2. El sitio está disponible en https://circuitprompt.com.ar
3. `./manage-server.sh status` - Verificar estado
4. `./manage-server.sh logs` - Ver logs si hay problemas

## 🔧 **Comandos de Servidor Remoto**

### Aplicar cambios en servidor:
```bash
sshpass -p 'kA/Ef37uSudOwj' ssh -p5289 root@179.43.121.187 "cd /home/circuitprompt/htdocs/circuitprompt.com.ar && git pull && ./manage-server.sh prod"
```

### Cambiar a modo desarrollo en servidor:
```bash
sshpass -p 'kA/Ef37uSudOwj' ssh -p5289 root@179.43.121.187 "cd /home/circuitprompt/htdocs/circuitprompt.com.ar && ./manage-server.sh dev"
```

### Ver estado en servidor:
```bash
sshpass -p 'kA/Ef37uSudOwj' ssh -p5289 root@179.43.121.187 "cd /home/circuitprompt/htdocs/circuitprompt.com.ar && ./manage-server.sh status"
```

## ✅ **Ventajas del Nuevo Sistema**

- ✅ **URL única**: Una sola URL para desarrollo y producción
- ✅ **Sin errores de nginx**: Configuración robusta que no falla
- ✅ **Detección automática**: Nginx sabe qué servidor usar
- ✅ **Simplicidad**: Un comando para cada modo
- ✅ **Flexibilidad**: Fácil cambio entre modos
- ✅ **Monitoreo**: Estado claro de todos los servicios

## 🚨 **Solución de Problemas**

### Si nginx no responde:
```bash
./manage-server.sh restart-nginx
```

### Si hay problemas de conectividad:
```bash
./manage-server.sh status
```

### Si necesitas logs detallados:
```bash
./manage-server.sh logs
```

### Si todo falla:
```bash
./manage-server.sh stop
./manage-server.sh prod  # o dev
``` 
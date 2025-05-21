# Guía de despliegue en producción para CircuitPrompt

Esta guía detalla los pasos necesarios para desplegar la aplicación CircuitPrompt en un servidor de producción.

## Requisitos previos

- Node.js 20.x o superior
- PostgreSQL 14 o superior
- Servidor con al menos 2GB de RAM
- CloudPanel configurado (en el caso de DonWeb)

## Pasos para el despliegue

### 1. Preparación del servidor

Si estás usando CloudPanel, primero configura un sitio para Node.js:

1. Accede a CloudPanel: `https://cp.circuitprompt.com.ar:8443`
2. Ve a "Sitios Web" → "Agregar Sitio Web"
3. Selecciona "Node.js" como tipo de sitio
4. Ingresa `circuitprompt.com.ar` como dominio
5. Selecciona "Node.js 22 LTS" (o la versión LTS más reciente disponible)
6. Configura el puerto como **5001**
7. Guarda la configuración

### 2. Obtener el código

```bash
# Acceder al servidor vía SSH
ssh usuario@tu-servidor

# Ir al directorio del sitio (ajustar según configuración de CloudPanel)
cd /home/tu-usuario-del-sitio/htdocs/circuitprompt.com.ar

# Clonar el repositorio (sustituir por tu repo)
git clone https://github.com/tu-usuario/portfolio.git .
```

### 3. Configuración

1. Configura las variables de entorno:

```bash
# Copiar el archivo de ejemplo y editarlo
cp .env.prod .env.production
nano .env.production
```

2. Asegúrate de actualizar estos valores importantes:
   - `DB_USER`, `DB_PASSWORD`: Credenciales de base de datos
   - `JWT_SECRET`: Generar un valor aleatorio seguro
   - Claves de API para servicios externos

### 4. Despliegue automático

El script `deploy.sh` automatiza todo el proceso de despliegue:

```bash
# Dar permisos de ejecución
chmod +x deploy.sh

# Ejecutar el script
./deploy.sh
```

Este script:
- Instala dependencias
- Compila la aplicación
- Configura PM2 para mantener la aplicación en ejecución

### 5. Configuración de la base de datos

```bash
# Instalar PostgreSQL si no está instalado
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear base de datos y usuario
sudo -u postgres psql

# En el prompt de psql:
CREATE DATABASE portfolio;
CREATE USER miusuario WITH ENCRYPTED PASSWORD 'micontraseña';
GRANT ALL PRIVILEGES ON DATABASE portfolio TO miusuario;
\q

# Importar estructura inicial (si existe)
psql -U miusuario -d portfolio -f init-db.sql
```

### 6. Verificación

1. Verifica que la aplicación esté ejecutándose:
   ```bash
   pm2 status
   ```

2. Confirma que el sitio sea accesible:
   ```bash
   curl http://localhost:5001/health
   ```

3. Verifica los logs para detectar errores:
   ```bash
   pm2 logs circuitprompt
   ```

## Mantenimiento

### Reiniciar la aplicación

```bash
pm2 restart circuitprompt
```

### Ver logs

```bash
pm2 logs circuitprompt
```

### Actualizar la aplicación

```bash
# Obtener cambios del repositorio
git pull

# Ejecutar el script de despliegue
./deploy.sh
```

## Solución de problemas

### La aplicación no arranca

1. Verifica los logs: `pm2 logs circuitprompt`
2. Asegúrate de que la base de datos esté funcionando
3. Comprueba que las variables de entorno sean correctas

### Errores de conexión a la base de datos

1. Verifica que PostgreSQL esté en ejecución: `sudo systemctl status postgresql`
2. Comprueba las credenciales en el archivo `.env.production`

### Problemas con el dominio o certificados SSL

1. En CloudPanel, verifica la configuración del dominio
2. Asegúrate de que los registros DNS apunten a la IP correcta
3. Verifica y renueva el certificado SSL si es necesario

## Contacto

Para soporte, contactar a: tu-email@ejemplo.com 
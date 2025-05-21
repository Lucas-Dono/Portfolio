# Instrucciones para el Despliegue en DonWeb con CloudPanel

Este documento detalla los pasos necesarios para desplegar el proyecto Portfolio en el servidor de DonWeb utilizando CloudPanel.

## Requisitos Previos

1. Tener contratado un servidor cloud en DonWeb
2. Tener configurado CloudPanel (accesible en cp.circuitprompt.com.ar)
3. Credenciales de acceso a CloudPanel: admin/davebiGA48
4. Credenciales SSH: usuario root, contraseña kA/Ef37uSudOwj, puerto 5289

## Pasos para el Despliegue

### 1. Conectarse al Servidor por SSH

```bash
ssh root@circuitprompt.com.ar -p 5289
```

### 2. Clonar el Repositorio

```bash
cd /var/www
git clone [URL_DEL_REPOSITORIO] portfolio
cd portfolio
```

### 3. Configurar Variables de Entorno

El archivo `.env.prod` ya tiene configuradas las variables para producción con dominio circuitprompt.com.ar.

### 4. Ejecutar el Script de Despliegue

```bash
chmod +x donweb-deploy.sh
./donweb-deploy.sh
```

### 5. Configurar los Certificados SSL

Una vez que los contenedores estén funcionando, generar los certificados SSL con Let's Encrypt:

```bash
docker-compose -f docker-compose-prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d circuitprompt.com.ar -d www.circuitprompt.com.ar
```

Y luego reiniciar Nginx:

```bash
docker-compose -f docker-compose-prod.yml exec nginx nginx -s reload
```

### 6. Configurar DNS en CloudPanel

1. Acceder a CloudPanel: https://cp.circuitprompt.com.ar
2. Ir a la sección "Sitios" y seleccionar el sitio de circuitprompt.com.ar
3. En la sección "Configuración", configurar:
   - Tipo: Custom (Otro)
   - Directorio raíz: /var/www/portfolio
   - Puerto: 5001 (el puerto en el que escucha nuestra aplicación)
4. Guardar cambios

### 7. Verificar el Despliegue

1. Acceder a la aplicación en el navegador: https://circuitprompt.com.ar
2. Verificar que la API funciona: https://circuitprompt.com.ar/api/servicios
3. Comprobar que los endpoints de la API son accesibles con autenticación adecuada

### Solución de Problemas

Para ver los logs de los contenedores:

```bash
docker-compose -f docker-compose-prod.yml logs -f
# Para un contenedor específico
docker-compose -f docker-compose-prod.yml logs -f app
```

Para reiniciar los contenedores:

```bash
docker-compose -f docker-compose-prod.yml restart
```

Para detener y volver a iniciar todo:

```bash
docker-compose -f docker-compose-prod.yml down
docker-compose -f docker-compose-prod.yml up -d
```

## Notas Adicionales

- La aplicación se ejecuta en el puerto 5001
- La base de datos PostgreSQL se ejecuta en el puerto 5432 (accesible solo desde los contenedores)
- Los certificados SSL se renuevan automáticamente cada 3 meses
- Se ha configurado HTTPS por defecto con redirección desde HTTP
- Las variables de CORS están configuradas para permitir solo el dominio circuitprompt.com.ar 
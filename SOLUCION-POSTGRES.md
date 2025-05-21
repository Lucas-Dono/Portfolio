# Solución al problema de conexión PostgreSQL

## Problema detectado

El error `Error al conectar a PostgreSQL: la autentificación Ident falló para el usuario «postgres»` se produce porque PostgreSQL en Linux está configurado por defecto para usar el método de autenticación "ident", que requiere que el usuario de la base de datos exista como usuario del sistema operativo con el mismo nombre.

## Solución implementada: Docker

Se ha creado una configuración Docker completa para resolver este problema y proporcionar un entorno de desarrollo y producción consistente:

### Archivos creados

1. **Dockerfile**: Configura el contenedor para la aplicación Node.js
2. **docker-compose.yml**: Define los servicios necesarios (Node.js y PostgreSQL)
3. **init-db.sql**: Script para inicializar la base de datos con tablas y datos de ejemplo
4. **.env.docker**: Archivo de variables de entorno específico para Docker
5. **start-docker.sh**: Script para facilitar el inicio de los contenedores
6. **README-docker.md**: Documentación detallada sobre el uso de Docker

### Ventajas de esta solución

1. **Aislamiento**: Los servicios funcionan en contenedores aislados, evitando problemas de configuración local
2. **Consistencia**: Mismo entorno en desarrollo y producción
3. **Facilidad de despliegue**: El proyecto puede desplegarse fácilmente en cualquier servidor con Docker
4. **Sin configuración de PostgreSQL**: No es necesario modificar la configuración de PostgreSQL en el sistema
5. **Datos persistentes**: Los datos de la base de datos se mantienen entre reinicios gracias a los volúmenes

## Cómo utilizar

Para iniciar el proyecto con Docker:

```bash
./start-docker.sh
```

O manualmente:

```bash
docker-compose up -d
```

Para más detalles, consultar el archivo README-docker.md

## Configuración adicional

La configuración de la base de datos ahora se realiza a través del archivo `.env.docker`, donde se especifica:

- `DB_HOST=postgres` (nombre del servicio en docker-compose)
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=portfolio`

Esto garantiza que la aplicación se conecte correctamente a la base de datos PostgreSQL dentro del entorno Docker. 
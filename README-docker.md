# Instrucciones para Docker

Este proyecto está configurado para usar Docker, lo que facilita la ejecución tanto en entornos de desarrollo como de producción.

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Iniciar el proyecto

Para iniciar todos los servicios (aplicación y base de datos PostgreSQL):

```bash
./start-docker.sh
```

Para ejecutar en segundo plano:

```bash
docker-compose up -d
```

## Detener el proyecto

```bash
docker-compose down
```

Para eliminar también los volúmenes (esto borrará los datos de la base de datos):

```bash
docker-compose down -v
```

## Acceder a los servicios

- Frontend (React): http://localhost:3000
- Backend (API): http://localhost:5001
- Base de datos PostgreSQL: localhost:5433 (puerto 5433 en lugar del estándar 5432 para evitar conflictos)

## Comandos útiles

### Ver logs

```bash
docker-compose logs
```

Para seguir los logs en tiempo real:

```bash
docker-compose logs -f
```

### Ejecutar comandos dentro de los contenedores

Para ejecutar comandos dentro del contenedor de la aplicación:

```bash
docker-compose exec app sh
```

Para ejecutar comandos en la base de datos:

```bash
docker-compose exec postgres psql -U postgres -d portfolio
```

### Reconstruir los contenedores

Si realizas cambios en el Dockerfile o en las dependencias:

```bash
docker-compose build
```

Y luego:

```bash
docker-compose up -d
```

## Inicialización de la base de datos

Para inicializar la base de datos con las tablas necesarias:

```bash
docker-compose exec postgres psql -U postgres -d portfolio -f /app/init-db.sql
```

Para esto, primero hay que copiar el archivo init-db.sql al contenedor:

```bash
docker cp ./init-db.sql portfolio-postgres-1:/app/init-db.sql
```

## Solución de problemas

### Puerto 5432 en uso

Si encuentras el error `Error response from daemon: Ports are not available: listen tcp 0.0.0.0:5432: bind: address already in use`, significa que tienes una instancia de PostgreSQL ejecutándose localmente en tu sistema. Por eso, nuestro contenedor usa el puerto 5433 en lugar del 5432 estándar.

### Problemas con dependencias npm

Si encuentras errores durante la instalación de dependencias npm, prueba el método alternativo:

```bash
./start-docker-alt.sh
```

Este método usa volúmenes en lugar de construir una imagen, lo que puede resolver algunos problemas de compatibilidad. 
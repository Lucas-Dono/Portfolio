# Documentación de Seguridad de la Plataforma Portfolio

Este documento describe las medidas de seguridad implementadas para la plataforma Portfolio en Docker, siguiendo mejores prácticas de la industria para entornos de producción.

## Medidas de Seguridad Implementadas

### 1. Seguridad a Nivel de Contenedor

#### 1.1 Limitación de Capabilities
- Aplicado el principio de mínimo privilegio
- Capabilities eliminadas (`ALL`) y solo añadidas las necesarias:
  - `NET_BIND_SERVICE`: Permite a la aplicación y nginx enlazar a puertos bajos
  - `CHOWN`, `SETUID`, `SETGID`: Necesarias para cambio de usuario y operaciones de archivos
  - `FOWNER`: Solo para PostgreSQL

#### 1.2 Perfil de AppArmor
- Perfil personalizado en `security/apparmor/docker-portfolio-profile`
- Restricción del acceso a directorios sensibles
- Limitación de operaciones privilegiadas
- Permisos específicos para los archivos de aplicación

#### 1.3 Perfil de Seccomp
- Define un conjunto limitado de llamadas al sistema permitidas
- Bloquea llamadas al sistema potencialmente peligrosas
- Implementado en `security/seccomp/portfolio-seccomp.json`

#### 1.4 Flag No New Privileges
- Evita la escalada de privilegios incluso con binarios setuid
- Aplicado a todos los contenedores

### 2. Seguridad de Red

#### 2.1 Redes Aisladas
- Red `portfolio_internal`: Sin acceso a internet (red interna)
- Red `portfolio_frontend`: Solo para Nginx y Certbot

#### 2.2 Binding de Puertos
- Puertos internos solo accesibles desde localhost con binding a 127.0.0.1
- Solo puertos 80/443 expuestos públicamente a través de Nginx

#### 2.3 Seguridad TLS
- TLS 1.2+ configurado en Nginx
- Cipher suites fuertes configurados
- Certificados SSL gestionados por Certbot
- HSTS habilitado con preload

### 3. Seguridad de Datos

#### 3.1 Gestión de Secretos
- Credenciales almacenadas en Docker Secrets
- Sin hardcoding de contraseñas en archivos de configuración

#### 3.2 Base de Datos PostgreSQL
- Autenticación con scram-sha-256
- SSL habilitado para conexiones
- Configuración restrictiva en archivos `pg_hba.conf` y `postgresql.conf`

#### 3.3 Protección de Volúmenes
- Permisos adecuados en volúmenes persistentes
- Rotación de logs configurada

### 4. Restricciones de Recursos

- Límites de CPU y memoria establecidos para prevenir DoS
- 0.75 CPU, 1GB para la aplicación principal
- 0.5 CPU, 512MB para PostgreSQL
- 0.25 CPU, 256MB para Nginx

### 5. Hardening de Nginx

- Cabeceras de seguridad:
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Feature-Policy
- Restricción de métodos HTTP
- Bloqueo de acceso a archivos ocultos
- Limitación de tamaño de cuerpo de solicitud

## Cómo Usar

Para iniciar los servicios en modo seguro:

```bash
# Cargar perfiles de seguridad (requiere sudo/root)
sudo ./load-security.sh

# Iniciar los servicios
sudo ./start-docker-secure.sh
```

## Verificación de Seguridad

Puedes verificar la configuración de seguridad con:

```bash
# Verificar perfiles AppArmor
sudo aa-status

# Verificar contenedores en ejecución con sus opciones de seguridad
docker inspect --format='{{.Name}} {{.HostConfig.SecurityOpt}}' $(docker ps -q)

# Verificar configuración de Nginx
docker exec -it [nombre_container_nginx] nginx -t
```

## Consideraciones para Implementaciones Futuras

1. Implementar WAF (ModSecurity) para protección adicional contra ataques web
2. Considerar el uso de Vault para gestión de secretos más robusta
3. Configurar monitoreo de seguridad y detección de intrusiones
4. Implementar escaneo regular de contenedores con herramientas como Trivy o Clair
5. Configurar firewall a nivel de host (ufw/iptables) 
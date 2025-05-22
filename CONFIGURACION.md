# Guía de Configuración Centralizada

## Descripción

Este sistema permite configurar toda la aplicación desde un único punto central (archivos `.env`), evitando tener que modificar múltiples archivos de configuración cuando se cambia de entorno o se ajustan parámetros.

## Beneficios

- **Configuración simplificada**: Todos los ajustes se hacen desde un solo lugar
- **Pruebas automáticas**: El sistema puede probar diferentes configuraciones para encontrar la que funciona
- **Transición suave**: Facilita el cambio entre desarrollo local y producción
- **Evita errores**: Reduce la posibilidad de olvidar actualizar algún archivo de configuración

## Cómo usar

### Configuración automática

La forma más sencilla es usar el script de configuración automática:

```bash
./config-portfolio.sh
```

El script guiará a través del proceso y:
1. Verificará si estás configurando para desarrollo local o producción
2. Si es desarrollo local, probará diferentes puertos hasta encontrar uno que funcione
3. Si es producción, configurará todo para el dominio circuitprompt.com.ar

### Variables de entorno importantes

Estas son las principales variables que controlan la configuración:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto principal de la aplicación |
| `API_PORT` | Puerto para el API (si es diferente) |
| `VITE_API_URL` | URL completa del API (incluido el protocolo) |
| `CORS_FRONT` | URL del frontend para CORS |
| `CORS_BACK` | URL del backend para CORS |

### Procedimiento manual

Si prefieres configurar manualmente:

1. Edita `.env` (desarrollo) o `.env.prod` (producción)
2. Actualiza las variables PORT, CORS_* y VITE_*
3. Ejecuta el script de verificación para asegurar que todo esté correcto:
   ```bash
   node verifyConfig.js
   ```

## Solución de problemas

### La aplicación no se conecta correctamente

Si la aplicación no se conecta o muestra errores de conexión:

1. Verifica el endpoint `/health` para confirmar la configuración actual
2. Asegúrate que los puertos configurados estén disponibles
3. Confirma que las URLs en las variables CORS_* y VITE_* sean correctas
4. Reinicia los contenedores Docker después de cambiar la configuración

### Errores en despliegue de producción

En producción:

1. Verifica que las variables en `.env.prod` apunten a `https://circuitprompt.com.ar`
2. Confirma que el puerto configurado coincida con el expuesto en `docker-compose-prod.yml`
3. Verifica que la configuración de Nginx tenga los mismos puertos
4. Reinicia completamente los contenedores con `./donweb-deploy.sh`

## Diagrama de la configuración

```
┌────────────┐      ┌────────────┐      ┌────────────┐
│   .env     │──────▶  server.js  │      │  NGINX     │
│ .env.prod  │      │  (Backend)  │      │  (Proxy)   │
└────────────┘      └──────┬─────┘      └────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌────────────┐      ┌────────────┐      ┌────────────┐
│ docker-    │      │ Frontend   │      │ API        │
│ compose.yml│      │ (Vite/React)│     │ Endpoints  │
└────────────┘      └────────────┘      └────────────┘
``` 
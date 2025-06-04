# Solución para WhatsApp Web en el Servidor

Este documento explica cómo resolver los problemas con WhatsApp Web en entornos de servidor restrictivos como el tuyo.

## El problema

En el servidor, WhatsApp Web está fallando con el error:
```
Error: Protocol error (Network.setUserAgentOverride): Session closed. Most likely the page has been closed.
```

Este error ocurre cuando Puppeteer no puede mantener una sesión estable con el navegador Chromium en entornos restrictivos.

## Archivos de solución

Hemos creado tres archivos para ayudarte a solucionar el problema:

1. **fix-server-whatsapp.sh**: Script para configurar WhatsApp Web en el servidor
2. **update-server.mjs**: Script para actualizar la configuración en server.js
3. **test-puppeteer-server.mjs**: Diagnóstico de Puppeteer en el servidor

## Instrucciones paso a paso

### Opción 1: Solución automatizada (recomendada)

1. Sube estos archivos al servidor:
   - `fix-server-whatsapp.sh`
   - `update-server.mjs`
   - `test-puppeteer-server.mjs`

2. Ejecuta estos comandos en el servidor:
   ```bash
   # Dar permisos de ejecución
   chmod +x fix-server-whatsapp.sh
   
   # Ejecutar el script de configuración
   ./fix-server-whatsapp.sh
   
   # Actualizar server.js con la configuración mejorada
   node update-server.mjs
   
   # Probar si Puppeteer funciona correctamente
   node test-puppeteer-server.mjs
   ```

3. Si el test funciona:
   - Edita `.env` y cambia `WHATSAPP_DISABLE_WEB=false`
   - Reinicia el servidor: `node server.js`
   - Accede a `/admin/qr` para escanear el código QR

### Opción 2: Solución manual

Si los scripts no funcionan, puedes realizar estos cambios manualmente:

1. Edita `server/whatsapp-config.js` con esta configuración:
   ```javascript
   // Configuración para WhatsApp Web.js en servidor
   export const puppeteerOptions = {
       executablePath: '/usr/bin/chromium-browser',
       headless: 'new',
       args: [
           '--no-sandbox',
           '--disable-setuid-sandbox',
           '--disable-dev-shm-usage',
           '--disable-accelerated-2d-canvas',
           '--disable-gpu',
           '--disable-extensions',
           '--disable-software-rasterizer',
           '--single-process',
           '--window-size=800,600',
           '--disable-web-security',
           '--allow-running-insecure-content',
           '--ignore-certificate-errors',
           '--remote-debugging-port=0'
       ],
       timeout: 60000
   };
   
   export default { puppeteerOptions };
   ```

2. Modifica la inicialización del cliente en `server.js`:
   ```javascript
   client = new Client({
       authStrategy: new LocalAuth({
         clientId: "contact-bot",
         dataPath: process.env.WHATSAPP_DATA_PATH || './.wwebjs_auth'
       }),
       puppeteer: {
         executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
         headless: 'new',
         args: [
           '--no-sandbox',
           '--disable-setuid-sandbox', 
           '--disable-dev-shm-usage',
           '--disable-accelerated-2d-canvas',
           '--disable-gpu',
           '--disable-extensions',
           '--disable-software-rasterizer',
           '--single-process',
           '--window-size=800,600',
           '--disable-web-security',
           '--allow-running-insecure-content',
           '--ignore-certificate-errors',
           '--remote-debugging-port=0'
         ],
         timeout: 60000
       }
     });
   ```

## Solución de problemas adicionales

Si sigues teniendo problemas, intenta:

1. Instalar todas las dependencias necesarias para Chromium:
   ```bash
   sudo apt-get update
   sudo apt-get install -y chromium-browser gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget
   ```

2. Verificar que el navegador existe y es accesible:
   ```bash
   which chromium-browser
   ls -la /usr/bin/chromium-browser
   ```

3. Si el servidor no tiene interfaz gráfica, puedes probar con un enfoque sin WhatsApp Web:
   - Configura `WHATSAPP_DISABLE_WEB=true` en `.env`
   - Usa el sistema de fallback por email que ya está implementado

## Información técnica adicional

Este problema ocurre porque:

1. Puppeteer necesita ejecutar un navegador Chrome/Chromium
2. En entornos de servidor sin interfaz gráfica, esto requiere configuración especial
3. Las restricciones de seguridad del servidor pueden limitar lo que Puppeteer puede hacer

La solución propuesta:
- Usa argumentos de línea de comando específicos para Chrome que permiten ejecutarlo en entornos restrictivos
- Aumenta los tiempos de espera para manejar conexiones lentas
- Proporciona una forma de probar si Puppeteer funciona antes de intentar usar WhatsApp Web 
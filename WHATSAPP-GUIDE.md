# Guía para WhatsApp Web en CircuitPrompt

Esta guía te ayudará a configurar y usar WhatsApp Web en tu aplicación CircuitPrompt alojada en Donweb.

## ¿Para qué se usa WhatsApp en la aplicación?

WhatsApp Web se usa para enviar notificaciones automáticas a un grupo de WhatsApp cuando:
- Un cliente realiza una compra
- Alguien envía un formulario de contacto
- Se recibe un mensaje importante
- Cualquier evento que requiera atención

## Configuración inicial en el servidor

1. Ejecutar el script de instalación de dependencias:
   ```
   chmod +x setup-whatsapp.sh
   sudo ./setup-whatsapp.sh
   ```

2. Reiniciar la aplicación:
   ```
   pm2 restart circuitprompt
   ```

3. Acceder a la interfaz de administración:
   ```
   https://circuitprompt.com.ar/admin
   ```
   
   Usar las credenciales:
   - Usuario: admin (o el que hayas configurado en .env)
   - Contraseña: admin123 (o la que hayas configurado en .env)

## Vinculación con WhatsApp

1. En la interfaz de administración, haz clic en "Ver Código QR"
2. Abre WhatsApp en tu teléfono
3. Ve a Configuración > Dispositivos vinculados > Vincular un dispositivo
4. Escanea el código QR que se muestra en el navegador
5. Espera a que se complete la vinculación (verás "Conectado" en el panel)

## Configuración de grupos

Para que la aplicación envíe mensajes a un grupo de WhatsApp:

1. Crea un grupo en WhatsApp desde tu teléfono
2. Agrega al menos otro contacto al grupo (requisito de WhatsApp)
3. Desde el chat del grupo, envía un mensaje con la URL de invitación:
   - En Android: Toca los tres puntos > Info. del grupo > Invitar al grupo mediante un enlace > Copiar enlace
   - En iPhone: Toca el nombre del grupo > Compartir enlace > Copiar enlace

4. Envía ese enlace por mensaje privado al mismo número que escaneó el QR
5. El bot se unirá automáticamente al grupo
6. Accede a `/admin/whatsapp` y verás el grupo listado con su ID
7. Configura la variable `GROUP_CHAT_ID` en tu archivo `.env.prod` con ese ID

## Variables de entorno importantes

Estas variables controlan el comportamiento de WhatsApp:

```
# WhatsApp
GROUP_CHAT_ID=123456789@g.us    # ID del grupo para enviar mensajes
WHATSAPP_DISABLE_WEB=false      # Desactiva WhatsApp si es 'true'
WHATSAPP_DATA_PATH=./.wwebjs_auth # Ubicación archivos sesión
```

## Solución de problemas

### El código QR no aparece
- Verifica que las dependencias estén instaladas correctamente
- Asegúrate que Puppeteer/Chromium pueda ejecutarse (ejecuta `setup-whatsapp.sh`)
- Revisa los logs: `pm2 logs circuitprompt`

### La sesión se desconecta frecuentemente
- WhatsApp Web requiere conexión estable
- Asegúrate que el navegador headless pueda ejecutarse sin errores
- Evita múltiples sesiones con el mismo número

### No se envían mensajes
- Verifica que `GROUP_CHAT_ID` contenga el ID correcto
- Comprueba que el bot sea miembro del grupo
- Revisa que la sesión esté activa (estado "Conectado" en el panel)

## Mantenimiento

- Ocasionalmente WhatsApp puede requerir reautenticación
- Si la sesión caduca, accede a `/admin/qr` y escanea nuevamente
- La sesión se guarda en `.wwebjs_auth` en el servidor 
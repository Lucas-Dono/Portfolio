# Instrucciones para Subir el Proyecto a GitHub

Este documento explica cómo subir tu proyecto Portfolio a un repositorio privado en GitHub.

## Paso 1: Crear un Repositorio Privado en GitHub

1. Inicia sesión en tu cuenta de GitHub: https://github.com/login
2. Haz clic en el botón "+" en la esquina superior derecha y selecciona "New repository"
3. Nombra el repositorio (por ejemplo, "portfolio-private")
4. Asegúrate de seleccionar la opción "Private" (importante para mantener la información sensible segura)
5. No inicialices el repositorio con archivos README, .gitignore o LICENSE
6. Haz clic en "Create repository"

## Paso 2: Configurar Git en tu Máquina Local

Configura tu nombre de usuario y email en Git (si no lo has hecho ya):

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

## Paso 3: Conectar tu Repositorio Local con el Remoto

Después de crear el repositorio en GitHub, te mostrará un conjunto de comandos. Copia y ejecuta los siguientes comandos en la terminal:

```bash
# Asegúrate de estar en la carpeta raíz de tu proyecto
cd /home/Lucas/Documentos/Portfolio/portfolio

# Conecta tu repositorio local con el remoto en GitHub
git remote add origin https://https://github.com/Lucas-Dono/Portfolio

# Sube tu código al repositorio remoto
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

## Paso 4: Introducir Credenciales

Al hacer push, se te pedirá tu nombre de usuario y contraseña de GitHub. En lugar de tu contraseña normal, deberás usar un token de acceso personal:

1. Ve a GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Haz clic en "Generate new token"
3. Selecciona el scope "repo" (acceso completo a repositorios privados)
4. Genera el token y cópialo
5. Usa este token como contraseña cuando Git te lo solicite

## Paso 5: Verificar la Subida

1. Visita tu repositorio en GitHub para verificar que todos los archivos se hayan subido correctamente
2. Comprueba que el repositorio esté marcado como privado (icono de candado)

## Paso 6: Para Hacer el Repositorio Público Posteriormente

Cuando quieras hacer una versión pública del proyecto:

1. Crea un nuevo repositorio público
2. Haz una copia del proyecto local que elimine información sensible:
   ```bash
   # Clona tu repositorio privado
   git clone https://github.com/TU_USUARIO/portfolio-private.git portfolio-public
   cd portfolio-public
   
   # Restaura el .gitignore original
   git checkout -- .gitignore
   
   # Elimina archivos sensibles
   git rm -f .env .env.prod .env.test-prod
   git rm -f secrets/*
   git rm -rf .wwebjs_auth/
   
   # Haz commit de los cambios
   git commit -m "Preparar versión pública"
   
   # Cambia el origen remoto
   git remote set-url origin https://github.com/TU_USUARIO/portfolio-public.git
   
   # Sube al nuevo repositorio
   git push -u origin main
   ```

## Ayuda Adicional

Si encuentras problemas o necesitas ayuda adicional, consulta:
- Documentación de GitHub: https://docs.github.com/es
- Guía de GitHub para creación de repositorios: https://docs.github.com/es/repositories/creating-and-managing-repositories/creating-a-new-repository 
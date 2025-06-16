#!/usr/bin/env node

/**
 * Script para facilitar el debugging del Error React #310
 * Uso: node debug-error-310.js [opción]
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader() {
  console.log(colorize('\n🔍 DEBUGGING ERROR REACT #310', 'cyan'));
  console.log(colorize('================================', 'cyan'));
}

function printHelp() {
  console.log(colorize('\n📋 Opciones disponibles:', 'yellow'));
  console.log('');
  console.log(colorize('  start', 'green') + '     - Iniciar servidor con debugging activado');
  console.log(colorize('  test', 'green') + '      - Abrir página de prueba de errores 310');
  console.log(colorize('  dashboard', 'green') + ' - Abrir dashboard con debugging activado');
  console.log(colorize('  report', 'green') + '    - Mostrar último reporte de error capturado');
  console.log(colorize('  clean', 'green') + '     - Limpiar reportes y logs anteriores');
  console.log(colorize('  help', 'green') + '      - Mostrar esta ayuda');
  console.log('');
}

function startDevServer() {
  console.log(colorize('🚀 Iniciando servidor de desarrollo con debugging...', 'green'));
  console.log(colorize('📊 El debugging del error 310 se activará automáticamente', 'blue'));
  console.log('');
  
  const child = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(colorize(`❌ Error: ${error}`, 'red'));
      return;
    }
  });

  child.stdout.on('data', (data) => {
    console.log(data);
  });

  child.stderr.on('data', (data) => {
    console.error(data);
  });

  // Esperar un poco y luego mostrar instrucciones
  setTimeout(() => {
    console.log(colorize('\n📋 INSTRUCCIONES:', 'yellow'));
    console.log('1. Abre el navegador en: http://localhost:5173');
    console.log('2. Para debugging automático: http://localhost:5173/dashboard?debug=310');
    console.log('3. Para pruebas específicas: http://localhost:5173/debug/error310');
    console.log('4. Abre DevTools (F12) y ve a la pestaña Console');
    console.log('5. Reproduce el error y observa los logs detallados');
    console.log('');
    console.log(colorize('🔍 Busca logs que empiecen con: 🚨 ERROR 310 DETECTADO', 'cyan'));
  }, 3000);
}

function openTestPage() {
  console.log(colorize('🧪 Abriendo página de prueba de errores 310...', 'green'));
  
  const urls = [
    'http://localhost:5173/debug/error310',
    'http://localhost:3000/debug/error310',
    'http://localhost:5000/debug/error310'
  ];

  urls.forEach(url => {
    // Comando específico para Windows
    const command = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    exec(command, (error) => {
      if (!error) {
        console.log(colorize(`✅ Abriendo: ${url}`, 'green'));
      }
    });
  });

  console.log('');
  console.log(colorize('📋 En la página de prueba:', 'yellow'));
  console.log('1. Haz clic en los botones de prueba para reproducir errores específicos');
  console.log('2. Observa los logs en la consola del navegador');
  console.log('3. Revisa los errores capturados en la interfaz');
}

function openDashboard() {
  console.log(colorize('📊 Abriendo dashboard con debugging activado...', 'green'));
  
  const urls = [
    'http://localhost:5173/dashboard?debug=310',
    'http://localhost:3000/dashboard?debug=310',
    'http://localhost:5000/dashboard?debug=310'
  ];

  urls.forEach(url => {
    // Comando específico para Windows
    const command = process.platform === 'win32' ? `start "" "${url}"` : `open "${url}"`;
    exec(command, (error) => {
      if (!error) {
        console.log(colorize(`✅ Abriendo: ${url}`, 'green'));
      }
    });
  });

  console.log('');
  console.log(colorize('📋 En el dashboard:', 'yellow'));
  console.log('1. Interactúa con los componentes normalmente');
  console.log('2. Cambia entre pestañas, redimensiona ventana, etc.');
  console.log('3. Observa los logs de debugging en la consola');
  console.log('4. Si aparece el error, se capturará automáticamente');
}

function showReport() {
  console.log(colorize('📊 Buscando reportes de error 310...', 'blue'));
  
  // Intentar leer el reporte desde diferentes ubicaciones posibles
  const possiblePaths = [
    path.join(process.cwd(), 'error-310-report.json'),
    path.join(process.cwd(), 'logs', 'error-310-report.json'),
    path.join(process.cwd(), 'debug', 'error-310-report.json')
  ];

  let reportFound = false;

  for (const reportPath of possiblePaths) {
    if (fs.existsSync(reportPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        console.log(colorize('✅ Reporte encontrado:', 'green'));
        console.log(JSON.stringify(report, null, 2));
        reportFound = true;
        break;
      } catch (error) {
        console.log(colorize(`⚠️ Error leyendo reporte en ${reportPath}`, 'yellow'));
      }
    }
  }

  if (!reportFound) {
    console.log(colorize('📋 No se encontraron reportes locales.', 'yellow'));
    console.log('');
    console.log(colorize('💡 Para ver el reporte desde el navegador:', 'cyan'));
    console.log('1. Abre DevTools (F12) en el navegador');
    console.log('2. Ve a la pestaña Console');
    console.log('3. Ejecuta: JSON.parse(localStorage.getItem("react_error_310_report"))');
    console.log('');
    console.log(colorize('📊 Para ver estadísticas del debugger:', 'cyan'));
    console.log('1. En la consola del navegador ejecuta: window.reactDebugger.getStats()');
  }
}

function cleanReports() {
  console.log(colorize('🧹 Limpiando reportes y logs anteriores...', 'yellow'));
  
  const filesToClean = [
    'error-310-report.json',
    'logs/error-310-report.json',
    'debug/error-310-report.json'
  ];

  let cleaned = 0;

  filesToClean.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(colorize(`✅ Eliminado: ${file}`, 'green'));
        cleaned++;
      } catch (error) {
        console.log(colorize(`❌ Error eliminando ${file}: ${error.message}`, 'red'));
      }
    }
  });

  if (cleaned === 0) {
    console.log(colorize('📋 No se encontraron archivos para limpiar.', 'blue'));
  } else {
    console.log(colorize(`✅ Se limpiaron ${cleaned} archivos.`, 'green'));
  }

  console.log('');
  console.log(colorize('💡 Para limpiar reportes del navegador:', 'cyan'));
  console.log('1. Abre DevTools (F12)');
  console.log('2. Ve a Application > Local Storage');
  console.log('3. Elimina la clave "react_error_310_report"');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  printHeader();

  switch (command.toLowerCase()) {
    case 'start':
      startDevServer();
      break;
    
    case 'test':
      openTestPage();
      break;
    
    case 'dashboard':
      openDashboard();
      break;
    
    case 'report':
      showReport();
      break;
    
    case 'clean':
      cleanReports();
      break;
    
    case 'help':
    default:
      printHelp();
      console.log(colorize('💡 Ejemplo de uso:', 'cyan'));
      console.log('  node debug-error-310.js start');
      console.log('  node debug-error-310.js test');
      console.log('  node debug-error-310.js dashboard');
      console.log('');
      break;
  }
}

// Ejecutar el script
main(); 
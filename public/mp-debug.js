/**
 * Script de depuración para Mercado Pago
 * Este script detecta si el SDK de Mercado Pago se ha cargado correctamente
 * y proporciona información sobre posibles problemas.
 */

(function () {
  console.log('🔍 Iniciando detector de problemas de Mercado Pago...');

  // Comprobar si el SDK está disponible
  function checkSDK() {
    if (typeof window.MercadoPago === 'function') {
      console.log('✅ SDK de Mercado Pago detectado correctamente');
      return true;
    } else {
      console.error('❌ SDK de Mercado Pago no disponible');
      return false;
    }
  }

  // Comprobar configuración de cookies
  function checkCookies() {
    try {
      // Intentar establecer una cookie de prueba
      document.cookie = "mp_debug=1; SameSite=None; Secure";
      console.log('✅ Cookies configuradas correctamente');
      return true;
    } catch (e) {
      console.error('❌ Error al establecer cookies:', e);
      return false;
    }
  }

  // Comprobar si el contenedor del brick existe
  function checkContainer() {
    // Solo verificar el contenedor si estamos en la página de pago
    if (!window.location.pathname.includes('/payment')) {
      console.log('ℹ️ No estamos en la página de pago, omitiendo verificación del contenedor del brick');
      return true; // Devolver true para no mostrar error
    }

    const container = document.getElementById('payment-brick-container');
    if (container) {
      console.log('✅ Contenedor del brick encontrado:', container);
      return true;
    } else {
      console.error('❌ Contenedor del brick no encontrado');
      return false;
    }
  }

  // Ejecutar todas las comprobaciones
  function runChecks() {
    const sdkOk = checkSDK();
    const cookiesOk = checkCookies();

    // Esperar a que el DOM esté listo para verificar el contenedor
    setTimeout(() => {
      const containerOk = checkContainer();

      if (sdkOk && cookiesOk && containerOk) {
        console.log('✅ Todas las verificaciones pasaron. La integración debería funcionar correctamente.');
      } else {
        console.error('❌ Se encontraron problemas en la integración de Mercado Pago.');
      }
    }, 2000);
  }

  // Ejecutar comprobaciones cuando la página esté cargada
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runChecks);
  } else {
    runChecks();
  }

  // Exponer funciones de diagnóstico para uso desde la consola
  window.mpDebug = {
    checkSDK,
    checkCookies,
    checkContainer,
    runChecks
  };
})(); 
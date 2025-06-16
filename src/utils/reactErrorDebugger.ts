// Sistema de debugging específico para errores de React
// Especialmente diseñado para diagnosticar el error #310 (hooks inconsistentes)

interface HookCall {
  type: string;
  order: number;
  component: string;
  timestamp: number;
  stackTrace?: string;
}

interface ComponentRender {
  component: string;
  renderCount: number;
  hookCalls: HookCall[];
  timestamp: number;
  props?: any;
  state?: any;
}

class ReactErrorDebugger {
  private static instance: ReactErrorDebugger;
  private hookCallHistory: Map<string, HookCall[]> = new Map();
  private renderHistory: Map<string, ComponentRender[]> = new Map();
  private isDebugging: boolean = false;
  private originalConsoleError: typeof console.error;

  constructor() {
    this.originalConsoleError = console.error;
    this.setupErrorInterception();
  }

  static getInstance(): ReactErrorDebugger {
    if (!ReactErrorDebugger.instance) {
      ReactErrorDebugger.instance = new ReactErrorDebugger();
    }
    return ReactErrorDebugger.instance;
  }

  // Activar debugging específico para error 310
  enableError310Debugging(): void {
    this.isDebugging = true;
    console.log('🔍 DEBUGGING ERROR 310 ACTIVADO');
    console.log('📊 Monitoreando llamadas de hooks y renderizados...');
    
    // Interceptar errores de React
    this.interceptReactErrors();
    
    // Monitorear hooks específicos
    this.monitorHooks();
  }

  // Desactivar debugging
  disableDebugging(): void {
    this.isDebugging = false;
    console.log('🔍 Debugging desactivado');
  }

  private setupErrorInterception(): void {
    // Interceptar errores globales
    window.addEventListener('error', (event) => {
      if (this.isDebugging && this.isReactError310(event.error)) {
        this.handleError310(event.error);
      }
    });

    // Interceptar errores no capturados de promesas
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isDebugging && this.isReactError310(event.reason)) {
        this.handleError310(event.reason);
      }
    });
  }

  private interceptReactErrors(): void {
    // Sobrescribir console.error para capturar errores de React
    console.error = (...args: any[]) => {
      if (this.isDebugging) {
        const errorMessage = args.join(' ');
        
        if (this.isReactError310Message(errorMessage)) {
          console.log('🚨 ERROR 310 DETECTADO EN CONSOLE.ERROR');
          this.analyzeError310Context();
        }
      }
      
      // Llamar al console.error original
      this.originalConsoleError.apply(console, args);
    };
  }

  private isReactError310(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString();
    return errorString.includes('Minified React error #310') ||
           errorString.includes('Rendered more hooks than during the previous render') ||
           errorString.includes('React has detected a change in the order of Hooks');
  }

  private isReactError310Message(message: string): boolean {
    return message.includes('#310') ||
           message.includes('more hooks than during the previous render') ||
           message.includes('change in the order of Hooks');
  }

  private handleError310(error: any): void {
    console.log('🚨 ERROR REACT #310 CAPTURADO');
    console.log('📍 Stack trace:', error.stack);
    
    this.analyzeError310Context();
    this.generateDiagnosticReport();
  }

  private analyzeError310Context(): void {
    console.log('🔍 ANALIZANDO CONTEXTO DEL ERROR 310...');
    
    // Analizar el stack trace actual
    const stack = new Error().stack;
    console.log('📍 Stack trace actual:', stack);
    
    // Buscar componentes sospechosos en el stack
    this.identifySuspiciousComponents(stack);
    
    // Analizar el historial de renderizados recientes
    this.analyzeRecentRenders();
  }

  private identifySuspiciousComponents(stack?: string): void {
    if (!stack) return;
    
    console.log('🔍 IDENTIFICANDO COMPONENTES SOSPECHOSOS...');
    
    // Patrones comunes que causan error 310
    const suspiciousPatterns = [
      'Dashboard',
      'useEffect',
      'useState',
      'useRef',
      'styled-components',
      'SecuritySettings',
      'NoProjectsContent',
      'RatingModal'
    ];
    
    const foundPatterns = suspiciousPatterns.filter(pattern => 
      stack.includes(pattern)
    );
    
    if (foundPatterns.length > 0) {
      console.log('⚠️ COMPONENTES SOSPECHOSOS ENCONTRADOS:', foundPatterns);
    }
  }

  private analyzeRecentRenders(): void {
    console.log('🔍 ANALIZANDO RENDERIZADOS RECIENTES...');
    
    for (const [component, renders] of this.renderHistory.entries()) {
      const recentRenders = renders.slice(-5); // Últimos 5 renderizados
      
      if (recentRenders.length > 1) {
        const hookCountVariation = this.analyzeHookCountVariation(recentRenders);
        
        if (hookCountVariation.hasVariation) {
          console.log(`🚨 VARIACIÓN DE HOOKS DETECTADA EN ${component}:`);
          console.log('📊 Conteos de hooks por renderizado:', hookCountVariation.counts);
          console.log('📋 Detalles:', hookCountVariation.details);
        }
      }
    }
  }

  private analyzeHookCountVariation(renders: ComponentRender[]): {
    hasVariation: boolean;
    counts: number[];
    details: any[];
  } {
    const counts = renders.map(render => render.hookCalls.length);
    const hasVariation = new Set(counts).size > 1;
    
    const details = renders.map((render, index) => ({
      renderIndex: index,
      hookCount: render.hookCalls.length,
      timestamp: render.timestamp,
      hookTypes: render.hookCalls.map(hook => hook.type)
    }));
    
    return { hasVariation, counts, details };
  }

  private monitorHooks(): void {
    // Esta función sería más compleja en una implementación real
    // Por ahora, registramos cuando se detectan patrones problemáticos
    console.log('🔍 Monitor de hooks activado');
  }

  private generateDiagnosticReport(): void {
    console.log('📋 GENERANDO REPORTE DIAGNÓSTICO...');
    
    const report = {
      timestamp: new Date().toISOString(),
      error: 'React Error #310',
      description: 'Rendered more hooks than during the previous render',
      possibleCauses: [
        'Hooks declarados después de return condicional',
        'Componentes definidos dentro de otros componentes',
        'Styled-components con props dinámicos',
        'useEffect con dependencias que cambian el número de hooks',
        'Renderizado condicional de componentes con hooks'
      ],
      recommendations: [
        'Mover todos los hooks al inicio del componente',
        'Extraer componentes internos fuera del componente padre',
        'Evitar props dinámicos en styled-components',
        'Usar early returns solo después de declarar todos los hooks',
        'Verificar que todos los useEffect tengan dependencias estables'
      ],
      componentHistory: Object.fromEntries(this.renderHistory),
      hookHistory: Object.fromEntries(this.hookCallHistory)
    };
    
    console.log('📊 REPORTE COMPLETO:', report);
    
    // Guardar en localStorage para análisis posterior
    try {
      localStorage.setItem('react_error_310_report', JSON.stringify(report, null, 2));
      console.log('💾 Reporte guardado en localStorage como "react_error_310_report"');
    } catch (e) {
      console.warn('⚠️ No se pudo guardar el reporte en localStorage');
    }
  }

  // Método para registrar renderizados manualmente
  logComponentRender(componentName: string, hookCount: number, additionalInfo?: any): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!this.isDebugging) return;
    
    const render: ComponentRender = {
      component: componentName,
      renderCount: (this.renderHistory.get(componentName)?.length || 0) + 1,
      hookCalls: [], // Se llenaría con información real de hooks
      timestamp: Date.now(),
      props: additionalInfo?.props,
      state: additionalInfo?.state
    };
    
    if (!this.renderHistory.has(componentName)) {
      this.renderHistory.set(componentName, []);
    }
    
    this.renderHistory.get(componentName)!.push(render);
    
    console.log(`🔄 Renderizado registrado: ${componentName} (${render.renderCount})`);
  }

  // Método para obtener estadísticas
  getStats(): any {
    return {
      isDebugging: this.isDebugging,
      componentsMonitored: this.renderHistory.size,
      totalRenders: Array.from(this.renderHistory.values()).reduce((total, renders) => total + renders.length, 0),
      recentActivity: this.getRecentActivity()
    };
  }

  private getRecentActivity(): any {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    const recentRenders = Array.from(this.renderHistory.entries())
      .map(([component, renders]) => ({
        component,
        recentRenders: renders.filter(render => render.timestamp > fiveMinutesAgo).length
      }))
      .filter(item => item.recentRenders > 0);
    
    return recentRenders;
  }
}

// Función de utilidad para activar debugging desde la consola
export const enableReactError310Debugging = (): void => {
  const debuggerInstance = ReactErrorDebugger.getInstance();
  debuggerInstance.enableError310Debugging();
  
  // Hacer disponible globalmente para debugging
  (window as any).reactDebugger = debuggerInstance;
  
  console.log('🔍 Para obtener estadísticas, usa: window.reactDebugger.getStats()');
  console.log('🔍 Para ver el reporte completo, revisa localStorage["react_error_310_report"]');
};

// Función para desactivar debugging
export const disableReactError310Debugging = (): void => {
  const debuggerInstance = ReactErrorDebugger.getInstance();
  debuggerInstance.disableDebugging();
  
  delete (window as any).reactDebugger;
};

// Exportar la instancia para uso interno
export const reactErrorDebugger = ReactErrorDebugger.getInstance();

// Auto-activar en desarrollo si hay parámetros específicos o variable de entorno
if (typeof window !== 'undefined') {
  // Verificar variables de entorno de manera segura
  const isDevelopment = import.meta.env?.MODE === 'development' || import.meta.env?.DEV === true;
  const isDebugEnabled = import.meta.env?.REACT_DEBUG_310 === 'true';
  
  const shouldAutoActivate = 
    window.location.search.includes('debug=310') ||
    isDebugEnabled ||
    (isDevelopment && window.location.pathname === '/dashboard');
    
  if (shouldAutoActivate) {
    enableReactError310Debugging();
    console.log('🔍 Debugging automático activado');
    
    if (window.location.search.includes('debug=310')) {
      console.log('📍 Activado por parámetro URL debug=310');
    }
    if (isDebugEnabled) {
      console.log('📍 Activado por variable de entorno REACT_DEBUG_310');
    }
    if (isDevelopment && window.location.pathname === '/dashboard') {
      console.log('📍 Activado automáticamente en desarrollo para Dashboard');
    }
  }
} 
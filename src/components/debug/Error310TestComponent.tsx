import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { enableReactError310Debugging } from '../../utils/reactErrorDebugger';

// Componente que INTENCIONALMENTE reproduce el error 310
// para poder diagnosticarlo y entender exactamente qué lo causa

interface TestComponentProps {
  testMode: 'hooks_after_return' | 'nested_components' | 'styled_props' | 'conditional_hooks' | 'normal';
}

// Styled component con props dinámicos (puede causar error 310)
const TestDiv = styled.div<{ isActive: boolean; count: number }>`
  padding: 1rem;
  background: ${props => props.isActive ? '#00d2ff' : '#333'};
  opacity: ${props => props.count > 5 ? 1 : 0.5};
  border: 2px solid ${props => props.isActive ? '#3a7bd5' : 'transparent'};
  margin: 1rem 0;
  border-radius: 8px;
  transition: all 0.3s ease;
`;

const TestContainer = styled.div`
  padding: 2rem;
  background: #121212;
  color: #f5f5f5;
  min-height: 100vh;
`;

const TestButton = styled.button`
  padding: 0.75rem 1.5rem;
  margin: 0.5rem;
  background: linear-gradient(135deg, #3a7bd5, #00d2ff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 210, 255, 0.3);
  }
`;

const ErrorLog = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  max-height: 300px;
  overflow-y: auto;
`;

// Componente que causa error 310 - Hooks después de return condicional
const ProblematicComponent1: React.FC<{ shouldRender: boolean }> = ({ shouldRender }) => {
  // ❌ PROBLEMA: Return condicional ANTES de declarar hooks
  if (!shouldRender) {
    return <div>No renderizar</div>;
  }

  // ❌ HOOKS DESPUÉS DEL RETURN CONDICIONAL
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    console.log('Efecto ejecutado en componente problemático 1');
  }, [count]);

  return (
    <TestDiv isActive={isActive} count={count}>
      <h3>Componente Problemático 1 - Hooks después de return</h3>
      <p>Count: {count}</p>
      <TestButton onClick={() => setCount(c => c + 1)}>Incrementar</TestButton>
      <TestButton onClick={() => setIsActive(!isActive)}>Toggle Active</TestButton>
    </TestDiv>
  );
};

// Componente que causa error 310 - Componentes anidados con hooks
const ProblematicComponent2: React.FC<{ mode: string }> = ({ mode }) => {
  const [parentState, setParentState] = useState(0);

  // ❌ PROBLEMA: Componente definido DENTRO de otro componente
  const NestedComponent = () => {
    const [nestedState, setNestedState] = useState(0); // ❌ Hook en componente anidado
    
    useEffect(() => {
      console.log('Efecto en componente anidado');
    }, [nestedState]);

    return (
      <div>
        <p>Estado anidado: {nestedState}</p>
        <TestButton onClick={() => setNestedState(n => n + 1)}>
          Incrementar Anidado
        </TestButton>
      </div>
    );
  };

  return (
    <TestDiv isActive={parentState > 3} count={parentState}>
      <h3>Componente Problemático 2 - Componente anidado con hooks</h3>
      <p>Estado padre: {parentState}</p>
      <TestButton onClick={() => setParentState(p => p + 1)}>
        Incrementar Padre
      </TestButton>
      
      {/* ❌ Renderizado condicional del componente anidado */}
      {mode === 'show_nested' && <NestedComponent />}
    </TestDiv>
  );
};

// Componente que causa error 310 - Hooks condicionales
const ProblematicComponent3: React.FC<{ enableHooks: boolean }> = ({ enableHooks }) => {
  const [baseState, setBaseState] = useState(0);

  // ❌ PROBLEMA: Hooks condicionales
  if (enableHooks) {
    const [conditionalState] = useState(0); // ❌ Hook condicional (setter no usado intencionalmente)
    
    useEffect(() => {
      console.log('Efecto condicional');
    }, [conditionalState]);
  }

  return (
    <TestDiv isActive={enableHooks} count={baseState}>
      <h3>Componente Problemático 3 - Hooks condicionales</h3>
      <p>Estado base: {baseState}</p>
      <p>Hooks habilitados: {enableHooks ? 'Sí' : 'No'}</p>
      <TestButton onClick={() => setBaseState(b => b + 1)}>
        Incrementar Base
      </TestButton>
    </TestDiv>
  );
};

// Componente correcto para comparación
const CorrectComponent: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  // ✅ CORRECTO: Todos los hooks al inicio
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Efecto en componente correcto');
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [count]);

  // ✅ CORRECTO: Verificaciones condicionales DESPUÉS de los hooks
  if (!isVisible) {
    return <div>Componente oculto</div>;
  }

  return (
    <TestDiv isActive={isActive} count={count}>
      <h3>✅ Componente Correcto</h3>
      <p>Count: {count}</p>
      <TestButton onClick={() => setCount(c => c + 1)}>Incrementar</TestButton>
      <TestButton onClick={() => setIsActive(!isActive)}>Toggle Active</TestButton>
    </TestDiv>
  );
};

const Error310TestComponent: React.FC<TestComponentProps> = ({ testMode }) => {
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [testState, setTestState] = useState({
    shouldRender: true,
    mode: 'normal',
    enableHooks: true,
    isVisible: true
  });

  useEffect(() => {
    // Activar debugging
    enableReactError310Debugging();
    console.log('🧪 Componente de prueba Error 310 iniciado');

    // Interceptar errores para mostrarlos en la UI
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('310') || errorMessage.includes('hooks')) {
        setErrorLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${errorMessage}`]);
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const triggerError = (type: string) => {
    console.log(`🧪 Triggering error type: ${type}`);
    
    switch (type) {
      case 'hooks_after_return':
        setTestState(prev => ({ ...prev, shouldRender: !prev.shouldRender }));
        break;
      case 'nested_components':
        setTestState(prev => ({ 
          ...prev, 
          mode: prev.mode === 'show_nested' ? 'normal' : 'show_nested' 
        }));
        break;
      case 'conditional_hooks':
        setTestState(prev => ({ ...prev, enableHooks: !prev.enableHooks }));
        break;
      case 'styled_props':
        // Forzar re-render con props cambiantes
        setTestState(prev => ({ ...prev, isVisible: !prev.isVisible }));
        break;
    }
  };

  const clearLogs = () => {
    setErrorLogs([]);
  };

  const getDebugStats = () => {
    if ((window as any).reactDebugger) {
      console.log('📊 Estadísticas del debugger:', (window as any).reactDebugger.getStats());
    }
  };

  return (
    <TestContainer>
      <h1>🧪 Componente de Prueba - Error React #310</h1>
      <p>Este componente reproduce intencionalmente el error 310 para diagnosticarlo.</p>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Controles de Prueba</h2>
        <TestButton onClick={() => triggerError('hooks_after_return')}>
          Test: Hooks después de Return
        </TestButton>
        <TestButton onClick={() => triggerError('nested_components')}>
          Test: Componentes Anidados
        </TestButton>
        <TestButton onClick={() => triggerError('conditional_hooks')}>
          Test: Hooks Condicionales
        </TestButton>
        <TestButton onClick={() => triggerError('styled_props')}>
          Test: Styled Props Dinámicos
        </TestButton>
        <TestButton onClick={getDebugStats}>
          Ver Estadísticas Debug
        </TestButton>
        <TestButton onClick={clearLogs}>
          Limpiar Logs
        </TestButton>
      </div>

      {/* Renderizar componente según el modo de prueba */}
      {testMode === 'hooks_after_return' && (
        <ProblematicComponent1 shouldRender={testState.shouldRender} />
      )}
      
      {testMode === 'nested_components' && (
        <ProblematicComponent2 mode={testState.mode} />
      )}
      
      {testMode === 'conditional_hooks' && (
        <ProblematicComponent3 enableHooks={testState.enableHooks} />
      )}
      
      {testMode === 'normal' && (
        <CorrectComponent isVisible={testState.isVisible} />
      )}

      {/* Mostrar logs de errores */}
      {errorLogs.length > 0 && (
        <div>
          <h3>🚨 Errores Capturados:</h3>
          <ErrorLog>
            {errorLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </ErrorLog>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a1a', borderRadius: '4px' }}>
        <h3>📋 Instrucciones:</h3>
        <ul>
          <li>Abre las DevTools (F12) y ve a la pestaña Console</li>
          <li>Haz clic en los botones de prueba para reproducir diferentes tipos de errores 310</li>
          <li>Observa los logs detallados en la consola</li>
          <li>Revisa localStorage["react_error_310_report"] para el reporte completo</li>
          <li>Usa window.reactDebugger.getStats() en la consola para estadísticas</li>
        </ul>
      </div>
    </TestContainer>
  );
};

export default Error310TestComponent; 
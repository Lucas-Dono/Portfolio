import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuración especial para debugging del error 310 en producción
// Esta configuración mantiene los errores de React sin minificar para mejor debugging
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-styled-components", {
            displayName: true,
            fileName: true, // Mantener nombres de archivo para debugging
            pure: true,
            ssr: false
          }]
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      // Rutas específicas para dependencias problemáticas
      'styled-components': path.resolve(__dirname, 'node_modules/styled-components'),
      'react-is': path.resolve(__dirname, 'node_modules/react-is'),
      '@emotion/unitless': path.resolve(__dirname, 'node_modules/@emotion/unitless'),
      'hoist-non-react-statics': path.resolve(__dirname, 'node_modules/hoist-non-react-statics'),
      'prop-types': path.resolve(__dirname, 'node_modules/prop-types'),
      // Aliases para Emotion
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
      '@emotion/cache': path.resolve(__dirname, 'node_modules/@emotion/cache'),
      '@emotion/serialize': path.resolve(__dirname, 'node_modules/@emotion/serialize'),
      '@emotion/utils': path.resolve(__dirname, 'node_modules/@emotion/utils'),
      '@emotion/sheet': path.resolve(__dirname, 'node_modules/@emotion/sheet'),
      // Asegura rutas absolutas desde la raíz del proyecto
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: [
      'styled-components',
      'react-is',
      'stylis',
      '@emotion/unitless',
      'hoist-non-react-statics',
      'shallowequal',
      'prop-types',
      // Añadir paquetes de Emotion
      '@emotion/react',
      '@emotion/styled',
      '@emotion/cache',
      '@emotion/serialize',
      '@emotion/utils'
    ],
    // Exclude sólo los componentes Icon individuales de MUI
    exclude: [
      '@mui/icons-material/Home',
      '@mui/icons-material/Person',
      '@mui/icons-material/Code',
      '@mui/icons-material/Chat',
      '@mui/icons-material/Science',
      '@mui/icons-material/FormatQuote',
      '@mui/icons-material/Menu',
      '@mui/icons-material/LightMode',
      '@mui/icons-material/DarkMode',
    ]
  },
  // ===== CONFIGURACIÓN ESPECIAL PARA DEBUGGING =====
  build: {
    // Mantener nombres de variables y funciones para debugging
    minify: false,
    
    // Generar source maps para debugging
    sourcemap: true,
    
    // No eliminar console.log para debugging
    terserOptions: {
      compress: {
        drop_console: false, // Mantener todos los console.log
        drop_debugger: false, // Mantener debugger statements
      },
      mangle: false, // No ofuscar nombres de variables
    },
    
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/prop-types/, /node_modules/, /@emotion/]
    },
    
    rollupOptions: {
      output: {
        // Mantener nombres legibles en los chunks
        manualChunks: {
          'styled-components': ['styled-components'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'emotion': ['@emotion/react', '@emotion/styled', '@emotion/cache'],
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'debugging': ['src/utils/reactErrorDebugger']
        },
        
        // Usar nombres de archivo descriptivos
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  
  // Configuración específica para debugging
  define: {
    // Habilitar debugging en esta build usando import.meta.env
    'import.meta.env.REACT_DEBUG_310': '"true"',
  },
  
  // Configuración de preview para testing
  preview: {
    port: 4173,
    open: true
  }
}) 
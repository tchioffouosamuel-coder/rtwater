import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Optimisation du build
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Méthode objet au lieu de fonction pour éviter les dépendances circulaires
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router-vendor': ['react-router-dom'],
        }
      }
    },
    
    // Configuration de la minification
    minify: 'esbuild',
    
    // Augmenter la limite de taille pour éviter les warnings
    chunkSizeWarningLimit: 600,
    
    // Sourcemaps désactivées en production
    sourcemap: false,
  }
})
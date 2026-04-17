import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // QUESTA È LA RIGA FONDAMENTALE PER LA SICUREZZA
    sourcemap: false, 
    
    // Opzionale: rende il codice ancora più compatto e difficile da leggere
    minify: 'esbuild', 
  }
})
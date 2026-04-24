import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Necesario para Docker
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:80', // Apunta al nombre del contenedor del backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // La misma magia que Nginx
      }
    }
  }
})

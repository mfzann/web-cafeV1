import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5188,
    proxy: {
      '/api': {
        target: 'http://localhost:5055',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5055',
        ws: true
      }
    }
  }
});

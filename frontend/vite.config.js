import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // During development, proxy /bff requests to the Express BFF
      '/bff': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

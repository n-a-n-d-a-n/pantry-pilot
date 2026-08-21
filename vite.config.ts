import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.ENABLE_HMR === 'true' ? {
        clientPort: 443,
        protocol: 'wss',
        overlay: false,
      } : false,
      watch: process.env.ENABLE_HMR === 'true' ? {} : null,
    },
  };
});

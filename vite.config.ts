/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const frankfurterProxy = {
  '/api/frankfurter': {
    target: 'https://api.frankfurter.app',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/frankfurter/, ''),
    configure: (proxy: import('http-proxy').Server) => {
      proxy.on('error', () => { /* usa tasas de fallback */ });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: frankfurterProxy },
  preview: { proxy: frankfurterProxy },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@i18n': resolve(__dirname, 'src/i18n'),
      '@lib': resolve(__dirname, 'src/lib'),
    },
  },
});

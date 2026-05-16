import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({
      routesDirectory: './.tanstack/src/routes',
      generatedRouteTree: './.tanstack/src/routeTree.gen.ts',
    }),
    react(),
  ],
  server: {
    port: 3202,
    watch: {
      ignored: ['**/.tanstack/src/routeTree.gen.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './.tanstack/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./.tanstack/src/test/setup.ts'],
    env: { VITE_API_URL: 'http://localhost:3200' },
  },
});

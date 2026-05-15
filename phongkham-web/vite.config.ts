import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite(),
    react(),
  ],
  server: {
    watch: {
      // Prevents the generator from re-running on its own output file,
      // which causes a startup error. New route files still trigger HMR
      // via the route files themselves; add a manual browser refresh
      // when adding entirely new route files.
      ignored: ['**/src/routeTree.gen.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_API_URL: 'http://localhost:3000' },
  },
});

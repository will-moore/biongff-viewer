import * as path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /\/src\/.*\.js$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
    define: {
      'process.env': { ...process.env, ...loadEnv(mode, process.cwd(), '') },
    },
    resolve: {
      alias: {
        '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        '@app': path.resolve(__dirname, './src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          includePaths: [
            path.resolve(__dirname, 'node_modules/bootstrap/scss'),
          ],
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: path.resolve(__dirname, 'src/tests/setupTests.js'),
    },
  };
});

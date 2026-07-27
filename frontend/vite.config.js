// Author: Naveen Duhan
import { defineConfig } from 'vite';
import { transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: '/deepnec-2.0/',
  plugins: [
    {
      name: 'treat-source-js-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!/\/src\/.*\.[jt]sx?$/.test(id)) return null;
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      DEEPNEC: path.resolve(import.meta.dirname, 'src/DEEPNEC.jsx'),
      Components: path.resolve(import.meta.dirname, 'src/Components'),
      Pages: path.resolve(import.meta.dirname, 'src/Pages'),
      env: path.resolve(import.meta.dirname, 'src/env.js'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    outDir: 'build',
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(import.meta.dirname)],
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});

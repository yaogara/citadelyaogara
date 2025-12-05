import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  server: {
    host: '0.0.0.0',
    proxy: {
      '/s/': {
        target: 'http://localhost:8081',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  define: { 'process.env': {} },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      vue: 'vue/dist/vue.esm-bundler.js',
      'citadels-common': 'citadels-common/src/index.ts',
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
        // ⚠️ DO NOT inject @imports here — main.scss handles everything
      },
    },
  },
});
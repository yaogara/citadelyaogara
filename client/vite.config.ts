import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/s/': 'http://localhost:8081/s/',
    },
  },
  define: { 'process.env': {} },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      'citadels-common': 'citadels-common/src/index.ts',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
        additionalData: `
    @import "@/scss/theme.scss";
    @import "@/scss/bootstrap.scss";
    @import "@/scss/animation.scss";
  `,
      },
    },
  },
});

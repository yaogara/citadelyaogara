import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { networkInterfaces } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = dirname(fileURLToPath(import.meta.url));

function lanAddressLogger(): Plugin {
  return {
    name: 'lan-address-logger',
    configureServer(server) {
      server.httpServer?.on('listening', () => {
        const addresses: string[] = [];
        const nets = networkInterfaces();
        Object.values(nets).forEach((net = []) => {
          net.forEach((details) => {
            if (details.family === 'IPv4' && !details.internal) {
              addresses.push(details.address);
            }
          });
        });

        if (addresses.length > 0) {
          const port = server.config.server.port ?? 5173;
          // Vite already prints host/port, but make LAN URLs explicit for mobile testing.
          // eslint-disable-next-line no-console
          console.log('\nAccess the dev server on your LAN:');
          addresses.forEach((addr) => {
            // eslint-disable-next-line no-console
            console.log(`  http://${addr}:${port}`);
          });
          // eslint-disable-next-line no-console
          console.log('');
        }
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), ...(command === 'serve' ? [lanAddressLogger()] : [])],
  resolve: {
    alias: {
      '@': resolve(rootDir, './src'),
      'citadels-common': resolve(rootDir, '../common/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/s/': {
        target: 'http://localhost:8081',
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));

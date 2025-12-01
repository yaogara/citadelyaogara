var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { networkInterfaces } from 'os';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
var rootDir = dirname(fileURLToPath(import.meta.url));
function lanAddressLogger() {
    return {
        name: 'lan-address-logger',
        configureServer: function (server) {
            var _a;
            (_a = server.httpServer) === null || _a === void 0 ? void 0 : _a.on('listening', function () {
                var _a;
                var addresses = [];
                var nets = networkInterfaces();
                Object.values(nets).forEach(function (net) {
                    if (net === void 0) { net = []; }
                    net.forEach(function (details) {
                        if (details.family === 'IPv4' && !details.internal) {
                            addresses.push(details.address);
                        }
                    });
                });
                if (addresses.length > 0) {
                    var port_1 = (_a = server.config.server.port) !== null && _a !== void 0 ? _a : 5173;
                    // Vite already prints host/port, but make LAN URLs explicit for mobile testing.
                    // eslint-disable-next-line no-console
                    console.log('\nAccess the dev server on your LAN:');
                    addresses.forEach(function (addr) {
                        // eslint-disable-next-line no-console
                        console.log("  http://".concat(addr, ":").concat(port_1));
                    });
                    // eslint-disable-next-line no-console
                    console.log('');
                }
            });
        },
    };
}
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        plugins: __spreadArray([react()], (command === 'serve' ? [lanAddressLogger()] : []), true),
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
    });
});

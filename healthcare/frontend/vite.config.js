import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'sandboxed-preview-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Sandboxed preview frames have an opaque "null" origin. Only allow
        // cross-origin access to development assets, never to /api responses.
        if (req.headers.origin === 'null' && !/^\/api(?:\/|\?|$)/.test(req.url || '')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        next();
      });
    },
  }],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    cors: false,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:4001',
        changeOrigin: true,
      },
    },
  },
});

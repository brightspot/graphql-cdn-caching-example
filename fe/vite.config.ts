import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Varnish, the demo's stand-in for Cloudflare, listens on 8080 in docker-compose. Proxying keeps the API on the
// app's own origin, so no CORS setup is needed.
const cdnUrl = process.env.CDN_URL || 'http://localhost:8080';
const proxy = { '/delivery/graphql': { target: cdnUrl, changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});

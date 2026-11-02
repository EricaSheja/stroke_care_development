import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the Vite server runs on 5173 and forwards /api to the Express API on 3000.
// In production Express serves the built files from frontend/dist, so there is one public link.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: { '/api': 'http://localhost:3000' },
    },
});
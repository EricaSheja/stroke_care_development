import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

// Hosting concerns: response headers, the health check and serving the built frontend.
// Owner: Orion (DevOps). One service serves the API and the app, so there is one public link.

export function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-store');
  next();
}

// The host pings /health to know the service is alive.
export function mountHealth(app) {
  const health = (req, res) => res.json({ status: 'ok', time: new Date().toISOString() });
  app.get('/health', health);
  app.get('/api/health', health);
}

// Serves the built React app and sends every other page to index.html so links and refresh work.
export function serveFrontend(app, frontendDir) {
  if (frontendDir && fs.existsSync(path.join(frontendDir, 'index.html'))) {
    app.use(express.static(frontendDir));
    app.use((req, res) => res.sendFile(path.join(frontendDir, 'index.html')));
  } else {
    app.get('/', (req, res) => res.type('text').send('StrokeCare API is running. Build the frontend to see the app.'));
  }
}

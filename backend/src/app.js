import express from 'express';
import { authMiddleware, authRouter } from './auth.js';
import { securityHeaders, mountHealth, serveFrontend } from './hosting.js';
import { readingsRouter } from './routes/readings.js';
import { planRouter, patientsRouter } from './routes/plan.js';
import { checkinsRouter } from './routes/checkins.js';
import { educationRouter } from './routes/education.js';
import { summaryRouter } from './routes/summary.js';

// Builds the Express app. One service serves the API and the built frontend, so there is one public link.
// Owner: Axel. The headers, health check and frontend serving come from hosting.js (Orion).

export function createApp(db, { frontendDir } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(securityHeaders);

  const auth = authMiddleware(db);
  mountHealth(app);

  app.use('/api/auth', authRouter(db, auth));
  app.use('/api/readings', readingsRouter(db, auth));
  app.use('/api/plan', planRouter(db, auth));
  app.use('/api/patients', patientsRouter(db, auth));
  app.use('/api/checkins', checkinsRouter(db, auth));
  app.use('/api/education', educationRouter(db, auth));
  app.use('/api/summary', summaryRouter(db, auth));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  serveFrontend(app, frontendDir);

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}

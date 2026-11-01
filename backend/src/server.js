// Starts the web service and reads its settings from the environment. Owner: Orion (DevOps).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { seedIfEmpty } from './seed.js';
import { createApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbFile = process.env.DB_FILE || path.join(here, '..', 'data', 'strokecare.db');
const frontendDir = process.env.FRONTEND_DIR || path.join(here, '..', '..', 'frontend', 'dist');
const port = Number(process.env.PORT) || 3000;

const db = openDb(dbFile);
const seeded = seedIfEmpty(db); // set SEED_DEMO=false to start with an empty database
const app = createApp(db, { frontendDir });

app.listen(port, () => {
  console.log(`StrokeCare listening on port ${port}${seeded ? ' (demo data loaded)' : ''}`);
});
